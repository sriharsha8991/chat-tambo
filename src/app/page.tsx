"use client";

import { PersonaProvider } from "@/contexts/PersonaContext";
import { TamboWrapper } from "@/components/layout/TamboWrapper";
import { ChatPage } from "@/components/layout/ChatPage";

/**
 * Zoho People Generative UI Workspace
 * 
 * A clean ChatGPT-style interface where users interact with an intelligent
 * HR assistant. The UI adapts based on the user's persona (Employee, Manager, HR Admin).
 */
export default function Home() {
  return (
    <PersonaProvider>
      <TamboWrapper>
        <ChatPage />
      </TamboWrapper>
    </PersonaProvider>
  );
}

