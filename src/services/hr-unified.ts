/**
 * @file Unified HR Service
 * @description Provides HR data operations with automatic backend selection
 * 
 * This service automatically uses Supabase when configured, falling back
 * to JSON file storage otherwise. It provides a consistent API regardless
 * of the backend.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import * as supabaseHR from './supabase-hr';

// ============================================
// BACKEND DETECTION
// ============================================

export function getBackendType(): 'supabase' | 'json' {
  return 'supabase';
}

function requireSupabase(): void {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

// ============================================
// EMPLOYEE OPERATIONS
// ============================================

export async function getEmployee(employeeId: string) {
  requireSupabase();
  return supabaseHR.getEmployee(employeeId);
}

export async function getDirectReports(managerId: string) {
  requireSupabase();
  return supabaseHR.getDirectReports(managerId);
}

export async function getAllEmployees() {
  requireSupabase();
  return supabaseHR.getAllEmployees();
}

export async function getPersonaUsers() {
  requireSupabase();
  return supabaseHR.getPersonaUsers();
}

// ============================================
// TEAM OPERATIONS
// ============================================

export async function getTeamMembers(managerId: string) {
  requireSupabase();
  const directReports = await getDirectReports(managerId);
  const today = new Date().toISOString().split('T')[0];
  const supabaseReports = directReports as Array<{
    id: string;
    employee_id: string;
    name: string;
  }>;

  const teamMembers = await Promise.all(
    supabaseReports.map(async (emp) => {
      const [attendanceRecords, leaveRequests] = await Promise.all([
        supabaseHR.getAttendanceRecords(emp.id),
        supabaseHR.getLeaveRequests(emp.id),
      ]);

      const todayAttendance = attendanceRecords.find((record) => record.date === today);
      const onLeave = leaveRequests.some(
        (request) =>
          request.status === 'approved' &&
          request.start_date <= today &&
          request.end_date >= today
      );

      let status: 'available' | 'wfh' | 'on_leave' | 'absent' = 'available';
      if (onLeave) {
        status = 'on_leave';
      } else if (todayAttendance?.status === 'wfh') {
        status = 'wfh';
      }

      return {
        id: emp.id,
        employeeId: emp.employee_id,
        name: emp.name,
        status,
        todayAttendance: todayAttendance
          ? {
              checkIn: todayAttendance.check_in || undefined,
              checkOut: todayAttendance.check_out || undefined,
            }
          : undefined,
      };
    })
  );

  return teamMembers;
}

// ============================================
// LEAVE BALANCE OPERATIONS
// ============================================

export async function getLeaveBalances(employeeId: string) {
  requireSupabase();
  return supabaseHR.getLeaveBalances(employeeId);
}

export async function updateLeaveBalance(
  employeeId: string,
  leaveType: string,
  usedDays: number
) {
  requireSupabase();
  return supabaseHR.updateLeaveBalance(employeeId, leaveType, usedDays);
}

// ============================================
// LEAVE REQUEST OPERATIONS
// ============================================

export async function getLeaveRequests(employeeId?: string) {
  requireSupabase();
  return supabaseHR.getLeaveRequests(employeeId);
}

export async function getPendingLeaveRequests(managerId?: string) {
  requireSupabase();
  return supabaseHR.getPendingLeaveRequests(managerId);
}

export async function createLeaveRequest(request: {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
}) {
  requireSupabase();
  const result = await supabaseHR.createLeaveRequest(request);
  return result ? { id: result.id } : null;
}

export async function approveLeaveRequest(
  requestId: string,
  reviewerId: string,
  comment?: string
) {
  requireSupabase();
  return supabaseHR.approveLeaveRequest(requestId, reviewerId, comment);
}

export async function rejectLeaveRequest(
  requestId: string,
  reviewerId: string,
  comment?: string
) {
  requireSupabase();
  return supabaseHR.rejectLeaveRequest(requestId, reviewerId, comment);
}

// ============================================
// ATTENDANCE OPERATIONS
// ============================================

export async function getAttendanceRecords(employeeId: string) {
  requireSupabase();
  return supabaseHR.getAttendanceRecords(employeeId);
}

export async function getTodayAttendance(employeeId: string) {
  requireSupabase();
  return supabaseHR.getTodayAttendance(employeeId);
}

export async function addOrUpdateAttendance(
  employeeId: string,
  record: {
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
    status: 'present' | 'absent' | 'wfh' | 'on_leave' | 'half_day' | 'holiday';
    hoursWorked?: number | null;
  }
) {
  requireSupabase();
  return supabaseHR.upsertAttendance({
    employeeId,
    date: record.date,
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    status: record.status,
    hoursWorked: record.hoursWorked,
  });
}

// ============================================
// REGULARIZATION OPERATIONS
// ============================================

export async function getRegularizationRequests(employeeId?: string) {
  requireSupabase();
  return supabaseHR.getRegularizationRequests(employeeId);
}

export async function createRegularizationRequest(request: {
  employeeId: string;
  date: string;
  requestType: 'missed_checkin' | 'missed_checkout' | 'correction';
  requestedTime: string;
  reason: string;
}) {
  requireSupabase();
  const result = await supabaseHR.createRegularizationRequest(request);
  return result ? { id: result.id } : null;
}

export async function approveRegularization(
  requestId: string,
  reviewerId: string,
  comment?: string
) {
  requireSupabase();
  return supabaseHR.approveRegularization(requestId, reviewerId, comment);
}

export async function rejectRegularization(
  requestId: string,
  reviewerId: string,
  comment?: string
) {
  requireSupabase();
  return supabaseHR.rejectRegularization(requestId, reviewerId, comment);
}

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

export async function getNotifications(employeeId?: string, role?: 'employee' | 'manager' | 'hr') {
  requireSupabase();
  return supabaseHR.getNotifications(employeeId, role);
}

export async function markNotificationRead(notificationId: string) {
  requireSupabase();
  return supabaseHR.markNotificationRead(notificationId);
}

// ============================================
// POLICY OPERATIONS
// ============================================

export async function searchPolicies(query: string) {
  requireSupabase();
  return supabaseHR.searchPolicies(query);
}

export async function getPolicies() {
  requireSupabase();
  return supabaseHR.searchPolicies('');
}

export async function createPolicy(input: {
  title: string;
  category: string;
  content: string;
  lastUpdated?: string;
}) {
  requireSupabase();
  return supabaseHR.createPolicy(input);
}

export async function updatePolicy(
  id: string,
  updates: Partial<{ title: string; category: string; content: string; lastUpdated: string }>
) {
  requireSupabase();
  return supabaseHR.updatePolicy(id, updates);
}

export async function deletePolicy(id: string) {
  requireSupabase();
  return supabaseHR.deletePolicy(id);
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export async function getAnnouncements(role?: string) {
  requireSupabase();
  return supabaseHR.getAnnouncements(role);
}

export async function createAnnouncement(input: {
  title: string;
  content: string;
  audienceRole: 'all' | 'employee' | 'manager' | 'hr';
  pinned?: boolean;
  createdBy?: string | null;
  expiresAt?: string | null;
}) {
  requireSupabase();
  return supabaseHR.createAnnouncement(input);
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<{
    title: string;
    content: string;
    audienceRole: 'all' | 'employee' | 'manager' | 'hr';
    pinned: boolean;
    expiresAt: string | null;
  }>
) {
  requireSupabase();
  return supabaseHR.updateAnnouncement(id, updates);
}

export async function deleteAnnouncement(id: string) {
  requireSupabase();
  return supabaseHR.deleteAnnouncement(id);
}

// ============================================
// DOCUMENTS & ACKNOWLEDGMENTS
// ============================================

export async function getDocuments(role?: string) {
  requireSupabase();
  return supabaseHR.getDocuments(role);
}

export async function getDocumentById(id: string) {
  requireSupabase();
  return supabaseHR.getDocumentById(id);
}

export async function createDocument(input: {
  title: string;
  description?: string | null;
  filePath: string;
  audienceRole: 'all' | 'employee' | 'manager' | 'hr';
  requiresAck?: boolean;
  createdBy?: string | null;
  expiresAt?: string | null;
}) {
  requireSupabase();
  return supabaseHR.createDocument(input);
}

export async function deleteDocument(id: string) {
  requireSupabase();
  return supabaseHR.deleteDocument(id);
}

export async function acknowledgeDocument(employeeId: string, documentId: string) {
  requireSupabase();
  return supabaseHR.acknowledgeDocument(employeeId, documentId);
}

export async function getAcknowledgedDocumentIds(employeeId: string) {
  requireSupabase();
  return supabaseHR.getAcknowledgedDocumentIds(employeeId);
}

// ============================================
// SYSTEM METRICS
// ============================================

export async function getSystemMetrics() {
  requireSupabase();
  const metrics = await supabaseHR.getSystemMetrics();
  return {
    ...metrics,
    complianceScore: 0,
    escalations: 0,
  };
}

// ============================================
// PENDING APPROVALS (Combined)
// ============================================

export async function getAllPendingApprovals(managerId: string) {
  requireSupabase();
  const [leaveRequests, regularizationRequests] = await Promise.all([
    supabaseHR.getPendingLeaveRequests(managerId),
    supabaseHR.getRegularizationRequests(),
  ]);
  
  // Get direct reports to filter regularization requests
  const directReports = await supabaseHR.getDirectReports(managerId);
  const reportIds = directReports.map(e => e.id);
  
  const pendingReg = regularizationRequests.filter(
    r => r.status === 'pending' && reportIds.includes(r.employee_id)
  );
  
  const approvals: Array<{
    id: string;
    type: 'leave' | 'regularization';
    employeeId: string;
    employeeName: string;
    department: string;
    title: string;
    details: string;
    submittedAt: string;
    priority: 'normal' | 'urgent';
  }> = [];
  
  // Add leave requests
  for (const req of leaveRequests) {
    const emp = req.employee;
    approvals.push({
      id: req.id,
      type: 'leave',
      employeeId: req.employee_id,
      employeeName: emp?.name || 'Unknown',
      department: emp?.department || 'Unknown',
      title: `${req.leave_type} Leave - ${req.days_requested} day(s)`,
      details: `${req.start_date} to ${req.end_date}: ${req.reason}`,
      submittedAt: req.submitted_at,
      priority: 'normal',
    });
  }
  
  // Add regularization requests
  for (const req of pendingReg) {
    const emp = directReports.find(e => e.id === req.employee_id);
    approvals.push({
      id: req.id,
      type: 'regularization',
      employeeId: req.employee_id,
      employeeName: emp?.name || 'Unknown',
      department: emp?.department || 'Unknown',
      title: `${req.request_type.replace('_', ' ')} - ${req.date}`,
      details: req.reason,
      submittedAt: req.submitted_at,
      priority: 'normal',
    });
  }
  
  return approvals.sort((a, b) => 
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

// ============================================
// PINNED WIDGETS
// ============================================

export async function getPinnedWidgets(employeeId: string) {
  requireSupabase();
  return supabaseHR.getPinnedWidgets(employeeId);
}

export async function pinWidget(input: {
  employeeId: string;
  componentName: string;
  queryDescriptor: Record<string, unknown>;
  layout?: Record<string, unknown>;
  title?: string | null;
  orderIndex?: number;
}) {
  requireSupabase();
  return supabaseHR.pinWidget(input);
}

export async function unpinWidget(widgetId: string) {
  requireSupabase();
  return supabaseHR.unpinWidget(widgetId);
}

export async function updateWidgetLayout(widgetId: string, layout: Record<string, unknown>) {
  requireSupabase();
  return supabaseHR.updateWidgetLayout(widgetId, layout);
}

export async function updateWidgetTitle(widgetId: string, title: string) {
  requireSupabase();
  return supabaseHR.updateWidgetTitle(widgetId, title);
}

export async function batchUpdateWidgetLayouts(
  updates: Array<{ id: string; layout: Record<string, unknown> }>
) {
  requireSupabase();
  return supabaseHR.batchUpdateLayouts(updates);
}

export async function clearAllPinnedWidgets(employeeId: string) {
  requireSupabase();
  return supabaseHR.clearAllPinnedWidgets(employeeId);
}

// ============================================
// REAL-TIME SUBSCRIPTIONS (Supabase only)
// ============================================

export function subscribeToLeaveRequests(
  callback: (payload: { eventType: string; new: unknown; old: unknown }) => void
) {
  if (isSupabaseConfigured()) {
    return supabaseHR.subscribeToLeaveRequests(callback);
  }
  return null;
}

export async function subscribeToNotifications(
  employeeId: string,
  callback: (notification: unknown) => void
) {
  requireSupabase();
  return supabaseHR.subscribeToNotifications(employeeId, callback);
}
