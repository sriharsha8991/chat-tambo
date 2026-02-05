"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  User,
  Building2,
  FileText,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHRActions } from "@/hooks";

interface ApprovalItem {
  id: string;
  type: "leave" | "regularization" | "wfh";
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  details: string;
  submittedAt: string;
  priority: "normal" | "urgent";
}

interface ApprovalDetailProps {
  approval: ApprovalItem;
  onApprove?: (id: string, comment?: string) => void;
  onReject?: (id: string, comment?: string) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const typeConfig = {
  leave: { icon: Calendar, color: "text-blue-500", bgColor: "bg-blue-100", label: "Leave Request" },
  regularization: { icon: Clock, color: "text-purple-500", bgColor: "bg-purple-100", label: "Regularization" },
  wfh: { icon: Calendar, color: "text-green-500", bgColor: "bg-green-100", label: "WFH Request" },
};

export function ApprovalDetail({
  approval,
  onApprove,
  onReject,
  onBack,
  isLoading = false,
}: ApprovalDetailProps) {
  const [comment, setComment] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);

  // Use direct HR actions hook
  const { approveRequest, rejectRequest, isLoading: actionLoading } = useHRActions();

  // Handle missing approval
  if (!approval) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">No approval details available</p>
        </CardContent>
      </Card>
    );
  }

  const type = typeConfig[approval.type] || typeConfig.leave;
  const TypeIcon = type.icon;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleAction = async (selectedAction: "approve" | "reject") => {
    setAction(selectedAction);
    setMessage(null);
    
    try {
      if (selectedAction === "approve") {
        if (onApprove) {
          onApprove(approval.id, comment || undefined);
          setMessage({ type: "success", text: `Request approved successfully!` });
          setIsProcessed(true);
        } else {
          // Direct tool call - no chat message needed!
          const result = await approveRequest(approval.id, comment || undefined);
          if (result.success) {
            setMessage({ type: "success", text: `✓ ${approval.employeeName}'s ${type.label} approved!` });
            setIsProcessed(true);
          } else {
            setMessage({ type: "error", text: result.error || "Failed to approve request." });
          }
        }
      } else {
        if (onReject) {
          onReject(approval.id, comment || undefined);
          setMessage({ type: "success", text: `Request rejected.` });
          setIsProcessed(true);
        } else {
          // Direct tool call - no chat message needed!
          const result = await rejectRequest(approval.id, comment || undefined);
          if (result.success) {
            setMessage({ type: "success", text: `✓ ${approval.employeeName}'s ${type.label} rejected.` });
            setIsProcessed(true);
          } else {
            setMessage({ type: "error", text: result.error || "Failed to reject request." });
          }
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to process request. Please try again." });
    }
  };

  const isProcessing = actionLoading || isLoading;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className={cn("rounded-lg p-1.5", type.bgColor)}>
              <TypeIcon className={cn("h-5 w-5", type.color)} />
            </div>
            {type.label}
          </CardTitle>
          {approval.priority === "urgent" && (
            <Badge variant="destructive">Urgent</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message */}
        {message && (
          <Alert 
            variant={message.type === "error" ? "destructive" : "default"} 
            className={cn(
              message.type === "success" && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-800 dark:text-green-200" : ""}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Employee Info */}
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{getInitials(approval.employeeName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{approval.employeeName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{approval.employeeId}</span>
              <span>•</span>
              <Building2 className="h-3.5 w-3.5" />
              <span>{approval.department}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Request Details */}
        <div className="space-y-3">
          <div>
            <Label className="text-muted-foreground">Request</Label>
            <p className="font-medium">{approval.title}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Details</Label>
            <p className="text-sm">{approval.details}</p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <Label className="text-muted-foreground">Submitted</Label>
              <p className="text-sm">{formatDate(approval.submittedAt)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Time</Label>
              <p className="text-sm">{formatTime(approval.submittedAt)}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Comment (Optional)
          </Label>
          <Textarea
            id="comment"
            placeholder="Add a comment for the employee..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            disabled={isProcessing || isProcessed}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {isProcessed ? (
          <div className="w-full text-center py-2">
            <p className="text-sm text-muted-foreground">
              {action === "approve" ? "✓ Approved" : "✓ Rejected"} - Request processed
            </p>
          </div>
        ) : (
          <>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => handleAction("approve")}
              disabled={isProcessing}
            >
              {isProcessing && action === "approve" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              {isProcessing && action === "approve" ? "Approving..." : "Approve"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => handleAction("reject")}
              disabled={isProcessing}
            >
              {isProcessing && action === "reject" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-5 w-5" />
              )}
              {isProcessing && action === "reject" ? "Rejecting..." : "Reject"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
