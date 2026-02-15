"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
} from "lucide-react";
import {
  SystemDashboard,
  PolicyViewer,
  AnnouncementBoard,
  DocumentCenter,
  PolicyManager,
} from "@/components/hr";
import {
  getSystemMetrics,
  getPolicies,
  getAnnouncements,
  getDocuments,
} from "@/services/hr-api-client";
import { ProactiveAlert, useDashboardFetch } from "./shared";

export function HRDashboard() {
  const [metrics, setMetrics] = useState<Awaited<
    ReturnType<typeof getSystemMetrics>
  > | null>(null);
  const [policies, setPolicies] = useState<
    Awaited<ReturnType<typeof getPolicies>>
  >([]);
  const [announcements, setAnnouncements] = useState<
    Awaited<ReturnType<typeof getAnnouncements>>
  >([]);
  const [documents, setDocuments] = useState<
    Awaited<ReturnType<typeof getDocuments>>
  >([]);

  const fetcher = useCallback(async () => {
    const [systemMetrics, allPolicies, allAnnouncements, allDocuments] =
      await Promise.all([
        getSystemMetrics(),
        getPolicies(),
        getAnnouncements({}),
        getDocuments({}),
      ]);
    setMetrics(systemMetrics);
    setPolicies(allPolicies);
    setAnnouncements(allAnnouncements);
    setDocuments(allDocuments);
  }, []);

  const { isLoading, refresh } = useDashboardFetch(fetcher, {
    onLeaveRequestChange: () => {},
    onRegularizationChange: () => {},
    onAttendanceChange: () => {},
    onNotificationChange: () => {},
  });

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
                <p className="text-sm text-emerald-600 font-medium">
                  Total Employees
                </p>
                <p className="text-2xl font-bold text-emerald-900">
                  {metrics?.totalEmployees || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Present Today
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {metrics?.presentToday || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">
                  Pending Approvals
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {metrics?.pendingApprovals || 0}
                </p>
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
                <p className="text-2xl font-bold text-red-900">
                  {metrics?.escalations || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Components */}
      <div className="space-y-6">
        {metrics && <SystemDashboard metrics={metrics} />}
        <div className="grid grid-cols-2 gap-6">
          <AnnouncementBoard
            announcements={announcements}
            onRefresh={refresh}
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
            onRefresh={refresh}
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
          onRefresh={refresh}
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
