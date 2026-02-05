"use client";

/**
 * @file Test Page
 * @description A test page to verify HR components work independently
 * without needing Tambo API authentication
 */

import { useState } from "react";
import { PersonaProvider, usePersona } from "@/contexts/PersonaContext";
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

// Mock data for testing components
const mockLeaveBalances = [
  { leaveType: "casual", totalDays: 12, usedDays: 3, remainingDays: 9, label: "Casual Leave" },
  { leaveType: "sick", totalDays: 10, usedDays: 2, remainingDays: 8, label: "Sick Leave" },
  { leaveType: "earned", totalDays: 15, usedDays: 5, remainingDays: 10, label: "Earned Leave" },
  { leaveType: "wfh", totalDays: 24, usedDays: 8, remainingDays: 16, label: "Work From Home" },
];

const mockRequests = [
  { id: "1", type: "leave" as const, title: "Casual Leave - 2 days", status: "pending" as const, details: "Family function", submittedAt: "2024-01-15" },
  { id: "2", type: "regularization" as const, title: "Missed checkout - Jan 10", status: "approved" as const, details: "Forgot to check out", submittedAt: "2024-01-11" },
  { id: "3", type: "wfh" as const, title: "WFH Request - Jan 20", status: "rejected" as const, details: "Internet issues", submittedAt: "2024-01-18" },
];

const mockAttendanceRecords = [
  { date: "2024-01-15", checkIn: "09:15", checkOut: "18:30", totalHours: "9h 15m", status: "present" as const },
  { date: "2024-01-14", checkIn: "09:00", checkOut: "18:00", totalHours: "9h 00m", status: "present" as const },
  { date: "2024-01-13", status: "holiday" as const, notes: "Makar Sankranti" },
  { date: "2024-01-12", checkIn: "10:00", checkOut: "16:00", totalHours: "6h 00m", status: "half_day" as const },
  { date: "2024-01-11", status: "wfh" as const, checkIn: "09:30", checkOut: "19:00", totalHours: "9h 30m" },
];

const mockApprovals = [
  { id: "1", type: "leave" as const, employeeId: "E001", employeeName: "Priya Sharma", department: "Engineering", title: "Sick Leave - 1 day", details: "Not feeling well", submittedAt: "2024-01-15T10:00:00Z", priority: "urgent" as const },
  { id: "2", type: "wfh" as const, employeeId: "E002", employeeName: "Amit Patel", department: "Engineering", title: "WFH Request - Jan 20", details: "Internet installation at home", submittedAt: "2024-01-14T14:30:00Z", priority: "normal" as const },
  { id: "3", type: "regularization" as const, employeeId: "E003", employeeName: "Sneha Reddy", department: "Engineering", title: "Missed checkout correction", details: "Forgot to check out yesterday", submittedAt: "2024-01-15T09:00:00Z", priority: "normal" as const },
];

const mockTeamMembers = [
  { id: "1", employeeId: "E001", name: "Priya Sharma", status: "available" as const, todayAttendance: { checkIn: "09:00" } },
  { id: "2", employeeId: "E002", name: "Amit Patel", status: "wfh" as const, todayAttendance: { checkIn: "09:30" } },
  { id: "3", employeeId: "E003", name: "Sneha Reddy", status: "on_leave" as const },
  { id: "4", employeeId: "E004", name: "Vikram Singh", status: "available" as const, todayAttendance: { checkIn: "08:45" } },
  { id: "5", employeeId: "E005", name: "Deepa Nair", status: "offline" as const },
];

const mockMetrics = {
  totalEmployees: 150,
  presentToday: 120,
  onLeave: 15,
  pendingApprovals: 23,
  complianceScore: 94,
  escalations: 2,
};

const mockPolicies = [
  { id: "1", title: "Leave Policy", category: "Leave", content: "Employees are entitled to 12 casual leaves, 10 sick leaves, and 15 earned leaves per year...", lastUpdated: "2024-01-01" },
  { id: "2", title: "Work From Home Guidelines", category: "WFH", content: "Employees may request up to 2 WFH days per week subject to manager approval...", lastUpdated: "2023-12-15" },
  { id: "3", title: "Attendance Rules", category: "Attendance", content: "Core working hours are 10 AM to 6 PM. Employees must maintain minimum 8 hours per day...", lastUpdated: "2023-11-20" },
];

const PERSONA_OPTIONS: { id: PersonaRole; label: string }[] = [
  { id: "employee", label: "Priya (Employee)" },
  { id: "manager", label: "Rajesh (Manager)" },
  { id: "hr", label: "Ananya (HR Admin)" },
];

function TestContent() {
  const { currentPersona, setPersona, currentUser } = usePersona();
  const [activeTab, setActiveTab] = useState<"employee" | "manager" | "hr">("employee");

  const tabs = [
    { id: "employee", label: "Employee View", roles: ["employee", "manager", "hr_admin"] },
    { id: "manager", label: "Manager View", roles: ["manager", "hr_admin"] },
    { id: "hr", label: "HR Admin View", roles: ["hr_admin"] },
  ];

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
                <LeaveBalanceCard balances={mockLeaveBalances} />
              </div>

              {/* Request Status List */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">RequestStatusList</h3>
                <RequestStatusList requests={mockRequests} maxHeight={300} />
              </div>
            </div>

            {/* Attendance Timeline - Full Width */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">AttendanceTimeline</h3>
              <AttendanceTimeline records={mockAttendanceRecords} />
            </div>

            {/* Leave Request Form */}
            <div className="bg-white rounded-lg shadow p-4 max-w-md">
              <h3 className="text-sm font-medium text-gray-500 mb-3">LeaveRequestForm</h3>
              <LeaveRequestForm balances={mockLeaveBalances} />
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
                <ApprovalQueue approvals={mockApprovals} />
              </div>

              {/* Team Overview */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">TeamOverview</h3>
                <TeamOverview members={mockTeamMembers} />
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
              <SystemDashboard metrics={mockMetrics} />
            </div>

            {/* Policy Viewer */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">PolicyViewer</h3>
              <PolicyViewer policies={mockPolicies} />
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
  return (
    <PersonaProvider>
      <TestContent />
    </PersonaProvider>
  );
}
