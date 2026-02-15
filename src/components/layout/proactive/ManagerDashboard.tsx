"use client";

import { useState, useCallback } from "react";
import { usePersona } from "@/contexts/PersonaContext";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, Users, TrendingUp } from "lucide-react";
import {
  ApprovalQueue,
  TeamOverview,
  AnnouncementsFeed,
  DocumentsAcknowledgeList,
} from "@/components/hr";
import {
  getPendingApprovals,
  getTeamMembers,
  getAnnouncements,
  getDocuments,
  getAcknowledgedDocumentIds,
  acknowledgeDocument,
} from "@/services/hr-api-client";
import { ProactiveAlert, useDashboardFetch } from "./shared";

export function ManagerDashboard() {
  const { currentUser } = usePersona();

  const [approvals, setApprovals] = useState<
    Awaited<ReturnType<typeof getPendingApprovals>>
  >([]);
  const [teamMembers, setTeamMembers] = useState<
    Awaited<ReturnType<typeof getTeamMembers>>
  >([]);
  const [announcements, setAnnouncements] = useState<
    Awaited<ReturnType<typeof getAnnouncements>>
  >([]);
  const [documents, setDocuments] = useState<
    Awaited<ReturnType<typeof getDocuments>>
  >([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);

  const fetcher = useCallback(async () => {
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
  }, [currentUser.employeeId, currentUser.role]);

  const { isLoading } = useDashboardFetch(fetcher, {
    managerId: currentUser.employeeId,
    onLeaveRequestChange: () => {},
    onRegularizationChange: () => {},
    onNotificationChange: () => {},
  });

  const presentCount = teamMembers.filter(
    (m) => m.status === "available" && m.todayAttendance?.checkIn,
  ).length;
  const wfhCount = teamMembers.filter((m) => m.status === "wfh").length;
  const onLeaveCount = teamMembers.filter(
    (m) => m.status === "on_leave",
  ).length;
  const attendanceRate =
    teamMembers.length > 0
      ? Math.round(((presentCount + wfhCount) / teamMembers.length) * 100)
      : 0;

  const handleAcknowledge = async (documentId: string) => {
    try {
      await acknowledgeDocument({
        employeeId: currentUser.employeeId,
        documentId,
      });
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
                <p className="text-sm text-purple-600 font-medium">
                  Pending Approvals
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {approvals.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Team Present
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {presentCount + wfhCount} / {teamMembers.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">
                  On Leave Today
                </p>
                <p className="text-2xl font-bold text-emerald-900">
                  {onLeaveCount}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">
                  Team Attendance
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {attendanceRate}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Components Grid */}
      <div className="grid grid-cols-2 gap-6">
        <ApprovalQueue approvals={approvals} />
        <TeamOverview members={teamMembers} />
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
