"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Trash2, ExternalLink, Calendar } from "lucide-react";
import { deleteDocument, uploadDocument } from "@/services/hr-api-client";
import { useCurrentUser } from "@/contexts/PersonaContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentItem {
  id: string;
  title: string;
  description?: string | null;
  filePath: string;
  audienceRole: string;
  requiresAck: boolean;
  createdAt: string;
}

interface DocumentCenterProps {
  documents: DocumentItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
  maxItems?: number;
  canUpload?: boolean;
  canDelete?: boolean;
  emptyState?: {
    title?: string;
    description?: string;
  };
}

export function DocumentCenter({
  documents = [],
  onRefresh,
  isLoading = false,
  maxItems,
  canUpload = true,
  canDelete = true,
  emptyState,
}: DocumentCenterProps) {
  const currentUser = useCurrentUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audienceRole, setAudienceRole] = useState<"all" | "employee" | "manager" | "hr">("all");
  const [requiresAck, setRequiresAck] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      await uploadDocument({
        file,
        title: title.trim(),
        description: description.trim(),
        audienceRole,
        requiresAck,
        createdBy: currentUser.id,
      });
      setTitle("");
      setDescription("");
      setRequiresAck(false);
      setFile(null);
      setMessage({ type: "success", text: "Document uploaded successfully." });
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload document.";
      setMessage({ type: "error", text: errorMessage });
      console.error("Failed to upload document:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument({ id });
      setMessage({ type: "success", text: "Document deleted successfully." });
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete document.";
      setMessage({ type: "error", text: errorMessage });
      console.error("Failed to delete document:", error);
    }
  };

  const items = maxItems ? documents.slice(0, maxItems) : documents;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Document Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        {canUpload && (
          <div className="grid gap-3">
            <Input
              placeholder="Document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Short description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select value={audienceRole} onValueChange={(value) => setAudienceRole(value as "all" | "employee" | "manager" | "hr")}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="employee">Employees</SelectItem>
                  <SelectItem value="manager">Managers</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={requiresAck}
                  onChange={(e) => setRequiresAck(e.target.checked)}
                />
                Require acknowledgment
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
              <Button onClick={handleUpload} disabled={isSubmitting || !file || !title.trim()}>
                {isSubmitting ? "Uploading..." : "Upload PDF"}
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[420px]">
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
                  {emptyState?.title || "No documents uploaded yet"}
                </p>
                {emptyState?.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {emptyState.description}
                  </p>
                )}
              </div>
            ) : (
              items.map((doc) => (
                <div key={doc.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{doc.title}</span>
                        {doc.requiresAck && <Badge variant="secondary">Ack</Badge>}
                        <Badge variant="outline" className="text-xs">
                          {doc.audienceRole}
                        </Badge>
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
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="icon">
                        <a href={doc.filePath} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      {canDelete && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
