/**
 * Query Resolver — Phase 1 (Static Registry)
 *
 * Maps queryId strings to hr-unified (Supabase-direct) functions.
 * This is the single point of resolution: /api/query calls this resolver,
 * and it talks directly to Supabase — no HTTP round-trips.
 *
 * Phase 2 extension point: when QUERY_REGISTRY[queryId] is undefined,
 * fall back to a Gemini-powered dynamic query generator (guarded by
 * GEMINI_QUERY_ENABLED env flag) instead of throwing.
 */

import * as unified from "./hr-unified";
import { QUERY_TABLE_MAP } from "@/lib/query-tables";

// ============================================
// QUERY REGISTRY — maps queryId → fetch function
// ============================================

/* eslint-disable @typescript-eslint/no-explicit-any */
type QueryFn = (params: any) => Promise<unknown>;

const QUERY_REGISTRY: Record<string, QueryFn> = {
  // Employee queries
  attendanceStatus: (p) => unified.getTodayAttendance(p?.employeeId),
  leaveBalance: (p) => unified.getLeaveBalances(p?.employeeId),
  requestStatus: (p) => unified.getLeaveRequests(p?.employeeId),

  // Manager queries
  pendingApprovals: (p) => unified.getAllPendingApprovals(p?.managerId),
  teamMembers: (p) => unified.getTeamMembers(p?.managerId),

  // HR / system queries
  systemMetrics: () => unified.getSystemMetrics(),
  policies: (p) => (p?.query ? unified.searchPolicies(p.query) : unified.getPolicies()),
  announcements: (p) => unified.getAnnouncements(p?.role),
  documents: (p) => unified.getDocuments(p?.role),
  acknowledgedDocumentIds: (p) => unified.getAcknowledgedDocumentIds(p?.employeeId),
  allEmployees: () => unified.getAllEmployees(),

  // Analytics queries (mock data — same as hr-api-client for consistency)
  attendanceTrends: (p) => {
    const period = p?.period ?? "week";
    if (period === "week") {
      return Promise.resolve({
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        datasets: [
          { label: "Present", data: [92, 88, 95, 91, 85], color: "hsl(160, 82%, 47%)" },
          { label: "WFH", data: [5, 8, 3, 6, 10], color: "hsl(220, 100%, 62%)" },
          { label: "Leave", data: [3, 4, 2, 3, 5], color: "hsl(32, 100%, 62%)" },
        ],
      });
    }
    return Promise.resolve({
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        { label: "Attendance %", data: [94, 92, 96, 93, 91, 95], color: "hsl(160, 82%, 47%)" },
      ],
    });
  },
  leaveAnalytics: (p) => {
    const type = p?.type ?? "distribution";
    if (type === "distribution") {
      return Promise.resolve({
        labels: ["Casual", "Sick", "Earned", "WFH", "Comp-off"],
        datasets: [
          { label: "Leave Distribution", data: [35, 15, 25, 20, 5], color: "hsl(220, 100%, 62%)" },
        ],
      });
    }
    return Promise.resolve({
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        { label: "Casual Leave", data: [12, 8, 15, 10, 18, 14], color: "hsl(220, 100%, 62%)" },
        { label: "Sick Leave", data: [5, 8, 3, 6, 4, 7], color: "hsl(340, 82%, 66%)" },
        { label: "Earned Leave", data: [8, 10, 12, 8, 15, 20], color: "hsl(160, 82%, 47%)" },
      ],
    });
  },
  teamMetrics: (p) => {
    const metric = p?.metric ?? "status";
    if (metric === "status") {
      return Promise.resolve({
        labels: ["In Office", "WFH", "On Leave", "Offline"],
        datasets: [
          { label: "Team Status", data: [12, 5, 2, 1], color: "hsl(160, 82%, 47%)" },
        ],
      });
    }
    if (metric === "attendance") {
      return Promise.resolve({
        labels: ["Priya", "Amit", "Sneha", "Vikram", "Kavitha"],
        datasets: [
          { label: "Attendance %", data: [96, 92, 88, 94, 98], color: "hsl(220, 100%, 62%)" },
        ],
      });
    }
    return Promise.resolve({
      labels: ["Priya", "Amit", "Sneha", "Vikram", "Kavitha"],
      datasets: [
        { label: "Leaves Taken", data: [8, 12, 6, 10, 4], color: "hsl(32, 100%, 62%)" },
        { label: "Leaves Remaining", data: [29, 25, 31, 27, 33], color: "hsl(160, 82%, 47%)" },
      ],
    });
  },
  hrAnalytics: (p) => {
    const metric = p?.metric ?? "departmentDistribution";
    if (metric === "departmentDistribution") {
      return Promise.resolve({
        labels: ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"],
        datasets: [
          { label: "Employees", data: [85, 42, 28, 15, 18, 60], color: "hsl(220, 100%, 62%)" },
        ],
      });
    }
    if (metric === "headcount") {
      return Promise.resolve({
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          { label: "Total Employees", data: [235, 238, 242, 245, 247, 248], color: "hsl(160, 82%, 47%)" },
          { label: "New Hires", data: [5, 4, 6, 3, 4, 2], color: "hsl(220, 100%, 62%)" },
        ],
      });
    }
    return Promise.resolve({
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        { label: "Turnover Rate %", data: [2.5, 3.1, 2.8, 2.2], color: "hsl(340, 82%, 66%)" },
      ],
    });
  },
};

// ============================================
// RESOLVER
// ============================================

/**
 * Resolve and execute a named query with the provided parameters.
 * Throws if the queryId is not registered (Phase 2: Gemini fallback).
 */
export async function resolveQuery(
  queryId: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const fn = QUERY_REGISTRY[queryId];

  if (!fn) {
    // Phase 2: if GEMINI_QUERY_ENABLED, call generateDynamicQuery(queryId, params, schema)
    throw new Error(`Unknown queryId: "${queryId}". Registered: ${Object.keys(QUERY_REGISTRY).join(", ")}`);
  }

  return fn(params);
}

/** Check if a queryId is registered */
export function isQueryRegistered(queryId: string): boolean {
  return queryId in QUERY_REGISTRY;
}

/** Get all registered query IDs */
export function getRegisteredQueryIds(): string[] {
  return Object.keys(QUERY_REGISTRY);
}

// ============================================
// TABLE MAPPING — queryId → Supabase table(s)
// Used by useLiveQuery to know what realtime channels to subscribe to.
// ============================================

// ============================================
// TABLE MAPPING — imported from shared module
// ============================================

/**
 * Get the Supabase table names that a query depends on.
 * Used to set up realtime subscriptions for live updates.
 */
export function getRealtimeTables(queryId: string): string[] {
  return QUERY_TABLE_MAP[queryId] ?? [];
}

// ============================================
// TOOL-NAME → QUERY-ID MAPPING
// Maps Tambo tool names to their corresponding queryIds
// so the PinButton can derive queryDescriptor from tool calls.
// ============================================

const TOOL_TO_QUERY: Record<string, string> = {
  getAttendanceStatus: "attendanceStatus",
  getLeaveBalance: "leaveBalance",
  getRequestStatus: "requestStatus",
  getPendingApprovals: "pendingApprovals",
  getTeamMembers: "teamMembers",
  getSystemMetrics: "systemMetrics",
  searchPolicies: "policies",
  getAttendanceTrends: "attendanceTrends",
  getLeaveAnalytics: "leaveAnalytics",
  getTeamMetrics: "teamMetrics",
  getHRAnalytics: "hrAnalytics",
};

/** Convert a Tambo tool name to the corresponding queryId */
export function toolNameToQueryId(toolName: string): string | null {
  return TOOL_TO_QUERY[toolName] ?? null;
}

// ============================================
// COMPONENT-NAME → QUERY-ID FALLBACK
// Maps component names to a default queryId so the PinButton
// can appear even when no tool call is present on the message.
// ============================================

const COMPONENT_TO_QUERY: Record<string, string> = {
  CheckInOutCard: "attendanceStatus",
  LeaveBalanceCard: "leaveBalance",
  RequestStatusList: "requestStatus",
  AttendanceTimeline: "attendanceStatus",
  ApprovalQueue: "pendingApprovals",
  TeamOverview: "teamMembers",
  ApprovalDetail: "pendingApprovals",
  SystemDashboard: "systemMetrics",
  PolicyViewer: "policies",
  AnnouncementsFeed: "announcements",
  DocumentsAcknowledgeList: "documents",
  AnnouncementBoard: "announcements",
  DocumentCenter: "documents",
  PolicyManager: "policies",
  Graph: "hrAnalytics",
};

/** Fallback: derive a queryId from a component name when no tool call exists */
export function componentNameToQueryId(componentName: string): string | null {
  return COMPONENT_TO_QUERY[componentName] ?? null;
}
