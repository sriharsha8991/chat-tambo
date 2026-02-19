"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
} from "@/components/tambo/message-input";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { MessageGenerationStage } from "@/components/tambo/message-generation-stage";
import { ChevronLeft, ChevronRight, MessageSquare, Sparkles } from "lucide-react";
import { useTamboThread } from "@tambo-ai/react";

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { thread } = useTamboThread();
  const hasMessages = (thread?.messages?.length ?? 0) > 0;

  return (
    <div
      className={`relative flex flex-col bg-background border-l border-border transition-all duration-300 ${
        isExpanded ? "w-96" : "w-0"
      } ${className}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-10 top-1/2 -translate-y-1/2 h-20 w-10 bg-background border border-border border-r-0 rounded-l-lg flex items-center justify-center hover:bg-muted transition-colors shadow-sm z-10"
        aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
      >
        {isExpanded ? (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <>
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">AI Assistant</h2>
                <p className="text-xs text-muted-foreground">Ask me anything about HR tasks</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              <ThreadContent variant="default">
                <ThreadContentMessages />
              </ThreadContent>
              
              {/* Welcome message when empty */}
              {!hasMessages && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-foreground/70">How can I help you today?</p>
                  <p className="text-xs mt-1">Try: &quot;Apply for leave next Friday&quot;</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Generation Stage */}
          <MessageGenerationStage className="px-4" />

          {/* Input */}
          <div className="p-4 border-t bg-muted/30">
            <MessageInput variant="bordered" className="bg-background">
              <MessageInputTextarea 
                placeholder="Ask about leave, attendance, approvals..." 
                className="min-h-[60px] resize-none"
              />
              <MessageInputToolbar>
                <MessageInputSubmitButton />
              </MessageInputToolbar>
            </MessageInput>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
