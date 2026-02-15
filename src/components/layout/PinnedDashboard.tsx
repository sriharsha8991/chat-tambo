"use client";

import { usePinnedWidgets } from "@/hooks/usePinnedWidgets";
import { refreshAllWidgets } from "@/hooks/useLiveQuery";
import { WidgetWrapper } from "./WidgetWrapper";
import type { PinnedWidget, GridLayout } from "@/types/dashboard";
import { Loader2, LayoutDashboard, Trash2, RefreshCw } from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Responsive,
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type LayoutItem,
  type ResponsiveLayouts,
  type DefaultBreakpoints,
} from "react-grid-layout";
import { cn } from "@/lib/utils";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

/**
 * PinnedDashboard — responsive drag-and-drop grid of pinned widgets.
 *
 * Each widget is wrapped in <WidgetWrapper> which handles live data
 * fetching and component rendering.
 *
 * Layout changes are batched and persisted to Supabase on drag/resize end.
 */

const GRID_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const ROW_HEIGHT = 80;

export function PinnedDashboard({ className }: { className?: string }) {
  const {
    widgets,
    isLoading,
    unpin,
    rename,
    batchSaveLayouts,
    clearAll,
  } = usePinnedWidgets();

  const [confirmClear, setConfirmClear] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    try {
      await refreshAllWidgets();
    } finally {
      setIsRefreshingAll(false);
    }
  }, []);

  // Build react-grid-layout items from pinned widgets
  const layouts = useMemo(() => {
    return buildLayouts(widgets);
  }, [widgets]);

  // Debounce layout saves — only persist after user finishes dragging
  const pendingLayoutRef = useRef<Record<string, GridLayout>>({});
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      // Collect updated positions
      const updates: Record<string, GridLayout> = {};
      for (const item of layout) {
        updates[item.i] = {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: item.minW,
          minH: item.minH,
        };
      }
      pendingLayoutRef.current = updates;

      // Debounce: persist after 800ms of no changes
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const entries = Object.entries(pendingLayoutRef.current).map(
          ([id, lay]) => ({ id, layout: lay }),
        );
        if (entries.length > 0) {
          batchSaveLayouts(entries);
        }
        pendingLayoutRef.current = {};
      }, 800);
    },
    [batchSaveLayouts],
  );

  const handleClearAll = useCallback(async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    await clearAll();
    setConfirmClear(false);
  }, [confirmClear, clearAll]);

  // ── Loading ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────
  if (widgets.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground", className)}>
        <LayoutDashboard className="h-12 w-12 opacity-30" />
        <p className="text-sm">No pinned widgets yet</p>
        <p className="text-xs max-w-sm text-center">
          Use the chat to find the data you need, then click <strong>&quot;Pin to Dashboard&quot;</strong> on any rendered component to add it here.
        </p>
      </div>
    );
  }

  // ── Dashboard grid ─────────────────────────────────
  return (
    <div className={cn("w-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 mb-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {widgets.length} pinned widget{widgets.length !== 1 && "s"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh all widgets"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshingAll && "animate-spin")} />
            Refresh All
          </button>
          <button
            onClick={handleClearAll}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors",
              confirmClear
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmClear ? "Click again to confirm" : "Clear all"}
          </button>
        </div>
      </div>

      <DashboardGrid
        widgets={widgets}
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onUnpin={unpin}
        onRename={rename}
      />
    </div>
  );
}

// ============================================
// DashboardGrid — inner component using useContainerWidth
// ============================================

function DashboardGrid({
  widgets,
  layouts,
  onLayoutChange,
  onUnpin,
  onRename,
}: {
  widgets: PinnedWidget[];
  layouts: ResponsiveLayouts<DefaultBreakpoints>;
  onLayoutChange: (layout: Layout) => void;
  onUnpin: (widgetId: string) => void;
  onRename: (widgetId: string, newTitle: string) => void;
}) {
  const { containerRef, width } = useContainerWidth();

  const handleResponsiveLayoutChange = useCallback(
    (layout: Layout, _layouts: ResponsiveLayouts<DefaultBreakpoints>) => {
      onLayoutChange(layout);
    },
    [onLayoutChange],
  );
  
  return (
    <div ref={containerRef}>
      {width > 0 && (
        <Responsive
          className="dashboard-grid"
          width={width}
          layouts={layouts}
          breakpoints={GRID_BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={ROW_HEIGHT}
          onLayoutChange={handleResponsiveLayoutChange}
          dragConfig={{ enabled: true, handle: ".drag-handle" }}
          resizeConfig={{ enabled: true }}
          compactor={verticalCompactor}
          margin={[16, 16] as readonly [number, number]}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetWrapper widget={widget} onUnpin={onUnpin} onRename={onRename} />
            </div>
          ))}
        </Responsive>
      )}
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function widgetToLayoutItem(widget: PinnedWidget): LayoutItem {
  return {
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
    minW: widget.layout.minW ?? 2,
    minH: widget.layout.minH ?? 2,
  };
}

function buildLayouts(widgets: PinnedWidget[]): ResponsiveLayouts<DefaultBreakpoints> {
  const lg = widgets.map(widgetToLayoutItem);

  // Scale down layouts for smaller breakpoints
  const md = lg.map((item) => ({
    ...item,
    w: Math.min(item.w, GRID_COLS.md),
    x: Math.min(item.x, GRID_COLS.md - Math.min(item.w, GRID_COLS.md)),
  }));

  const sm = lg.map((item) => ({
    ...item,
    w: Math.min(item.w, GRID_COLS.sm),
    x: 0, // Stack single-column-ish on small screens
  }));

  const xs = lg.map((item, i) => ({
    ...item,
    w: GRID_COLS.xs,
    x: 0,
    y: i * (item.h || 3), // Stack vertically
  }));

  const xxs = lg.map((item, i) => ({
    ...item,
    w: GRID_COLS.xxs,
    x: 0,
    y: i * (item.h || 3),
  }));

  return { lg, md, sm, xs, xxs };
}
