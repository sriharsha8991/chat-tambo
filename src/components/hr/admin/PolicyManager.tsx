"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Trash2, Edit3, Save } from "lucide-react";
import { createPolicy, deletePolicy, updatePolicy } from "@/services/hr-api-client";

interface PolicyItem {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}

interface PolicyManagerProps {
  policies: PolicyItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
  maxItems?: number;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  emptyState?: {
    title?: string;
    description?: string;
  };
}

export function PolicyManager({
  policies = [],
  onRefresh,
  isLoading = false,
  maxItems,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  emptyState,
}: PolicyManagerProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await createPolicy({
        title: title.trim(),
        category: category.trim().toLowerCase(),
        content: content.trim(),
      });
      setTitle("");
      setCategory("general");
      setContent("");
      onRefresh?.();
    } catch (error) {
      console.error("Failed to create policy:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (policy: PolicyItem) => {
    setEditingId(policy.id);
    setEditTitle(policy.title);
    setEditCategory(policy.category);
    setEditContent(policy.content);
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    setIsSubmitting(true);
    try {
      await updatePolicy({
        id: editingId,
        title: editTitle.trim(),
        category: editCategory.trim().toLowerCase(),
        content: editContent.trim(),
      });
      setEditingId(null);
      onRefresh?.();
    } catch (error) {
      console.error("Failed to update policy:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePolicy({ id });
      onRefresh?.();
    } catch (error) {
      console.error("Failed to delete policy:", error);
    }
  };

  const items = maxItems ? policies.slice(0, maxItems) : policies;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Policy Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canCreate && (
          <div className="grid gap-3">
            <Input
              placeholder="Policy title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="Category (leave, attendance, compliance, general)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Textarea
              placeholder="Policy content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
            <Button onClick={handleCreate} disabled={isSubmitting || !title.trim() || !content.trim()}>
              {isSubmitting ? "Saving..." : "Add Policy"}
            </Button>
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
                  {emptyState?.title || "No policies created yet"}
                </p>
                {emptyState?.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {emptyState.description}
                  </p>
                )}
              </div>
            ) : (
              items.map((policy) => (
                <div key={policy.id} className="rounded-lg border p-3">
                  {editingId === policy.id ? (
                    <div className="space-y-2">
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                      <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
                          <Save className="mr-1 h-4 w-4" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{policy.title}</span>
                          <Badge variant="secondary">{policy.category}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {policy.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Button variant="ghost" size="icon" onClick={() => startEdit(policy)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(policy.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
