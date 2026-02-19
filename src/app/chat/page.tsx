"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";

/**
 * Chat page — renders the Tambo chat interface.
 *
 * Providers (PersonaProvider + TamboProvider) are in the root layout
 * so tools have access to the current user's employeeId, managerId, and persona.
 */
export default function Home() {
  return (
    <div className="h-screen">
      <MessageThreadFull className="max-w-6xl mx-auto" />
    </div>
  );
}
