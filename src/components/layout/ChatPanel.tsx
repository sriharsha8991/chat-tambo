"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={`relative flex flex-col bg-white border-l transition-all duration-300 ${
        isExpanded ? "w-96" : "w-0"
      } ${className}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-10 top-1/2 -translate-y-1/2 h-20 w-10 bg-white border border-r-0 rounded-l-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm z-10"
        aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
      >
        {isExpanded ? (
          <ChevronRight className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <>
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">AI Assistant</h2>
                <p className="text-xs text-gray-500">Ask me anything about HR tasks</p>
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
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">How can I help you today?</p>
                <p className="text-xs mt-1">Try: "Apply for leave next Friday"</p>
              </div>
            </div>
          </ScrollArea>

          {/* Generation Stage */}
          <MessageGenerationStage className="px-4" />

          {/* Input */}
          <div className="p-4 border-t bg-gray-50">
            <MessageInput variant="bordered" className="bg-white">
              <MessageInputTextarea 
                placeholder="Ask about leave, attendance, approvals..." 
                className="min-h-[60px] resize-none"
              />
              <MessageInputToolbar>
                <MessageInputSubmitButton />
              </MessageInputToolbar>
            </MessageInput>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
