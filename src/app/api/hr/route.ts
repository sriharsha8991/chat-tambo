/**
 * @file API Route for HR Data Operations
 * @description Handles all HR data operations with Supabase (primary) or JSON (fallback)
 * 
 * This API route uses the unified HR service which automatically selects
 * between Supabase and JSON file storage based on configuration.
 */

import { NextRequest, NextResponse } from "next/server";
import * as hrService from "@/services/hr-unified";

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

      case "getLeaveBalances":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        const leaveBalances = await hrService.getLeaveBalances(employeeId);
        if (!leaveBalances || leaveBalances.length === 0) {
          return NextResponse.json({ error: `Leave balances not found for employee: ${employeeId}` }, { status: 404 });
        }
        return NextResponse.json(leaveBalances);

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
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        return NextResponse.json(await hrService.getNotifications(employeeId));

      case "getSystemMetrics":
        return NextResponse.json(await hrService.getSystemMetrics());

      case "getBackendType":
        return NextResponse.json({ backend: hrService.getBackendType() });

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

      case "updateLeaveBalance": {
        const { employeeId, leaveType, usedDays } = data;
        if (!employeeId || !leaveType || usedDays === undefined) {
          return NextResponse.json({ error: "employeeId, leaveType, and usedDays required" }, { status: 400 });
        }
        await hrService.updateLeaveBalance(employeeId, leaveType, usedDays);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("HR API POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
