import { getDb, isSupabaseConfigured, LeaveRequest, Employee } from './base';
import { getDirectReports } from './employees';
import { createNotification } from '@/services/supabase-hr/notifications';
import { resolveEmployee, resolveEmployeeUuid } from './utils';

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee?: Employee;
}

export async function getLeaveRequests(employeeId?: string): Promise<LeaveRequestWithEmployee[]> {
  if (!isSupabaseConfigured()) return [];

  let query = getDb()
    .from('leave_requests')
    .select('*, employee:employees!leave_requests_employee_id_fkey(*)')
    .order('submitted_at', { ascending: false });

  if (employeeId) {
    const employeeUuid = await resolveEmployeeUuid(employeeId);
    query = query.eq('employee_id', employeeUuid);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leave requests:', error);
    return [];
  }

  return (data as LeaveRequestWithEmployee[]) || [];
}

export async function getPendingLeaveRequests(managerId?: string): Promise<LeaveRequestWithEmployee[]> {
  if (!isSupabaseConfigured()) return [];

  // If managerId provided, get only requests from direct reports
  if (managerId) {
    const directReports = await getDirectReports(managerId);
    const reportIds = directReports.map(e => e.id);

    if (reportIds.length === 0) return [];

    const { data, error } = await getDb()
      .from('leave_requests')
      .select('*, employee:employees!leave_requests_employee_id_fkey(*)')
      .eq('status', 'pending')
      .in('employee_id', reportIds)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending leave requests:', error);
      return [];
    }

    return (data as LeaveRequestWithEmployee[]) || [];
  }

  // Get all pending requests
  const { data, error } = await getDb()
    .from('leave_requests')
    .select('*, employee:employees!leave_requests_employee_id_fkey(*)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending leave requests:', error);
    return [];
  }

  return (data as LeaveRequestWithEmployee[]) || [];
}

export async function createLeaveRequest(request: {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
}): Promise<LeaveRequest | null> {
  if (!isSupabaseConfigured()) return null;

  const employee = await resolveEmployee(request.employeeId);
  const employeeUuid = employee?.id ?? request.employeeId;

  const { data, error } = await getDb()
    .from('leave_requests')
    .insert({
      employee_id: employeeUuid,
      leave_type: request.leaveType as 'casual' | 'sick' | 'earned' | 'wfh' | 'comp_off',
      start_date: request.startDate,
      end_date: request.endDate,
      days_requested: request.daysRequested,
      reason: request.reason,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating leave request:', error);
    return null;
  }

  const newRequest = data as LeaveRequest | null;

  // Create notification for manager
  if (employee?.manager_id && newRequest) {
    await createNotification({
      employeeId: employee.manager_id,
      type: 'new_leave_request',
      title: 'New Leave Request',
      message: `${employee.name} has requested ${request.daysRequested} day(s) of ${request.leaveType} leave from ${request.startDate} to ${request.endDate}`,
      relatedId: newRequest.id,
    });
  }

  return newRequest;
}

export async function approveLeaveRequest(
  requestId: string,
  reviewerId: string,
  comment?: string
): Promise<LeaveRequest | null> {
  if (!isSupabaseConfigured()) return null;

  const reviewerUuid = await resolveEmployeeUuid(reviewerId);

  // Get the request first to update leave balance
  const { data: existingRequest } = await getDb()
    .from('leave_requests')
    .select('*, employee:employees!leave_requests_employee_id_fkey(*)')
    .eq('id', requestId)
    .single();

  const requestRecord = existingRequest as LeaveRequestWithEmployee | null;
  if (!requestRecord || requestRecord.status !== 'pending') {
    return null;
  }

  // Update the request
  const { data, error } = await getDb()
    .from('leave_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerUuid,
      review_comment: comment || null,
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    console.error('Error approving leave request:', error);
    return null;
  }

  // Update leave balance
  const currentYear = new Date().getFullYear();
  const { data: balanceData } = await getDb()
    .from('leave_balances')
    .select('used_days')
    .eq('employee_id', requestRecord.employee_id)
    .eq('leave_type', requestRecord.leave_type)
    .eq('year', currentYear)
    .single();

  const leaveBalance = balanceData as { used_days: number } | null;
  if (leaveBalance) {
    await getDb()
      .from('leave_balances')
      .update({ used_days: leaveBalance.used_days + requestRecord.days_requested })
      .eq('employee_id', requestRecord.employee_id)
      .eq('leave_type', requestRecord.leave_type)
      .eq('year', currentYear);
  }

  // Create notification for employee
  if (requestRecord.employee) {
    await createNotification({
      employeeId: requestRecord.employee_id,
      type: 'leave_approved',
      title: 'Leave Request Approved',
      message: `Your ${requestRecord.leave_type} leave request from ${requestRecord.start_date} to ${requestRecord.end_date} has been approved.${comment ? ` Comment: ${comment}` : ''}`,
      relatedId: requestId,
    });
  }

  return data as LeaveRequest;
}

export async function rejectLeaveRequest(
  requestId: string,
  reviewerId: string,
  comment?: string
): Promise<LeaveRequest | null> {
  if (!isSupabaseConfigured()) return null;

  const reviewerUuid = await resolveEmployeeUuid(reviewerId);

  // Get the request first
  const { data: existingRequest } = await getDb()
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  const requestRecord = existingRequest as LeaveRequest | null;
  if (!requestRecord || requestRecord.status !== 'pending') {
    return null;
  }

  const { data, error } = await getDb()
    .from('leave_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerUuid,
      review_comment: comment || null,
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    console.error('Error rejecting leave request:', error);
    return null;
  }

  // Create notification for employee
  await createNotification({
    employeeId: requestRecord.employee_id,
    type: 'leave_rejected',
    title: 'Leave Request Rejected',
    message: `Your ${requestRecord.leave_type} leave request from ${requestRecord.start_date} to ${requestRecord.end_date} has been rejected.${comment ? ` Reason: ${comment}` : ''}`,
    relatedId: requestId,
  });

  return data as LeaveRequest;
}
