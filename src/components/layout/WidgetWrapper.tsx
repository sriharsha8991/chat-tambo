"use client";

import { useLiveQuery } from "@/hooks/useLiveQuery";
import { getComponent, getComponentLabel } from "@/lib/component-registry";
import type { PinnedWidget } from "@/types/dashboard";
import { Loader2, X } from "lucide-react";
import React, { useState, useCallback, useMemo, Suspense } from "react";
import { cn } from "@/lib/utils";

/**
 * WidgetWrapper — renders a single pinned widget on the dashboard.
 *
 * 1. Calls useLiveQuery(queryId, params) to fetch live data
 * 2. Maps query result → component props via mapQueryToProps
 * 3. Renders the component from the registry
 * 4. Shows loading / error states + unpin button on hover
 */

interface WidgetWrapperProps {
  widget: PinnedWidget;
  onUnpin?: (widgetId: string) => void;
  className?: string;
}

export function WidgetWrapper({ widget, onUnpin, className }: WidgetWrapperProps) {
  const { componentName, queryDescriptor, title } = widget;
  const { queryId, params } = queryDescriptor;

  const { data, isLoading, error, refresh } = useLiveQuery(queryId, params);
  const [hovered, setHovered] = useState(false);

  const Component = useMemo(() => getComponent(componentName), [componentName]);

  const mappedProps = useMemo(() => {
    if (!data) return null;
    return mapQueryToProps(queryId, componentName, data, params);
  }, [data, queryId, componentName, params]);

  const handleUnpin = useCallback(() => {
    onUnpin?.(widget.id);
  }, [onUnpin, widget.id]);

  // ── Unknown component ──────────────────────────────
  if (!Component) {
    return (
      <div className={cn("h-full rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-center text-sm text-destructive", className)}>
        Unknown component: {componentName}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────
  if (error) {
    return (
      <div
        className={cn("h-full rounded-lg border bg-card shadow-sm flex flex-col", className)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <WidgetHeader
          title={title ?? getComponentLabel(componentName)}
          hovered={hovered}
          onUnpin={handleUnpin}
          onRefresh={refresh}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-sm text-destructive gap-2">
          <p>Failed to load data</p>
          <button onClick={refresh} className="text-xs underline text-muted-foreground hover:text-foreground">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────
  if (isLoading && !data) {
    return (
      <div
        className={cn("h-full rounded-lg border bg-card shadow-sm flex flex-col", className)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <WidgetHeader
          title={title ?? getComponentLabel(componentName)}
          hovered={hovered}
          onUnpin={handleUnpin}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ── Normal render ──────────────────────────────────
  return (
    <div
      className={cn("h-full rounded-lg border bg-card shadow-sm flex flex-col overflow-hidden", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <WidgetHeader
        title={title ?? getComponentLabel(componentName)}
        hovered={hovered}
        onUnpin={handleUnpin}
        onRefresh={refresh}
        isRefreshing={isLoading}
      />
      <div className="flex-1 overflow-auto p-2">
        <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin mx-auto mt-4" />}>
          <Component {...(mappedProps ?? {})} />
        </Suspense>
      </div>
    </div>
  );
}

// ============================================
// Widget Header — title + hover actions
// ============================================

function WidgetHeader({
  title,
  hovered,
  onUnpin,
  onRefresh,
  isRefreshing,
}: {
  title: string;
  hovered: boolean;
  onUnpin?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 min-h-[36px] drag-handle cursor-grab active:cursor-grabbing">
      <span className="text-xs font-medium truncate">{title}</span>
      <div className={cn("flex items-center gap-1 transition-opacity", hovered ? "opacity-100" : "opacity-0")}>
        {onRefresh && (
          <button
            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <Loader2 className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          </button>
        )}
        {onUnpin && (
          <button
            onClick={(e) => { e.stopPropagation(); onUnpin(); }}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Unpin from dashboard"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// QUERY → PROPS MAPPER
// ============================================

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Maps raw query data to the specific props expected by each component.
 *
 * Most mappings are simple "wrap" patterns:
 *   query returns Array → component wants { propName: Array }
 *
 * Special cases (attendanceStatus → two components, Graph augmentation)
 * are handled explicitly.
 */
function mapQueryToProps(
  queryId: string,
  componentName: string,
  data: unknown,
  params?: Record<string, unknown>,
): Record<string, unknown> {
  const mapper = PROPS_MAPPERS[queryId];
  if (mapper) {
    return mapper(data, componentName, params);
  }
  // Fallback: try to pass data directly as props if it's an object
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return { data };
}

type PropsMapper = (
  data: unknown,
  componentName: string,
  params?: Record<string, unknown>,
) => Record<string, unknown>;

const PROPS_MAPPERS: Record<string, PropsMapper> = {
  // ── Employee ──────────────────────────────────────
  attendanceStatus: (data, componentName) => {
    const d = data as {
      records: any[];
      summary: any;
      todayStatus: {
        isCheckedIn: boolean;
        checkInTime?: string;
        checkOutTime?: string;
        hasMissedCheckout: boolean;
      };
    };

    if (componentName === "CheckInOutCard") {
      const t = d.todayStatus;
      return {
        checkInTime: t.checkInTime,
        checkOutTime: t.checkOutTime,
        status: t.checkOutTime
          ? "checked_out"
          : t.isCheckedIn
            ? "checked_in"
            : "not_checked_in",
        totalHours:
          t.checkInTime && t.checkOutTime
            ? computeHours(t.checkInTime, t.checkOutTime)
            : undefined,
      };
    }

    // AttendanceTimeline
    return {
      records: (d.records ?? []).map((r: any) => ({
        ...r,
        totalHours: r.hoursWorked != null ? `${r.hoursWorked}h` : undefined,
      })),
    };
  },

  leaveBalance: (data) => ({ balances: data }),

  requestStatus: (data) => ({ requests: data }),

  // ── Manager ───────────────────────────────────────
  pendingApprovals: (data, componentName) => {
    if (componentName === "ApprovalDetail") {
      const arr = data as any[];
      return { approval: arr?.[0] ?? null };
    }
    return { approvals: data };
  },

  teamMembers: (data) => ({ members: data }),

  // ── HR Admin ──────────────────────────────────────
  systemMetrics: (data) => ({ metrics: data }),

  policies: (data, componentName) => {
    const base: Record<string, unknown> = { policies: data };
    if (componentName === "PolicyManager") {
      base.canCreate = true;
      base.canEdit = true;
      base.canDelete = true;
    }
    return base;
  },

  announcements: (data, componentName) => {
    const base: Record<string, unknown> = { announcements: data };
    if (componentName === "AnnouncementBoard") {
      base.canPost = true;
      base.canDelete = true;
    }
    return base;
  },

  documents: (data, componentName) => {
    const base: Record<string, unknown> = {
      documents: data,
      acknowledgedIds: [],
    };
    if (componentName === "DocumentCenter") {
      base.canUpload = true;
      base.canDelete = true;
    }
    return base;
  },

  acknowledgedDocumentIds: (data) => ({ acknowledgedIds: data }),

  allEmployees: (data) => ({ employees: data }),

  // ── Analytics → Graph ─────────────────────────────
  attendanceTrends: (data, _cn, params) => ({
    data: { type: "bar", ...(data as object) },
    title: (params?.title as string) ?? "Attendance Trends",
  }),

  leaveAnalytics: (data, _cn, params) => ({
    data: {
      type: params?.type === "distribution" ? "pie" : "line",
      ...(data as object),
    },
    title:
      params?.type === "distribution"
        ? "Leave Distribution"
        : "Leave Usage Trends",
  }),

  teamMetrics: (data, _cn, params) => ({
    data: {
      type: params?.metric === "status" ? "pie" : "bar",
      ...(data as object),
    },
    title: `Team ${(params?.metric as string) ?? "Metrics"}`,
  }),

  hrAnalytics: (data, _cn, params) => ({
    data: {
      type: params?.metric === "departmentDistribution" ? "pie" : "line",
      ...(data as object),
    },
    title: `HR ${(params?.metric as string) ?? "Analytics"}`,
  }),
};

// ── Helpers ──────────────────────────────────────────

function computeHours(checkIn: string, checkOut: string): string {
  try {
    const inDate = new Date(`1970-01-01T${checkIn}`);
    const outDate = new Date(`1970-01-01T${checkOut}`);
    const diffMs = outDate.getTime() - inDate.getTime();
    if (diffMs <= 0) return "0h";
    const hours = Math.floor(diffMs / 3_600_000);
    const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } catch {
    return "–";
  }
}
