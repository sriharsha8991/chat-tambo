"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications, markNotificationRead } from "@/services/hr-api-client";
import { usePersona } from "@/contexts/PersonaContext";

export function NotifierBell() {
  const { currentPersona, currentUser } = usePersona();
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const refreshNotifications = async () => {
    setIsLoading(true);
    try {
      const results = await getNotifications({
        employeeId: currentUser.employeeId,
        role: currentPersona,
      });
      setNotifications(results);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const handleRefresh = () => refreshNotifications();
    window.addEventListener("hr-data-updated", handleRefresh);
    return () => window.removeEventListener("hr-data-updated", handleRefresh);
  }, [currentUser.employeeId, currentPersona]);

  const handleMarkRead = async (notificationId: string) => {
    try {
      await markNotificationRead({ notificationId });
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item
        )
      );
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const item of unread) {
      await handleMarkRead(item.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[320px] w-full">
          <div className="px-2 pb-2 pr-3">
            {isLoading ? (
              <div className="space-y-2 py-2">
                {[...Array(3)].map((_, index) => (
                  <div key={`loading-${index}`} className="rounded-md border p-2">
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="flex flex-col items-start gap-1 rounded-md border p-2 mb-2 cursor-pointer"
                  onClick={() => handleMarkRead(item.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium">
                      {item.title}
                    </span>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
