"use client";

import { AppShell } from "@/components/layout";
import { PersonaProvider } from "@/contexts/PersonaContext";
import { TamboWrapper } from "@/components/layout/TamboWrapper";

/**
 * Zoho People Generative UI Workspace
 * 
 * A persona-aware, intent-driven HR experience where users talk to the UI
 * and the UI adapts using pre-built components.
 */
export default function Home() {
  return (
    <PersonaProvider>
      <TamboWrapper>
        <AppShell />
      </TamboWrapper>
    </PersonaProvider>
  );
}
