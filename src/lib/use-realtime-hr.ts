/**
 * @file Real-time HR Data Hook
 * @description Client-side hook for subscribing to real-time HR data changes
 * via the shared RealtimeManager singleton (one channel per table).
 */

import { useEffect, useCallback } from "react";
import { notifyDataUpdate } from "@/services/hr-api-client";
import { subscribe, type HRTable } from "./realtime-manager";

type SubscriptionCallback = () => void;

export interface RealtimeHROptions {
  employeeId?: string;
  managerId?: string;
  onLeaveRequestChange?: SubscriptionCallback;
  onRegularizationChange?: SubscriptionCallback;
  onNotificationChange?: SubscriptionCallback;
  onAttendanceChange?: SubscriptionCallback;
}

/**
 * Hook for subscribing to real-time HR data changes.
 * Uses the shared channel manager so multiple components don't
 * create duplicate Supabase channels.
 */
export function useRealtimeHR(options: RealtimeHROptions = {}) {
  const {
    onLeaveRequestChange,
    onRegularizationChange,
    onNotificationChange,
    onAttendanceChange,
  } = options;

  const handleDataChange = useCallback(
    (callback?: SubscriptionCallback) => {
      notifyDataUpdate();
      callback?.();
    },
    [],
  );

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const sub = (table: HRTable, cb?: SubscriptionCallback) => {
      unsubs.push(subscribe(table, () => handleDataChange(cb)));
    };

    if (onLeaveRequestChange) sub("leave_requests", onLeaveRequestChange);
    if (onRegularizationChange)
      sub("regularization_requests", onRegularizationChange);
    if (onNotificationChange) sub("notifications", onNotificationChange);
    if (onAttendanceChange) sub("attendance", onAttendanceChange);

    // Always listen to announcements, documents, and acknowledgments
    sub("announcements");
    sub("documents");
    sub("document_acknowledgments");

    return () => unsubs.forEach((u) => u());
  }, [
    handleDataChange,
    onLeaveRequestChange,
    onRegularizationChange,
    onNotificationChange,
    onAttendanceChange,
  ]);

  return {
    isSupabaseConfigured: Boolean(
      typeof window !== "undefined" &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

/**
 * Simple hook to check backend type
 */
export function useBackendType() {
  const isSupabaseConfigured = Boolean(
    typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return {
    backend: isSupabaseConfigured ? ("supabase" as const) : ("json" as const),
    isSupabase: isSupabaseConfigured,
    isJson: !isSupabaseConfigured,
  };
}
