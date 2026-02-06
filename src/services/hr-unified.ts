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
import * as dataStore from './dataStore';

// ============================================
// BACKEND DETECTION
// ============================================

export function getBackendType(): 'supabase' | 'json' {
  return isSupabaseConfigured() ? 'supabase' : 'json';
}

// ============================================
// EMPLOYEE OPERATIONS
// ============================================

export async function getEmployee(employeeId: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.getEmployee(employeeId);
  }
  return dataStore.getEmployee(employeeId);
}

export async function getDirectReports(managerId: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.getDirectReports(managerId);
  }
  return dataStore.getDirectReports(managerId);
}

export async function getAllEmployees() {
  if (isSupabaseConfigured()) {
    return supabaseHR.getAllEmployees();
  }
  return dataStore.getAllEmployees();
}

// ============================================
// LEAVE BALANCE OPERATIONS
// ============================================

export async function getLeaveBalances(employeeId: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.getLeaveBalances(employeeId);
  }
  
  const balances = dataStore.getLeaveBalances(employeeId);
  if (!balances) return [];
  
  return Object.entries(balances).map(([type, balance]) => ({
    leave_type: type,
    total_days: balance.total,
    used_days: balance.used,
    remaining_days: balance.total - balance.used,
  }));
}

export async function updateLeaveBalance(
  employeeId: string,
  leaveType: string,
  usedDays: number
) {
  if (isSupabaseConfigured()) {
    return supabaseHR.updateLeaveBalance(employeeId, leaveType, usedDays);
  }
  dataStore.updateLeaveBalance(employeeId, leaveType as keyof dataStore.LeaveBalances, usedDays);
  return true;
}

// ============================================
// LEAVE REQUEST OPERATIONS
// ============================================

export async function getLeaveRequests(employeeId?: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.getLeaveRequests(employeeId);
  }
  return dataStore.getLeaveRequests(employeeId);
}

export async function getPendingLeaveRequests(managerId?: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.getPendingLeaveRequests(managerId);
  }
  return dataStore.getPendingLeaveRequests(managerId);
}

export async function createLeaveRequest(request: {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
}) {
  if (isSupabaseConfigured()) {
    const result = await supabaseHR.createLeaveRequest(request);
    return result ? { id: result.id } : null;
  }
  
  const result = dataStore.createLeaveRequest({
    employeeId: request.employeeId,
    leaveType: request.leaveType as 'casual' | 'sick' | 'earned' | 'wfh' | 'comp_off',
    startDate: request.startDate,
    endDate: request.endDate,
    daysRequested: request.daysRequested,
    reason: request.reason,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    reviewComment: null,
  });
  
  return { id: result.id };
}

export async function approveLeaveRequest(
  requestId: string,
  reviewerId: string,
  comment?: string
) {
  if (isSupabaseConfigured()) {
    return supabaseHR.approveLeaveRequest(requestId, reviewerId, comment);
  }
  return dataStore.approveLeaveRequest(requestId, reviewerId, comment);
}

export async function rejectLeaveRequest(
  requestId: string,
  reviewerId: string,
  comment?: string
) {
  if (isSupabaseConfigured()) {
    return supabaseHR.rejectLeaveRequest(requestId, reviewerId, comment);
  }
  return dataStore.rejectLeaveRequest(requestId, reviewerId, comment);
}

// ============================================
// ATTENDANCE OPERATIONS
// ============================================

export async function getAttendanceRecords(employeeId: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.getAttendanceRecords(employeeId);
  }
  return dataStore.getAttendanceRecords(employeeId);
}

export async function getTodayAttendance(employeeId: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.getTodayAttendance(employeeId);
  }
  return dataStore.getTodayAttendance(employeeId);
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
  if (isSupabaseConfigured()) {
    return supabaseHR.upsertAttendance({
      employeeId,
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      hoursWorked: record.hoursWorked,
    });
  }
  
  dataStore.addOrUpdateAttendance(employeeId, {
    date: record.date,
    checkIn: record.checkIn || null,
    checkOut: record.checkOut || null,
    status: record.status,
    hoursWorked: record.hoursWorked || null,
  });
  
  return true;
}

// ============================================
// REGULARIZATION OPERATIONS
// ============================================

export async function getRegularizationRequests(employeeId?: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.getRegularizationRequests(employeeId);
  }
  return dataStore.getRegularizationRequests(employeeId);
}

export async function createRegularizationRequest(request: {
  employeeId: string;
  date: string;
  requestType: 'missed_checkin' | 'missed_checkout' | 'correction';
  requestedTime: string;
  reason: string;
}) {
  if (isSupabaseConfigured()) {
    const result = await supabaseHR.createRegularizationRequest(request);
    return result ? { id: result.id } : null;
  }
  
  const result = dataStore.createRegularizationRequest({
    employeeId: request.employeeId,
    date: request.date,
    requestType: request.requestType,
    requestedTime: request.requestedTime,
    reason: request.reason,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    reviewComment: null,
  });
  
  return { id: result.id };
}

export async function approveRegularization(
  requestId: string,
  reviewerId: string,
  comment?: string
) {
  if (isSupabaseConfigured()) {
    return supabaseHR.approveRegularization(requestId, reviewerId, comment);
  }
  return dataStore.approveRegularization(requestId, reviewerId, comment);
}

export async function rejectRegularization(
  requestId: string,
  reviewerId: string,
  comment?: string
) {
  if (isSupabaseConfigured()) {
    return supabaseHR.rejectRegularization(requestId, reviewerId, comment);
  }
  return dataStore.rejectRegularization(requestId, reviewerId, comment);
}

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

export async function getNotifications(employeeId: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.getNotifications(employeeId);
  }
  return dataStore.getNotifications(employeeId);
}

export async function markNotificationRead(notificationId: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.markNotificationRead(notificationId);
  }
  dataStore.markNotificationRead(notificationId);
  return true;
}

// ============================================
// POLICY OPERATIONS
// ============================================

export async function searchPolicies(query: string) {
  if (isSupabaseConfigured()) {
    return supabaseHR.searchPolicies(query);
  }
  return dataStore.searchPolicies(query);
}

// ============================================
// SYSTEM METRICS
// ============================================

export async function getSystemMetrics() {
  if (isSupabaseConfigured()) {
    return supabaseHR.getSystemMetrics();
  }
  return dataStore.getSystemMetrics();
}

// ============================================
// PENDING APPROVALS (Combined)
// ============================================

export async function getAllPendingApprovals(managerId: string) {
  if (isSupabaseConfigured()) {
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
  
  return dataStore.getAllPendingApprovals(managerId);
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

export function subscribeToNotifications(
  employeeId: string,
  callback: (notification: unknown) => void
) {
  if (isSupabaseConfigured()) {
    return supabaseHR.subscribeToNotifications(employeeId, callback);
  }
  return null;
}
