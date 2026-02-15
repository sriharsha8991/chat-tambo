/**
 * useLiveQuery — Core hook for live data in pinned components
 *
 * Fetches data via the /api/query endpoint using a queryId + params,
 * then subscribes to Supabase realtime changes on the relevant tables
 * (via the shared RealtimeManager singleton) and the global
 * "hr-data-updated" event to auto-refresh.
 *
 * Both chat-rendered and dashboard-rendered components share this hook
 * so they always display live data.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QUERY_TABLE_MAP } from "@/lib/query-tables";
import { subscribe, type HRTable } from "@/lib/realtime-manager";
import type { QueryResult } from "@/types/dashboard";

// ============================================
// GLOBAL REFRESH REGISTRY
// ============================================

/** All mounted useLiveQuery instances register their fetchData here. */
const refreshRegistry = new Set<() => Promise<void>>();

/**
 * Invoke every registered widget's fetch and await completion.
 * Returns after all settle (success or failure).
 */
export async function refreshAllWidgets(): Promise<void> {
  const tasks = Array.from(refreshRegistry).map((fn) => fn());
  await Promise.allSettled(tasks);
}

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

  // Register in the global refresh registry
  useEffect(() => {
    refreshRegistry.add(fetchData);
    return () => {
      refreshRegistry.delete(fetchData);
    };
  }, [fetchData]);

  // Initial fetch + refetch on queryId/params change
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Subscribe to Supabase realtime via shared RealtimeManager
  useEffect(() => {
    if (!queryId) return;

    const tables = QUERY_TABLE_MAP[queryId] ?? [];
    if (tables.length === 0) return;

    const uniqueTables = [...new Set(tables)] as HRTable[];
    const unsubs = uniqueTables.map((table) =>
      subscribe(table, () => fetchData()),
    );

    return () => unsubs.forEach((u) => u());
  }, [queryId, paramsKey, fetchData]);

  // Also listen for the global "hr-data-updated" event
  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("hr-data-updated", handler);
    return () => window.removeEventListener("hr-data-updated", handler);
  }, [queryId, fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
