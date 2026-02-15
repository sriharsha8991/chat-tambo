/**
 * Shared Query → Table Mapping
 *
 * Single source of truth for which Supabase tables each queryId depends on.
 * Used by:
 *   - query-resolver.ts (server-side, for getRealtimeTables)
 *   - useLiveQuery.ts   (client-side, for realtime subscriptions)
 */

export const QUERY_TABLE_MAP: Record<string, string[]> = {
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
