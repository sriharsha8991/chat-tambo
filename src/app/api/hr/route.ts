/**
 * @file API Route for HR Data Operations
 * @description Handles all HR data operations with Supabase (primary) or JSON (fallback)
 * 
 * This API route uses the unified HR service which automatically selects
 * between Supabase and JSON file storage based on configuration.
 */

import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import * as hrService from "@/services/hr-unified";

export const runtime = "nodejs";

// ============================================
// GET: Read operations
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const employeeId = searchParams.get("employeeId");
    const managerId = searchParams.get("managerId");

    console.log(`[HR API] GET action=${action}, employeeId=${employeeId}, managerId=${managerId}, backend=${hrService.getBackendType()}`);

    switch (action) {
      case "getEmployee":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        const employee = await hrService.getEmployee(employeeId);
        if (!employee) {
          return NextResponse.json({ error: `Employee not found: ${employeeId}` }, { status: 404 });
        }
        return NextResponse.json(employee);

      case "getDirectReports":
        if (!managerId) {
          return NextResponse.json({ error: "managerId required" }, { status: 400 });
        }
        return NextResponse.json(await hrService.getDirectReports(managerId) || []);

      case "getAllEmployees":
        return NextResponse.json(await hrService.getAllEmployees());

      case "getTeamMembers":
        if (!managerId) {
          return NextResponse.json({ error: "managerId required" }, { status: 400 });
        }
        return NextResponse.json(await hrService.getTeamMembers(managerId));

      case "getLeaveBalances":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        const leaveBalances = await hrService.getLeaveBalances(employeeId);
        return NextResponse.json(leaveBalances || []);

      case "getAttendanceRecords":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        return NextResponse.json(await hrService.getAttendanceRecords(employeeId) || []);

      case "getTodayAttendance":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        return NextResponse.json(await hrService.getTodayAttendance(employeeId) || null);

      case "getLeaveRequests":
        return NextResponse.json(await hrService.getLeaveRequests(employeeId || undefined));

      case "getPendingLeaveRequests":
        return NextResponse.json(await hrService.getPendingLeaveRequests(managerId || undefined));

      case "getRegularizationRequests":
        return NextResponse.json(await hrService.getRegularizationRequests(employeeId || undefined));

      case "getPendingApprovals":
        if (!managerId) {
          return NextResponse.json({ error: "managerId required" }, { status: 400 });
        }
        return NextResponse.json(await hrService.getAllPendingApprovals(managerId));

      case "getNotifications":
        return NextResponse.json(
          await hrService.getNotifications(
            employeeId || undefined,
            (searchParams.get("role") as "employee" | "manager" | "hr" | null) || undefined
          )
        );

      case "searchPolicies": {
        const query = searchParams.get("query") || "";
        if (!query.trim()) {
          return NextResponse.json({ error: "query required" }, { status: 400 });
        }
        return NextResponse.json(await hrService.searchPolicies(query));
      }

      case "getPolicies":
        return NextResponse.json(await hrService.getPolicies());

      case "getAnnouncements": {
        const role = searchParams.get("role") || undefined;
        return NextResponse.json(await hrService.getAnnouncements(role));
      }

      case "getDocuments": {
        const role = searchParams.get("role") || undefined;
        return NextResponse.json(await hrService.getDocuments(role));
      }

      case "getAcknowledgedDocumentIds": {
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        return NextResponse.json(await hrService.getAcknowledgedDocumentIds(employeeId));
      }

      case "getSystemMetrics":
        return NextResponse.json(await hrService.getSystemMetrics());

      case "getBackendType":
        return NextResponse.json({ backend: hrService.getBackendType() });

      case "getPinnedWidgets":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        return NextResponse.json(await hrService.getPinnedWidgets(employeeId));

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("HR API GET error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}

// ============================================
// POST: Write operations
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    console.log(`[HR API] POST action=${action}, backend=${hrService.getBackendType()}`, JSON.stringify(data).substring(0, 200));

    switch (action) {
      case "addOrUpdateAttendance": {
        const { employeeId, record } = data;
        if (!employeeId || !record) {
          return NextResponse.json({ error: "employeeId and record required" }, { status: 400 });
        }
        await hrService.addOrUpdateAttendance(employeeId, record);
        return NextResponse.json({ success: true });
      }

      case "createLeaveRequest": {
        const { request: leaveRequest } = data;
        if (!leaveRequest) {
          return NextResponse.json({ error: "request required" }, { status: 400 });
        }
        const result = await hrService.createLeaveRequest({
          employeeId: leaveRequest.employeeId,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          daysRequested: leaveRequest.daysRequested,
          reason: leaveRequest.reason,
        });
        return NextResponse.json(result);
      }

      case "approveLeaveRequest": {
        const { requestId, reviewerId, comment } = data;
        if (!requestId || !reviewerId) {
          return NextResponse.json({ error: "requestId and reviewerId required" }, { status: 400 });
        }
        const result = await hrService.approveLeaveRequest(requestId, reviewerId, comment);
        return NextResponse.json(result || { error: "Request not found or not pending" });
      }

      case "rejectLeaveRequest": {
        const { requestId, reviewerId, comment } = data;
        if (!requestId || !reviewerId) {
          return NextResponse.json({ error: "requestId and reviewerId required" }, { status: 400 });
        }
        const result = await hrService.rejectLeaveRequest(requestId, reviewerId, comment);
        return NextResponse.json(result || { error: "Request not found" });
      }

      case "createRegularizationRequest": {
        const { request: regRequest } = data;
        if (!regRequest) {
          return NextResponse.json({ error: "request required" }, { status: 400 });
        }
        const result = await hrService.createRegularizationRequest({
          employeeId: regRequest.employeeId,
          date: regRequest.date,
          requestType: regRequest.requestType,
          requestedTime: regRequest.requestedTime,
          reason: regRequest.reason,
        });
        return NextResponse.json(result);
      }

      case "approveRegularization": {
        const { requestId, reviewerId, comment } = data;
        if (!requestId || !reviewerId) {
          return NextResponse.json({ error: "requestId and reviewerId required" }, { status: 400 });
        }
        const result = await hrService.approveRegularization(requestId, reviewerId, comment);
        return NextResponse.json(result || { error: "Request not found or not pending" });
      }

      case "rejectRegularization": {
        const { requestId, reviewerId, comment } = data;
        if (!requestId || !reviewerId) {
          return NextResponse.json({ error: "requestId and reviewerId required" }, { status: 400 });
        }
        const result = await hrService.rejectRegularization(requestId, reviewerId, comment);
        return NextResponse.json(result || { error: "Request not found" });
      }

      case "markNotificationRead": {
        const { notificationId } = data;
        if (!notificationId) {
          return NextResponse.json({ error: "notificationId required" }, { status: 400 });
        }
        await hrService.markNotificationRead(notificationId);
        return NextResponse.json({ success: true });
      }

      case "acknowledgeDocument": {
        const { employeeId, documentId } = data;
        if (!employeeId || !documentId) {
          return NextResponse.json({ error: "employeeId and documentId required" }, { status: 400 });
        }
        const result = await hrService.acknowledgeDocument(employeeId, documentId);
        return NextResponse.json(result || { error: "Unable to acknowledge document" });
      }

      case "createAnnouncement": {
        const { announcement } = data;
        if (!announcement) {
          return NextResponse.json({ error: "announcement required" }, { status: 400 });
        }
        const result = await hrService.createAnnouncement(announcement);
        return NextResponse.json(result || { error: "Unable to create announcement" });
      }

      case "updateAnnouncement": {
        const { id, updates } = data;
        if (!id || !updates) {
          return NextResponse.json({ error: "id and updates required" }, { status: 400 });
        }
        const result = await hrService.updateAnnouncement(id, updates);
        return NextResponse.json(result || { error: "Unable to update announcement" });
      }

      case "deleteAnnouncement": {
        const { id } = data;
        if (!id) {
          return NextResponse.json({ error: "id required" }, { status: 400 });
        }
        const success = await hrService.deleteAnnouncement(id);
        return NextResponse.json({ success });
      }

      case "createDocument": {
        const { document } = data;
        if (!document) {
          return NextResponse.json({ error: "document required" }, { status: 400 });
        }
        const result = await hrService.createDocument(document);
        return NextResponse.json(result || { error: "Unable to create document" });
      }

      case "deleteDocument": {
        const { id } = data;
        if (!id) {
          return NextResponse.json({ error: "id required" }, { status: 400 });
        }

        const document = await hrService.getDocumentById(id);
        if (!document) {
          return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        if (document.file_path && document.file_path.startsWith("/uploads/")) {
          const filePath = path.join(process.cwd(), "public", document.file_path);
          try {
            await unlink(filePath);
          } catch (error) {
            console.error("Error deleting file:", error);
          }
        }

        const success = await hrService.deleteDocument(id);
        return NextResponse.json({ success });
      }

      case "createPolicy": {
        const { policy } = data;
        if (!policy) {
          return NextResponse.json({ error: "policy required" }, { status: 400 });
        }
        const result = await hrService.createPolicy(policy);
        return NextResponse.json(result || { error: "Unable to create policy" });
      }

      case "updatePolicy": {
        const { id, updates } = data;
        if (!id || !updates) {
          return NextResponse.json({ error: "id and updates required" }, { status: 400 });
        }
        const result = await hrService.updatePolicy(id, updates);
        return NextResponse.json(result || { error: "Unable to update policy" });
      }

      case "deletePolicy": {
        const { id } = data;
        if (!id) {
          return NextResponse.json({ error: "id required" }, { status: 400 });
        }
        const success = await hrService.deletePolicy(id);
        return NextResponse.json({ success });
      }

      case "updateLeaveBalance": {
        const { employeeId, leaveType, usedDays } = data;
        if (!employeeId || !leaveType || usedDays === undefined) {
          return NextResponse.json({ error: "employeeId, leaveType, and usedDays required" }, { status: 400 });
        }
        await hrService.updateLeaveBalance(employeeId, leaveType, usedDays);
        return NextResponse.json({ success: true });
      }

      case "pinWidget": {
        const { employeeId, componentName, queryDescriptor, layout, title } = data;
        if (!employeeId || !componentName) {
          return NextResponse.json({ error: "employeeId and componentName required" }, { status: 400 });
        }
        const widget = await hrService.pinWidget({
          employeeId,
          componentName,
          queryDescriptor: queryDescriptor || {},
          layout,
          title,
        });
        return NextResponse.json(widget || { error: "Already pinned or failed" });
      }

      case "unpinWidget": {
        const { widgetId } = data;
        if (!widgetId) {
          return NextResponse.json({ error: "widgetId required" }, { status: 400 });
        }
        const success = await hrService.unpinWidget(widgetId);
        return NextResponse.json({ success });
      }

      case "updateWidgetLayout": {
        const { widgetId, layout } = data;
        if (!widgetId || !layout) {
          return NextResponse.json({ error: "widgetId and layout required" }, { status: 400 });
        }
        const success = await hrService.updateWidgetLayout(widgetId, layout);
        return NextResponse.json({ success });
      }

      case "updateWidgetTitle": {
        const { widgetId, title } = data;
        if (!widgetId || title === undefined) {
          return NextResponse.json({ error: "widgetId and title required" }, { status: 400 });
        }
        const success = await hrService.updateWidgetTitle(widgetId, title);
        return NextResponse.json({ success });
      }

      case "batchUpdateWidgetLayouts": {
        const { updates } = data;
        if (!updates || !Array.isArray(updates)) {
          return NextResponse.json({ error: "updates array required" }, { status: 400 });
        }
        const success = await hrService.batchUpdateWidgetLayouts(updates);
        return NextResponse.json({ success });
      }

      case "clearAllPinnedWidgets": {
        const { employeeId } = data;
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        const success = await hrService.clearAllPinnedWidgets(employeeId);
        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("HR API POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
