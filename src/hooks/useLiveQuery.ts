/**
 * useLiveQuery — Core hook for live data in pinned components
 *
 * Fetches data via the /api/query endpoint using a queryId + params,
 * then subscribes to Supabase realtime changes on the relevant tables
 * and the global "hr-data-updated" event to auto-refresh.
 *
 * Both chat-rendered and dashboard-rendered components share this hook
 * so they always display live data.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { QueryResult } from "@/types/dashboard";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ============================================
// TABLE MAPPING (client-side copy)
// Must stay in sync with query-resolver.ts QUERY_TABLE_MAP
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

// ============================================
// DEEP COMPARISON FOR PARAMS
// ============================================

function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return "";
  return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}

// ============================================
// HOOK
// ============================================

export function useLiveQuery<T = unknown>(
  queryId: string,
  params: Record<string, unknown> = {}
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable param reference to prevent infinite re-render loops
  const paramsKey = stableStringify(params);
  const paramsRef = useRef(params);
  if (stableStringify(paramsRef.current) !== paramsKey) {
    paramsRef.current = params;
  }

  const channelsRef = useRef<RealtimeChannel[]>([]);
  const isMountedRef = useRef(true);

  // Fetch data from /api/query
  const fetchData = useCallback(async () => {
    if (!queryId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryId, params: paramsRef.current }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Query failed");
      }

      const result = await response.json();

      if (isMountedRef.current) {
        setData(result.data as T);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    }
  }, [queryId, paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch + refetch on queryId/params change
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Subscribe to Supabase realtime for relevant tables
  useEffect(() => {
    if (!supabase || !queryId) return;

    const tables = QUERY_TABLE_MAP[queryId] ?? [];
    if (tables.length === 0) return;

    // Deduplicate table names
    const uniqueTables = [...new Set(tables)];

    for (const table of uniqueTables) {
      const channel = supabase
        .channel(`live-query-${queryId}-${table}-${paramsKey}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            console.log(`[useLiveQuery] Realtime change on ${table}, refreshing ${queryId}`);
            fetchData();
          }
        )
        .subscribe();

      channelsRef.current.push(channel);
    }

    return () => {
      channelsRef.current.forEach((ch) => supabase?.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [queryId, paramsKey, fetchData]);

  // Also listen for the global "hr-data-updated" event
  useEffect(() => {
    const handler = () => {
      console.log(`[useLiveQuery] hr-data-updated event, refreshing ${queryId}`);
      fetchData();
    };

    window.addEventListener("hr-data-updated", handler);
    return () => window.removeEventListener("hr-data-updated", handler);
  }, [queryId, fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
