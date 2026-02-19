"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Clock, CheckCircle2, Home, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  employeeId: string;
  name: string;
  status: "available" | "on_leave" | "wfh" | "offline" | "absent";
  todayAttendance?: {
    checkIn?: string;
    checkOut?: string;
  };
}

interface TeamOverviewProps {
  members: TeamMember[];
  onMemberClick?: (member: TeamMember) => void;
}

const statusConfig = {
  available: { 
    label: "In Office", 
    icon: CheckCircle2, 
    color: "text-green-500",
    bgColor: "bg-green-100",
    dotColor: "bg-green-500"
  },
  on_leave: { 
    label: "On Leave", 
    icon: Calendar, 
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    dotColor: "bg-blue-500"
  },
  wfh: { 
    label: "WFH", 
    icon: Home, 
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    dotColor: "bg-purple-500"
  },
  offline: { 
    label: "Not Checked In", 
    icon: AlertCircle, 
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    dotColor: "bg-gray-400"
  },
  absent: { 
    label: "Absent", 
    icon: AlertCircle, 
    color: "text-red-500",
    bgColor: "bg-red-100",
    dotColor: "bg-red-500"
  },
};

export function TeamOverview({ members = [], onMemberClick }: TeamOverviewProps) {
  const resolveStatusKey = (
    status: TeamMember["status"] | undefined,
    hasCheckIn: boolean
  ): keyof typeof statusConfig => {
    if (!status) return "absent";
    if (status === "available" && !hasCheckIn) return "offline";
    return status as keyof typeof statusConfig;
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (time?: string) => {
    if (!time) return null;
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle empty members
  if (!members || members.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No team members found</p>
        </CardContent>
      </Card>
    );
  }

  // Group members by status
  const statusCounts = {
    available: members.filter((m) => m.status === "available" && m.todayAttendance?.checkIn).length,
    wfh: members.filter((m) => m.status === "wfh").length,
    on_leave: members.filter((m) => m.status === "on_leave").length,
    offline: members.filter((m) => m.status === "available" && !m.todayAttendance?.checkIn).length,
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Team Overview
          <Badge variant="secondary" className="ml-2">
            {members.length} members
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          {Object.entries(statusCounts).map(([key, count]) => {
            const status = statusConfig[key as keyof typeof statusConfig] || statusConfig.absent;
            return (
              <div
                key={key}
                className={cn("rounded-lg p-2 text-center", status.bgColor)}
              >
                <p className="text-lg font-bold">{count}</p>
                <p className={cn("text-xs", status.color)}>{status.label}</p>
              </div>
            );
          })}
        </div>

        {/* Member List */}
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {members.map((member, index) => {
              // Determine actual status
              const actualStatus = resolveStatusKey(
                member.status,
                Boolean(member.todayAttendance?.checkIn)
              );
              const status = statusConfig[actualStatus] || statusConfig.absent;
              const StatusIcon = status.icon;

              return (
                <div
                  key={member.id || member.employeeId || `member-${index}`}
                  className="flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => onMemberClick?.(member)}
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                        status.dotColor
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <StatusIcon className={cn("h-3 w-3", status.color)} />
                      <span>{status.label}</span>
                      {member.todayAttendance?.checkIn && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(member.todayAttendance.checkIn)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
