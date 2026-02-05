"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestStatus {
  id: string;
  type: "leave" | "regularization" | "wfh";
  title: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  details: string;
}

interface RequestStatusListProps {
  requests: RequestStatus[];
  maxHeight?: number;
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "outline" as const,
    icon: AlertCircle,
    color: "text-amber-500",
  },
  approved: {
    label: "Approved",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-500",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-500",
  },
};

const typeConfig = {
  leave: { icon: Calendar, color: "text-blue-500", bgColor: "bg-blue-100" },
  regularization: { icon: Clock, color: "text-purple-500", bgColor: "bg-purple-100" },
  wfh: { icon: FileText, color: "text-green-500", bgColor: "bg-green-100" },
};

export function RequestStatusList({ requests = [], maxHeight = 400 }: RequestStatusListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!requests || requests.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            My Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="mb-2 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No pending requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          My Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }} className="px-6 pb-6">
          <div className="space-y-3">
            {requests.map((request) => {
              const status = statusConfig[request.status] || statusConfig.pending;
              const type = typeConfig[request.type] || typeConfig.leave;
              const TypeIcon = type.icon;
              const StatusIcon = status.icon;

              return (
                <div
                  key={request.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("rounded-lg p-1.5", type.bgColor)}>
                        <TypeIcon className={cn("h-4 w-4", type.color)} />
                      </div>
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {formatDate(request.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={status.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{request.details}</p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
