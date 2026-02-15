"use client";

import { PersonaProvider } from "@/contexts/PersonaContext";
import { TamboWrapper } from "@/components/layout/TamboWrapper";

/**
 * ClientProviders — wraps the app once at root level so that:
 * 1. PersonaContext & TamboProvider persist across page navigation
 * 2. Chat thread survives navigating between / and /dashboard
 * 3. Employee data is fetched once per session, not per page
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <PersonaProvider>
      <TamboWrapper>{children}</TamboWrapper>
    </PersonaProvider>
  );
}
