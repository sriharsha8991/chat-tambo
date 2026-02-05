"use client";

import { TamboProvider } from "@tambo-ai/react";
import { components, tools } from "@/lib/tambo";
import { usePersona } from "@/contexts/PersonaContext";
import { useMemo } from "react";

interface TamboWrapperProps {
  children: React.ReactNode;
}

/**
 * TamboWrapper - Wraps children with TamboProvider and passes persona context
 * 
 * This component must be inside PersonaProvider to access the current user's
 * information and pass it to Tambo as contextHelpers.
 */
export function TamboWrapper({ children }: TamboWrapperProps) {
  const { currentUser, currentPersona, userContext } = usePersona();

  // Create context helpers that provide user info to every message
  const contextHelpers = useMemo(() => ({
    current_user: () => ({
      employeeId: currentUser.employeeId,
      userId: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      department: currentUser.department,
      managerId: currentUser.managerId,
    }),
    user_context: () => ({
      isCheckedInToday: userContext.isCheckedInToday,
      hasMissedCheckout: userContext.hasMissedCheckout,
      missedCheckoutDate: userContext.missedCheckoutDate,
      pendingApprovals: userContext.pendingApprovals,
      escalations: userContext.escalations,
      isWorkingHours: userContext.isWorkingHours,
      notifications: userContext.notifications,
    }),
    current_time: () => {
      const now = new Date();
      return {
        date: now.toISOString().split("T")[0],
        time: now.toLocaleTimeString("en-IN", { hour12: true }),
        dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
        timestamp: now.toISOString(),
      };
    },
    persona_info: () => ({
      currentPersona,
      canViewTeam: currentPersona === "manager" || currentPersona === "hr",
      canApprove: currentPersona === "manager" || currentPersona === "hr",
      canViewSystemDashboard: currentPersona === "hr",
      canManagePolicies: currentPersona === "hr",
    }),
  }), [currentUser, currentPersona, userContext]);

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY || "demo-key"}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      contextHelpers={contextHelpers}
    >
      {children}
    </TamboProvider>
  );
}
