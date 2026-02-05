"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";

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

interface ApprovalQueueProps {
  approvals: ApprovalItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDetails?: (item: ApprovalItem) => void;
}

const typeConfig = {
  leave: { icon: Calendar, color: "text-blue-500", bgColor: "bg-blue-100" },
  regularization: { icon: Clock, color: "text-purple-500", bgColor: "bg-purple-100" },
  wfh: { icon: Calendar, color: "text-green-500", bgColor: "bg-green-100" },
};

export function ApprovalQueue({
  approvals = [],
  onApprove,
  onReject,
  onViewDetails,
}: ApprovalQueueProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const tambo = useTambo();

  const handleApprove = async (approval: ApprovalItem) => {
    if (onApprove) {
      onApprove(approval.id);
      return;
    }
    
    setLoadingId(approval.id);
    setMessage(null);
    try {
      if (tambo?.sendThreadMessage) {
        await tambo.sendThreadMessage(
          `Approve ${approval.employeeName}'s ${approval.type} request (ID: ${approval.id}): ${approval.title}`,
          { streamResponse: true }
        );
        setMessage({ type: "success", text: `Approved ${approval.employeeName}'s request` });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to approve. Please try again." });
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (approval: ApprovalItem) => {
    if (onReject) {
      onReject(approval.id);
      return;
    }
    
    setLoadingId(approval.id);
    setMessage(null);
    try {
      if (tambo?.sendThreadMessage) {
        await tambo.sendThreadMessage(
          `Reject ${approval.employeeName}'s ${approval.type} request (ID: ${approval.id}): ${approval.title}`,
          { streamResponse: true }
        );
        setMessage({ type: "success", text: `Rejected ${approval.employeeName}'s request` });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reject. Please try again." });
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!approvals || approvals.length === 0) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="mb-2 h-12 w-12 text-green-500/30" />
            <p className="font-medium text-green-600">All caught up!</p>
            <p className="text-sm text-muted-foreground">No pending approvals</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const urgentCount = approvals.filter((a) => a.priority === "urgent").length;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="h-5 w-5" />
          Pending Approvals
          <Badge variant="secondary" className="ml-2">
            {approvals.length}
          </Badge>
        </CardTitle>
        {urgentCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {urgentCount} Urgent
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Status Message */}
        {message && (
          <div className="px-6 pt-2">
            <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : ""}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          </div>
        )}
        <ScrollArea className="max-h-[450px]">
          <div className="space-y-1 px-6 pb-6 pt-2">
            {approvals.map((approval) => {
              const type = typeConfig[approval.type] || typeConfig.leave;
              const TypeIcon = type.icon;

              return (
                <div
                  key={approval.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors hover:bg-muted/50",
                    approval.priority === "urgent" && "border-red-200 bg-red-50/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(approval.employeeName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{approval.employeeName}</span>
                        {approval.priority === "urgent" && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={cn("rounded p-0.5", type.bgColor)}>
                          <TypeIcon className={cn("h-3 w-3", type.color)} />
                        </div>
                        <span>{approval.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {approval.details}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted: {formatDate(approval.submittedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails?.(approval)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleApprove(approval)}
                      disabled={loadingId === approval.id}
                    >
                      {loadingId === approval.id ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleReject(approval)}
                      disabled={loadingId === approval.id}
                    >
                      {loadingId === approval.id ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-1 h-4 w-4" />
                      )}
                      Reject
                    </Button>
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
