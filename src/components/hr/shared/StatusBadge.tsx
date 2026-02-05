"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "cancelled"
  | "present"
  | "absent"
  | "half_day"
  | "wfh"
  | "holiday"
  | "checked_in"
  | "checked_out"
  | "not_checked_in"
  | "missed_checkout"
  | "urgent"
  | "normal"
  | "low";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Request statuses
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  
  // Attendance statuses
  present: {
    label: "Present",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  absent: {
    label: "Absent",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  half_day: {
    label: "Half Day",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  wfh: {
    label: "WFH",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  holiday: {
    label: "Holiday",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  
  // Check-in statuses
  checked_in: {
    label: "Checked In",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  checked_out: {
    label: "Checked Out",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  not_checked_in: {
    label: "Not Checked In",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  missed_checkout: {
    label: "Missed Checkout",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  
  // Priority levels
  urgent: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  normal: {
    label: "Normal",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  low: {
    label: "Low",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showDot?: boolean;
  customLabel?: string;
}

export function StatusBadge({ status, className, showDot = false, customLabel }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) {
    return (
      <Badge variant="outline" className={cn("capitalize", className)}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, "font-medium", className)}
    >
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      )}
      {customLabel || config.label}
    </Badge>
  );
}

// Export types for use in other components
export type { StatusType };
