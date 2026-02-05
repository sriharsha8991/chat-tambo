/**
 * @file API Route for HR Data Operations
 * @description Handles all HR data operations (read/write to JSON store)
 * 
 * This API route acts as a server-side bridge for the dataStore
 * since fs operations only work on the server.
 */

import { NextRequest, NextResponse } from "next/server";
import * as dataStore from "@/services/dataStore";

// ============================================
// GET: Read operations
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const employeeId = searchParams.get("employeeId");
    const managerId = searchParams.get("managerId");

    console.log(`[HR API] GET action=${action}, employeeId=${employeeId}, managerId=${managerId}`);

    switch (action) {
      case "getEmployee":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        const employee = dataStore.getEmployee(employeeId);
        if (!employee) {
          return NextResponse.json({ error: `Employee not found: ${employeeId}` }, { status: 404 });
        }
        return NextResponse.json(employee);

      case "getDirectReports":
        if (!managerId) {
          return NextResponse.json({ error: "managerId required" }, { status: 400 });
        }
        return NextResponse.json(dataStore.getDirectReports(managerId) || []);

      case "getAllEmployees":
        return NextResponse.json(dataStore.getAllEmployees());

      case "getLeaveBalances":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        const leaveBalances = dataStore.getLeaveBalances(employeeId);
        if (!leaveBalances) {
          return NextResponse.json({ error: `Leave balances not found for employee: ${employeeId}` }, { status: 404 });
        }
        return NextResponse.json(leaveBalances);

      case "getAttendanceRecords":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        return NextResponse.json(dataStore.getAttendanceRecords(employeeId) || []);

      case "getTodayAttendance":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        return NextResponse.json(dataStore.getTodayAttendance(employeeId) || null);

      case "getLeaveRequests":
        return NextResponse.json(dataStore.getLeaveRequests(employeeId || undefined));

      case "getPendingLeaveRequests":
        return NextResponse.json(dataStore.getPendingLeaveRequests(managerId || undefined));

      case "getRegularizationRequests":
        return NextResponse.json(dataStore.getRegularizationRequests(employeeId || undefined));

      case "getPendingApprovals":
        if (!managerId) {
          return NextResponse.json({ error: "managerId required" }, { status: 400 });
        }
        return NextResponse.json(dataStore.getAllPendingApprovals(managerId));

      case "getNotifications":
        if (!employeeId) {
          return NextResponse.json({ error: "employeeId required" }, { status: 400 });
        }
        return NextResponse.json(dataStore.getNotifications(employeeId));

      case "getSystemMetrics":
        return NextResponse.json(dataStore.getSystemMetrics());

      case "getStore":
        return NextResponse.json(dataStore.readStore());

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

    console.log(`[HR API] POST action=${action}`, JSON.stringify(data).substring(0, 200));

    switch (action) {
      case "addOrUpdateAttendance": {
        const { employeeId, record } = data;
        if (!employeeId || !record) {
          return NextResponse.json({ error: "employeeId and record required" }, { status: 400 });
        }
        dataStore.addOrUpdateAttendance(employeeId, record);
        return NextResponse.json({ success: true });
      }

      case "createLeaveRequest": {
        const { request: leaveRequest } = data;
        if (!leaveRequest) {
          return NextResponse.json({ error: "request required" }, { status: 400 });
        }
        const result = dataStore.createLeaveRequest(leaveRequest);
        return NextResponse.json(result);
      }

      case "approveLeaveRequest": {
        const { requestId, reviewerId, comment } = data;
        if (!requestId || !reviewerId) {
          return NextResponse.json({ error: "requestId and reviewerId required" }, { status: 400 });
        }
        const result = dataStore.approveLeaveRequest(requestId, reviewerId, comment);
        return NextResponse.json(result || { error: "Request not found or not pending" });
      }

      case "rejectLeaveRequest": {
        const { requestId, reviewerId, comment } = data;
        if (!requestId || !reviewerId) {
          return NextResponse.json({ error: "requestId and reviewerId required" }, { status: 400 });
        }
        const result = dataStore.rejectLeaveRequest(requestId, reviewerId, comment);
        return NextResponse.json(result || { error: "Request not found" });
      }

      case "createRegularizationRequest": {
        const { request: regRequest } = data;
        if (!regRequest) {
          return NextResponse.json({ error: "request required" }, { status: 400 });
        }
        const result = dataStore.createRegularizationRequest(regRequest);
        return NextResponse.json(result);
      }

      case "approveRegularization": {
        const { requestId, reviewerId, comment } = data;
        if (!requestId || !reviewerId) {
          return NextResponse.json({ error: "requestId and reviewerId required" }, { status: 400 });
        }
        const result = dataStore.approveRegularization(requestId, reviewerId, comment);
        return NextResponse.json(result || { error: "Request not found or not pending" });
      }

      case "rejectRegularization": {
        const { requestId, reviewerId, comment } = data;
        if (!requestId || !reviewerId) {
          return NextResponse.json({ error: "requestId and reviewerId required" }, { status: 400 });
        }
        const result = dataStore.rejectRegularization(requestId, reviewerId, comment);
        return NextResponse.json(result || { error: "Request not found" });
      }

      case "markNotificationRead": {
        const { notificationId } = data;
        if (!notificationId) {
          return NextResponse.json({ error: "notificationId required" }, { status: 400 });
        }
        dataStore.markNotificationRead(notificationId);
        return NextResponse.json({ success: true });
      }

      case "updateLeaveBalance": {
        const { employeeId, leaveType, usedDays } = data;
        if (!employeeId || !leaveType || usedDays === undefined) {
          return NextResponse.json({ error: "employeeId, leaveType, and usedDays required" }, { status: 400 });
        }
        dataStore.updateLeaveBalance(employeeId, leaveType, usedDays);
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
