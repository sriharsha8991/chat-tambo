"use client";

import { useState, useEffect, useCallback } from "react";
import { usePersona, useUserContext } from "@/contexts/PersonaContext";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle, 
  FileText,
  TrendingUp,
  Bell,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PersonaRole } from "@/types/hr";

// Import HR Components
import {
  CheckInOutCard,
  LeaveBalanceCard,
  RequestStatusList,
  AttendanceTimeline,
  ApprovalQueue,
  TeamOverview,
  SystemDashboard,
  PolicyViewer,
  AnnouncementsFeed,
  DocumentsAcknowledgeList,
  AnnouncementBoard,
  DocumentCenter,
  PolicyManager,
} from "@/components/hr";

// Import API client (uses fetch, works in browser)
import {
  getAttendanceStatus,
  getLeaveBalance,
  getRequestStatus,
  getPendingApprovals,
  getTeamMembers,
  getSystemMetrics,
  getPolicies,
  getAnnouncements,
  getDocuments,
  getAcknowledgedDocumentIds,
  acknowledgeDocument,
} from "@/services/hr-api-client";

// Import real-time hook for Supabase subscriptions
import { useRealtimeHR } from "@/lib/use-realtime-hr";

function ProactiveAlert({ type, title, message }: { type: "warning" | "info"; title: string; message: string }) {
  return (
    <Alert variant={type === "warning" ? "destructive" : "default"} className="mb-4">
      {type === "warning" ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// Employee Dashboard
function EmployeeDashboard() {
  const { userContext } = useUserContext();
  const { currentUser } = usePersona();
  
  const [leaveBalances, setLeaveBalances] = useState<Awaited<ReturnType<typeof getLeaveBalance>>>([]);
  const [requests, setRequests] = useState<Awaited<ReturnType<typeof getRequestStatus>>>([]);
  const [attendance, setAttendance] = useState<Awaited<ReturnType<typeof getAttendanceStatus>> | null>(null);
  const [announcements, setAnnouncements] = useState<Awaited<ReturnType<typeof getAnnouncements>>>([]);
  const [documents, setDocuments] = useState<Awaited<ReturnType<typeof getDocuments>>>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const [balances, reqs, att, ann, docs, ackIds] = await Promise.all([
        getLeaveBalance({ employeeId: currentUser.employeeId }),
        getRequestStatus({ employeeId: currentUser.employeeId }),
        getAttendanceStatus({ employeeId: currentUser.employeeId }),
        getAnnouncements({ role: currentUser.role }),
        getDocuments({ role: currentUser.role }),
        getAcknowledgedDocumentIds({ employeeId: currentUser.employeeId }),
      ]);
      setLeaveBalances(balances);
      setRequests(reqs);
      setAttendance(att);
      setAnnouncements(ann);
      setDocuments(docs);
      setAcknowledgedIds(ackIds);
    } catch (error) {
      console.error("Failed to fetch employee data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser.employeeId, currentUser.role]);

  // Real-time subscriptions for Supabase
  useRealtimeHR({
    employeeId: currentUser.employeeId,
    onLeaveRequestChange: () => fetchData(true),
    onAttendanceChange: () => fetchData(true),
    onNotificationChange: () => fetchData(true),
  });

  useEffect(() => {
    fetchData();
    
    // Auto-refresh when window gains focus
    const handleFocus = () => fetchData(true);
    window.addEventListener("focus", handleFocus);
    
    // Listen for custom refresh event (from chat actions)
    const handleRefresh = () => fetchData(true);
    window.addEventListener("hr-data-updated", handleRefresh);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("hr-data-updated", handleRefresh);
    };
  }, [fetchData]);

  const totalLeaveRemaining = leaveBalances.reduce((sum, b) => sum + b.remainingDays, 0);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  const handleAcknowledge = async (documentId: string) => {
    try {
      await acknowledgeDocument({ employeeId: currentUser.employeeId, documentId });
      setAcknowledgedIds((prev) => [...new Set([...prev, documentId])]);
    } catch (error) {
      console.error("Failed to acknowledge document:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Proactive Alerts */}
      {userContext.hasMissedCheckout && (
        <ProactiveAlert
          type="warning"
          title="Missed Checkout Detected"
          message={`You didn't check out on ${userContext.missedCheckoutDate}. Please submit a regularization request.`}
        />
      )}
      
      {!userContext.isCheckedInToday && userContext.isWorkingHours && (
        <ProactiveAlert
          type="info"
          title="Good Morning!"
          message="You haven't checked in yet today. Click the button below to check in."
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Today&apos;s Status</p>
                <p className="text-2xl font-bold text-blue-900">
                  {attendance?.todayStatus.isCheckedIn ? "Checked In" : "Not Checked In"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Leave Balance</p>
                <p className="text-2xl font-bold text-emerald-900">{totalLeaveRemaining} days</p>
              </div>
              <Calendar className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Pending Requests</p>
                <p className="text-2xl font-bold text-amber-900">{pendingCount}</p>
              </div>
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">This Month</p>
                <p className="text-2xl font-bold text-purple-900">
                  {attendance?.summary.presentDays || 0} days
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Components Grid */}
      <div className="grid grid-cols-2 gap-6">
        <CheckInOutCard
          checkInTime={attendance?.todayStatus.checkInTime}
          checkOutTime={attendance?.todayStatus.checkOutTime}
          status={
            attendance?.todayStatus.checkOutTime ? "checked_out" :
            attendance?.todayStatus.isCheckedIn ? "checked_in" : "not_checked_in"
          }
          employeeId={currentUser.employeeId}
          isLoading={isLoading}
        />
        <AttendanceTimeline
          records={attendance?.records.map(r => ({
            date: r.date,
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            totalHours: r.hoursWorked ? `${r.hoursWorked}h` : undefined,
            status: r.status as "present" | "absent" | "half_day" | "wfh" | "on_leave" | "holiday" | "regularization_pending",
          })) || []}
          maxItems={5}
        />
        <LeaveBalanceCard
          balances={leaveBalances}
        />
        <RequestStatusList
          requests={requests}
          maxHeight={350}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <AnnouncementsFeed
          announcements={announcements}
          isLoading={isLoading}
          maxItems={6}
          density="comfortable"
          emptyState={{
            title: "No announcements yet",
            description: "HR updates will appear here once published.",
          }}
        />
        <DocumentsAcknowledgeList
          documents={documents}
          acknowledgedIds={acknowledgedIds}
          onAcknowledge={handleAcknowledge}
          isLoading={isLoading}
          maxItems={6}
          density="comfortable"
          showAcknowledge
          emptyState={{
            title: "No documents available",
            description: "Required reads and guides will show up here.",
          }}
        />
      </div>
    </div>
  );
}

// Manager Dashboard
function ManagerDashboard() {
  const { userContext } = useUserContext();
  const { currentUser } = usePersona();
  
  const [approvals, setApprovals] = useState<Awaited<ReturnType<typeof getPendingApprovals>>>([]);
  const [teamMembers, setTeamMembers] = useState<Awaited<ReturnType<typeof getTeamMembers>>>([]);
  const [announcements, setAnnouncements] = useState<Awaited<ReturnType<typeof getAnnouncements>>>([]);
  const [documents, setDocuments] = useState<Awaited<ReturnType<typeof getDocuments>>>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const [apprs, team, ann, docs, ackIds] = await Promise.all([
        getPendingApprovals({ managerId: currentUser.employeeId }),
        getTeamMembers({ managerId: currentUser.employeeId }),
        getAnnouncements({ role: currentUser.role }),
        getDocuments({ role: currentUser.role }),
        getAcknowledgedDocumentIds({ employeeId: currentUser.employeeId }),
      ]);
      setApprovals(apprs);
      setTeamMembers(team);
      setAnnouncements(ann);
      setDocuments(docs);
      setAcknowledgedIds(ackIds);
    } catch (error) {
      console.error("Failed to fetch manager data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser.employeeId, currentUser.role]);

  // Real-time subscriptions for Supabase - Manager sees updates instantly
  useRealtimeHR({
    managerId: currentUser.employeeId,
    onLeaveRequestChange: () => fetchData(true),
    onRegularizationChange: () => fetchData(true),
    onNotificationChange: () => fetchData(true),
  });

  useEffect(() => {
    fetchData();
    
    // Auto-refresh when window gains focus
    const handleFocus = () => fetchData(true);
    window.addEventListener("focus", handleFocus);
    
    // Listen for custom refresh event (from chat actions)
    const handleRefresh = () => fetchData(true);
    window.addEventListener("hr-data-updated", handleRefresh);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("hr-data-updated", handleRefresh);
    };
  }, [fetchData]);

  const presentCount = teamMembers.filter(m => m.status === "available" && m.todayAttendance?.checkIn).length;
  const wfhCount = teamMembers.filter(m => m.status === "wfh").length;
  const onLeaveCount = teamMembers.filter(m => m.status === "on_leave").length;
  const attendanceRate = teamMembers.length > 0 
    ? Math.round(((presentCount + wfhCount) / teamMembers.length) * 100)
    : 0;

  const handleAcknowledge = async (documentId: string) => {
    try {
      await acknowledgeDocument({ employeeId: currentUser.employeeId, documentId });
      setAcknowledgedIds((prev) => [...new Set([...prev, documentId])]);
    } catch (error) {
      console.error("Failed to acknowledge document:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Proactive Alerts */}
      {approvals.length > 0 && (
        <ProactiveAlert
          type="warning"
          title={`${approvals.length} Pending Approvals`}
          message="You have team requests waiting for your review. Please take action."
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Pending Approvals</p>
                <p className="text-2xl font-bold text-purple-900">{approvals.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Team Present</p>
                <p className="text-2xl font-bold text-blue-900">{presentCount + wfhCount} / {teamMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">On Leave Today</p>
                <p className="text-2xl font-bold text-emerald-900">{onLeaveCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Team Attendance</p>
                <p className="text-2xl font-bold text-amber-900">{attendanceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Components Grid */}
      <div className="grid grid-cols-2 gap-6">
        <ApprovalQueue approvals={approvals} />
        <TeamOverview
          members={teamMembers}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <AnnouncementsFeed
          announcements={announcements}
          isLoading={isLoading}
          maxItems={6}
          density="comfortable"
          emptyState={{
            title: "No announcements yet",
            description: "HR updates will appear here once published.",
          }}
        />
        <DocumentsAcknowledgeList
          documents={documents}
          acknowledgedIds={acknowledgedIds}
          onAcknowledge={handleAcknowledge}
          isLoading={isLoading}
          maxItems={6}
          density="comfortable"
          showAcknowledge
          emptyState={{
            title: "No documents available",
            description: "Required reads and guides will show up here.",
          }}
        />
      </div>
    </div>
  );
}

// HR Dashboard
function HRDashboard() {
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof getSystemMetrics>> | null>(null);
  const [policies, setPolicies] = useState<Awaited<ReturnType<typeof getPolicies>>>([]);
  const [announcements, setAnnouncements] = useState<Awaited<ReturnType<typeof getAnnouncements>>>([]);
  const [documents, setDocuments] = useState<Awaited<ReturnType<typeof getDocuments>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const [systemMetrics, allPolicies, allAnnouncements, allDocuments] = await Promise.all([
        getSystemMetrics(),
        getPolicies(),
        getAnnouncements({}),
        getDocuments({}),
      ]);
      setMetrics(systemMetrics);
      setPolicies(allPolicies);
      setAnnouncements(allAnnouncements);
      setDocuments(allDocuments);
    } catch (error) {
      console.error("Failed to fetch HR data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Real-time subscriptions for Supabase - HR sees all updates
  useRealtimeHR({
    onLeaveRequestChange: () => fetchData(true),
    onRegularizationChange: () => fetchData(true),
    onAttendanceChange: () => fetchData(true),
    onNotificationChange: () => fetchData(true),
  });

  useEffect(() => {
    fetchData();
    
    // Auto-refresh when window gains focus
    const handleFocus = () => fetchData(true);
    window.addEventListener("focus", handleFocus);
    
    // Listen for custom refresh event (from chat actions)
    const handleRefresh = () => fetchData(true);
    window.addEventListener("hr-data-updated", handleRefresh);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("hr-data-updated", handleRefresh);
    };
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Proactive Alerts */}
      {metrics && metrics.escalations > 0 && (
        <ProactiveAlert
          type="warning"
          title={`${metrics.escalations} Escalations Require Attention`}
          message="There are escalated issues that need HR intervention."
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Total Employees</p>
                <p className="text-2xl font-bold text-emerald-900">{metrics?.totalEmployees || 0}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Present Today</p>
                <p className="text-2xl font-bold text-blue-900">{metrics?.presentToday || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Pending Approvals</p>
                <p className="text-2xl font-bold text-amber-900">{metrics?.pendingApprovals || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Escalations</p>
                <p className="text-2xl font-bold text-red-900">{metrics?.escalations || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Components */}
      <div className="space-y-6">
        {metrics && (
          <SystemDashboard metrics={metrics} />
        )}
        <div className="grid grid-cols-2 gap-6">
          <AnnouncementBoard
            announcements={announcements}
            onRefresh={() => fetchData(true)}
            isLoading={isLoading}
            maxItems={8}
            canPost
            canDelete
            emptyState={{
              title: "No announcements yet",
              description: "Post your first update for the organization.",
            }}
          />
          <DocumentCenter
            documents={documents}
            onRefresh={() => fetchData(true)}
            isLoading={isLoading}
            maxItems={8}
            canUpload
            canDelete
            emptyState={{
              title: "No documents uploaded yet",
              description: "Upload a PDF to start collecting acknowledgments.",
            }}
          />
        </div>
        <PolicyManager
          policies={policies}
          onRefresh={() => fetchData(true)}
          isLoading={isLoading}
          maxItems={8}
          canCreate
          canEdit
          canDelete
          emptyState={{
            title: "No policies created yet",
            description: "Create policies to make them visible to the team.",
          }}
        />
        <PolicyViewer
          policies={policies}
          isLoading={isLoading}
          showSearch={false}
          maxItems={10}
          density="comfortable"
          emptyState={{
            title: "No policies found",
            description: "Create policies to show them here.",
          }}
        />
      </div>
    </div>
  );
}

// Dashboard Router
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}
