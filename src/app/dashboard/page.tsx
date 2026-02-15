"use client";

import { PinnedDashboard } from "@/components/layout/PinnedDashboard";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Personal Dashboard Page
 *
 * Renders all pinned widgets in a drag-and-drop grid layout.
 * Each widget fetches live data via useLiveQuery so data stays fresh.
 *
 * Providers (PersonaProvider + TamboProvider) are in the root layout so
 * chat thread is shared with the main chat page.
 */
export default function DashboardPage() {
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
