import { getDb, isSupabaseConfigured, RegularizationRequest, Attendance } from './base';
import { createNotification } from '@/services/supabase-hr/notifications';
import { resolveEmployee, resolveEmployeeUuid } from './utils';

export async function getRegularizationRequests(employeeId?: string): Promise<RegularizationRequest[]> {
  if (!isSupabaseConfigured()) return [];

  let query = getDb()
    .from('regularization_requests')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (employeeId) {
    const employeeUuid = await resolveEmployeeUuid(employeeId);
    query = query.eq('employee_id', employeeUuid);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching regularization requests:', error);
    return [];
  }

  return (data as RegularizationRequest[]) || [];
}

export async function createRegularizationRequest(request: {
  employeeId: string;
  date: string;
  requestType: 'missed_checkin' | 'missed_checkout' | 'correction';
  requestedTime: string;
  reason: string;
}): Promise<RegularizationRequest | null> {
  if (!isSupabaseConfigured()) return null;

  const employee = await resolveEmployee(request.employeeId);
  const employeeUuid = employee?.id ?? request.employeeId;

  const { data, error } = await getDb()
    .from('regularization_requests')
    .insert({
      employee_id: employeeUuid,
      date: request.date,
      request_type: request.requestType,
      requested_time: request.requestedTime,
      reason: request.reason,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating regularization request:', error);
    return null;
  }

  const newRequest = data as RegularizationRequest | null;

  // Create notification for manager
  if (employee?.manager_id && newRequest) {
    await createNotification({
      employeeId: employee.manager_id,
      type: 'new_regularization_request',
      title: 'New Regularization Request',
      message: `${employee.name} has submitted a ${request.requestType.replace('_', ' ')} regularization request for ${request.date}`,
      relatedId: newRequest.id,
    });
  }

  return newRequest;
}

export async function approveRegularization(
  requestId: string,
  reviewerId: string,
  comment?: string
): Promise<RegularizationRequest | null> {
  if (!isSupabaseConfigured()) return null;

  const reviewerUuid = await resolveEmployeeUuid(reviewerId);

  const { data, error } = await getDb()
    .from('regularization_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerUuid,
      review_comment: comment || null,
    })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    console.error('Error approving regularization:', error);
    return null;
  }

  const approvedRequest = data as RegularizationRequest | null;

  // Update attendance record based on the regularization
  if (approvedRequest) {
    const { data: attendanceData } = await getDb()
      .from('attendance')
      .select('*')
      .eq('employee_id', approvedRequest.employee_id)
      .eq('date', approvedRequest.date)
      .single();

    const existingAttendance = attendanceData as Attendance | null;
    if (existingAttendance) {
      const updateData: Record<string, unknown> = {};
      if (approvedRequest.request_type === 'missed_checkin') {
        updateData.check_in = approvedRequest.requested_time;
      } else if (approvedRequest.request_type === 'missed_checkout') {
        updateData.check_out = approvedRequest.requested_time;
      }
      updateData.status = 'present';

      await getDb()
        .from('attendance')
        .update(updateData)
        .eq('id', existingAttendance.id);
    }

    // Create notification for employee
    await createNotification({
      employeeId: approvedRequest.employee_id,
      type: 'regularization_approved',
      title: 'Regularization Approved',
      message: `Your regularization request for ${approvedRequest.date} has been approved.`,
      relatedId: requestId,
    });
  }

  return approvedRequest;
}

export async function rejectRegularization(
  requestId: string,
  reviewerId: string,
  comment?: string
): Promise<RegularizationRequest | null> {
  if (!isSupabaseConfigured()) return null;

  const reviewerUuid = await resolveEmployeeUuid(reviewerId);

  // Get request first for notification
  const { data: existingRequest } = await getDb()
    .from('regularization_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  const requestRecord = existingRequest as RegularizationRequest | null;

  const { data, error } = await getDb()
    .from('regularization_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerUuid,
      review_comment: comment || null,
    })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    console.error('Error rejecting regularization:', error);
    return null;
  }

  // Create notification for employee
  if (requestRecord) {
    await createNotification({
      employeeId: requestRecord.employee_id,
      type: 'regularization_rejected',
      title: 'Regularization Rejected',
      message: `Your regularization request for ${requestRecord.date} has been rejected.${comment ? ` Reason: ${comment}` : ''}`,
      relatedId: requestId,
    });
  }

  return data as RegularizationRequest;
}
