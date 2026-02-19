"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, Mail, Building2 } from "lucide-react";
import { useLiveQuery } from "@/hooks/useLiveQuery";

// ── Schema ─────────────────────────────────────────────────

export const employeeDirectorySchema = z.object({
  department: z
    .string()
    .optional()
    .describe("Filter employees by department name"),
  role: z
    .enum(["employee", "manager", "hr"])
    .optional()
    .describe("Filter by role"),
  maxItems: z
    .number()
    .optional()
    .describe("Maximum number of employees to display (default: all)"),
});

export type EmployeeDirectoryProps = z.infer<typeof employeeDirectorySchema>;

// ── Types ──────────────────────────────────────────────────

interface Employee {
  id: string;
  employee_id?: string;
  employeeId?: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "hr";
  department: string;
}

// ── Helpers ────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_COLOR: Record<string, string> = {
  hr: "bg-purple-100 text-purple-800",
  manager: "bg-blue-100 text-blue-800",
  employee: "bg-emerald-100 text-emerald-800",
};

const AVATAR_BG: Record<string, string> = {
  hr: "bg-purple-200 text-purple-700",
  manager: "bg-blue-200 text-blue-700",
  employee: "bg-emerald-200 text-emerald-700",
};

// ── Component ──────────────────────────────────────────────

export function EmployeeDirectory({
  department,
  role,
  maxItems,
}: EmployeeDirectoryProps) {
  const [search, setSearch] = useState("");

  const { data: allEmployees, isLoading } = useLiveQuery<Employee[]>(
    "allEmployees",
    {},
  );

  const filtered = useMemo(() => {
    let list = allEmployees ?? [];

    if (department) {
      list = list.filter(
        (e) => e.department?.toLowerCase() === department.toLowerCase(),
      );
    }
    if (role) {
      list = list.filter((e) => e.role === role);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department?.toLowerCase().includes(q) ||
          (e.employee_id ?? e.employeeId ?? "").toLowerCase().includes(q),
      );
    }
    if (maxItems) {
      list = list.slice(0, maxItems);
    }
    return list;
  }, [allEmployees, department, role, search, maxItems]);

  // Group by department
  const grouped = useMemo(() => {
    const map = new Map<string, Employee[]>();
    for (const e of filtered) {
      const dept = e.department ?? "Other";
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(e);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Employee Directory
          </CardTitle>
          <Badge variant="secondary">{filtered.length} people</Badge>
        </div>
        {/* Search bar */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto space-y-6">
        {isLoading && (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No employees found.
          </p>
        )}
        {grouped.map(([dept, employees]) => (
          <div key={dept}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {dept}
              </h3>
              <Badge variant="outline" className="text-xs">
                {employees.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className={AVATAR_BG[emp.role] ?? "bg-gray-200"}>
                    <AvatarFallback className="text-sm font-medium">
                      {initials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {emp.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${ROLE_COLOR[emp.role] ?? ""}`}
                      >
                        {emp.role}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {emp.employee_id ?? emp.employeeId}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
