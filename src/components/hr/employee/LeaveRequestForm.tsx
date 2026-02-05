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
import { Calendar, Send, Info, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTambo } from "@tambo-ai/react";

interface LeaveBalance {
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  label: string;
}

interface LeaveRequestFormProps {
  balances: LeaveBalance[];
  preselectedType?: string;
  onSubmit?: (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function LeaveRequestForm({
  balances = [],
  preselectedType,
  onSubmit,
  onCancel,
}: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState(preselectedType || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get Tambo context to send messages
  const tambo = useTambo();

  const selectedBalance = balances?.find((b) => b.leaveType === leaveType);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysRequested = calculateDays();

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (!leaveType) {
      setError("Please select a leave type");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select start and end dates");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be after start date");
      return;
    }
    if (selectedBalance && daysRequested > selectedBalance.remainingDays) {
      setError(`Insufficient leave balance. You have ${selectedBalance.remainingDays} days remaining.`);
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for your leave");
      return;
    }

    setIsSubmitting(true);
    try {
      // If onSubmit callback is provided, use it
      if (onSubmit) {
        await onSubmit({
          leaveType,
          startDate,
          endDate,
          reason: reason.trim(),
        });
      } else if (tambo?.sendThreadMessage) {
        // Otherwise, send a message to Tambo to process the request
        const leaveLabel = selectedBalance?.label || leaveType;
        const message = `Submit my leave request: ${leaveLabel} from ${startDate} to ${endDate} (${daysRequested} days). Reason: ${reason.trim()}`;
        
        await tambo.sendThreadMessage(message, { streamResponse: true });
      }
      
      setSuccess(true);
      // Reset form after successful submission
      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch {
      setError("Failed to submit leave request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Request Leave
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Leave request submitted successfully! Check the chat for confirmation.
            </AlertDescription>
          </Alert>
        )}

        {/* Leave Type */}
        <div className="space-y-2">
          <Label htmlFor="leaveType">Leave Type</Label>
          <Select value={leaveType} onValueChange={setLeaveType}>
            <SelectTrigger id="leaveType">
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              {balances
                .filter((balance) => balance.leaveType && balance.leaveType.trim() !== "")
                .map((balance) => (
                <SelectItem key={balance.leaveType} value={balance.leaveType}>
                  <div className="flex items-center justify-between gap-4">
                    <span>{balance.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ({balance.remainingDays} days available)
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        {/* Days Summary */}
        {daysRequested > 0 && selectedBalance && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Requesting <strong>{daysRequested} day(s)</strong> of {selectedBalance.label}.
              You&apos;ll have <strong>{selectedBalance.remainingDays - daysRequested}</strong> days remaining.
            </AlertDescription>
          </Alert>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            placeholder="Enter reason for leave..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={isSubmitting || !leaveType || !startDate || !endDate || !reason.trim()}
        >
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </CardFooter>
    </Card>
  );
}
