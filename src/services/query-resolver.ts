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

  // Analytics queries — real Supabase aggregations with fallbacks
  attendanceTrends: (p) => analytics.getAttendanceTrends(p?.period, p?.startDate, p?.endDate),
  leaveAnalytics: (p) => analytics.getLeaveAnalytics(p?.type, p?.startDate, p?.endDate),
  teamMetrics: (p) => analytics.getTeamMetrics(p?.metric, p?.managerId),
  hrAnalytics: (p) => analytics.getHRAnalytics(p?.metric),
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
