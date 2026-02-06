/**
 * @file HR API Client
 * @description Client-side functions to interact with the HR API
 * 
 * This file provides a client-safe way to interact with the HR data store.
 * All operations go through the /api/hr endpoint which handles the actual
 * file operations on the server.
 */

const API_BASE = "/api/hr";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Dispatch event to notify UI components that HR data has changed
 */
export function notifyDataUpdate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hr-data-updated"));
  }
}

async function get<T>(action: string, params?: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams({ action, ...params });
  const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

async function post<T>(action: string, data: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

// ============================================
// EMPLOYEE OPERATIONS
// ============================================

export async function getAllEmployees(): Promise<Array<{
  id: string;
  employee_id?: string;
  employeeId?: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "hr";
  department: string;
  manager_id?: string | null;
  managerId?: string | null;
}>> {
  return get("getAllEmployees", {});
}

// ============================================
// ATTENDANCE OPERATIONS
// ============================================

export async function submitCheckInOut(params: { 
  employeeId: string; 
  action: "check_in" | "check_out" 
}): Promise<{
  success: boolean;
  timestamp: string;
  message: string;
}> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];
  
  // For check-in
  if (params.action === "check_in") {
    await post("addOrUpdateAttendance", {
      employeeId: params.employeeId,
      record: {
        date: today,
        checkIn: time,
        checkOut: null,
        status: "present",
        hoursWorked: null,
      },
    });
    
    // Notify UI to refresh
    notifyDataUpdate();
    
    return {
      success: true,
      timestamp: now.toISOString(),
      message: `Checked in at ${now.toLocaleTimeString()}`,
    };
  }
  
  // For check-out, get current attendance first
  const records = await get<Array<{
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    status: string;
    hoursWorked?: number | null;
    hours_worked?: number | null;
  }>>("getAttendanceRecords", { employeeId: params.employeeId });

  const normalizedRecords = records.map((record) => ({
    date: record.date,
    checkIn: record.checkIn ?? record.check_in ?? null,
    checkOut: record.checkOut ?? record.check_out ?? null,
    status: record.status,
    hoursWorked: record.hoursWorked ?? record.hours_worked ?? null,
  }));
  
  const todayRecord = normalizedRecords.find(r => r.date === today);
  
  if (todayRecord?.checkIn) {
    const checkInTime = new Date(`${today}T${todayRecord.checkIn}`);
    const hoursWorked = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    
    await post("addOrUpdateAttendance", {
      employeeId: params.employeeId,
      record: {
        date: today,
        checkIn: todayRecord.checkIn,
        checkOut: time,
        status: "present",
        hoursWorked: Math.round(hoursWorked * 100) / 100,
      },
    });
  }
  
  // Notify UI to refresh
  notifyDataUpdate();
  
  return {
    success: true,
    timestamp: now.toISOString(),
    message: `Checked out at ${now.toLocaleTimeString()}`,
  };
}

export async function getAttendanceStatus(params: { 
  employeeId: string 
}): Promise<{
  records: Array<{
    id: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: string;
    hoursWorked?: number;
  }>;
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    wfhDays: number;
    avgHoursWorked: number;
  };
  todayStatus: {
    isCheckedIn: boolean;
    checkInTime?: string;
    checkOutTime?: string;
    hasMissedCheckout: boolean;
    missedCheckoutDate?: string;
  };
}> {
  const records = await get<Array<{
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    status: string;
    hoursWorked?: number | null;
    hours_worked?: number | null;
  }>>("getAttendanceRecords", { employeeId: params.employeeId });

  const normalizedRecords = records.map((record) => ({
    date: record.date,
    checkIn: record.checkIn ?? record.check_in ?? null,
    checkOut: record.checkOut ?? record.check_out ?? null,
    status: record.status,
    hoursWorked: record.hoursWorked ?? record.hours_worked ?? null,
  }));
  
  const today = new Date().toISOString().split("T")[0];
  const todayRecord = normalizedRecords.find((r) => r.date === today);
  const missedCheckout = normalizedRecords.find((r) => r.checkIn && !r.checkOut && r.date !== today);
  
  const presentDays = normalizedRecords.filter((r) => r.status === "present").length;
  
  return {
    records: normalizedRecords.map((r) => ({
      id: `att-${params.employeeId}-${r.date}`,
      date: r.date,
      checkIn: r.checkIn || undefined,
      checkOut: r.checkOut || undefined,
      status: r.status === "on_leave" ? "absent" : r.status,
      hoursWorked: r.hoursWorked || undefined,
    })),
    summary: {
      totalDays: normalizedRecords.length,
      presentDays,
      absentDays: normalizedRecords.filter((r) => r.status === "absent").length,
      wfhDays: normalizedRecords.filter((r) => r.status === "wfh").length,
      avgHoursWorked: normalizedRecords.reduce((total, record) => total + (record.hoursWorked || 0), 0) / (presentDays || 1),
    },
    todayStatus: {
      isCheckedIn: !!todayRecord?.checkIn,
      checkInTime: todayRecord?.checkIn || undefined,
      checkOutTime: todayRecord?.checkOut || undefined,
      hasMissedCheckout: !!missedCheckout,
      missedCheckoutDate: missedCheckout?.date,
    },
  };
}

// ============================================
// LEAVE OPERATIONS
// ============================================

export async function getLeaveBalance(params: { 
  employeeId: string 
}): Promise<Array<{
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  label: string;
}>> {
  const balances = await get<Array<{
    leave_type: string;
    total_days: number;
    used_days: number;
    remaining_days: number;
  }>>("getLeaveBalances", { employeeId: params.employeeId });

  const labels: Record<string, string> = {
    casual: "Casual Leave",
    sick: "Sick Leave",
    earned: "Earned Leave",
    wfh: "Work From Home",
    comp_off: "Compensatory Off",
  };

  return balances.map((balance) => ({
    leaveType: balance.leave_type,
    totalDays: balance.total_days,
    usedDays: balance.used_days,
    remainingDays: balance.remaining_days,
    label: labels[balance.leave_type] || balance.leave_type,
  }));
}

export async function submitLeaveRequest(params: {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<{
  success: boolean;
  requestId: string;
  message: string;
  daysRequested: number;
}> {
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const validLeaveTypes = ["casual", "sick", "earned", "wfh", "comp_off"];
  const leaveType = validLeaveTypes.includes(params.leaveType) ? params.leaveType : "casual";
  
  const result = await post<{ id: string }>("createLeaveRequest", {
    request: {
      employeeId: params.employeeId,
      leaveType,
      startDate: params.startDate,
      endDate: params.endDate,
      daysRequested: days,
      reason: params.reason,
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewComment: null,
    },
  });
  
  // Notify UI to refresh
  notifyDataUpdate();
  
  return {
    success: true,
    requestId: result.id,
    message: "Leave request submitted successfully. Pending manager approval.",
    daysRequested: days,
  };
}

// ============================================
// REGULARIZATION OPERATIONS
// ============================================

export async function submitRegularization(params: {
  employeeId: string;
  date: string;
  requestType: "missed_checkin" | "missed_checkout" | "correction";
  requestedTime: string;
  reason: string;
}): Promise<{
  success: boolean;
  requestId: string;
  message: string;
}> {
  const result = await post<{ id: string }>("createRegularizationRequest", {
    request: {
      employeeId: params.employeeId,
      date: params.date,
      requestType: params.requestType,
      requestedTime: params.requestedTime,
      reason: params.reason,
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewComment: null,
    },
  });
  
  // Notify UI to refresh
  notifyDataUpdate();
  
  return {
    success: true,
    requestId: result.id,
    message: "Regularization request submitted successfully. Pending manager approval.",
  };
}

// ============================================
// APPROVAL OPERATIONS
// ============================================

export async function getPendingApprovals(params: { 
  managerId: string 
}): Promise<Array<{
  id: string;
  type: "leave" | "regularization";
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  details: string;
  submittedAt: string;
  priority: "normal" | "urgent";
}>> {
  return get("getPendingApprovals", { managerId: params.managerId });
}

export async function processApproval(params: {
  approvalId: string;
  action: "approve" | "reject";
  comment?: string;
  managerId?: string;
  type?: "leave" | "regularization" | "wfh";
}): Promise<{
  success: boolean;
  message: string;
}> {
  if (!params.managerId) {
    throw new Error("managerId is required to process approvals");
  }
  const reviewerId = params.managerId;
  const approvalType = params.type || (params.approvalId.startsWith("LV-") ? "leave" : "regularization");
  const isLeave = approvalType === "leave" || approvalType === "wfh";
  
  if (isLeave) {
    await post(
      params.action === "approve" ? "approveLeaveRequest" : "rejectLeaveRequest",
      { requestId: params.approvalId, reviewerId, comment: params.comment }
    );
  } else {
    await post(
      params.action === "approve" ? "approveRegularization" : "rejectRegularization",
      { requestId: params.approvalId, reviewerId, comment: params.comment }
    );
  }
  
  // Notify UI to refresh
  notifyDataUpdate();
  
  return {
    success: true,
    message: params.action === "approve" 
      ? "Request approved successfully."
      : "Request rejected.",
  };
}

// ============================================
// REQUEST STATUS
// ============================================

export async function getRequestStatus(params: { 
  employeeId: string 
}): Promise<Array<{
  id: string;
  type: "leave" | "regularization";
  title: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  details: string;
}>> {
  const [leaveRequests, regularizationRequests] = await Promise.all([
    get<Array<{
    id: string;
    leaveType?: string;
    startDate?: string;
    submittedAt?: string;
    leave_type?: string;
    start_date?: string;
    submitted_at?: string;
    reason: string;
    status: string;
  }>>("getLeaveRequests", { employeeId: params.employeeId }),
    get<Array<{
      id: string;
      requestType?: string;
      date?: string;
      submittedAt?: string;
      request_type?: string;
      submitted_at?: string;
      reason: string;
      status: string;
    }>>("getRegularizationRequests", { employeeId: params.employeeId }),
  ]);
  
  const labels: Record<string, string> = {
    casual: "Casual Leave",
    sick: "Sick Leave",
    earned: "Earned Leave",
    wfh: "Work From Home",
    comp_off: "Compensatory Off",
  };
  
  const results: Array<{
    id: string;
    type: "leave" | "regularization";
    title: string;
    submittedAt: string;
    status: "pending" | "approved" | "rejected";
    details: string;
  }> = leaveRequests.map((lr) => {
    const leaveType = lr.leaveType || lr.leave_type || "casual";
    const startDate = lr.startDate || lr.start_date || "";
    const submittedAt = lr.submittedAt || lr.submitted_at || new Date().toISOString();

    return {
      id: lr.id,
      type: "leave" as const,
      title: `${labels[leaveType] || leaveType} - ${startDate}`,
      submittedAt,
      status: lr.status as "pending" | "approved" | "rejected",
      details: lr.reason,
    };
  });

  for (const rr of regularizationRequests) {
    const requestType = rr.requestType || rr.request_type || "correction";
    const submittedAt = rr.submittedAt || rr.submitted_at || new Date().toISOString();
    const date = rr.date || "";
    const title = requestType === "missed_checkin"
      ? `Missed Check-in - ${date}`
      : requestType === "missed_checkout"
      ? `Missed Check-out - ${date}`
      : `Correction - ${date}`;

    results.push({
      id: rr.id,
      type: "regularization",
      title,
      submittedAt,
      status: rr.status as "pending" | "approved" | "rejected",
      details: rr.reason,
    });
  }
  
  // Sort by submission date (newest first)
  results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  
  return results;
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function getNotifications(params: { 
  employeeId?: string;
  role?: "employee" | "manager" | "hr";
}): Promise<Array<{
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  audienceRole?: string;
  relatedId?: string;
}>> {
  const results = await get<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    created_at?: string;
    createdAt?: string;
    is_read?: boolean;
    read?: boolean;
    audience_role?: string;
    audienceRole?: string;
    related_id?: string | null;
    relatedId?: string;
  }>>("getNotifications", {
    ...(params.employeeId ? { employeeId: params.employeeId } : {}),
    ...(params.role ? { role: params.role } : {}),
  });

  return results.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    createdAt: notification.createdAt || notification.created_at || new Date().toISOString(),
    read: notification.read ?? notification.is_read ?? false,
    audienceRole: notification.audienceRole || notification.audience_role || undefined,
    relatedId: notification.relatedId || notification.related_id || undefined,
  }));
}

export async function markNotificationRead(params: { 
  notificationId: string 
}): Promise<{ success: boolean }> {
  return post("markNotificationRead", { notificationId: params.notificationId });
}

// ============================================
// TEAM DATA
// ============================================

export async function getTeamMembers(params: { 
  managerId: string 
}): Promise<Array<{
  id: string;
  employeeId: string;
  name: string;
  status: "available" | "wfh" | "on_leave" | "absent";
  todayAttendance?: { checkIn?: string; checkOut?: string };
}>> {
  return get("getTeamMembers", { managerId: params.managerId });
}

// ============================================
// SYSTEM METRICS
// ============================================

export async function getSystemMetrics(): Promise<{
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingApprovals: number;
  complianceScore: number;
  escalations: number;
}> {
  return get("getSystemMetrics", {});
}

// ============================================
// POLICIES
// ============================================

export async function searchPolicies(params: { 
  query: string 
}): Promise<Array<{
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}>> {
  const results = await get<Array<{
    id: string;
    title: string;
    category: string | null;
    content: string;
    created_at?: string;
    last_updated?: string;
    lastUpdated?: string;
  }>>("searchPolicies", { query: params.query });

  return results.map((policy) => ({
    id: policy.id,
    title: policy.title,
    category: (policy.category || "General").toLowerCase(),
    content: policy.content,
    lastUpdated: policy.lastUpdated || policy.last_updated || policy.created_at || new Date().toISOString(),
  }));
}

export async function getPolicies(): Promise<Array<{
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}>> {
  const results = await get<Array<{
    id: string;
    title: string;
    category: string | null;
    content: string;
    created_at?: string;
    last_updated?: string;
    lastUpdated?: string;
  }>>("getPolicies", {});

  return results.map((policy) => ({
    id: policy.id,
    title: policy.title,
    category: (policy.category || "General").toLowerCase(),
    content: policy.content,
    lastUpdated: policy.lastUpdated || policy.last_updated || policy.created_at || new Date().toISOString(),
  }));
}

export async function createPolicy(params: {
  title: string;
  category: string;
  content: string;
}): Promise<{ id: string }> {
  const result = await post<{ id: string }>("createPolicy", {
    policy: {
      title: params.title,
      category: params.category,
      content: params.content,
      lastUpdated: new Date().toISOString(),
    },
  });
  notifyDataUpdate();
  return result;
}

export async function updatePolicy(params: {
  id: string;
  title: string;
  category: string;
  content: string;
}): Promise<{ id: string }> {
  const result = await post<{ id: string }>("updatePolicy", {
    id: params.id,
    updates: {
      title: params.title,
      category: params.category,
      content: params.content,
      lastUpdated: new Date().toISOString(),
    },
  });
  notifyDataUpdate();
  return result;
}

export async function deletePolicy(params: { id: string }): Promise<{ success: boolean }> {
  const result = await post<{ success: boolean }>("deletePolicy", { id: params.id });
  notifyDataUpdate();
  return result;
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export async function getAnnouncements(params: {
  role?: "employee" | "manager" | "hr";
}): Promise<Array<{
  id: string;
  title: string;
  content: string;
  audienceRole: string;
  pinned: boolean;
  createdAt: string;
  expiresAt?: string | null;
}>> {
  const results = await get<Array<{
    id: string;
    title: string;
    content: string;
    audience_role: string;
    pinned: boolean;
    created_at: string;
    expires_at?: string | null;
  }>>("getAnnouncements", params.role ? { role: params.role } : {});

  return results.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    audienceRole: item.audience_role,
    pinned: item.pinned,
    createdAt: item.created_at,
    expiresAt: item.expires_at || null,
  }));
}

export async function createAnnouncement(params: {
  title: string;
  content: string;
  audienceRole: "all" | "employee" | "manager" | "hr";
  pinned?: boolean;
  createdBy?: string | null;
  expiresAt?: string | null;
}): Promise<{ id: string }> {
  const result = await post<{ id: string }>("createAnnouncement", {
    announcement: {
      title: params.title,
      content: params.content,
      audienceRole: params.audienceRole,
      pinned: params.pinned ?? false,
      createdBy: params.createdBy || null,
      expiresAt: params.expiresAt || null,
    },
  });
  notifyDataUpdate();
  return result;
}

export async function deleteAnnouncement(params: { id: string }): Promise<{ success: boolean }> {
  const result = await post<{ success: boolean }>("deleteAnnouncement", { id: params.id });
  notifyDataUpdate();
  return result;
}

// ============================================
// DOCUMENTS & ACKNOWLEDGMENTS
// ============================================

export async function getDocuments(params: {
  role?: "employee" | "manager" | "hr";
}): Promise<Array<{
  id: string;
  title: string;
  description?: string | null;
  filePath: string;
  audienceRole: string;
  requiresAck: boolean;
  createdAt: string;
  expiresAt?: string | null;
}>> {
  const results = await get<Array<{
    id: string;
    title: string;
    description?: string | null;
    file_path: string;
    audience_role: string;
    requires_ack: boolean;
    created_at: string;
    expires_at?: string | null;
  }>>("getDocuments", params.role ? { role: params.role } : {});

  return results.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description || null,
    filePath: item.file_path,
    audienceRole: item.audience_role,
    requiresAck: item.requires_ack,
    createdAt: item.created_at,
    expiresAt: item.expires_at || null,
  }));
}

export async function getAcknowledgedDocumentIds(params: {
  employeeId: string;
}): Promise<string[]> {
  return get("getAcknowledgedDocumentIds", { employeeId: params.employeeId });
}

export async function acknowledgeDocument(params: {
  employeeId: string;
  documentId: string;
}): Promise<{ id: string }> {
  const result = await post<{ id: string }>("acknowledgeDocument", {
    employeeId: params.employeeId,
    documentId: params.documentId,
  });
  notifyDataUpdate();
  return result;
}

export async function uploadDocument(params: {
  file: File;
  title: string;
  description?: string;
  audienceRole: "all" | "employee" | "manager" | "hr";
  requiresAck?: boolean;
  createdBy?: string | null;
  expiresAt?: string | null;
}): Promise<{ id: string; file_path: string }> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("title", params.title);
  formData.append("description", params.description || "");
  formData.append("audienceRole", params.audienceRole);
  formData.append("requiresAck", String(params.requiresAck ?? false));
  formData.append("createdBy", params.createdBy || "");
  formData.append("expiresAt", params.expiresAt || "");

  const response = await fetch("/api/hr/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Upload failed");
  }

  notifyDataUpdate();
  return response.json();
}

export async function deleteDocument(params: { id: string }): Promise<{ success: boolean }> {
  const result = await post<{ success: boolean }>("deleteDocument", { id: params.id });
  notifyDataUpdate();
  return result;
}

// ============================================
// ANALYTICS DATA
// ============================================

/**
 * Get attendance trends data for charts
 * Returns weekly or monthly attendance percentages
 */
export async function getAttendanceTrends(params: {
  period?: "week" | "month";
  employeeId?: string;
  department?: string;
}): Promise<{
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}> {
  const { period = "week" } = params;

  if (period === "week") {
    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      datasets: [
        {
          label: "Present",
          data: [92, 88, 95, 91, 85],
          color: "hsl(160, 82%, 47%)", // Green
        },
        {
          label: "WFH",
          data: [5, 8, 3, 6, 10],
          color: "hsl(220, 100%, 62%)", // Blue
        },
        {
          label: "Leave",
          data: [3, 4, 2, 3, 5],
          color: "hsl(32, 100%, 62%)", // Orange
        },
      ],
    };
  }

  // Monthly data
  return {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Attendance %",
        data: [94, 92, 96, 93, 91, 95],
        color: "hsl(160, 82%, 47%)",
      },
    ],
  };
}

/**
 * Get leave analytics data for charts
 * Returns leave type distribution or usage over time
 */
export async function getLeaveAnalytics(params: {
  type?: "distribution" | "usage";
  employeeId?: string;
  department?: string;
}): Promise<{
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}> {
  const { type = "distribution" } = params;

  if (type === "distribution") {
    return {
      labels: ["Casual", "Sick", "Earned", "WFH", "Comp-off"],
      datasets: [
        {
          label: "Leave Distribution",
          data: [35, 15, 25, 20, 5],
          color: "hsl(220, 100%, 62%)",
        },
      ],
    };
  }

  // Usage over time
  return {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Casual Leave",
        data: [12, 8, 15, 10, 18, 14],
        color: "hsl(220, 100%, 62%)",
      },
      {
        label: "Sick Leave",
        data: [5, 8, 3, 6, 4, 7],
        color: "hsl(340, 82%, 66%)",
      },
      {
        label: "Earned Leave",
        data: [8, 10, 12, 8, 15, 20],
        color: "hsl(160, 82%, 47%)",
      },
    ],
  };
}

/**
 * Get team metrics data for managers
 */
export async function getTeamMetrics(params: {
  managerId?: string;
  metric?: "attendance" | "leave" | "status";
}): Promise<{
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}> {
  const { metric = "status" } = params;

  if (metric === "status") {
    return {
      labels: ["In Office", "WFH", "On Leave", "Offline"],
      datasets: [
        {
          label: "Team Status",
          data: [12, 5, 2, 1],
          color: "hsl(160, 82%, 47%)",
        },
      ],
    };
  }

  if (metric === "attendance") {
    return {
      labels: ["Priya", "Amit", "Sneha", "Vikram", "Kavitha"],
      datasets: [
        {
          label: "Attendance %",
          data: [96, 92, 88, 94, 98],
          color: "hsl(220, 100%, 62%)",
        },
      ],
    };
  }

  // Leave usage by team member
  return {
    labels: ["Priya", "Amit", "Sneha", "Vikram", "Kavitha"],
    datasets: [
      {
        label: "Leaves Taken",
        data: [8, 12, 6, 10, 4],
        color: "hsl(32, 100%, 62%)",
      },
      {
        label: "Leaves Remaining",
        data: [29, 25, 31, 27, 33],
        color: "hsl(160, 82%, 47%)",
      },
    ],
  };
}

/**
 * Get HR KPIs and organization-wide metrics for charts
 */
export async function getHRAnalytics(params: {
  metric?: "headcount" | "turnover" | "departmentDistribution";
}): Promise<{
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}> {
  const { metric = "departmentDistribution" } = params;

  if (metric === "departmentDistribution") {
    return {
      labels: ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"],
      datasets: [
        {
          label: "Employees",
          data: [85, 42, 28, 15, 18, 60],
          color: "hsl(220, 100%, 62%)",
        },
      ],
    };
  }

  if (metric === "headcount") {
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Total Employees",
          data: [235, 238, 242, 245, 247, 248],
          color: "hsl(160, 82%, 47%)",
        },
        {
          label: "New Hires",
          data: [5, 4, 6, 3, 4, 2],
          color: "hsl(220, 100%, 62%)",
        },
      ],
    };
  }

  // Turnover
  return {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      {
        label: "Turnover Rate %",
        data: [2.5, 3.1, 2.8, 2.2],
        color: "hsl(340, 82%, 66%)",
      },
    ],
  };
}
