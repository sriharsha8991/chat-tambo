/**
 * @file tambo.ts
 * @description Central configuration for Tambo HR components and tools
 *
 * This file registers all HR components and tools for the Zoho People
 * Generative UI workspace. Components are organized by persona.
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import {
  CheckInOutCard,
  LeaveBalanceCard,
  LeaveRequestForm,
  RequestStatusList,
  AttendanceTimeline,
  RegularizationForm,
  ApprovalQueue,
  TeamOverview,
  ApprovalDetail,
  SystemDashboard,
  PolicyViewer,
} from "@/components/hr";
import {
  getAttendanceStatus,
  submitCheckInOut,
  submitRegularization,
  getLeaveBalance,
  submitLeaveRequest,
  getPendingApprovals,
  processApproval,
  searchPolicies,
  getAttendanceTrends,
  getLeaveAnalytics,
  getTeamMetrics,
  getHRAnalytics,
} from "@/services/hr-api-client";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

// ============================================
// TAMBO TOOLS - HR Operations
// ============================================

export const tools: TamboTool[] = [
  // Attendance Tools
  {
    name: "getAttendanceStatus",
    description: 
      "Get the attendance status for an employee including today's check-in status, " +
      "weekly attendance records, and any missed checkouts. Use this when user asks " +
      "about their attendance, check-in status, or work hours.",
    tool: getAttendanceStatus,
    inputSchema: z.object({
      employeeId: z.string().describe("Employee ID to fetch attendance for"),
      startDate: z.string().optional().describe("Start date for attendance range (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date for attendance range (YYYY-MM-DD)"),
    }),
    outputSchema: z.object({
      records: z.array(z.object({
        id: z.string(),
        date: z.string(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        status: z.enum(["present", "absent", "half_day", "wfh", "holiday"]),
        hoursWorked: z.number().optional(),
      })),
      summary: z.object({
        totalDays: z.number(),
        presentDays: z.number(),
        absentDays: z.number(),
        wfhDays: z.number(),
        avgHoursWorked: z.number(),
      }),
      todayStatus: z.object({
        isCheckedIn: z.boolean(),
        checkInTime: z.string().optional(),
        checkOutTime: z.string().optional(),
        hasMissedCheckout: z.boolean(),
        missedCheckoutDate: z.string().optional(),
      }),
    }),
  },
  {
    name: "submitCheckInOut",
    description: 
      "Check in or check out an employee for the day. Use this when user wants to " +
      "clock in, clock out, or mark their attendance.",
    tool: submitCheckInOut,
    inputSchema: z.object({
      employeeId: z.string().describe("Employee ID"),
      action: z.enum(["check_in", "check_out"]).describe("Whether to check in or check out"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      timestamp: z.string(),
      message: z.string(),
    }),
  },
  {
    name: "submitRegularization",
    description: 
      "Submit an attendance regularization request for missed check-in, missed checkout, " +
      "or attendance correction. Use when user says they forgot to check in/out or needs " +
      "to correct their attendance.",
    tool: submitRegularization,
    inputSchema: z.object({
      employeeId: z.string().describe("Employee ID"),
      date: z.string().describe("Date to regularize (YYYY-MM-DD)"),
      requestType: z.enum(["missed_checkin", "missed_checkout", "correction"])
        .describe("Type of regularization"),
      requestedTime: z.string().describe("The time to record (HH:MM)"),
      reason: z.string().describe("Reason for the regularization"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      requestId: z.string(),
      message: z.string(),
    }),
  },

  // Leave Tools
  {
    name: "getLeaveBalance",
    description: 
      "Get the leave balance for an employee showing all leave types and remaining days. " +
      "Use when user asks about their leave balance, how many leaves they have, or " +
      "before applying for leave.",
    tool: getLeaveBalance,
    inputSchema: z.object({
      employeeId: z.string().describe("Employee ID to fetch leave balance for"),
    }),
    outputSchema: z.array(z.object({
      leaveType: z.enum(["casual", "sick", "earned", "wfh", "comp_off"]),
      totalDays: z.number(),
      usedDays: z.number(),
      remainingDays: z.number(),
      label: z.string(),
    })),
  },
  {
    name: "submitLeaveRequest",
    description: 
      "Submit a leave request for an employee. Use when user wants to apply for leave, " +
      "take time off, or request WFH. Always check leave balance first.",
    tool: submitLeaveRequest,
    inputSchema: z.object({
      employeeId: z.string().describe("Employee ID"),
      leaveType: z.enum(["casual", "sick", "earned", "wfh", "comp_off"])
        .describe("Type of leave to request"),
      startDate: z.string().describe("Start date of leave (YYYY-MM-DD)"),
      endDate: z.string().describe("End date of leave (YYYY-MM-DD)"),
      reason: z.string().describe("Reason for taking leave"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      requestId: z.string(),
      message: z.string(),
      daysRequested: z.number(),
    }),
  },

  // Manager Tools
  {
    name: "getPendingApprovals",
    description: 
      "Get all pending approval requests for a manager. Use when manager asks about " +
      "pending requests, what needs approval, or team requests waiting.",
    tool: getPendingApprovals,
    inputSchema: z.object({
      managerId: z.string().describe("Manager's employee ID"),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      type: z.enum(["leave", "regularization"]),
      employeeId: z.string(),
      employeeName: z.string(),
      department: z.string(),
      title: z.string(),
      details: z.string(),
      submittedAt: z.string(),
      priority: z.enum(["normal", "urgent"]),
    })),
  },
  {
    name: "processApproval",
    description: 
      "Approve or reject a pending request. Use when manager wants to approve or " +
      "reject a leave request, regularization, or other pending item.",
    tool: processApproval,
    inputSchema: z.object({
      approvalId: z.string().describe("ID of the approval item"),
      action: z.enum(["approve", "reject"]).describe("Whether to approve or reject"),
      comment: z.string().optional().describe("Optional comment for the decision"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },

  // HR Tools
  {
    name: "searchPolicies",
    description: 
      "Search HR policies and documents. Use when user asks about company policies, " +
      "leave rules, attendance guidelines, WFH policy, or any HR-related questions.",
    tool: searchPolicies,
    inputSchema: z.object({
      query: z.string().describe("Search query for finding relevant policies"),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      content: z.string(),
      lastUpdated: z.string(),
    })),
  },

  // Analytics Tools
  {
    name: "getAttendanceTrends",
    description: 
      "Get attendance trends data for visualizing in charts. Use when user asks about " +
      "attendance patterns, trends, or wants to see attendance data over time. " +
      "Returns data formatted for bar/line charts.",
    tool: getAttendanceTrends,
    inputSchema: z.object({
      period: z.enum(["week", "month"]).optional().describe("Time period for trends (week or month)"),
      employeeId: z.string().optional().describe("Filter by employee ID"),
      department: z.string().optional().describe("Filter by department"),
    }),
    outputSchema: z.object({
      labels: z.array(z.string()),
      datasets: z.array(z.object({
        label: z.string(),
        data: z.array(z.number()),
        color: z.string().optional(),
      })),
    }),
  },
  {
    name: "getLeaveAnalytics",
    description: 
      "Get leave analytics data for charts. Use when user asks about leave patterns, " +
      "distribution of leave types, or leave usage trends. Use type='distribution' for " +
      "pie charts showing leave type breakdown, type='usage' for line charts showing usage over time.",
    tool: getLeaveAnalytics,
    inputSchema: z.object({
      type: z.enum(["distribution", "usage"]).optional().describe("Type of analytics - distribution (pie) or usage (line)"),
      employeeId: z.string().optional().describe("Filter by employee ID"),
      department: z.string().optional().describe("Filter by department"),
    }),
    outputSchema: z.object({
      labels: z.array(z.string()),
      datasets: z.array(z.object({
        label: z.string(),
        data: z.array(z.number()),
        color: z.string().optional(),
      })),
    }),
  },
  {
    name: "getTeamMetrics",
    description: 
      "Get team performance metrics for managers. Use when manager asks about team " +
      "attendance, team status breakdown, or team leave usage. " +
      "metric='status' for current team status, metric='attendance' for attendance comparison, " +
      "metric='leave' for leave usage comparison.",
    tool: getTeamMetrics,
    inputSchema: z.object({
      managerId: z.string().optional().describe("Manager's employee ID"),
      metric: z.enum(["attendance", "leave", "status"]).optional().describe("Type of metric to fetch"),
    }),
    outputSchema: z.object({
      labels: z.array(z.string()),
      datasets: z.array(z.object({
        label: z.string(),
        data: z.array(z.number()),
        color: z.string().optional(),
      })),
    }),
  },
  {
    name: "getHRAnalytics",
    description: 
      "Get organization-wide HR analytics for HR admins. Use when HR asks about " +
      "department distribution, headcount trends, or turnover rates. " +
      "metric='departmentDistribution' for pie chart, metric='headcount' for trend line, " +
      "metric='turnover' for turnover rates.",
    tool: getHRAnalytics,
    inputSchema: z.object({
      metric: z.enum(["headcount", "turnover", "departmentDistribution"]).optional()
        .describe("Type of HR metric to fetch"),
    }),
    outputSchema: z.object({
      labels: z.array(z.string()),
      datasets: z.array(z.object({
        label: z.string(),
        data: z.array(z.number()),
        color: z.string().optional(),
      })),
    }),
  },
];

// ============================================
// TAMBO COMPONENTS - HR UI
// ============================================

export const components: TamboComponent[] = [
  // Visualization Component
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, area, pie) for " +
      "visualizing attendance trends, leave usage, team metrics, and other HR data. " +
      "Use for showing attendance over time, leave balance distribution, or team statistics.",
    component: Graph,
    propsSchema: graphSchema,
  },

  // ============================================
  // EMPLOYEE COMPONENTS
  // ============================================
  {
    name: "CheckInOutCard",
    description:
      "A card component for employee check-in and check-out. Shows current status, " +
      "check-in/out times, and total hours worked. Use when displaying today's attendance " +
      "or when employee needs to check in/out.",
    component: CheckInOutCard,
    propsSchema: z.object({
      checkInTime: z.string().optional().describe("Check-in time (HH:MM:SS format)"),
      checkOutTime: z.string().optional().describe("Check-out time (HH:MM:SS format)"),
      status: z.enum(["not_checked_in", "checked_in", "checked_out"])
        .describe("Current attendance status"),
      totalHours: z.string().optional().describe("Total hours worked (e.g., '8h 30m')"),
    }),
  },
  {
    name: "LeaveBalanceCard",
    description:
      "A card showing all leave balances for an employee with progress bars. Displays " +
      "casual, sick, earned, WFH, and comp-off balances. Use when employee asks about " +
      "their leave balance or available leaves.",
    component: LeaveBalanceCard,
    propsSchema: z.object({
      balances: z.array(z.object({
        leaveType: z.string().describe("Type of leave (casual, sick, earned, wfh, comp_off)"),
        totalDays: z.number().describe("Total days allocated"),
        usedDays: z.number().describe("Days already used"),
        remainingDays: z.number().describe("Days remaining"),
        label: z.string().describe("Display label for the leave type"),
      })).describe("Array of leave balance information"),
    }),
  },
  {
    name: "LeaveRequestForm",
    description:
      "A form for submitting leave requests. Includes leave type selection, date range picker, " +
      "and reason field. Use when employee wants to apply for leave or time off.",
    component: LeaveRequestForm,
    propsSchema: z.object({
      balances: z.array(z.object({
        leaveType: z.string(),
        totalDays: z.number(),
        usedDays: z.number(),
        remainingDays: z.number(),
        label: z.string(),
      })).describe("Leave balances to show available days"),
      preselectedType: z.string().optional().describe("Pre-selected leave type"),
    }),
  },
  {
    name: "RequestStatusList",
    description:
      "A list showing the status of employee's pending and past requests (leave, regularization). " +
      "Use when employee wants to see their request history or check approval status.",
    component: RequestStatusList,
    propsSchema: z.object({
      requests: z.array(z.object({
        id: z.string().describe("Request ID"),
        type: z.enum(["leave", "regularization", "wfh"]).describe("Type of request"),
        title: z.string().describe("Request title"),
        submittedAt: z.string().describe("Submission timestamp"),
        status: z.enum(["pending", "approved", "rejected"]).describe("Current status"),
        details: z.string().describe("Additional details"),
      })).describe("Array of request statuses"),
      maxHeight: z.number().optional().describe("Maximum height for scrolling"),
    }),
  },
  {
    name: "AttendanceTimeline",
    description:
      "A timeline view of attendance history showing check-in/out times, status, and hours " +
      "for recent days. Use when showing attendance history or weekly/monthly attendance.",
    component: AttendanceTimeline,
    propsSchema: z.object({
      records: z.array(z.object({
        date: z.string().describe("Date (YYYY-MM-DD)"),
        checkIn: z.string().optional().describe("Check-in time"),
        checkOut: z.string().optional().describe("Check-out time"),
        totalHours: z.string().optional().describe("Total hours worked"),
        status: z.enum(["present", "absent", "half_day", "wfh", "on_leave", "holiday", "regularization_pending"])
          .describe("Attendance status"),
        notes: z.string().optional().describe("Additional notes"),
      })).describe("Array of attendance records"),
      maxItems: z.number().optional().describe("Maximum items to display"),
    }),
  },
  {
    name: "RegularizationForm",
    description:
      "A form for submitting attendance regularization requests. Use when employee missed " +
      "check-in/out and needs to regularize their attendance.",
    component: RegularizationForm,
    propsSchema: z.object({}),
  },

  // ============================================
  // MANAGER COMPONENTS
  // ============================================
  {
    name: "ApprovalQueue",
    description:
      "A list of pending approval items for managers showing leave requests and regularizations " +
      "from team members. Use when manager asks about pending approvals or team requests.",
    component: ApprovalQueue,
    propsSchema: z.object({
      approvals: z.array(z.object({
        id: z.string().describe("Approval item ID"),
        type: z.enum(["leave", "regularization", "wfh"]).describe("Type of request"),
        employeeId: z.string().describe("Employee ID"),
        employeeName: z.string().describe("Employee name"),
        department: z.string().describe("Department name"),
        title: z.string().describe("Request title"),
        details: z.string().describe("Request details"),
        submittedAt: z.string().describe("Submission timestamp"),
        priority: z.enum(["normal", "urgent"]).describe("Request priority"),
      })).describe("Array of pending approvals"),
    }),
  },
  {
    name: "TeamOverview",
    description:
      "A dashboard showing team members and their current status (in office, WFH, on leave). " +
      "Use when manager wants to see team availability or who is working today.",
    component: TeamOverview,
    propsSchema: z.object({
      members: z.array(z.object({
        id: z.string().describe("Member ID"),
        employeeId: z.string().describe("Employee ID"),
        name: z.string().describe("Employee name"),
        status: z.enum(["available", "on_leave", "wfh", "offline"]).describe("Current status"),
        todayAttendance: z.object({
          checkIn: z.string().optional(),
          checkOut: z.string().optional(),
        }).optional().describe("Today's attendance"),
      })).describe("Array of team members"),
    }),
  },
  {
    name: "ApprovalDetail",
    description:
      "Detailed view of a single approval item with employee info and approve/reject buttons. " +
      "Use when manager wants to review and act on a specific request.",
    component: ApprovalDetail,
    propsSchema: z.object({
      approval: z.object({
        id: z.string(),
        type: z.enum(["leave", "regularization", "wfh"]),
        employeeId: z.string(),
        employeeName: z.string(),
        department: z.string(),
        title: z.string(),
        details: z.string(),
        submittedAt: z.string(),
        priority: z.enum(["normal", "urgent"]),
      }).describe("The approval item to display"),
      isLoading: z.boolean().optional().describe("Loading state for actions"),
    }),
  },

  // ============================================
  // HR ADMIN COMPONENTS
  // ============================================
  {
    name: "SystemDashboard",
    description:
      "HR system dashboard showing key metrics like total employees, present today, " +
      "on leave, pending approvals, compliance score, and escalations. Use for HR admins.",
    component: SystemDashboard,
    propsSchema: z.object({
      metrics: z.object({
        totalEmployees: z.number().describe("Total employee count"),
        presentToday: z.number().describe("Employees present today"),
        onLeave: z.number().describe("Employees on leave"),
        pendingApprovals: z.number().describe("Pending approval count"),
        complianceScore: z.number().describe("Compliance percentage"),
        escalations: z.number().describe("Number of escalations"),
      }).describe("System metrics"),
      previousMetrics: z.object({
        totalEmployees: z.number(),
        presentToday: z.number(),
        onLeave: z.number(),
        pendingApprovals: z.number(),
        complianceScore: z.number(),
        escalations: z.number(),
      }).optional().describe("Previous period metrics for comparison"),
    }),
  },
  {
    name: "PolicyViewer",
    description:
      "A searchable viewer for HR policies and documents. Shows leave policy, attendance rules, " +
      "WFH guidelines, etc. Use when anyone asks about company policies or HR rules.",
    component: PolicyViewer,
    propsSchema: z.object({
      policies: z.array(z.object({
        id: z.string().describe("Policy ID"),
        title: z.string().describe("Policy title"),
        category: z.string().describe("Policy category"),
        content: z.string().describe("Policy content"),
        lastUpdated: z.string().describe("Last update date"),
      })).describe("Array of policies to display"),
      searchQuery: z.string().optional().describe("Pre-filled search query"),
    }),
  },
];

// ============================================
// CONTEXT HELPERS
// ============================================

export const contextHelpers = {
  currentTime: () => {
    const now = new Date();
    return {
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString(),
      dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
      isWorkingHours: now.getHours() >= 9 && now.getHours() < 18,
    };
  },
};

// ============================================
// PERSONA-SPECIFIC SUGGESTIONS
// ============================================

export type PersonaRole = "employee" | "manager" | "hr";

export interface StarterSuggestion {
  id: string;
  title: string;
  detailedSuggestion: string;
  icon?: string;
}

export const personaSuggestions: Record<PersonaRole, StarterSuggestion[]> = {
  employee: [
    {
      id: "emp-1",
      title: "🕐 Check In/Out",
      detailedSuggestion: "Check me in for today",
    },
    {
      id: "emp-2",
      title: "📅 Leave Balance",
      detailedSuggestion: "Show my leave balance",
    },
    {
      id: "emp-3",
      title: "📝 Apply Leave",
      detailedSuggestion: "I want to apply for leave",
    },
    {
      id: "emp-4",
      title: "📊 My Attendance Trends",
      detailedSuggestion: "Show my attendance trends for this month",
    },
  ],
  manager: [
    {
      id: "mgr-1",
      title: "📋 Pending Approvals",
      detailedSuggestion: "Show my pending approvals",
    },
    {
      id: "mgr-2",
      title: "👥 Team Status",
      detailedSuggestion: "Show my team's attendance today",
    },
    {
      id: "mgr-3",
      title: "📊 Team Analytics",
      detailedSuggestion: "Show my team's attendance trends chart",
    },
    {
      id: "mgr-4",
      title: "📈 Leave Analytics",
      detailedSuggestion: "Show team leave distribution chart",
    },
  ],
  hr: [
    {
      id: "hr-1",
      title: "📊 HR Analytics",
      detailedSuggestion: "Show organization headcount by department chart",
    },
    {
      id: "hr-2",
      title: "📋 All Approvals",
      detailedSuggestion: "Show all pending approvals across the organization",
    },
    {
      id: "hr-3",
      title: "📈 Org Metrics",
      detailedSuggestion: "Show organization turnover and attrition trends",
    },
    {
      id: "hr-4",
      title: "📜 Policy Search",
      detailedSuggestion: "Show me the leave policy",
    },
  ],
};

// Helper to get suggestions for a persona
export function getSuggestionsForPersona(persona: PersonaRole): StarterSuggestion[] {
  return personaSuggestions[persona] || personaSuggestions.employee;
}
