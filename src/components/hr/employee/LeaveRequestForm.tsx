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
import { Calendar, Send, Info, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useHRActions } from "@/hooks";

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
  employeeId?: string;
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
  employeeId = "emp-001", // Default for demo
  onSubmit,
  onCancel,
}: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState(preselectedType || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ requestId: string; daysRequested: number } | null>(null);

  // Use direct HR actions hook
  const { applyLeave, isLoading } = useHRActions();

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
    setSuccessData(null);

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

    try {
      // If custom onSubmit callback is provided, use it
      if (onSubmit) {
        await onSubmit({
          leaveType,
          startDate,
          endDate,
          reason: reason.trim(),
        });
        setSuccessData({ requestId: "custom", daysRequested });
      } else {
        // Direct tool call - no chat message needed!
        const result = await applyLeave({
          employeeId,
          leaveType,
          startDate,
          endDate,
          reason: reason.trim(),
        });
        
        if (result.success && result.data) {
          setSuccessData(result.data);
          // Reset form after successful submission
          setLeaveType("");
          setStartDate("");
          setEndDate("");
          setReason("");
        } else {
          setError(result.error || "Failed to submit leave request. Please try again.");
        }
      }
    } catch {
      setError("Failed to submit leave request. Please try again.");
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

        {successData && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="space-y-1">
                <p className="font-medium">✓ Leave request submitted successfully!</p>
                <p className="text-sm">Request ID: {successData.requestId}</p>
                <p className="text-sm">{successData.daysRequested} day(s) requested • Pending manager approval</p>
              </div>
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
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={isLoading || !leaveType || !startDate || !endDate || !reason.trim() || !!successData}
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
