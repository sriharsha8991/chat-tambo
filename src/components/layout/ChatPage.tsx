"use client";

import * as React from "react";
import { usePersona } from "@/contexts/PersonaContext";
import { getSuggestionsForPersona } from "@/lib/tambo";
import { ComponentsSidebar } from "./ComponentsSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageInput,
  MessageInputError,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import { ThreadContainer } from "@/components/tambo/thread-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
} from "@/components/tambo/thread-history";
import { NotifierBell } from "@/components/layout/NotifierBell";
import { useTambo } from "@tambo-ai/react";
import {
  ChevronDown,
  User,
  Users,
  Building2,
  Sparkles,
  PanelRightClose,
  PanelRight,
  History,
  MessageCircle,
  FileText,
  ClipboardList,
} from "lucide-react";

const personaConfig = {
  employee: {
    label: "Employee",
    icon: User,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    gradient: "from-blue-500 to-cyan-500",
  },
  manager: {
    label: "Manager",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    gradient: "from-purple-500 to-pink-500",
  },
  hr: {
    label: "HR Admin",
    icon: Building2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    gradient: "from-emerald-500 to-teal-500",
  },
};

interface ChatPageProps {
  showSidebar?: boolean;
}

export function ChatPage({ showSidebar = true }: ChatPageProps) {
  const { currentPersona, currentUser, setPersona, availablePersonas } = usePersona();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tambo = useTambo();
  const prevPersonaRef = React.useRef(currentPersona);

  // Get persona-specific suggestions
  const starterSuggestions = getSuggestionsForPersona(currentPersona);

  const config = personaConfig[currentPersona];
  const PersonaIcon = config.icon;

  // Check if thread has messages
  const hasMessages = tambo?.thread?.messages && tambo.thread.messages.length > 0;

  const quickActions = React.useMemo(() => {
    if (currentPersona === "manager") {
      return [
        {
          label: "Pending approvals",
          description: "Review team requests",
          prompt: "Show my pending approvals",
          icon: ClipboardList,
        },
        {
          label: "Team status",
          description: "See who is working",
          prompt: "Show my team's status today",
          icon: Users,
        },
        {
          label: "Team metrics",
          description: "Attendance overview",
          prompt: "Show team attendance metrics",
          icon: PanelRight,
        },
        {
          label: "Salary slips",
          description: "Download monthly slips",
          prompt: "Download my salary slip for this month",
          icon: FileText,
        },
      ];
    }

    if (currentPersona === "hr") {
      return [
        {
          label: "HR dashboard",
          description: "System health & metrics",
          prompt: "Show the HR system dashboard",
          icon: Sparkles,
        },
        {
          label: "Policies",
          description: "Search HR policies",
          prompt: "Show me the company policies",
          icon: Building2,
        },
        {
          label: "HR analytics",
          description: "Headcount trends",
          prompt: "Show HR analytics for headcount trends",
          icon: PanelRight,
        },
        {
          label: "Salary slips",
          description: "Download monthly slips",
          prompt: "Download my salary slip for this month",
          icon: FileText,
        },
      ];
    }

    return [
      {
        label: "Check in",
        description: "Start your day",
        prompt: "Check me in for today",
        icon: Sparkles,
      },
      {
        label: "Leave balance",
        description: "View your balance",
        prompt: "Show my leave balance",
        icon: PanelRight,
      },
      {
        label: "Apply leave",
        description: "Request time off",
        prompt: "I want to apply for leave",
        icon: PanelRightClose,
      },
      {
        label: "Salary slip",
        description: "Download monthly slip",
        prompt: "Download my salary slip for this month",
        icon: FileText,
      },
    ];
  }, [currentPersona]);

  React.useEffect(() => {
    if (prevPersonaRef.current !== currentPersona) {
      prevPersonaRef.current = currentPersona;
      if (tambo?.startNewThread) {
        void tambo.startNewThread();
      }
      window.dispatchEvent(new CustomEvent("hr-data-updated"));
    }
  }, [currentPersona, tambo]);

  // Handle component click from sidebar
  const handleComponentClick = (componentName: string) => {
    const componentPrompts: Record<string, string> = {
      "Check In/Out": "Check me in for today",
      "Leave Balance": "Show my leave balance",
      "Leave Request": "I want to apply for leave",
      "Request Status": "Show my pending requests",
      "Attendance History": "Show my attendance history for this week",
      "Regularization": "I need to regularize my attendance",
      "Approval Queue": "Show my pending approvals",
      "Team Overview": "Show my team's status today",
      "Approval Detail": "Show me the details of pending approvals",
      "HR Dashboard": "Show the HR system dashboard",
      "Policy Viewer": "Show me the company policies",
      "Attendance Trends": "Show attendance trends for this week",
      "Leave Analytics": "Show leave analytics distribution",
      "Team Metrics": "Show team attendance metrics",
      "HR Analytics": "Show HR analytics for headcount trends",
      "Salary Slip": "Download my salary slip for this month",
    };

    const prompt = componentPrompts[componentName];
    if (prompt && tambo?.sendThreadMessage) {
      tambo.sendThreadMessage(prompt, { streamResponse: true });
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    if (tambo?.sendThreadMessage) {
      tambo.sendThreadMessage(suggestion, { streamResponse: true });
    }
  };

  // Thread History Sidebar
  const threadHistorySidebar = historyOpen && (
    <div className="w-72 border-r border-border bg-muted/30">
      <ThreadHistory position="left">
        <ThreadHistoryHeader />
        <ThreadHistoryNewButton />
        <ThreadHistorySearch />
        <ThreadHistoryList />
      </ThreadHistory>
    </div>
  );

  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Minimal Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* History Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="h-9 w-9 hover:bg-muted"
          >
            <History className={cn("h-5 w-5 transition-colors", historyOpen && "text-primary")} />
          </Button>

          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/80 shadow-sm">
              <img
                src="/zoho-assistant.svg"
                alt="Zoho Assistant logo"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-black via-neutral-700 to-zinc-800 bg-clip-text text-transparent">
                Zoho People AI
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotifierBell />
          {/* Persona Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 pl-2 pr-3 h-10 border-border/50 hover:bg-muted/50">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className={cn(config.bgColor, config.color, "text-xs font-bold")}>
                    {currentUser.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium leading-tight">{currentUser.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{config.label}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Switch Persona</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availablePersonas.map((persona) => {
                const pConfig = personaConfig[persona];
                const PIcon = pConfig.icon;
                return (
                  <DropdownMenuItem
                    key={persona}
                    onClick={() => setPersona(persona)}
                    className={cn(
                      "gap-3 cursor-pointer py-3",
                      currentPersona === persona && "bg-muted"
                    )}
                  >
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", pConfig.bgColor)}>
                      <PIcon className={cn("h-5 w-5", pConfig.color)} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{pConfig.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {persona === "employee" && "Amit Patel • Engineering"}
                        {persona === "manager" && "Rajesh Kumar • Engineering Lead"}
                        {persona === "hr" && "Ananya Patel • HR Department"}
                      </span>
                    </div>
                    {currentPersona === persona && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Components Sidebar Toggle */}
          {showSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-9 w-9 hover:bg-muted"
            >
              {sidebarOpen ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRight className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thread History */}
        {threadHistorySidebar}

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          <ThreadContainer
            ref={containerRef}
            disableSidebarSpacing
            className="flex-1"
          >
            <ScrollableMessageContainer className="p-4">
              <div className="mx-auto max-w-3xl">
                {/* Welcome Section - Only show when no messages */}
                {!hasMessages && (
                  <div className="relative flex flex-col items-center justify-center py-12 text-center animate-in fade-in-50 duration-500">
                    <div className="absolute inset-0 -z-10">
                      <div className="pointer-events-none absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 to-transparent blur-3xl" />
                      <div className="pointer-events-none absolute right-8 top-24 h-28 w-28 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-2xl" />
                    </div>

                    {/* Welcome Text */}
                    <div className="mb-6 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        <PersonaIcon className={cn("h-3.5 w-3.5", config.color)} />
                        {config.label} workspace • Ready for actions
                      </div>
                      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                        Hello, {currentUser.name.split(" ")[0]}! 👋
                      </h1>
                      <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
                        Tell me what you need. I will instantly render the right HR UI and guide
                        you to completion without navigating menus.
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-6 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
                      {quickActions.map((action, index) => {
                        const ActionIcon = action.icon;
                        return (
                          <button
                            key={action.label}
                            onClick={() => handleSuggestionClick(action.prompt)}
                            className={cn(
                              "group flex items-center justify-between rounded-2xl border border-border/50 bg-background/60 p-4 text-left",
                              "transition-all duration-200 hover:border-primary/30 hover:bg-background",
                              "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
                              "animate-in fade-in-50 slide-in-from-bottom-4",
                            )}
                            style={{ animationDelay: `${index * 80}ms` }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60",
                                config.bgColor
                              )}>
                                <ActionIcon className={cn("h-5 w-5", config.color)} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                                <p className="text-xs text-muted-foreground">{action.description}</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground group-hover:text-primary">
                              Ask
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Suggestion Cards removed to keep landing focused */}
                  </div>
                )}

                {/* Messages */}
                <ThreadContent>
                  <ThreadContentMessages />
                </ThreadContent>
              </div>
            </ScrollableMessageContainer>

            {/* Message input */}
            <div className="mx-auto w-full max-w-3xl px-4 pb-6">
              <MessageInput className="rounded-2xl border border-border/50 bg-background shadow-xl shadow-black/5 transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-2xl focus-within:shadow-primary/10">
                <MessageInputTextarea
                  placeholder={`Message Zoho People AI...`}
                  className="min-h-[56px] resize-none border-0 bg-transparent px-4 py-4 text-base focus-visible:ring-0 placeholder:text-muted-foreground/60"
                />
                <MessageInputToolbar className="px-3 pb-3">
                  <div className="flex-1 text-xs text-muted-foreground">
                    Press Enter to send
                  </div>
                  <MessageInputSubmitButton className={cn(
                    "h-10 w-10 rounded-xl bg-gradient-to-r text-white shadow-lg transition-all duration-200",
                    "hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100",
                    config.gradient
                  )} />
                </MessageInputToolbar>
                <MessageInputError />
              </MessageInput>

              {/* Powered by text */}
              <p className="mt-3 text-center text-xs text-muted-foreground/60">
                Powered by <span className="font-medium text-muted-foreground">Tambo AI</span> • Your intelligent HR companion
              </p>
            </div>
          </ThreadContainer>
        </div>

        {/* Components Sidebar */}
        {showSidebar && sidebarOpen && (
          <ComponentsSidebar 
            onComponentClick={handleComponentClick}
            className="shrink-0"
          />
        )}
      </div>
    </div>
  );
}
