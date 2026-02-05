"use client";

import { usePersona } from "@/contexts/PersonaContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, Settings, User, Users, Shield } from "lucide-react";
import type { PersonaRole } from "@/types/hr";

const personaConfig: Record<PersonaRole, { label: string; icon: React.ReactNode; color: string }> = {
  employee: {
    label: "Employee",
    icon: <User className="h-4 w-4" />,
    color: "bg-blue-500",
  },
  manager: {
    label: "Manager",
    icon: <Users className="h-4 w-4" />,
    color: "bg-purple-500",
  },
  hr: {
    label: "HR Admin",
    icon: <Shield className="h-4 w-4" />,
    color: "bg-emerald-500",
  },
};

export function TopBar() {
  const { currentPersona, currentUser, setPersona, availablePersonas, userContext } = usePersona();
  const config = personaConfig[currentPersona];

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
          <span className="text-white font-bold text-sm">ZP</span>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Zoho People</h1>
          <p className="text-xs text-gray-500">Generative Workspace</p>
        </div>
      </div>

      {/* Center - Persona Indicator */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 py-1 px-3">
          <span className={`h-2 w-2 rounded-full ${config.color}`} />
          <span className="font-medium">{config.label} View</span>
        </Badge>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {userContext.notifications > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {userContext.notifications}
            </span>
          )}
        </Button>

        {/* Persona Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className={`${config.color} text-white text-xs`}>
                  {currentUser.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{currentUser.name}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
                <p className="text-xs text-gray-400">{currentUser.employeeId} • {currentUser.department}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
              Switch Persona
            </DropdownMenuLabel>
            {availablePersonas.map((persona) => {
              const pConfig = personaConfig[persona];
              return (
                <DropdownMenuItem
                  key={persona}
                  onClick={() => setPersona(persona)}
                  className={currentPersona === persona ? "bg-gray-100" : ""}
                >
                  <span className={`h-2 w-2 rounded-full ${pConfig.color} mr-2`} />
                  {pConfig.label}
                  {currentPersona === persona && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
