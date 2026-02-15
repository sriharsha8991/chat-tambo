"use client";

/**
 * @file Test Page
 * @description A test page to verify HR components work independently
 * without needing Tambo API authentication
 */

import { useEffect, useState } from "react";
import { usePersona } from "@/contexts/PersonaContext";
import type { PersonaRole } from "@/types/hr";
import {
  CheckInOutCard,
  LeaveBalanceCard,
  LeaveRequestForm,
  RequestStatusList,
  AttendanceTimeline,
  ApprovalQueue,
  TeamOverview,
  SystemDashboard,
  PolicyViewer,
} from "@/components/hr";

import {
  getAttendanceStatus,
  getLeaveBalance,
  getRequestStatus,
  getPendingApprovals,
  getTeamMembers,
  getSystemMetrics,
  searchPolicies,
} from "@/services/hr-api-client";

const PERSONA_OPTIONS: { id: PersonaRole; label: string }[] = [
  { id: "employee", label: "Employee" },
  { id: "manager", label: "Manager" },
  { id: "hr", label: "HR Admin" },
];

function TestContent() {
  const { currentPersona, setPersona, currentUser } = usePersona();
  const [activeTab, setActiveTab] = useState<"employee" | "manager" | "hr">("employee");
  const [leaveBalances, setLeaveBalances] = useState<Awaited<ReturnType<typeof getLeaveBalance>>>([]);
  const [requests, setRequests] = useState<Awaited<ReturnType<typeof getRequestStatus>>>([]);
  const [attendance, setAttendance] = useState<Awaited<ReturnType<typeof getAttendanceStatus>> | null>(null);
  const [approvals, setApprovals] = useState<Awaited<ReturnType<typeof getPendingApprovals>>>([]);
  const [teamMembers, setTeamMembers] = useState<Awaited<ReturnType<typeof getTeamMembers>>>([]);
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof getSystemMetrics>> | null>(null);
  const [policies, setPolicies] = useState<Awaited<ReturnType<typeof searchPolicies>>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: "employee", label: "Employee View", roles: ["employee", "manager", "hr_admin"] },
    { id: "manager", label: "Manager View", roles: ["manager", "hr_admin"] },
    { id: "hr", label: "HR Admin View", roles: ["hr_admin"] },
  ];

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.employeeId) return;
      setIsLoading(true);

      try {
        if (activeTab === "employee") {
          const [balances, reqs, att] = await Promise.all([
            getLeaveBalance({ employeeId: currentUser.employeeId }),
            getRequestStatus({ employeeId: currentUser.employeeId }),
            getAttendanceStatus({ employeeId: currentUser.employeeId }),
          ]);
          setLeaveBalances(balances);
          setRequests(reqs);
          setAttendance(att);
        }

        if (activeTab === "manager") {
          const [apprs, team] = await Promise.all([
            getPendingApprovals({ managerId: currentUser.employeeId }),
            getTeamMembers({ managerId: currentUser.employeeId }),
          ]);
          setApprovals(apprs);
          setTeamMembers(team);
        }

        if (activeTab === "hr") {
          const [systemMetrics, policyResults] = await Promise.all([
            getSystemMetrics(),
            searchPolicies({ query: "" }),
          ]);
          setMetrics(systemMetrics);
          setPolicies(policyResults);
        }
      } catch (error) {
        console.error("Failed to load test data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [activeTab, currentUser]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🧪 Component Test Page</h1>
            <p className="text-sm text-gray-500 mt-1">
              Test HR components without Tambo API - Verify UI works correctly
            </p>
          </div>
          
          {/* Persona Switcher */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Persona:</span>
            <select
              value={currentPersona}
              onChange={(e) => setPersona(e.target.value as PersonaRole)}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              {PERSONA_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">({currentUser.name})</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === "employee" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Employee Components</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Check In/Out Card */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">CheckInOutCard</h3>
                <CheckInOutCard
                  status="not_checked_in"
                  checkInTime={undefined}
                />
              </div>

              {/* Leave Balance Card */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">LeaveBalanceCard</h3>
                <LeaveBalanceCard balances={leaveBalances} />
              </div>

              {/* Request Status List */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">RequestStatusList</h3>
                <RequestStatusList requests={requests} maxHeight={300} />
              </div>
            </div>

            {/* Attendance Timeline - Full Width */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">AttendanceTimeline</h3>
              <AttendanceTimeline
                records={attendance?.records.map(r => ({
                  date: r.date,
                  checkIn: r.checkIn,
                  checkOut: r.checkOut,
                  totalHours: r.hoursWorked ? `${r.hoursWorked}h` : undefined,
                  status: r.status as "present" | "absent" | "half_day" | "wfh" | "on_leave" | "holiday" | "regularization_pending",
                })) || []}
              />
            </div>

            {/* Leave Request Form */}
            <div className="bg-white rounded-lg shadow p-4 max-w-md">
              <h3 className="text-sm font-medium text-gray-500 mb-3">LeaveRequestForm</h3>
              <LeaveRequestForm balances={leaveBalances} />
            </div>
          </div>
        )}

        {activeTab === "manager" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Manager Components</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Approval Queue */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">ApprovalQueue</h3>
                <ApprovalQueue approvals={approvals} />
              </div>

              {/* Team Overview */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">TeamOverview</h3>
                <TeamOverview members={teamMembers} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "hr" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">HR Admin Components</h2>
            
            {/* System Dashboard */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">SystemDashboard</h3>
              {metrics && <SystemDashboard metrics={metrics} />}
            </div>

            {/* Policy Viewer */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">PolicyViewer</h3>
              <PolicyViewer
                policies={policies}
                onSearch={async (query) => {
                  const results = await searchPolicies({ query });
                  setPolicies(results);
                }}
              />
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900">📋 How This Relates to Agentic UI</h3>
          <p className="text-sm text-blue-800 mt-2">
            These components are registered with Tambo in <code className="bg-blue-100 px-1 rounded">src/lib/tambo.ts</code>.
            When you have a valid API key, the AI agent can:
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
            <li>Analyze user intent from chat messages</li>
            <li>Call tools like <code className="bg-blue-100 px-1 rounded">getLeaveBalance</code> to fetch data</li>
            <li>Dynamically render these components with the fetched data</li>
            <li>The UI adapts based on conversation context</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function TestPage() {
  return <TestContent />;
}
