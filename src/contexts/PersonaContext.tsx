"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { PersonaRole, UserProfile, UserContext } from "@/types/hr";

// Mock users for each persona
const MOCK_USERS: Record<PersonaRole, UserProfile> = {
  employee: {
    id: "emp-001",
    employeeId: "ZP-1001",
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    role: "employee",
    department: "Engineering",
    managerId: "mgr-001",
    avatarUrl: undefined,
  },
  manager: {
    id: "mgr-001",
    employeeId: "ZP-0501",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@company.com",
    role: "manager",
    department: "Engineering",
    avatarUrl: undefined,
  },
  hr: {
    id: "hr-001",
    employeeId: "ZP-0101",
    name: "Ananya Patel",
    email: "ananya.patel@company.com",
    role: "hr",
    department: "Human Resources",
    avatarUrl: undefined,
  },
};

interface PersonaContextValue {
  // Current persona and user
  currentPersona: PersonaRole;
  currentUser: UserProfile;
  
  // Switch persona
  setPersona: (persona: PersonaRole) => void;
  
  // User context for proactive rendering
  userContext: UserContext;
  
  // Update user context (for state changes)
  updateUserContext: (updates: Partial<UserContext>) => void;
  
  // Available personas
  availablePersonas: PersonaRole[];
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

// Initial user context based on persona
const getInitialUserContext = (user: UserProfile): UserContext => {
  const now = new Date();
  const hour = now.getHours();
  const isWorkingHours = hour >= 9 && hour < 18;
  
  // Simulate different states for demo
  const baseContext: UserContext = {
    user,
    isCheckedInToday: false,
    hasMissedCheckout: false,
    pendingRequests: [],
    pendingApprovals: 0,
    escalations: 0,
    isWorkingHours,
    notifications: 0,
  };
  
  // Add role-specific mock state
  switch (user.role) {
    case "employee":
      return {
        ...baseContext,
        // Simulate: employee forgot to checkout yesterday
        hasMissedCheckout: true,
        missedCheckoutDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        isCheckedInToday: false,
        pendingRequests: [
          {
            id: "req-001",
            type: "leave",
            title: "Casual Leave - Feb 10",
            submittedAt: "2026-02-03T10:00:00Z",
            status: "pending",
            details: "Family function",
          },
        ],
        notifications: 2,
      };
      
    case "manager":
      return {
        ...baseContext,
        isCheckedInToday: true,
        pendingApprovals: 5,
        notifications: 5,
      };
      
    case "hr":
      return {
        ...baseContext,
        isCheckedInToday: true,
        escalations: 3,
        pendingApprovals: 12,
        notifications: 8,
      };
      
    default:
      return baseContext;
  }
};

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [currentPersona, setCurrentPersona] = useState<PersonaRole>("employee");
  const [userContextState, setUserContextState] = useState<UserContext>(() => 
    getInitialUserContext(MOCK_USERS.employee)
  );
  
  const currentUser = MOCK_USERS[currentPersona];
  
  const setPersona = useCallback((persona: PersonaRole) => {
    setCurrentPersona(persona);
    setUserContextState(getInitialUserContext(MOCK_USERS[persona]));
  }, []);
  
  const updateUserContext = useCallback((updates: Partial<UserContext>) => {
    setUserContextState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const value = useMemo<PersonaContextValue>(() => ({
    currentPersona,
    currentUser,
    setPersona,
    userContext: userContextState,
    updateUserContext,
    availablePersonas: ["employee", "manager", "hr"],
  }), [currentPersona, currentUser, setPersona, userContextState, updateUserContext]);
  
  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
}

// Hook to get just the current user (for components that only need user info)
export function useCurrentUser() {
  const { currentUser } = usePersona();
  return currentUser;
}

// Hook to get user context (for proactive rendering)
export function useUserContext() {
  const { userContext, updateUserContext } = usePersona();
  return { userContext, updateUserContext };
}
