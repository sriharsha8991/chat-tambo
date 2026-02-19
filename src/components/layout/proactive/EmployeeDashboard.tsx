"use client";

import { useState, useCallback } from "react";
import { usePersona, useUserContext } from "@/contexts/PersonaContext";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, FileText, TrendingUp } from "lucide-react";
import {
  CheckInOutCard,
  LeaveBalanceCard,
  RequestStatusList,
  AttendanceTimeline,
  AnnouncementsFeed,
  DocumentsAcknowledgeList,
} from "@/components/hr";
import {
  getLeaveBalance,
  getRequestStatus,
  getAttendanceStatus,
  getAnnouncements,
  getDocuments,
  getAcknowledgedDocumentIds,
  acknowledgeDocument,
} from "@/services/hr-api-client";
import { ProactiveAlert, useDashboardFetch } from "./shared";

export function EmployeeDashboard() {
  const { userContext, updateUserContext } = useUserContext();
  const { currentUser } = usePersona();

  const [leaveBalances, setLeaveBalances] = useState<
    Awaited<ReturnType<typeof getLeaveBalance>>
  >([]);
  const [requests, setRequests] = useState<
    Awaited<ReturnType<typeof getRequestStatus>>
  >([]);
  const [attendance, setAttendance] = useState<Awaited<
    ReturnType<typeof getAttendanceStatus>
  > | null>(null);
  const [announcements, setAnnouncements] = useState<
    Awaited<ReturnType<typeof getAnnouncements>>
  >([]);
  const [documents, setDocuments] = useState<
    Awaited<ReturnType<typeof getDocuments>>
  >([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);

  const fetcher = useCallback(async () => {
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

    if (att?.todayStatus) {
      updateUserContext({
        isCheckedInToday: att.todayStatus.isCheckedIn,
        hasMissedCheckout: att.todayStatus.hasMissedCheckout,
        missedCheckoutDate: att.todayStatus.missedCheckoutDate,
      });
    }
  }, [currentUser.employeeId, currentUser.role]);

  const { isLoading } = useDashboardFetch(fetcher, {
    employeeId: currentUser.employeeId,
    onLeaveRequestChange: () => {},
    onAttendanceChange: () => {},
    onNotificationChange: () => {},
  });

  const totalLeaveRemaining = leaveBalances.reduce(
    (sum, b) => sum + b.remainingDays,
    0,
  );
  const pendingCount = requests.filter((r) => r.status === "pending").length;

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
                <p className="text-sm text-blue-600 font-medium">
                  Today&apos;s Status
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {attendance?.todayStatus.isCheckedIn
                    ? "Checked In"
                    : "Not Checked In"}
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
                <p className="text-sm text-emerald-600 font-medium">
                  Leave Balance
                </p>
                <p className="text-2xl font-bold text-emerald-900">
                  {totalLeaveRemaining} days
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
                  Pending Requests
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {pendingCount}
                </p>
              </div>
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  This Month
                </p>
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
            attendance?.todayStatus.checkOutTime
              ? "checked_out"
              : attendance?.todayStatus.isCheckedIn
                ? "checked_in"
                : "not_checked_in"
          }
          employeeId={currentUser.employeeId}
          isLoading={isLoading}
        />
        <AttendanceTimeline
          records={
            attendance?.records.map((r) => ({
              date: r.date,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              totalHours: r.hoursWorked ? `${r.hoursWorked}h` : undefined,
              status: r.status as
                | "present"
                | "absent"
                | "half_day"
                | "wfh"
                | "on_leave"
                | "holiday"
                | "regularization_pending",
            })) || []
          }
          maxItems={5}
        />
        <LeaveBalanceCard balances={leaveBalances} />
        <RequestStatusList requests={requests} maxHeight={350} />
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
