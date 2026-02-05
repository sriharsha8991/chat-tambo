"use client";

import { cn } from "@/lib/utils";
import { 
  FileText, 
  Calendar, 
  Users, 
  Clock, 
  Search,
  Inbox,
  Bell
} from "lucide-react";

type EmptyStateType = 
  | "no-requests"
  | "no-approvals"
  | "no-team"
  | "no-attendance"
  | "no-results"
  | "no-notifications"
  | "generic";

const emptyStateConfig: Record<EmptyStateType, {
  icon: React.ElementType;
  title: string;
  description: string;
}> = {
  "no-requests": {
    icon: FileText,
    title: "No Pending Requests",
    description: "You don't have any pending requests at the moment.",
  },
  "no-approvals": {
    icon: Inbox,
    title: "All Caught Up!",
    description: "No pending approvals require your attention.",
  },
  "no-team": {
    icon: Users,
    title: "No Team Members",
    description: "No team members found matching your criteria.",
  },
  "no-attendance": {
    icon: Clock,
    title: "No Attendance Records",
    description: "No attendance records found for this period.",
  },
  "no-results": {
    icon: Search,
    title: "No Results Found",
    description: "Try adjusting your search or filter criteria.",
  },
  "no-notifications": {
    icon: Bell,
    title: "No Notifications",
    description: "You're all caught up! No new notifications.",
  },
  "generic": {
    icon: Calendar,
    title: "Nothing Here Yet",
    description: "There's nothing to display at the moment.",
  },
};

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function EmptyState({
  type = "generic",
  title,
  description,
  icon,
  action,
  className,
  size = "default",
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  const sizeClasses = {
    sm: "py-6",
    default: "py-12",
    lg: "py-20",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    default: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      sizeClasses[size],
      className
    )}>
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icon className={cn("text-gray-400", iconSizes[size])} />
      </div>
      <h3 className={cn(
        "font-semibold text-gray-900",
        size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base"
      )}>
        {displayTitle}
      </h3>
      <p className={cn(
        "text-gray-500 mt-1 max-w-sm",
        size === "sm" ? "text-xs" : "text-sm"
      )}>
        {displayDescription}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
