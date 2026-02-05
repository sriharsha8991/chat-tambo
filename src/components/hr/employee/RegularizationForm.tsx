"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Send, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useHRActions } from "@/hooks";

interface RegularizationFormProps {
  employeeId?: string;
  onSubmit?: (data: {
    date: string;
    type: "missed_checkin" | "missed_checkout" | "missed_both";
    actualTime: string;
    reason: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function RegularizationForm({ 
  employeeId = "emp-001",
  onSubmit, 
  onCancel 
}: RegularizationFormProps) {
  const [date, setDate] = useState("");
  const [type, setType] = useState<string>("");
  const [actualTime, setActualTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ requestId: string } | null>(null);

  // Use direct HR actions hook
  const { submitRegularization, isLoading } = useHRActions();

  const handleSubmit = async () => {
    setError(null);
    setSuccessData(null);

    if (!date) {
      setError("Please select a date");
      return;
    }
    if (!type) {
      setError("Please select the type of regularization");
      return;
    }
    if (!actualTime) {
      setError("Please enter the actual time");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for regularization");
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit({
          date,
          type: type as "missed_checkin" | "missed_checkout" | "missed_both",
          actualTime,
          reason: reason.trim(),
        });
        setSuccessData({ requestId: "custom" });
      } else {
        // Convert type for API compatibility
        const requestType = type === "missed_both" ? "missed_checkin" : type as "missed_checkin" | "missed_checkout" | "correction";
        
        // Direct tool call - no chat message needed!
        const result = await submitRegularization({
          employeeId,
          date,
          requestType,
          requestedTime: actualTime,
          reason: reason.trim(),
        });
        
        if (result.success && result.data) {
          setSuccessData(result.data);
          // Reset form
          setDate("");
          setType("");
          setActualTime("");
          setReason("");
        } else {
          setError(result.error || "Failed to submit regularization request. Please try again.");
        }
      }
    } catch {
      setError("Failed to submit regularization request. Please try again.");
    }
  };

  // Calculate max date (today) and min date (7 days ago for regularization)
  const today = new Date().toISOString().split("T")[0];
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 7);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Attendance Regularization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successData && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="space-y-1">
                <p className="font-medium">✓ Regularization request submitted!</p>
                <p className="text-sm">Request ID: {successData.requestId}</p>
                <p className="text-sm">Pending manager approval</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Regularization requests must be submitted within 7 days of the missed entry.
          </AlertDescription>
        </Alert>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={minDateStr}
            max={today}
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Regularization Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="missed_checkin">Missed Check-in</SelectItem>
              <SelectItem value="missed_checkout">Missed Check-out</SelectItem>
              <SelectItem value="missed_both">Missed Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actual Time */}
        <div className="space-y-2">
          <Label htmlFor="actualTime">
            {type === "missed_checkin"
              ? "Actual Check-in Time"
              : type === "missed_checkout"
              ? "Actual Check-out Time"
              : "Actual Time (Check-in / Check-out)"}
          </Label>
          <Input
            id="actualTime"
            type="time"
            value={actualTime}
            onChange={(e) => setActualTime(e.target.value)}
          />
          {type === "missed_both" && (
            <p className="text-xs text-muted-foreground">
              For missed both, enter check-in time. You&apos;ll be contacted for check-out details.
            </p>
          )}
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            placeholder="Enter reason for regularization (e.g., forgot to punch, badge not working, system error)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={isLoading || !date || !type || !actualTime || !reason.trim() || !!successData}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Submitting..." : successData ? "Submitted ✓" : "Submit Request"}
        </Button>
      </CardFooter>
    </Card>
  );
}
