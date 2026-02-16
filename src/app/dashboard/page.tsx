"use client";

import { PersonaProvider } from "@/contexts/PersonaContext";
import { TamboWrapper } from "@/components/layout/TamboWrapper";
import { PinnedDashboard } from "@/components/layout/PinnedDashboard";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Personal Dashboard Page
 *
 * Renders all pinned widgets in a drag-and-drop grid layout.
 * Each widget fetches live data via useLiveQuery so data stays fresh.
 *
 * Shares the same PersonaProvider + TamboWrapper context as the chat page.
 */
export default function DashboardPage() {
  return (
    <PersonaProvider>
      <TamboWrapper>
        <DashboardContent />
      </TamboWrapper>
    </PersonaProvider>
  );
}

function DashboardContent() {
  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto py-4">
          <PinnedDashboard />
        </div>
      </div>
    </AppShell>
  );
}
