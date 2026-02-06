/**
 * HR Data Service
 * 
 * Provides HR data from JSON store with real persistence.
 * Uses dataStore.ts for all read/write operations.
 */

import type { 
  UserProfile, 
  AttendanceRecord, 
  LeaveBalanceInfo, 
  RequestStatus,
  ApprovalItem,
  TeamMember,
  SystemMetrics,
  PolicyDocument
} from "@/types/hr";

import * as dataStore from "./dataStore";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Map dataStore attendance status to HR type status
 * dataStore uses: "present" | "absent" | "wfh" | "on_leave" | "half_day" | "holiday"
 * HR type uses: "present" | "absent" | "half_day" | "wfh" | "holiday"
 */
function mapAttendanceStatus(status: string): "present" | "absent" | "half_day" | "wfh" | "holiday" {
  if (status === "on_leave") return "absent";
  if (["present", "absent", "half_day", "wfh", "holiday"].includes(status)) {
    return status as "present" | "absent" | "half_day" | "wfh" | "holiday";
  }
  return "absent";
}

// ============================================
// EMPLOYEE DATA (from JSON store)
// ============================================

export function getMockEmployees(): UserProfile[] {
  const store = dataStore.readStore();
  return store.employees.map(emp => ({
    id: emp.id,
    employeeId: emp.employeeId,
    name: emp.name,
    email: emp.email,
    role: emp.role as "employee" | "manager" | "hr",
    department: emp.department,
    managerId: emp.managerId || undefined,
  }));
}

// Keep for backward compatibility
export const mockEmployees: UserProfile[] = [
  {
    id: "emp-001",
    employeeId: "ZP-1001",
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    role: "employee",
    department: "Engineering",
    managerId: "mgr-001",
  },
  {
    id: "emp-002",
    employeeId: "ZP-1002",
    name: "Amit Patel",
    email: "amit.patel@company.com",
    role: "employee",
    department: "Engineering",
    managerId: "mgr-001",
  },
  {
    id: "emp-003",
    employeeId: "ZP-1003",
    name: "Sneha Reddy",
    email: "sneha.reddy@company.com",
    role: "employee",
    department: "Engineering",
    managerId: "mgr-001",
  },
  {
    id: "emp-004",
    employeeId: "ZP-1004",
    name: "Vikram Singh",
    email: "vikram.singh@company.com",
    role: "employee",
    department: "Engineering",
    managerId: "mgr-001",
  },
  {
    id: "emp-005",
    employeeId: "ZP-1005",
    name: "Kavitha Nair",
    email: "kavitha.nair@company.com",
    role: "employee",
    department: "Engineering",
    managerId: "mgr-001",
  },
  {
    id: "mgr-001",
    employeeId: "ZP-0501",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@company.com",
    role: "manager",
    department: "Engineering",
  },
  {
    id: "hr-001",
    employeeId: "ZP-0101",
    name: "Ananya Patel",
    email: "ananya.patel@company.com",
    role: "hr",
    department: "Human Resources",
  },
];

// ============================================
// ATTENDANCE DATA (from JSON store)
// ============================================

export async function getAttendanceStatus(params: { employeeId: string; startDate?: string; endDate?: string }): Promise<{
  records: AttendanceRecord[];
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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Get real attendance records from store
  const storeRecords = dataStore.getAttendanceRecords(params.employeeId);
  const today = new Date().toISOString().split("T")[0];
  
  // Convert to expected format - map "on_leave" to "absent" since HR types don't have "leave"
  const records: AttendanceRecord[] = storeRecords.map(r => ({
    id: `att-${params.employeeId}-${r.date}`,
    date: r.date,
    checkIn: r.checkIn || undefined,
    checkOut: r.checkOut || undefined,
    status: mapAttendanceStatus(r.status),
    hoursWorked: r.hoursWorked || undefined,
  }));
  
  const presentDays = records.filter(r => r.status === "present").length;
  const todayRecord = storeRecords.find(r => r.date === today);
  const missedCheckout = storeRecords.find(r => r.checkIn && !r.checkOut && r.date !== today);
  
  return {
    records,
    summary: {
      totalDays: records.length,
      presentDays,
      absentDays: records.filter(r => r.status === "absent").length,
      wfhDays: records.filter(r => r.status === "wfh").length,
      avgHoursWorked: records.filter(r => r.hoursWorked).reduce((a, b) => a + (b.hoursWorked || 0), 0) / (presentDays || 1),
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

export async function submitCheckInOut(params: { employeeId: string; action: "check_in" | "check_out" }): Promise<{
  success: boolean;
  timestamp: string;
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];
  
  // Update the store
  if (params.action === "check_in") {
    dataStore.addOrUpdateAttendance(params.employeeId, {
      date: today,
      checkIn: time,
      checkOut: null,
      status: "present",
      hoursWorked: null,
    });
  } else {
    // Get existing record to preserve check-in time
    const records = dataStore.getAttendanceRecords(params.employeeId);
    const todayRecord = records.find(r => r.date === today);
    
    if (todayRecord) {
      const checkInTime = new Date(`${today}T${todayRecord.checkIn}`);
      const checkOutTime = now;
      const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      
      dataStore.addOrUpdateAttendance(params.employeeId, {
        date: today,
        checkIn: todayRecord.checkIn,
        checkOut: time,
        status: "present",
        hoursWorked: Math.round(hoursWorked * 100) / 100,
      });
    }
  }
  
  return {
    success: true,
    timestamp: now.toISOString(),
    message: params.action === "check_in" 
      ? `Checked in at ${now.toLocaleTimeString()}`
      : `Checked out at ${now.toLocaleTimeString()}`,
  };
}

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
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Create regularization request in store
  const result = dataStore.createRegularizationRequest({
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
  });
  
  return {
    success: true,
    requestId: result.id,
    message: "Regularization request submitted successfully. Pending manager approval.",
  };
}

// ============================================
// LEAVE DATA (from JSON store)
// ============================================

const leaveTypeLabels: Record<string, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  earned: "Earned Leave",
  wfh: "Work From Home",
  comp_off: "Compensatory Off",
};

export async function getLeaveBalance(params: { employeeId: string }): Promise<LeaveBalanceInfo[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Get real leave balances from store
  const balances = dataStore.getLeaveBalances(params.employeeId);
  
  if (!balances) {
    return [];
  }
  
  // Convert from object format to array format
  const leaveTypes: Array<keyof dataStore.LeaveBalances> = ["casual", "sick", "earned", "wfh", "comp_off"];
  return leaveTypes.map(leaveType => ({
    leaveType,
    totalDays: balances[leaveType].total,
    usedDays: balances[leaveType].used,
    remainingDays: balances[leaveType].total - balances[leaveType].used,
    label: leaveTypeLabels[leaveType] || leaveType,
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
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Validate leave type
  const validLeaveTypes = ["casual", "sick", "earned", "wfh", "comp_off"];
  const leaveType = validLeaveTypes.includes(params.leaveType) 
    ? params.leaveType as "casual" | "sick" | "earned" | "wfh" | "comp_off"
    : "casual";
  
  // Create leave request in store (this will also notify the manager)
  const result = dataStore.createLeaveRequest({
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
  });
  
  return {
    success: true,
    requestId: result.id,
    message: "Leave request submitted successfully. Pending manager approval.",
    daysRequested: days,
  };
}

// ============================================
// REQUESTS & APPROVALS (from JSON store)
// ============================================

export async function getRequestStatus(params: { employeeId: string }): Promise<RequestStatus[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const store = dataStore.readStore();
  const results: RequestStatus[] = [];
  
  // Get leave requests for this employee
  const leaveRequests = store.leaveRequests.filter(r => r.employeeId === params.employeeId);
  for (const lr of leaveRequests) {
    results.push({
      id: lr.id,
      type: "leave",
      title: `${leaveTypeLabels[lr.leaveType] || lr.leaveType} - ${lr.startDate}`,
      submittedAt: lr.submittedAt,
      status: lr.status as "pending" | "approved" | "rejected",
      details: lr.reason,
    });
  }
  
  // Get regularization requests for this employee
  const regRequests = store.regularizationRequests.filter(r => r.employeeId === params.employeeId);
  for (const rr of regRequests) {
    results.push({
      id: rr.id,
      type: "regularization",
      title: `${rr.requestType === "missed_checkin" ? "Missed Check-in" : rr.requestType === "missed_checkout" ? "Missed Checkout" : "Correction"} - ${rr.date}`,
      submittedAt: rr.submittedAt,
      status: rr.status as "pending" | "approved" | "rejected",
      details: rr.reason,
    });
  }
  
  // Sort by submission date (newest first)
  results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  
  return results;
}

export async function getPendingApprovals(params: { managerId: string }): Promise<ApprovalItem[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Get real pending approvals from store
  const pendingApprovals = dataStore.getAllPendingApprovals(params.managerId);
  return pendingApprovals;
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
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!params.managerId) {
    throw new Error("managerId is required to process approvals");
  }
  const reviewerId = params.managerId;
  
  const approvalType = params.type || (params.approvalId.startsWith("LV-") ? "leave" : "regularization");
  const isLeave = approvalType === "leave" || approvalType === "wfh";
  const isReg = approvalType === "regularization";
  
  if (isLeave) {
    if (params.action === "approve") {
      dataStore.approveLeaveRequest(params.approvalId, reviewerId, params.comment);
    } else {
      dataStore.rejectLeaveRequest(params.approvalId, reviewerId, params.comment);
    }
  } else if (isReg) {
    if (params.action === "approve") {
      dataStore.approveRegularization(params.approvalId, reviewerId, params.comment);
    } else {
      dataStore.rejectRegularization(params.approvalId, reviewerId, params.comment);
    }
  }
  
  return {
    success: true,
    message: params.action === "approve" 
      ? "Request approved successfully."
      : "Request rejected.",
  };
}

// ============================================
// TEAM DATA (from JSON store)
// ============================================

export async function getTeamMembers(params: { managerId: string }): Promise<TeamMember[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Get direct reports from store
  const directReports = dataStore.getDirectReports(params.managerId);
  const today = new Date().toISOString().split("T")[0];
  const store = dataStore.readStore();
  
  return directReports.map(emp => {
    // Get today's attendance for this employee
    const employeeAttendance = store.attendance[emp.id] || [];
    const todayAttendance = employeeAttendance.find(
      (a: dataStore.AttendanceRecord) => a.date === today
    );
    
    // Check if on leave today
    const onLeave = store.leaveRequests.some(
      lr => lr.employeeId === emp.id && 
            lr.status === "approved" && 
            lr.startDate <= today && 
            lr.endDate >= today
    );
    
    // Determine status - use "absent" instead of "offline" to match TeamMember type
    let status: "available" | "wfh" | "on_leave" | "absent" = "absent";
    if (onLeave) {
      status = "on_leave";
    } else if (todayAttendance?.status === "wfh") {
      status = "wfh";
    } else if (todayAttendance?.checkIn) {
      status = "available";
    }
    
    return {
      id: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      status,
      todayAttendance: todayAttendance 
        ? { checkIn: todayAttendance.checkIn || undefined, checkOut: todayAttendance.checkOut || undefined }
        : undefined,
    };
  });
}

// ============================================
// HR DATA (from JSON store)
// ============================================

export async function getSystemMetrics(): Promise<SystemMetrics> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Get real metrics from store
  const metrics = dataStore.getSystemMetrics();
  return metrics;
}

export async function searchPolicies(params: { query: string }): Promise<PolicyDocument[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Get policies from store
  const store = dataStore.readStore();
  const policies = store.policies.map(p => ({
    id: p.id,
    title: p.title,
    category: p.category as "leave" | "attendance" | "general",
    content: p.content,
    lastUpdated: p.lastUpdated,
  }));
  
  const lowerQuery = params.query.toLowerCase();
  return policies.filter(p => 
    p.title.toLowerCase().includes(lowerQuery) ||
    p.content.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// NOTIFICATIONS (from JSON store)
// ============================================

export async function getNotifications(params: { employeeId: string }): Promise<Array<{
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  relatedId?: string;
}>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return dataStore.getNotifications(params.employeeId);
}

export async function markNotificationRead(params: { notificationId: string }): Promise<{ success: boolean }> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  dataStore.markNotificationRead(params.notificationId);
  return { success: true };
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
  await new Promise(resolve => setTimeout(resolve, 300));

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
  await new Promise(resolve => setTimeout(resolve, 300));

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
  await new Promise(resolve => setTimeout(resolve, 300));

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
  await new Promise(resolve => setTimeout(resolve, 300));

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

