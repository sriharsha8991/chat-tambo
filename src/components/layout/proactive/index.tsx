"use client";

import { usePersona } from "@/contexts/PersonaContext";
import type { PersonaRole } from "@/types/hr";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { ManagerDashboard } from "./ManagerDashboard";
import { HRDashboard } from "./HRDashboard";
import { getGreeting } from "./shared";

const dashboards: Record<PersonaRole, React.ComponentType> = {
  employee: EmployeeDashboard,
  manager: ManagerDashboard,
  hr: HRDashboard,
};

export function ProactiveDashboard() {
  const { currentPersona, currentUser } = usePersona();
  const Dashboard = dashboards[currentPersona];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {currentUser.name.split(" ")[0]}!
          </h2>
          <p className="text-gray-500 mt-1">
            Here&apos;s what needs your attention today
          </p>
        </div>

        {/* Persona-specific Dashboard */}
        <Dashboard />
      </div>
    </div>
  );
}
