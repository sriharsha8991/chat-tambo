"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  FileText,
  Users,
  CheckSquare,
  LayoutDashboard,
  BookOpen,
  Timer,
  ListChecks,
  UserCheck,
  ClipboardList,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
} from "lucide-react";

interface ComponentItem {
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "employee" | "manager" | "admin" | "analytics";
}

const hrComponents: ComponentItem[] = [
  // Employee Components
  {
    name: "Check In/Out",
    description: "Clock in and out for the day",
    icon: <Clock className="h-4 w-4" />,
    category: "employee",
  },
  {
    name: "Leave Balance",
    description: "View your leave balances",
    icon: <Calendar className="h-4 w-4" />,
    category: "employee",
  },
  {
    name: "Leave Request",
    description: "Apply for leave",
    icon: <FileText className="h-4 w-4" />,
    category: "employee",
  },
  {
    name: "Request Status",
    description: "Track your requests",
    icon: <ListChecks className="h-4 w-4" />,
    category: "employee",
  },
  {
    name: "Attendance History",
    description: "View attendance timeline",
    icon: <Timer className="h-4 w-4" />,
    category: "employee",
  },
  {
    name: "Regularization",
    description: "Correct attendance records",
    icon: <CheckSquare className="h-4 w-4" />,
    category: "employee",
  },

  // Manager Components
  {
    name: "Approval Queue",
    description: "Pending team requests",
    icon: <ClipboardList className="h-4 w-4" />,
    category: "manager",
  },
  {
    name: "Team Overview",
    description: "Team attendance status",
    icon: <Users className="h-4 w-4" />,
    category: "manager",
  },
  {
    name: "Approval Detail",
    description: "Review request details",
    icon: <UserCheck className="h-4 w-4" />,
    category: "manager",
  },

  // Admin Components
  {
    name: "HR Dashboard",
    description: "Organization metrics",
    icon: <LayoutDashboard className="h-4 w-4" />,
    category: "admin",
  },
  {
    name: "Policy Viewer",
    description: "HR policies & documents",
    icon: <BookOpen className="h-4 w-4" />,
    category: "admin",
  },

  // Analytics Components
  {
    name: "Attendance Trends",
    description: "View attendance patterns over time",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "analytics",
  },
  {
    name: "Leave Analytics",
    description: "Leave distribution & usage charts",
    icon: <PieChart className="h-4 w-4" />,
    category: "analytics",
  },
  {
    name: "Team Metrics",
    description: "Team performance charts",
    icon: <BarChart3 className="h-4 w-4" />,
    category: "analytics",
  },
  {
    name: "HR Analytics",
    description: "Organization-wide HR metrics",
    icon: <Activity className="h-4 w-4" />,
    category: "analytics",
  },
];

const categoryLabels: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "HR Admin",
  analytics: "Analytics",
};

const categoryColors: Record<string, string> = {
  employee: "text-blue-500",
  manager: "text-purple-500",
  admin: "text-emerald-500",
  analytics: "text-orange-500",
};

interface ComponentsSidebarProps {
  onComponentClick?: (componentName: string) => void;
  className?: string;
}

export function ComponentsSidebar({ onComponentClick, className }: ComponentsSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const groupedComponents = hrComponents.reduce((acc, comp) => {
    if (!acc[comp.category]) {
      acc[comp.category] = [];
    }
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, ComponentItem[]>);

  const categoryOrder = ["employee", "manager", "admin", "analytics"];

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "relative flex flex-col border-l border-border bg-muted/30 transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-14",
          className
        )}
      >
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -left-3 top-4 z-10 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Header */}
        <div className={cn(
          "flex items-center border-b border-border px-4 py-3",
          !isExpanded && "justify-center px-2"
        )}>
          {isExpanded ? (
            <h3 className="text-sm font-semibold text-foreground">Components</h3>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>HR Components</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Components List */}
        <ScrollArea className="flex-1">
          <div className={cn("py-2", isExpanded ? "px-3" : "px-2")}>
            {categoryOrder.map((category) => {
              const components = groupedComponents[category];
              if (!components) return null;

              return (
                <div key={category} className="mb-4">
                  {/* Category Header */}
                  {isExpanded && (
                    <div className={cn(
                      "mb-2 px-2 text-xs font-medium uppercase tracking-wider",
                      categoryColors[category]
                    )}>
                      {categoryLabels[category]}
                    </div>
                  )}

                  {/* Component Items */}
                  <div className="space-y-1">
                    {components.map((comp) => (
                      <Tooltip key={comp.name}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onComponentClick?.(comp.name)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                              !isExpanded && "justify-center"
                            )}
                          >
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                              category === "employee" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                              category === "manager" && "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                              category === "admin" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                              category === "analytics" && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                            )}>
                              {comp.icon}
                            </div>
                            {isExpanded && (
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-foreground">{comp.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{comp.description}</p>
                              </div>
                            )}
                          </button>
                        </TooltipTrigger>
                        {!isExpanded && (
                          <TooltipContent side="left">
                            <p className="font-medium">{comp.name}</p>
                            <p className="text-xs text-muted-foreground">{comp.description}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
