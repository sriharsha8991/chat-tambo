/**
 * HR Mock Data Service
 * 
 * Provides mock data for the HR workspace demo.
 * Replace with Supabase calls for production.
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

// ============================================
// MOCK EMPLOYEES
// ============================================

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
// ATTENDANCE DATA
// ============================================

function generateWeekAttendance(employeeId: string): AttendanceRecord[] {
  const today = new Date();
  const records: AttendanceRecord[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const isToday = i === 0;
    const isMissedCheckout = i === 1 && employeeId === "emp-001"; // Yesterday for Priya
    
    records.push({
      id: `att-${employeeId}-${i}`,
      date: date.toISOString().split("T")[0],
      checkIn: isToday ? undefined : "09:15:00",
      checkOut: isToday ? undefined : isMissedCheckout ? undefined : "18:30:00",
      status: isToday ? "absent" : isMissedCheckout ? "present" : "present",
      hoursWorked: isToday ? 0 : isMissedCheckout ? undefined : 9.25,
    });
  }
  
  return records;
}

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
  
  const records = generateWeekAttendance(params.employeeId);
  const presentDays = records.filter(r => r.status === "present").length;
  const missedCheckout = records.find(r => r.checkIn && !r.checkOut && r.date !== new Date().toISOString().split("T")[0]);
  
  return {
    records,
    summary: {
      totalDays: records.length,
      presentDays,
      absentDays: records.filter(r => r.status === "absent").length,
      wfhDays: records.filter(r => r.status === "wfh").length,
      avgHoursWorked: records.filter(r => r.hoursWorked).reduce((a, b) => a + (b.hoursWorked || 0), 0) / presentDays || 0,
    },
    todayStatus: {
      isCheckedIn: false,
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
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const now = new Date();
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
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    requestId: `REG-${Date.now()}`,
    message: "Regularization request submitted successfully. Pending manager approval.",
  };
}

// ============================================
// LEAVE DATA
// ============================================

export async function getLeaveBalance(params: { employeeId: string }): Promise<LeaveBalanceInfo[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      leaveType: "casual",
      totalDays: 12,
      usedDays: 4,
      remainingDays: 8,
      label: "Casual Leave",
    },
    {
      leaveType: "sick",
      totalDays: 10,
      usedDays: 2,
      remainingDays: 8,
      label: "Sick Leave",
    },
    {
      leaveType: "earned",
      totalDays: 15,
      usedDays: 5,
      remainingDays: 10,
      label: "Earned Leave",
    },
    {
      leaveType: "wfh",
      totalDays: 24,
      usedDays: 8,
      remainingDays: 16,
      label: "Work From Home",
    },
    {
      leaveType: "comp_off",
      totalDays: 3,
      usedDays: 1,
      remainingDays: 2,
      label: "Compensatory Off",
    },
  ];
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
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    success: true,
    requestId: `LV-${Date.now()}`,
    message: "Leave request submitted successfully. Pending manager approval.",
    daysRequested: days,
  };
}

// ============================================
// REQUESTS & APPROVALS
// ============================================

export async function getRequestStatus(params: { employeeId: string }): Promise<RequestStatus[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      id: "req-001",
      type: "leave",
      title: "Casual Leave - Feb 10, 2026",
      submittedAt: "2026-02-03T10:00:00Z",
      status: "pending",
      details: "Family function",
    },
    {
      id: "req-002",
      type: "regularization",
      title: "Missed Checkout - Feb 4, 2026",
      submittedAt: "2026-02-05T09:00:00Z",
      status: "pending",
      details: "Forgot to checkout, left at 6:30 PM",
    },
    {
      id: "req-003",
      type: "leave",
      title: "Sick Leave - Jan 28, 2026",
      submittedAt: "2026-01-28T08:00:00Z",
      status: "approved",
      details: "Fever",
    },
  ];
}

export async function getPendingApprovals(params: { managerId: string }): Promise<ApprovalItem[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      id: "appr-001",
      type: "leave",
      employeeId: "emp-001",
      employeeName: "Priya Sharma",
      department: "Engineering",
      title: "Casual Leave Request",
      details: "Feb 10, 2026 - Family function",
      submittedAt: "2026-02-03T10:00:00Z",
      priority: "normal",
    },
    {
      id: "appr-002",
      type: "regularization",
      employeeId: "emp-001",
      employeeName: "Priya Sharma",
      department: "Engineering",
      title: "Missed Checkout",
      details: "Feb 4, 2026 - Requested checkout time: 6:30 PM",
      submittedAt: "2026-02-05T09:00:00Z",
      priority: "normal",
    },
    {
      id: "appr-003",
      type: "leave",
      employeeId: "emp-002",
      employeeName: "Amit Patel",
      department: "Engineering",
      title: "WFH Request",
      details: "Feb 7, 2026 - Doctor appointment",
      submittedAt: "2026-02-04T14:00:00Z",
      priority: "normal",
    },
    {
      id: "appr-004",
      type: "leave",
      employeeId: "emp-003",
      employeeName: "Sneha Reddy",
      department: "Engineering",
      title: "Earned Leave Request",
      details: "Feb 14-15, 2026 - Travel",
      submittedAt: "2026-02-01T11:00:00Z",
      priority: "urgent",
    },
    {
      id: "appr-005",
      type: "regularization",
      employeeId: "emp-004",
      employeeName: "Vikram Singh",
      department: "Engineering",
      title: "Missed Check-in",
      details: "Feb 3, 2026 - Badge not working",
      submittedAt: "2026-02-03T10:30:00Z",
      priority: "normal",
    },
  ];
}

export async function processApproval(params: {
  approvalId: string;
  action: "approve" | "reject";
  comment?: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    message: params.action === "approve" 
      ? "Request approved successfully."
      : "Request rejected.",
  };
}

// ============================================
// TEAM DATA
// ============================================

export async function getTeamMembers(params: { managerId: string }): Promise<TeamMember[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      id: "emp-001",
      employeeId: "ZP-1001",
      name: "Priya Sharma",
      status: "available",
      todayAttendance: { checkIn: undefined },
    },
    {
      id: "emp-002",
      employeeId: "ZP-1002",
      name: "Amit Patel",
      status: "available",
      todayAttendance: { checkIn: "09:10:00" },
    },
    {
      id: "emp-003",
      employeeId: "ZP-1003",
      name: "Sneha Reddy",
      status: "on_leave",
    },
    {
      id: "emp-004",
      employeeId: "ZP-1004",
      name: "Vikram Singh",
      status: "wfh",
      todayAttendance: { checkIn: "09:30:00" },
    },
    {
      id: "emp-005",
      employeeId: "ZP-1005",
      name: "Kavitha Nair",
      status: "available",
      todayAttendance: { checkIn: "08:55:00" },
    },
  ];
}

// ============================================
// HR DATA
// ============================================

export async function getSystemMetrics(): Promise<SystemMetrics> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    totalEmployees: 248,
    presentToday: 231,
    onLeave: 12,
    pendingApprovals: 34,
    complianceScore: 94,
    escalations: 3,
  };
}

export async function searchPolicies(params: { query: string }): Promise<PolicyDocument[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const policies: PolicyDocument[] = [
    {
      id: "pol-001",
      title: "Leave Policy",
      category: "leave",
      content: "Employees are entitled to casual leave, sick leave, and earned leave as per company policy. Casual leave: 12 days/year. Sick leave: 10 days/year. Earned leave: 15 days/year. Leave requests must be submitted at least 3 days in advance for planned leave.",
      lastUpdated: "2025-01-15",
    },
    {
      id: "pol-002",
      title: "Attendance Policy",
      category: "attendance",
      content: "Working hours are 9:00 AM to 6:00 PM. Employees must check in within 15 minutes of their scheduled start time. Three late arrivals in a month may result in a half-day leave deduction. Regularization requests must be submitted within 48 hours of the missed entry.",
      lastUpdated: "2025-01-15",
    },
    {
      id: "pol-003",
      title: "Work From Home Policy",
      category: "attendance",
      content: "Employees may request up to 2 WFH days per week. WFH requests must be submitted 24 hours in advance. During WFH, employees must be available during core hours (10 AM - 4 PM). Manager approval is required for all WFH requests.",
      lastUpdated: "2025-02-01",
    },
    {
      id: "pol-004",
      title: "Regularization Policy",
      category: "attendance",
      content: "Attendance regularization is allowed for genuine reasons like system errors, forgotten punch, or emergency situations. Maximum 3 regularizations per month are allowed. Requests must include a valid reason and supporting details.",
      lastUpdated: "2025-01-20",
    },
  ];
  
  const lowerQuery = params.query.toLowerCase();
  return policies.filter(p => 
    p.title.toLowerCase().includes(lowerQuery) ||
    p.content.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery)
  );
}
