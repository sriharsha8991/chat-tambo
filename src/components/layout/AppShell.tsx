"use client";

import { TopBar } from "./TopBar";
import { ChatPanel } from "./ChatPanel";
import { ProactiveDashboard } from "./ProactiveDashboard";

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dashboard / Main Content */}
        {children || <ProactiveDashboard />}

        {/* Chat Panel */}
        <ChatPanel />
      </div>
    </div>
  );
}

// Export all layout components
export { TopBar } from "./TopBar";
export { ChatPanel } from "./ChatPanel";
export { ProactiveDashboard } from "./ProactiveDashboard";
