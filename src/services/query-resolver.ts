/**
 * Query Resolver — Phase 1 (Static Registry)
 *
 * Maps queryId strings to existing hr-api-client functions.
 * This is the single point of resolution: both useLiveQuery and /api/query
 * go through this resolver.
 *
 * Phase 2 extension point: when QUERY_REGISTRY[queryId] is undefined,
 * fall back to a Gemini-powered dynamic query generator (guarded by
 * GEMINI_QUERY_ENABLED env flag) instead of throwing.
 */

import {
  getAttendanceStatus,
  getLeaveBalance,
  getPendingApprovals,
  getTeamMembers,
  getSystemMetrics,
  searchPolicies,
  getAnnouncements,
  getDocuments,
  getAcknowledgedDocumentIds,
  getRequestStatus,
  getAttendanceTrends,
  getLeaveAnalytics,
  getTeamMetrics,
  getHRAnalytics,
  getAllEmployees,
  getPolicies,
} from "./hr-api-client";

// ============================================
// QUERY REGISTRY — maps queryId → fetch function
// ============================================

/* eslint-disable @typescript-eslint/no-explicit-any */
type QueryFn = (params: any) => Promise<unknown>;

const QUERY_REGISTRY: Record<string, QueryFn> = {
  // Employee queries
  attendanceStatus: (p) => getAttendanceStatus(p),
  leaveBalance: (p) => getLeaveBalance(p),
  requestStatus: (p) => getRequestStatus(p),

  // Manager queries
  pendingApprovals: (p) => getPendingApprovals(p),
  teamMembers: (p) => getTeamMembers(p),

  // HR / system queries
  systemMetrics: () => getSystemMetrics(),
  policies: (p) => (p?.query ? searchPolicies(p) : getPolicies()),
  announcements: (p) => getAnnouncements(p ?? {}),
  documents: (p) => getDocuments(p ?? {}),
  acknowledgedDocumentIds: (p) => getAcknowledgedDocumentIds(p),
  allEmployees: () => getAllEmployees(),

  // Analytics queries (currently static/mock — Phase 2: real DB)
  attendanceTrends: (p) => getAttendanceTrends(p ?? {}),
  leaveAnalytics: (p) => getLeaveAnalytics(p ?? {}),
  teamMetrics: (p) => getTeamMetrics(p ?? {}),
  hrAnalytics: (p) => getHRAnalytics(p ?? {}),
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

const QUERY_TABLE_MAP: Record<string, string[]> = {
  attendanceStatus: ["attendance"],
  leaveBalance: ["leave_balances"],
  requestStatus: ["leave_requests", "regularization_requests"],
  pendingApprovals: ["leave_requests", "regularization_requests"],
  teamMembers: ["attendance", "leave_requests", "employees"],
  systemMetrics: ["employees", "attendance", "leave_requests", "regularization_requests"],
  policies: ["policies"],
  announcements: ["announcements"],
  documents: ["documents", "document_acknowledgments"],
  acknowledgedDocumentIds: ["document_acknowledgments"],
  allEmployees: ["employees"],
  attendanceTrends: ["attendance"],
  leaveAnalytics: ["leave_requests", "leave_balances"],
  teamMetrics: ["attendance", "leave_requests"],
  hrAnalytics: ["employees"],
};

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
