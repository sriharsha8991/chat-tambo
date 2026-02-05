"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTambo } from "@tambo-ai/react";

interface CheckInOutCardProps {
  checkInTime?: string;
  checkOutTime?: string;
  status: "not_checked_in" | "checked_in" | "checked_out";
  totalHours?: string;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  isLoading?: boolean;
}

export function CheckInOutCard({
  checkInTime,
  checkOutTime,
  status = "not_checked_in",
  totalHours,
  onCheckIn,
  onCheckOut,
  isLoading = false,
}: CheckInOutCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Get Tambo context to send messages
  const tambo = useTambo();

  const handleAction = async (action: "check_in" | "check_out") => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      if (action === "check_in") {
        if (onCheckIn) {
          await onCheckIn();
        } else if (tambo?.sendThreadMessage) {
          await tambo.sendThreadMessage("Check me in for today", { streamResponse: true });
        }
        setMessage({ type: "success", text: "Check-in request submitted!" });
      } else if (action === "check_out") {
        if (onCheckOut) {
          await onCheckOut();
        } else if (tambo?.sendThreadMessage) {
          await tambo.sendThreadMessage("Check me out for today", { streamResponse: true });
        }
        setMessage({ type: "success", text: "Check-out request submitted!" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to submit. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusConfig = () => {
    switch (status) {
      case "not_checked_in":
        return {
          icon: AlertCircle,
          text: "Not checked in yet",
          color: "text-amber-500",
          bgColor: "bg-amber-50",
        };
      case "checked_in":
        return {
          icon: Clock,
          text: "Currently working",
          color: "text-green-500",
          bgColor: "bg-green-50",
        };
      case "checked_out":
        return {
          icon: CheckCircle2,
          text: "Day complete",
          color: "text-blue-500",
          bgColor: "bg-blue-50",
        };
      default:
        // Fallback for undefined or unexpected status
        return {
          icon: AlertCircle,
          text: "Not checked in yet",
          color: "text-amber-500",
          bgColor: "bg-amber-50",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Today&apos;s Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} 
                 className={message.type === "success" ? "border-green-200 bg-green-50" : ""}>
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>
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
              onClick={() => handleAction("check_in")}
              disabled={isSubmitting || isLoading}
            >
              <LogIn className="mr-2 h-5 w-5" />
              {isSubmitting ? "Checking in..." : "Check In"}
            </Button>
          )}
          {status === "checked_in" && (
            <Button
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={() => handleAction("check_out")}
              disabled={isSubmitting || isLoading}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {isSubmitting ? "Checking out..." : "Check Out"}
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
