"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useHRActions } from "@/hooks";

interface CheckInOutCardProps {
  checkInTime?: string;
  checkOutTime?: string;
  status: "not_checked_in" | "checked_in" | "checked_out";
  totalHours?: string;
  employeeId?: string;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  isLoading?: boolean;
}

export function CheckInOutCard({
  checkInTime: initialCheckInTime,
  checkOutTime: initialCheckOutTime,
  status: initialStatus = "not_checked_in",
  totalHours: initialTotalHours,
  employeeId = "emp-001", // Default for demo
  onCheckIn,
  onCheckOut,
  isLoading = false,
}: CheckInOutCardProps) {
  // Local state to update UI after actions
  const [checkInTime, setCheckInTime] = useState(initialCheckInTime);
  const [checkOutTime, setCheckOutTime] = useState(initialCheckOutTime);
  const [status, setStatus] = useState(initialStatus);
  const [totalHours, setTotalHours] = useState(initialTotalHours);
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Use direct HR actions hook
  const { checkIn, checkOut, isLoading: actionLoading } = useHRActions();

  // Sync props to state when they change
  useEffect(() => {
    setCheckInTime(initialCheckInTime);
    setCheckOutTime(initialCheckOutTime);
    setStatus(initialStatus);
    setTotalHours(initialTotalHours);
  }, [initialCheckInTime, initialCheckOutTime, initialStatus, initialTotalHours]);

  const handleCheckIn = async () => {
    setMessage(null);
    
    // If custom handler provided, use it
    if (onCheckIn) {
      onCheckIn();
      return;
    }
    
    // Direct tool call - no chat message needed!
    const result = await checkIn(employeeId);
    
    if (result.success && result.data) {
      // Update local state immediately
      const time = new Date(result.data.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setCheckInTime(time);
      setStatus("checked_in");
      setMessage({ 
        type: "success", 
        text: `✓ ${result.data.message}` 
      });
    } else {
      setMessage({ 
        type: "error", 
        text: result.error || "Failed to check in. Please try again." 
      });
    }
  };

  const handleCheckOut = async () => {
    setMessage(null);
    
    // If custom handler provided, use it
    if (onCheckOut) {
      onCheckOut();
      return;
    }
    
    // Direct tool call - no chat message needed!
    const result = await checkOut(employeeId);
    
    if (result.success && result.data) {
      // Update local state immediately
      const time = new Date(result.data.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setCheckOutTime(time);
      setStatus("checked_out");
      
      // Calculate total hours if we have check-in time
      if (checkInTime) {
        const checkInDate = new Date(`2000-01-01T${checkInTime}`);
        const checkOutDate = new Date(`2000-01-01T${time}`);
        const diffMs = checkOutDate.getTime() - checkInDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setTotalHours(`${diffHours}h ${diffMins}m`);
      }
      
      setMessage({ 
        type: "success", 
        text: `✓ ${result.data.message}` 
      });
    } else {
      setMessage({ 
        type: "error", 
        text: result.error || "Failed to check out. Please try again." 
      });
    }
  };

  const formatTime = (time: string) => {
    try {
      const date = new Date(`2000-01-01T${time}`);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return time;
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "not_checked_in":
        return {
          icon: AlertCircle,
          text: "Not checked in yet",
          color: "text-amber-500",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
        };
      case "checked_in":
        return {
          icon: Clock,
          text: "Currently working",
          color: "text-green-500",
          bgColor: "bg-green-50 dark:bg-green-950/30",
        };
      case "checked_out":
        return {
          icon: CheckCircle2,
          text: "Day complete",
          color: "text-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
        };
      default:
        return {
          icon: AlertCircle,
          text: "Not checked in yet",
          color: "text-amber-500",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const isProcessing = actionLoading || isLoading;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Today&apos;s Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message - Shows result inline */}
        {message && (
          <Alert 
            variant={message.type === "error" ? "destructive" : "default"} 
            className={cn(
              "transition-all",
              message.type === "success" && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-800 dark:text-green-200" : ""}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Badge */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg p-3",
            statusConfig.bgColor
          )}
        >
          <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
          <span className={cn("font-medium", statusConfig.color)}>
            {statusConfig.text}
          </span>
        </div>

        {/* Time Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Check In</p>
            <p className="text-xl font-semibold">
              {checkInTime ? formatTime(checkInTime) : "--:--"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Check Out</p>
            <p className="text-xl font-semibold">
              {checkOutTime ? formatTime(checkOutTime) : "--:--"}
            </p>
          </div>
        </div>

        {/* Total Hours */}
        {totalHours && (
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className="text-2xl font-bold">{totalHours}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {status === "not_checked_in" && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckIn}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              {isProcessing ? "Checking in..." : "Check In"}
            </Button>
          )}
          {status === "checked_in" && (
            <Button
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={handleCheckOut}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-5 w-5" />
              )}
              {isProcessing ? "Checking out..." : "Check Out"}
            </Button>
          )}
          {status === "checked_out" && (
            <div className="text-center text-sm text-muted-foreground">
              See you tomorrow! 👋
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
