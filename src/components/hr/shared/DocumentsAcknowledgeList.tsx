"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle2, Calendar, ExternalLink } from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  description?: string | null;
  filePath: string;
  audienceRole: string;
  requiresAck: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

interface DocumentsAcknowledgeListProps {
  documents: DocumentItem[];
  acknowledgedIds: string[];
  onAcknowledge?: (id: string) => void;
  title?: string;
  maxHeight?: number;
  maxItems?: number;
  isLoading?: boolean;
  density?: "compact" | "comfortable";
  showAcknowledge?: boolean;
  hideAcknowledged?: boolean;
  emptyState?: {
    title?: string;
    description?: string;
  };
}

export function DocumentsAcknowledgeList({
  documents = [],
  acknowledgedIds = [],
  onAcknowledge,
  title = "Documents",
  maxHeight = 360,
  maxItems,
  isLoading = false,
  density = "comfortable",
  showAcknowledge = true,
  hideAcknowledged = false,
  emptyState,
}: DocumentsAcknowledgeListProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredDocs = hideAcknowledged
    ? documents.filter((doc) => !acknowledgedIds.includes(doc.id))
    : documents;
  const items = maxItems ? filteredDocs.slice(0, maxItems) : filteredDocs;
  const paddingClass = density === "compact" ? "p-2" : "p-3";

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="px-6 pb-6" style={{ maxHeight }}>
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={`loading-${index}`} className="rounded-lg border p-3">
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 w-1/3 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-2/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {emptyState?.title || "No documents available"}
                </p>
                {emptyState?.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {emptyState.description}
                  </p>
                )}
              </div>
            ) : (
              items.map((doc) => {
                const isAcknowledged = acknowledgedIds.includes(doc.id);
                return (
                  <div key={doc.id} className={"rounded-lg border " + paddingClass}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{doc.title}</span>
                          {doc.requiresAck && (
                            <Badge variant="secondary">Acknowledgment</Badge>
                          )}
                          {isAcknowledged && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        {doc.description && (
                          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {doc.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={doc.filePath} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Open
                          </a>
                        </Button>
                        {showAcknowledge && doc.requiresAck && !isAcknowledged && onAcknowledge && (
                          <Button size="sm" onClick={() => onAcknowledge(doc.id)}>
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
