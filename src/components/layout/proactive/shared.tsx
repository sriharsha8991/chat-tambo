"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Bell } from "lucide-react";
import { useRealtimeHR, type RealtimeHROptions } from "@/lib/use-realtime-hr";

/* ── ProactiveAlert ─────────────────────────────────────────── */

export function ProactiveAlert({
  type,
  title,
  message,
}: {
  type: "warning" | "info";
  title: string;
  message: string;
}) {
  return (
    <Alert
      variant={type === "warning" ? "destructive" : "default"}
      className="mb-4"
    >
      {type === "warning" ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/* ── useDashboardFetch ──────────────────────────────────────── */

/**
 * Shared hook that manages loading state, realtime subscriptions,
 * and window-focus / hr-data-updated event listeners common to
 * every persona dashboard.
 *
 * @param fetcher  Async function that loads dashboard data.
 * @param realtime Options forwarded to `useRealtimeHR`.
 */
export function useDashboardFetch(
  fetcher: () => Promise<void>,
  realtime: RealtimeHROptions,
) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        await fetcherRef.current();
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  // Realtime subscriptions – refresh on every change event
  const realtimeWithRefresh = Object.fromEntries(
    Object.entries(realtime).map(([key, val]) => {
      if (typeof val === "function") {
        return [key, () => load(true)];
      }
      return [key, val];
    }),
  ) as RealtimeHROptions;

  useRealtimeHR(realtimeWithRefresh);

  useEffect(() => {
    load();

    const handleFocus = () => load(true);
    const handleRefresh = () => load(true);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("hr-data-updated", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("hr-data-updated", handleRefresh);
    };
  }, [load]);

  return { isLoading, isRefreshing, refresh: () => load(true) };
}

/* ── getGreeting ────────────────────────────────────────────── */

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}
