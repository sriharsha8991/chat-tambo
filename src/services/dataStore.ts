/**
 * @file dataStore.ts
 * @description JSON-based data store with read/write operations
 * 
 * This service provides persistent storage using a JSON file.
 * In production, replace with actual database calls.
 */

import fs from "fs";
import path from "path";

// ============================================
// TYPES
// ============================================

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "hr";
  department: string;
  managerId: string | null;
  joinDate: string;
}

export interface LeaveBalance {
  total: number;
  used: number;
}

export interface LeaveBalances {
  casual: LeaveBalance;
  sick: LeaveBalance;
  earned: LeaveBalance;
  wfh: LeaveBalance;
  comp_off: LeaveBalance;
}

export interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "absent" | "wfh" | "on_leave" | "half_day" | "holiday";
  hoursWorked: number | null;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: "casual" | "sick" | "earned" | "wfh" | "comp_off";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewComment: string | null;
  daysRequested: number;
}

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  date: string;
  requestType: "missed_checkin" | "missed_checkout" | "correction";
  requestedTime: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewComment: string | null;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}

export interface Notification {
  id: string;
  employeeId: string;
  type: "leave_approved" | "leave_rejected" | "regularization_approved" | "regularization_rejected" | "new_request";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface DataStore {
  employees: Employee[];
  leaveBalances: Record<string, LeaveBalances>;
  attendance: Record<string, AttendanceRecord[]>;
  leaveRequests: LeaveRequest[];
  regularizationRequests: RegularizationRequest[];
  policies: Policy[];
  notifications: Notification[];
  metadata: {
    lastUpdated: string;
    version: string;
  };
}

// ============================================
// FILE PATH
// ============================================

// Use absolute path resolution for Next.js compatibility
const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "store.json");

console.log(`[DataStore] Data file path: ${DATA_FILE_PATH}`);

// ============================================
// IN-MEMORY CACHE
// ============================================

let dataCache: DataStore | null = null;
let lastReadTime: number = 0;
const CACHE_TTL = 1000; // 1 second cache

// ============================================
// READ/WRITE OPERATIONS
// ============================================

/**
 * Read the entire data store
 */
export function readStore(): DataStore {
  const now = Date.now();
  
  // Return cached data if still valid
  if (dataCache && now - lastReadTime < CACHE_TTL) {
    return dataCache;
  }
  
  try {
    console.log(`[DataStore] Reading from: ${DATA_FILE_PATH}`);
    
    // Check if file exists
    if (!fs.existsSync(DATA_FILE_PATH)) {
      console.error(`[DataStore] File not found: ${DATA_FILE_PATH}`);
      throw new Error(`Data store file not found: ${DATA_FILE_PATH}`);
    }
    
    const data = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    dataCache = JSON.parse(data) as DataStore;
    lastReadTime = now;
    console.log(`[DataStore] Successfully loaded data store`);
    return dataCache;
  } catch (error) {
    console.error("[DataStore] Error reading data store:", error);
    throw error;
  }
}

/**
 * Write the entire data store
 */
export function writeStore(data: DataStore): void {
  try {
    // Update metadata
    data.metadata.lastUpdated = new Date().toISOString();
    
    console.log(`[DataStore] Writing to: ${DATA_FILE_PATH}`);
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[DataStore] Successfully wrote data store`);
    
    // Update cache
    dataCache = data;
    lastReadTime = Date.now();
  } catch (error) {
    console.error("[DataStore] Error writing data store:", error);
    throw new Error("Failed to write data store");
  }
}

/**
 * Invalidate cache (useful after external updates)
 */
export function invalidateCache(): void {
  dataCache = null;
  lastReadTime = 0;
}

// ============================================
// EMPLOYEE OPERATIONS
// ============================================

export function getEmployee(employeeId: string): Employee | undefined {
  const store = readStore();
  // Try both internal ID and employeeId field
  return store.employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
}

export function getEmployeeByEmployeeId(employeeId: string): Employee | undefined {
  const store = readStore();
  return store.employees.find((e) => e.employeeId === employeeId);
}

export function getDirectReports(managerId: string): Employee[] {
  const store = readStore();
  // Try both internal ID and employeeId field for manager lookup
  return store.employees.filter((e) => {
    if (e.managerId === managerId) return true;
    const manager = store.employees.find(m => m.employeeId === managerId);
    return manager && e.managerId === manager.id;
  });
}

export function getAllEmployees(): Employee[] {
  const store = readStore();
  return store.employees;
}

// ============================================
// LEAVE BALANCE OPERATIONS
// ============================================

export function getLeaveBalances(employeeId: string): LeaveBalances | undefined {
  const store = readStore();
  
  // First try direct lookup by internal ID (emp-001, mgr-001, etc.)
  if (store.leaveBalances[employeeId]) {
    return store.leaveBalances[employeeId];
  }
  
  // Otherwise, look up by employeeId field (ZP-1001, etc.)
  const employee = store.employees.find(e => e.employeeId === employeeId);
  if (employee) {
    return store.leaveBalances[employee.id];
  }
  
  return undefined;
}

export function updateLeaveBalance(
  employeeId: string,
  leaveType: keyof LeaveBalances,
  usedDays: number
): void {
  const store = readStore();
  if (store.leaveBalances[employeeId]) {
    store.leaveBalances[employeeId][leaveType].used += usedDays;
    writeStore(store);
  }
}

export function revertLeaveBalance(
  employeeId: string,
  leaveType: keyof LeaveBalances,
  days: number
): void {
  const store = readStore();
  if (store.leaveBalances[employeeId]) {
    store.leaveBalances[employeeId][leaveType].used = Math.max(
      0,
      store.leaveBalances[employeeId][leaveType].used - days
    );
    writeStore(store);
  }
}

// ============================================
// ATTENDANCE OPERATIONS
// ============================================

/**
 * Helper to resolve employee internal ID from either internal ID or employeeId
 */
function resolveEmployeeId(idOrEmployeeId: string): string | undefined {
  const store = readStore();
  
  // If it's already an internal ID, return it
  if (store.employees.find(e => e.id === idOrEmployeeId)) {
    return idOrEmployeeId;
  }
  
  // Otherwise, look up by employeeId field
  const employee = store.employees.find(e => e.employeeId === idOrEmployeeId);
  return employee?.id;
}

export function getAttendanceRecords(employeeId: string): AttendanceRecord[] {
  const store = readStore();
  
  // First try direct lookup
  if (store.attendance[employeeId]) {
    return store.attendance[employeeId];
  }
  
  // Otherwise, look up by employeeId field
  const internalId = resolveEmployeeId(employeeId);
  if (internalId) {
    return store.attendance[internalId] || [];
  }
  
  return [];
}

export function getTodayAttendance(employeeId: string): AttendanceRecord | undefined {
  const today = new Date().toISOString().split("T")[0];
  const records = getAttendanceRecords(employeeId);
  return records.find((r) => r.date === today);
}

export function addOrUpdateAttendance(
  employeeId: string,
  record: AttendanceRecord
): void {
  const store = readStore();
  if (!store.attendance[employeeId]) {
    store.attendance[employeeId] = [];
  }
  
  const existingIndex = store.attendance[employeeId].findIndex(
    (r) => r.date === record.date
  );
  
  if (existingIndex >= 0) {
    store.attendance[employeeId][existingIndex] = record;
  } else {
    store.attendance[employeeId].push(record);
  }
  
  // Sort by date descending
  store.attendance[employeeId].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  writeStore(store);
}

// ============================================
// LEAVE REQUEST OPERATIONS
// ============================================

export function getLeaveRequests(employeeId?: string): LeaveRequest[] {
  const store = readStore();
  if (employeeId) {
    return store.leaveRequests.filter((r) => r.employeeId === employeeId);
  }
  return store.leaveRequests;
}

export function getPendingLeaveRequests(managerId?: string): LeaveRequest[] {
  const store = readStore();
  let requests = store.leaveRequests.filter((r) => r.status === "pending");
  
  if (managerId) {
    // Get direct reports
    const directReports = getDirectReports(managerId);
    const reportIds = directReports.map((e) => e.id);
    requests = requests.filter((r) => reportIds.includes(r.employeeId));
  }
  
  return requests;
}

export function createLeaveRequest(request: Omit<LeaveRequest, "id">): LeaveRequest {
  const store = readStore();
  
  const newRequest: LeaveRequest = {
    ...request,
    id: `LV-${Date.now()}`,
  };
  
  store.leaveRequests.push(newRequest);
  writeStore(store);
  
  // Create notification for manager
  const employee = getEmployee(request.employeeId);
  if (employee?.managerId) {
    createNotification({
      employeeId: employee.managerId,
      type: "new_request",
      title: "New Leave Request",
      message: `${employee.name} has requested ${request.daysRequested} day(s) of ${request.leaveType} leave from ${request.startDate} to ${request.endDate}`,
      relatedId: newRequest.id,
    });
  }
  
  return newRequest;
}

export function updateLeaveRequest(
  requestId: string,
  updates: Partial<LeaveRequest>
): LeaveRequest | undefined {
  const store = readStore();
  const index = store.leaveRequests.findIndex((r) => r.id === requestId);
  
  if (index >= 0) {
    store.leaveRequests[index] = { ...store.leaveRequests[index], ...updates };
    writeStore(store);
    return store.leaveRequests[index];
  }
  
  return undefined;
}

export function approveLeaveRequest(
  requestId: string,
  reviewerId: string,
  comment?: string
): LeaveRequest | undefined {
  const store = readStore();
  const request = store.leaveRequests.find((r) => r.id === requestId);
  
  if (!request || request.status !== "pending") {
    return undefined;
  }
  
  // Update request status
  const updated = updateLeaveRequest(requestId, {
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    reviewComment: comment || null,
  });
  
  if (updated) {
    // Deduct from leave balance
    updateLeaveBalance(
      updated.employeeId,
      updated.leaveType,
      updated.daysRequested
    );
    
    // Create notification for employee
    const reviewer = getEmployee(reviewerId);
    createNotification({
      employeeId: updated.employeeId,
      type: "leave_approved",
      title: "Leave Approved",
      message: `Your ${updated.leaveType} leave request for ${updated.startDate} to ${updated.endDate} has been approved by ${reviewer?.name || "your manager"}`,
      relatedId: requestId,
    });
  }
  
  return updated;
}

export function rejectLeaveRequest(
  requestId: string,
  reviewerId: string,
  comment?: string
): LeaveRequest | undefined {
  const updated = updateLeaveRequest(requestId, {
    status: "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    reviewComment: comment || null,
  });
  
  if (updated) {
    // Create notification for employee
    const reviewer = getEmployee(reviewerId);
    createNotification({
      employeeId: updated.employeeId,
      type: "leave_rejected",
      title: "Leave Rejected",
      message: `Your ${updated.leaveType} leave request for ${updated.startDate} to ${updated.endDate} has been rejected by ${reviewer?.name || "your manager"}${comment ? `. Reason: ${comment}` : ""}`,
      relatedId: requestId,
    });
  }
  
  return updated;
}

// ============================================
// REGULARIZATION REQUEST OPERATIONS
// ============================================

export function getRegularizationRequests(employeeId?: string): RegularizationRequest[] {
  const store = readStore();
  if (employeeId) {
    return store.regularizationRequests.filter((r) => r.employeeId === employeeId);
  }
  return store.regularizationRequests;
}

export function getPendingRegularizations(managerId?: string): RegularizationRequest[] {
  const store = readStore();
  let requests = store.regularizationRequests.filter((r) => r.status === "pending");
  
  if (managerId) {
    const directReports = getDirectReports(managerId);
    const reportIds = directReports.map((e) => e.id);
    requests = requests.filter((r) => reportIds.includes(r.employeeId));
  }
  
  return requests;
}

export function createRegularizationRequest(
  request: Omit<RegularizationRequest, "id">
): RegularizationRequest {
  const store = readStore();
  
  const newRequest: RegularizationRequest = {
    ...request,
    id: `REG-${Date.now()}`,
  };
  
  store.regularizationRequests.push(newRequest);
  writeStore(store);
  
  // Create notification for manager
  const employee = getEmployee(request.employeeId);
  if (employee?.managerId) {
    createNotification({
      employeeId: employee.managerId,
      type: "new_request",
      title: "New Regularization Request",
      message: `${employee.name} has requested attendance regularization for ${request.date} (${request.requestType})`,
      relatedId: newRequest.id,
    });
  }
  
  return newRequest;
}

export function approveRegularization(
  requestId: string,
  reviewerId: string,
  comment?: string
): RegularizationRequest | undefined {
  const store = readStore();
  const index = store.regularizationRequests.findIndex((r) => r.id === requestId);
  
  if (index < 0 || store.regularizationRequests[index].status !== "pending") {
    return undefined;
  }
  
  const request = store.regularizationRequests[index];
  
  // Update request
  store.regularizationRequests[index] = {
    ...request,
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    reviewComment: comment || null,
  };
  
  // Update attendance record
  const attendance = getAttendanceRecords(request.employeeId);
  const attendanceRecord = attendance.find((a) => a.date === request.date);
  
  if (attendanceRecord) {
    if (request.requestType === "missed_checkin") {
      attendanceRecord.checkIn = request.requestedTime + ":00";
    } else if (request.requestType === "missed_checkout") {
      attendanceRecord.checkOut = request.requestedTime + ":00";
    }
    
    // Calculate hours if both times exist
    if (attendanceRecord.checkIn && attendanceRecord.checkOut) {
      const checkIn = new Date(`2000-01-01T${attendanceRecord.checkIn}`);
      const checkOut = new Date(`2000-01-01T${attendanceRecord.checkOut}`);
      attendanceRecord.hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    }
    
    attendanceRecord.status = "present";
    addOrUpdateAttendance(request.employeeId, attendanceRecord);
  }
  
  writeStore(store);
  
  // Create notification
  const reviewer = getEmployee(reviewerId);
  createNotification({
    employeeId: request.employeeId,
    type: "regularization_approved",
    title: "Regularization Approved",
    message: `Your regularization request for ${request.date} has been approved by ${reviewer?.name || "your manager"}`,
    relatedId: requestId,
  });
  
  return store.regularizationRequests[index];
}

export function rejectRegularization(
  requestId: string,
  reviewerId: string,
  comment?: string
): RegularizationRequest | undefined {
  const store = readStore();
  const index = store.regularizationRequests.findIndex((r) => r.id === requestId);
  
  if (index < 0) return undefined;
  
  store.regularizationRequests[index] = {
    ...store.regularizationRequests[index],
    status: "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    reviewComment: comment || null,
  };
  
  writeStore(store);
  
  // Create notification
  const reviewer = getEmployee(reviewerId);
  createNotification({
    employeeId: store.regularizationRequests[index].employeeId,
    type: "regularization_rejected",
    title: "Regularization Rejected",
    message: `Your regularization request for ${store.regularizationRequests[index].date} has been rejected${comment ? `. Reason: ${comment}` : ""}`,
    relatedId: requestId,
  });
  
  return store.regularizationRequests[index];
}

// ============================================
// POLICY OPERATIONS
// ============================================

export function getPolicies(): Policy[] {
  const store = readStore();
  return store.policies;
}

export function searchPolicies(query: string): Policy[] {
  const store = readStore();
  const lowerQuery = query.toLowerCase();
  
  return store.policies.filter(
    (p) =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

export function getNotifications(employeeId: string): Notification[] {
  const store = readStore();
  return store.notifications
    .filter((n) => n.employeeId === employeeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadNotifications(employeeId: string): Notification[] {
  return getNotifications(employeeId).filter((n) => !n.read);
}

export function createNotification(
  notification: Omit<Notification, "id" | "read" | "createdAt">
): Notification {
  const store = readStore();
  
  const newNotification: Notification = {
    ...notification,
    id: `NOTIF-${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  
  store.notifications.push(newNotification);
  writeStore(store);
  
  return newNotification;
}

export function markNotificationRead(notificationId: string): void {
  const store = readStore();
  const notification = store.notifications.find((n) => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    writeStore(store);
  }
}

export function markAllNotificationsRead(employeeId: string): void {
  const store = readStore();
  store.notifications.forEach((n) => {
    if (n.employeeId === employeeId) {
      n.read = true;
    }
  });
  writeStore(store);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all pending approvals for a manager (leaves + regularizations)
 */
export function getAllPendingApprovals(managerId: string): Array<{
  id: string;
  type: "leave" | "regularization";
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  details: string;
  submittedAt: string;
  priority: "normal" | "urgent";
}> {
  const pendingLeaves = getPendingLeaveRequests(managerId);
  const pendingRegularizations = getPendingRegularizations(managerId);
  
  const approvals: Array<{
    id: string;
    type: "leave" | "regularization";
    employeeId: string;
    employeeName: string;
    department: string;
    title: string;
    details: string;
    submittedAt: string;
    priority: "normal" | "urgent";
  }> = [];
  
  // Map leave requests
  for (const leave of pendingLeaves) {
    const employee = getEmployee(leave.employeeId);
    if (!employee) continue;
    
    const isUrgent = new Date(leave.startDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000; // 3 days
    
    approvals.push({
      id: leave.id,
      type: "leave",
      employeeId: leave.employeeId,
      employeeName: employee.name,
      department: employee.department,
      title: `${leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave - ${leave.startDate}`,
      details: `${leave.daysRequested} day(s): ${leave.reason}`,
      submittedAt: leave.submittedAt,
      priority: isUrgent ? "urgent" : "normal",
    });
  }
  
  // Map regularization requests
  for (const reg of pendingRegularizations) {
    const employee = getEmployee(reg.employeeId);
    if (!employee) continue;
    
    approvals.push({
      id: reg.id,
      type: "regularization",
      employeeId: reg.employeeId,
      employeeName: employee.name,
      department: employee.department,
      title: `${reg.requestType.replace("_", " ")} - ${reg.date}`,
      details: reg.reason,
      submittedAt: reg.submittedAt,
      priority: "normal",
    });
  }
  
  // Sort by submitted date (newest first)
  return approvals.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

/**
 * Get system metrics for HR dashboard
 */
export function getSystemMetrics(): {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingApprovals: number;
  complianceScore: number;
  escalations: number;
} {
  const store = readStore();
  const today = new Date().toISOString().split("T")[0];
  
  const employees = store.employees.filter((e) => e.role === "employee");
  const totalEmployees = employees.length;
  
  let presentToday = 0;
  let onLeave = 0;
  
  for (const emp of employees) {
    const todayAttendance = store.attendance[emp.id]?.find((a) => a.date === today);
    if (todayAttendance?.status === "present" || todayAttendance?.status === "wfh") {
      presentToday++;
    } else if (todayAttendance?.status === "on_leave") {
      onLeave++;
    }
  }
  
  const pendingApprovals = store.leaveRequests.filter((r) => r.status === "pending").length +
    store.regularizationRequests.filter((r) => r.status === "pending").length;
  
  return {
    totalEmployees,
    presentToday,
    onLeave,
    pendingApprovals,
    complianceScore: 94, // Mock
    escalations: 0,
  };
}
