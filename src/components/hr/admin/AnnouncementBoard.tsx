"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Megaphone, Trash2 } from "lucide-react";
import { createAnnouncement, deleteAnnouncement } from "@/services/hr-api-client";
import { useCurrentUser } from "@/contexts/PersonaContext";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  audienceRole: string;
  pinned: boolean;
  createdAt: string;
}

interface AnnouncementBoardProps {
  announcements: AnnouncementItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
  maxItems?: number;
  canPost?: boolean;
  canDelete?: boolean;
  emptyState?: {
    title?: string;
    description?: string;
  };
}

export function AnnouncementBoard({
  announcements = [],
  onRefresh,
  isLoading = false,
  maxItems,
  canPost = true,
  canDelete = true,
  emptyState,
}: AnnouncementBoardProps) {
  const currentUser = useCurrentUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audienceRole, setAudienceRole] = useState<"all" | "employee" | "manager" | "hr">("all");
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        audienceRole,
        pinned,
        createdBy: currentUser.id,
      });
      setTitle("");
      setContent("");
      setPinned(false);
      onRefresh?.();
    } catch (error) {
      console.error("Failed to create announcement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement({ id });
      onRefresh?.();
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    }
  };

  const items = maxItems ? announcements.slice(0, maxItems) : announcements;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Megaphone className="h-5 w-5" />
          HR Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canPost && (
          <div className="grid gap-3">
            <Input
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Write the announcement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
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
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
                Pin to top
              </label>
              <Button onClick={handleCreate} disabled={isSubmitting || !title.trim() || !content.trim()}>
                {isSubmitting ? "Posting..." : "Post Announcement"}
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
                  {emptyState?.title || "No announcements yet"}
                </p>
                {emptyState?.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {emptyState.description}
                  </p>
                )}
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.pinned && <Badge variant="secondary">Pinned</Badge>}
                        <Badge variant="outline" className="text-xs">
                          {item.audienceRole}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                        {item.content}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
