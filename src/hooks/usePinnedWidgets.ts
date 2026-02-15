/**
 * usePinnedWidgets — Manages the user's pinned dashboard widgets
 *
 * Provides CRUD operations for pinned widgets backed by Supabase,
 * with real-time sync across tabs/sessions.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePersona } from "@/contexts/PersonaContext";
import { supabase } from "@/lib/supabase";
import type { PinnedWidget, QueryDescriptor, GridLayout } from "@/types/dashboard";
import type { RealtimeChannel } from "@supabase/supabase-js";

const API_BASE = "/api/hr";

// ============================================
// HELPERS
// ============================================

/** Stable JSON stringify (sorted keys) to avoid key-order sensitivity */
function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return "";
  if (typeof obj !== "object") return JSON.stringify(obj);
  return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}

async function get<T>(action: string, params?: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams({ action, ...params });
  const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

async function post<T>(action: string, data: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

/** Convert snake_case DB row to camelCase PinnedWidget */
function rowToWidget(row: Record<string, unknown>): PinnedWidget {
  return {
    id: row.id as string,
    employeeId: (row.employee_id as string) || "",
    componentName: (row.component_name as string) || "",
    queryDescriptor: (row.query_descriptor as QueryDescriptor) || { queryId: "", params: {} },
    layout: (row.layout as GridLayout) || { x: 0, y: 0, w: 4, h: 3 },
    title: (row.title as string) || undefined,
    orderIndex: (row.order_index as number) || 0,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || undefined,
  };
}

// ============================================
// HOOK
// ============================================

export function usePinnedWidgets() {
  const { currentUser } = usePersona();
  const [widgets, setWidgets] = useState<PinnedWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const employeeId = currentUser?.id || currentUser?.employeeId;

  // Fetch pinned widgets
  const fetchWidgets = useCallback(async () => {
    if (!employeeId) return;

    try {
      setIsLoading(true);
      const rows = await get<Array<Record<string, unknown>>>("getPinnedWidgets", {
        employeeId,
      });
      setWidgets(rows.map(rowToWidget));
    } catch (err) {
      console.error("[usePinnedWidgets] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // Load on mount
  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  // Supabase realtime for cross-tab sync
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("pinned-widgets-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pinned_widgets" },
        () => {
          console.log("[usePinnedWidgets] Realtime change, refreshing");
          fetchWidgets();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchWidgets]);

  // ============================================
  // OPERATIONS
  // ============================================

  /** Pin a component to the dashboard */
  const pin = useCallback(
    async (
      componentName: string,
      queryDescriptor: QueryDescriptor,
      title?: string
    ): Promise<PinnedWidget | null> => {
      if (!employeeId) return null;

      // Lazy import to avoid circular dependency:
      // component-registry → @/components/hr → CheckInOutCard → @/hooks → usePinnedWidgets
      const { getDefaultLayout } = await import("@/lib/component-registry");
      const defaultLayout = getDefaultLayout(componentName);

      try {
        const result = await post<Record<string, unknown>>("pinWidget", {
          employeeId,
          componentName,
          queryDescriptor,
          layout: defaultLayout,
          title: title || null,
        });

        if (result.error) {
          console.warn("[usePinnedWidgets] Pin failed:", result.error);
          return null;
        }

        const widget = rowToWidget(result);
        setWidgets((prev) => [...prev, widget]);
        return widget;
      } catch (err) {
        console.error("[usePinnedWidgets] Pin error:", err);
        return null;
      }
    },
    [employeeId]
  );

  /** Unpin a widget from the dashboard */
  const unpin = useCallback(
    async (widgetId: string): Promise<boolean> => {
      try {
        const { success } = await post<{ success: boolean }>("unpinWidget", { widgetId });
        if (success) {
          setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
        }
        return success;
      } catch (err) {
        console.error("[usePinnedWidgets] Unpin error:", err);
        return false;
      }
    },
    []
  );

  /** Update a single widget's layout */
  const updateLayout = useCallback(
    async (widgetId: string, layout: GridLayout): Promise<boolean> => {
      try {
        const { success } = await post<{ success: boolean }>("updateWidgetLayout", {
          widgetId,
          layout,
        });
        if (success) {
          setWidgets((prev) =>
            prev.map((w) => (w.id === widgetId ? { ...w, layout } : w))
          );
        }
        return success;
      } catch (err) {
        console.error("[usePinnedWidgets] Layout update error:", err);
        return false;
      }
    },
    []
  );

  /** Rename a pinned widget */
  const rename = useCallback(
    async (widgetId: string, newTitle: string): Promise<boolean> => {
      try {
        const { success } = await post<{ success: boolean }>("updateWidgetTitle", {
          widgetId,
          title: newTitle,
        });
        if (success) {
          setWidgets((prev) =>
            prev.map((w) => (w.id === widgetId ? { ...w, title: newTitle } : w))
          );
        }
        return success;
      } catch (err) {
        console.error("[usePinnedWidgets] Rename error:", err);
        return false;
      }
    },
    []
  );

  /** Batch-save layouts after a drag-end event */
  const batchSaveLayouts = useCallback(
    async (updates: Array<{ id: string; layout: GridLayout }>): Promise<boolean> => {
      try {
        const { success } = await post<{ success: boolean }>("batchUpdateWidgetLayouts", {
          updates,
        });
        if (success) {
          setWidgets((prev) =>
            prev.map((w) => {
              const update = updates.find((u) => u.id === w.id);
              return update ? { ...w, layout: update.layout } : w;
            })
          );
        }
        return success;
      } catch (err) {
        console.error("[usePinnedWidgets] Batch layout error:", err);
        return false;
      }
    },
    []
  );

  /** Clear all pinned widgets for the current user */
  const clearAll = useCallback(async (): Promise<boolean> => {
    if (!employeeId) return false;
    try {
      const { success } = await post<{ success: boolean }>("clearAllPinnedWidgets", {
        employeeId,
      });
      if (success) setWidgets([]);
      return success;
    } catch (err) {
      console.error("[usePinnedWidgets] Clear all error:", err);
      return false;
    }
  }, [employeeId]);

  /** Check if a specific component+queryDescriptor combo is already pinned */
  const isWidgetPinned = useCallback(
    (componentName: string, queryDescriptor: QueryDescriptor): boolean => {
      const needle = stableStringify(queryDescriptor);
      return widgets.some(
        (w) =>
          w.componentName === componentName &&
          stableStringify(w.queryDescriptor) === needle
      );
    },
    [widgets]
  );

  /** Find the widget ID for a pinned component+queryDescriptor */
  const findWidgetId = useCallback(
    (componentName: string, queryDescriptor: QueryDescriptor): string | null => {
      const needle = stableStringify(queryDescriptor);
      const widget = widgets.find(
        (w) =>
          w.componentName === componentName &&
          stableStringify(w.queryDescriptor) === needle
      );
      return widget?.id ?? null;
    },
    [widgets]
  );

  return {
    widgets,
    isLoading,
    pin,
    unpin,
    rename,
    updateLayout,
    batchSaveLayouts,
    clearAll,
    isWidgetPinned,
    findWidgetId,
    refresh: fetchWidgets,
  };
}
