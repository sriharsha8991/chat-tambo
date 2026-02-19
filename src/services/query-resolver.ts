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
import * as analytics from "./supabase-hr/analytics";
import { QUERY_TABLE_MAP } from "@/lib/query-tables";

// ============================================
// QUERY REGISTRY — maps queryId → fetch function
// ============================================

/* eslint-disable @typescript-eslint/no-explicit-any */
type QueryFn = (params: any) => Promise<unknown>;

// ============================================
// LEAVE TYPE LABELS
// ============================================

const LEAVE_TYPE_LABELS: Record<string, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  earned: "Earned Leave",
  compensatory: "Compensatory Off",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  unpaid: "Unpaid Leave",
};

// ============================================
// QUERY REGISTRY
// ============================================

const QUERY_REGISTRY: Record<string, QueryFn> = {
  // ── Employee queries ──────────────────────────────

  /**
   * attendanceStatus — returns { records, todayStatus }
   * Fetches both the full attendance history (for AttendanceTimeline)
   * and today's status (for CheckInOutCard).
   */
  attendanceStatus: async (p) => {
    const [todayRecord, records] = await Promise.all([
      unified.getTodayAttendance(p?.employeeId),
      unified.getAttendanceRecords(p?.employeeId),
    ]);

    const todayStatus = todayRecord
      ? {
          isCheckedIn: !!todayRecord.check_in,
          checkInTime: todayRecord.check_in || undefined,
          checkOutTime: todayRecord.check_out || undefined,
          hasMissedCheckout:
            !!todayRecord.check_in &&
            !todayRecord.check_out &&
            todayRecord.status === "present",
        }
      : {
          isCheckedIn: false,
          checkInTime: undefined,
          checkOutTime: undefined,
          hasMissedCheckout: false,
        };

    return {
      records: (records || []).map((r: any) => ({
        date: r.date,
        checkIn: r.check_in || undefined,
        checkOut: r.check_out || undefined,
        status: r.status,
        hoursWorked: r.hours_worked,
      })),
      todayStatus,
    };
  },

  /**
   * leaveBalance — transforms snake_case DB rows to camelCase
   * with human-readable labels for the LeaveBalanceCard.
   */
  leaveBalance: async (p) => {
    const raw = await unified.getLeaveBalances(p?.employeeId);
    return (raw || []).map((b: any) => ({
      leaveType: b.leave_type ?? b.leaveType ?? "",
      totalDays: b.total_days ?? b.totalDays ?? 0,
      usedDays: b.used_days ?? b.usedDays ?? 0,
      remainingDays: b.remaining_days ?? b.remainingDays ?? 0,
      label:
        LEAVE_TYPE_LABELS[b.leave_type ?? b.leaveType ?? ""] ??
        b.leave_type ??
        b.leaveType ??
        "",
    }));
  },

  /**
   * requestStatus — transforms raw leave requests to the
   * { id, type, title, submittedAt, status, details } shape
   * expected by RequestStatusList.
   */
  requestStatus: async (p) => {
    const raw = await unified.getLeaveRequests(p?.employeeId);
    return (raw || []).map((r: any) => ({
      id: r.id,
      type: "leave" as const,
      title: `${r.leave_type ?? "Leave"} Leave – ${r.days_requested ?? 1} day(s)`,
      submittedAt: r.submitted_at ?? r.created_at ?? new Date().toISOString(),
      status: r.status ?? "pending",
      details: `${r.start_date ?? ""} to ${r.end_date ?? ""}: ${r.reason ?? ""}`.trim(),
    }));
  },

  // ── Manager queries ───────────────────────────────
  // (already return camelCase from hr-unified)
  pendingApprovals: (p) => unified.getAllPendingApprovals(p?.managerId),
  teamMembers: (p) => unified.getTeamMembers(p?.managerId),

  // ── HR / system queries ───────────────────────────
  systemMetrics: () => unified.getSystemMetrics(),

  /**
   * policies — transforms snake_case policy rows to camelCase
   */
  policies: async (p) => {
    const raw = p?.query
      ? await unified.searchPolicies(p.query)
      : await unified.getPolicies();
    return (raw || []).map((pol: any) => ({
      id: pol.id,
      title: pol.title,
      category: pol.category,
      content: pol.content,
      lastUpdated: pol.last_updated ?? pol.lastUpdated ?? pol.created_at ?? "",
    }));
  },

  /**
   * announcements — transforms snake_case announcement rows to camelCase
   */
  announcements: async (p) => {
    const raw = await unified.getAnnouncements(p?.role);
    return (raw || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      audienceRole: a.audience_role ?? a.audienceRole ?? "all",
      pinned: a.pinned ?? false,
      createdAt: a.created_at ?? a.createdAt ?? "",
      expiresAt: a.expires_at ?? a.expiresAt ?? null,
    }));
  },

  /**
   * documents — transforms snake_case document rows to camelCase
   */
  documents: async (p) => {
    const raw = await unified.getDocuments(p?.role);
    return (raw || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description ?? null,
      filePath: d.file_path ?? d.filePath ?? "",
      audienceRole: d.audience_role ?? d.audienceRole ?? "all",
      requiresAck: d.requires_ack ?? d.requiresAck ?? false,
      createdAt: d.created_at ?? d.createdAt ?? "",
      expiresAt: d.expires_at ?? d.expiresAt ?? null,
    }));
  },

  acknowledgedDocumentIds: (p) =>
    unified.getAcknowledgedDocumentIds(p?.employeeId),

  allEmployees: () => unified.getAllEmployees(),

  // ── Analytics queries ─────────────────────────────
  attendanceTrends: (p) =>
    analytics.getAttendanceTrends(p?.period, p?.startDate, p?.endDate),
  leaveAnalytics: (p) =>
    analytics.getLeaveAnalytics(p?.type, p?.startDate, p?.endDate),
  teamMetrics: (p) =>
    analytics.getTeamMetrics(p?.metric, p?.managerId),
  hrAnalytics: (p) =>
    analytics.getHRAnalytics(p?.metric),
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
