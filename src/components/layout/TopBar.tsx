"use client";

import { usePersona } from "@/contexts/PersonaContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Bell, ChevronDown, Settings, User, Users, Shield } from "lucide-react";
import type { PersonaRole } from "@/types/hr";
import { useEffect, useMemo, useState } from "react";
import { getNotifications, markNotificationRead } from "@/services/hr-api-client";

const personaConfig: Record<PersonaRole, { label: string; icon: React.ReactNode; color: string }> = {
  employee: {
    label: "Employee",
    icon: <User className="h-4 w-4" />,
    color: "bg-blue-500",
  },
  manager: {
    label: "Manager",
    icon: <Users className="h-4 w-4" />,
    color: "bg-purple-500",
  },
  hr: {
    label: "HR Admin",
    icon: <Shield className="h-4 w-4" />,
    color: "bg-emerald-500",
  },
};

export function TopBar() {
  const { currentPersona, currentUser, setPersona, availablePersonas } = usePersona();
  const config = personaConfig[currentPersona];
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
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
          <span className="text-white font-bold text-sm">ZP</span>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Zoho People</h1>
          <p className="text-xs text-gray-500">Generative Workspace</p>
        </div>
      </div>

      {/* Center - Persona Indicator */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 py-1 px-3">
          <span className={`h-2 w-2 rounded-full ${config.color}`} />
          <span className="font-medium">{config.label} View</span>
        </Badge>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
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
            <ScrollArea className="max-h-[320px]">
              <div className="px-2 pb-2">
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

        {/* Persona Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className={`${config.color} text-white text-xs`}>
                  {currentUser.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{currentUser.name}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
                <p className="text-xs text-gray-400">{currentUser.employeeId} • {currentUser.department}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
              Switch Persona
            </DropdownMenuLabel>
            {availablePersonas.map((persona) => {
              const pConfig = personaConfig[persona];
              return (
                <DropdownMenuItem
                  key={persona}
                  onClick={() => setPersona(persona)}
                  className={currentPersona === persona ? "bg-gray-100" : ""}
                >
                  <span className={`h-2 w-2 rounded-full ${pConfig.color} mr-2`} />
                  {pConfig.label}
                  {currentPersona === persona && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
