"use client";

import { usePinnedWidgets } from "@/hooks/usePinnedWidgets";
import type { QueryDescriptor } from "@/types/dashboard";
import { getComponentLabel } from "@/lib/component-registry";
import { Pin, Check, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * PinButton — floating toggle that pins/unpins a rendered component
 * to the user's personal dashboard.
 *
 * Placed inside MessageRenderedComponentArea to overlay on chat components.
 */

interface PinButtonProps {
  /** Tambo component name (e.g. "LeaveBalanceCard") */
  componentName: string;
  /** Query descriptor used to re-fetch data on the dashboard */
  queryDescriptor: QueryDescriptor;
  /** Optional title override for the pinned widget */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

export function PinButton({
  componentName,
  queryDescriptor,
  title,
  className,
}: PinButtonProps) {
  const { pin, unpin, isWidgetPinned, findWidgetId } = usePinnedWidgets();
  const [busy, setBusy] = useState(false);

  const pinned = isWidgetPinned(componentName, queryDescriptor);

  const handleToggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (pinned) {
        const widgetId = findWidgetId(componentName, queryDescriptor);
        if (widgetId) await unpin(widgetId);
      } else {
        await pin(
          componentName,
          queryDescriptor,
          title ?? getComponentLabel(componentName) ?? componentName,
        );
      }
    } catch (err) {
      console.error("[PinButton] toggle failed:", err);
    } finally {
      setBusy(false);
    }
  }, [busy, pinned, componentName, queryDescriptor, title, pin, unpin, findWidgetId]);

  if (busy) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs",
          "bg-muted text-muted-foreground cursor-wait",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>{pinned ? "Unpinning…" : "Pinning…"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      title={pinned ? "Unpin from dashboard" : "Pin to dashboard"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
        pinned
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
        "cursor-pointer",
        className,
      )}
    >
      {pinned ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Pinned</span>
        </>
      ) : (
        <>
          <Pin className="h-3.5 w-3.5" />
          <span>Pin to Dashboard</span>
        </>
      )}
    </button>
  );
}
