"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { PersonaProvider } from "@/contexts/PersonaContext";
import { TamboWrapper } from "@/components/layout/TamboWrapper";

/**
 * Chat page — renders the Tambo chat interface with persona context.
 *
 * Wrapped in PersonaProvider + TamboWrapper so that tools have access
 * to the current user's employeeId, managerId, and persona.
 */
export default function Home() {
  return (
    <PersonaProvider>
      <TamboWrapper>
        <div className="h-screen">
          <MessageThreadFull className="max-w-6xl mx-auto" />
        </div>
      </TamboWrapper>
    </PersonaProvider>
  );
}
