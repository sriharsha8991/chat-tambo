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
import { Clock, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTambo } from "@tambo-ai/react";

interface RegularizationFormProps {
  onSubmit?: (data: {
    date: string;
    type: "missed_checkin" | "missed_checkout" | "missed_both";
    actualTime: string;
    reason: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function RegularizationForm({ onSubmit, onCancel }: RegularizationFormProps) {
  const [date, setDate] = useState("");
  const [type, setType] = useState<string>("");
  const [actualTime, setActualTime] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get Tambo context to send messages
  const tambo = useTambo();

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

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

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          date,
          type: type as "missed_checkin" | "missed_checkout" | "missed_both",
          actualTime,
          reason: reason.trim(),
        });
      } else if (tambo?.sendThreadMessage) {
        const typeLabel = type === "missed_checkin" ? "missed check-in" : 
                         type === "missed_checkout" ? "missed check-out" : 
                         "missed check-in and check-out";
        const message = `Submit regularization request for ${date}: ${typeLabel} at ${actualTime}. Reason: ${reason.trim()}`;
        
        await tambo.sendThreadMessage(message, { streamResponse: true });
      }
      
      setSuccess(true);
      // Reset form
      setDate("");
      setType("");
      setActualTime("");
      setReason("");
    } catch {
      setError("Failed to submit regularization request. Please try again.");
    } finally {
      setIsSubmitting(false);
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

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Regularization request submitted successfully! Check the chat for confirmation.
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
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={isSubmitting || !date || !type || !actualTime || !reason.trim()}
        >
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </CardFooter>
    </Card>
  );
}
