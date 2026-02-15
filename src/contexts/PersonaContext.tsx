"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { PersonaRole, UserProfile, UserContext } from "@/types/hr";
import { apiGet } from "@/lib/api-client";

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
  
  return baseContext;
};

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [currentPersona, setCurrentPersona] = useState<PersonaRole>("employee");
  const [usersByRole, setUsersByRole] = useState<Record<PersonaRole, UserProfile | null>>({
    employee: null,
    manager: null,
    hr: null,
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userContextState, setUserContextState] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const employeesLoadedRef = React.useRef(false);

  useEffect(() => {
    // Skip re-fetching if already loaded
    if (employeesLoadedRef.current) {
      // Just switch persona with existing data
      const nextUser = usersByRole[currentPersona];
      if (nextUser) {
        setCurrentUser(nextUser);
        setUserContextState(getInitialUserContext(nextUser));
      }
      return;
    }

    let isMounted = true;

    const loadUsers = async () => {
      try {
        // Fetch only one representative per role (3 rows instead of all)
        const employees = await apiGet<Array<{
          id: string;
          employee_id?: string;
          employeeId?: string;
          name: string;
          email: string;
          role: "employee" | "manager" | "hr";
          department: string;
          manager_id?: string | null;
          managerId?: string | null;
        }>>("getPersonaUsers");
        const mapped = employees.map((employee) => ({
          id: employee.id,
          employeeId: employee.employeeId || employee.employee_id || employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          department: employee.department,
          managerId: employee.managerId || employee.manager_id || undefined,
          avatarUrl: undefined,
        }));

        const nextUsers: Record<PersonaRole, UserProfile | null> = {
          employee: mapped.find((user) => user.role === "employee") || null,
          manager: mapped.find((user) => user.role === "manager") || null,
          hr: mapped.find((user) => user.role === "hr") || null,
        };

        if (isMounted) {
          setUsersByRole(nextUsers);
          const initialUser = nextUsers[currentPersona] || mapped[0] || null;
          setCurrentUser(initialUser);
          setUserContextState(initialUser ? getInitialUserContext(initialUser) : null);
          employeesLoadedRef.current = true;
        }
      } catch (error) {
        console.error("Failed to load personas:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, [currentPersona]);

  const setPersona = useCallback((persona: PersonaRole) => {
    setCurrentPersona(persona);
    const nextUser = usersByRole[persona];
    if (nextUser) {
      setCurrentUser(nextUser);
      setUserContextState(getInitialUserContext(nextUser));
    }
  }, [usersByRole]);
  
  const updateUserContext = useCallback((updates: Partial<UserContext>) => {
    setUserContextState((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);
  
  const availablePersonas = useMemo<PersonaRole[]>(() => {
    const personaList: PersonaRole[] = ["employee", "manager", "hr"];
    return personaList.filter((persona) => Boolean(usersByRole[persona]));
  }, [usersByRole]);

  const value = useMemo<PersonaContextValue | null>(() => {
    if (!currentUser || !userContextState) return null;

    return {
      currentPersona,
      currentUser,
      setPersona,
      userContext: userContextState,
      updateUserContext,
      availablePersonas,
    };
  }, [currentPersona, currentUser, setPersona, userContextState, updateUserContext, availablePersonas]);

  if (isLoading || !value) {
    return <div className="p-6 text-sm text-muted-foreground">Loading personas...</div>;
  }

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
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
