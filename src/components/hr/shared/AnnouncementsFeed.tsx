"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Megaphone } from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  audienceRole: string;
  pinned: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

interface AnnouncementsFeedProps {
  announcements: AnnouncementItem[];
  title?: string;
  maxHeight?: number;
  maxItems?: number;
  isLoading?: boolean;
  density?: "compact" | "comfortable";
  emptyState?: {
    title?: string;
    description?: string;
  };
}

export function AnnouncementsFeed({
  announcements = [],
  title = "Announcements",
  maxHeight = 360,
  maxItems,
  isLoading = false,
  density = "comfortable",
  emptyState,
}: AnnouncementsFeedProps) {
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

  const items = maxItems ? announcements.slice(0, maxItems) : announcements;
  const paddingClass = density === "compact" ? "p-2" : "p-3";

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Megaphone className="h-5 w-5" />
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
                <div key={item.id} className={"rounded-lg border " + paddingClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {item.pinned && <Badge variant="secondary">Pinned</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                        {item.content}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
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
