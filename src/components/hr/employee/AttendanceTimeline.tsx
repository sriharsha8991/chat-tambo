"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, LogIn, LogOut, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: string;
  status: "present" | "absent" | "half_day" | "wfh" | "on_leave" | "holiday" | "regularization_pending";
  notes?: string;
}

interface AttendanceTimelineProps {
  records: AttendanceRecord[];
  maxItems?: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  present: { label: "Present", variant: "default", color: "bg-green-500" },
  absent: { label: "Absent", variant: "destructive", color: "bg-red-500" },
  half_day: { label: "Half Day", variant: "outline", color: "bg-amber-500" },
  wfh: { label: "WFH", variant: "secondary", color: "bg-purple-500" },
  on_leave: { label: "On Leave", variant: "secondary", color: "bg-blue-500" },
  holiday: { label: "Holiday", variant: "outline", color: "bg-gray-500" },
  regularization_pending: { label: "Pending", variant: "outline", color: "bg-amber-500" },
};

export function AttendanceTimeline({ records = [], maxItems = 7 }: AttendanceTimelineProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    // Append T00:00:00 to date-only strings to force local-time parsing
    // and avoid off-by-one day errors in timezones behind UTC.
    const normalized = dateString.includes("T") ? dateString : `${dateString}T00:00:00`;
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return dateString;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return "--:--";
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const displayRecords = (records || []).slice(0, maxItems);

  if (!records || records.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No attendance records available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Attendance History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[400px] px-6 pb-6">
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

            {displayRecords.map((record, index) => {
              const status = statusConfig[record.status] || statusConfig.present;

              return (
                <div key={`${record.date}-${index}`} className="relative pl-8 pb-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute left-0 top-1 h-6 w-6 rounded-full border-2 border-background flex items-center justify-center",
                      status.color
                    )}
                  >
                    {record.status === "present" && <CheckCircle2 className="h-3 w-3 text-white" />}
                    {record.status === "absent" && <AlertTriangle className="h-3 w-3 text-white" />}
                    {record.status === "wfh" && <Clock className="h-3 w-3 text-white" />}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    "rounded-lg border p-3",
                    index === 0 && "bg-muted/50"
                  )}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{formatDate(record.date)}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    {(record.status === "present" || record.status === "wfh" || record.status === "half_day") && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <LogIn className="h-3.5 w-3.5" />
                          <span>{formatTime(record.checkIn)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <LogOut className="h-3.5 w-3.5" />
                          <span>{formatTime(record.checkOut)}</span>
                        </div>
                        {record.totalHours && (
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{record.totalHours}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {record.notes && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {record.notes}
                      </p>
                    )}
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
