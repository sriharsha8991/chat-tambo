"use client";

import { ChatPage } from "@/components/layout/ChatPage";

/**
 * Zoho People Generative UI Workspace
 * 
 * A clean ChatGPT-style interface where users interact with an intelligent
 * HR assistant. The UI adapts based on the user's persona (Employee, Manager, HR Admin).
 *
 * Providers (PersonaProvider + TamboProvider) are in the root layout so
 * chat thread and persona state persist across page navigations.
 */
export default function Home() {
  return <ChatPage />;
}

