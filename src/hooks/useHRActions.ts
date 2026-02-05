/**
 * @file useHRActions.ts
 * @description Hook providing direct HR action functions for components
 * 
 * This hook provides direct access to HR tool functions so components can
 * execute actions and show results inline without sending messages to the chat.
 * 
 * Benefits:
 * - Immediate feedback in the component
 * - No "query loop" back to the AI
 * - Clean UX with in-component success/error states
 */

"use client";

import { useState, useCallback } from "react";
import {
  submitCheckInOut,
  submitLeaveRequest,
  submitRegularization,
  processApproval,
  getLeaveBalance,
  getAttendanceStatus,
} from "@/services/hr-api-client";

// ============================================
// TYPES
// ============================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UseHRActionsReturn {
  // Attendance Actions
  checkIn: (employeeId: string) => Promise<ActionResult<{ timestamp: string; message: string }>>;
  checkOut: (employeeId: string) => Promise<ActionResult<{ timestamp: string; message: string }>>;
  
  // Leave Actions
  applyLeave: (params: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => Promise<ActionResult<{ requestId: string; daysRequested: number }>>;
  
  // Regularization Actions
  submitRegularization: (params: {
    employeeId: string;
    date: string;
    requestType: "missed_checkin" | "missed_checkout" | "correction";
    requestedTime: string;
    reason: string;
  }) => Promise<ActionResult<{ requestId: string }>>;
  
  // Manager Actions
  approveRequest: (approvalId: string, comment?: string) => Promise<ActionResult>;
  rejectRequest: (approvalId: string, comment?: string) => Promise<ActionResult>;
  
  // Data Fetching
  refreshLeaveBalance: (employeeId: string) => Promise<ActionResult>;
  refreshAttendance: (employeeId: string) => Promise<ActionResult>;
  
  // State
  isLoading: boolean;
  lastAction: string | null;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useHRActions(): UseHRActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // ============================================
  // ATTENDANCE ACTIONS
  // ============================================

  const checkIn = useCallback(async (employeeId: string): Promise<ActionResult<{ timestamp: string; message: string }>> => {
    setIsLoading(true);
    setLastAction("check_in");
    try {
      const result = await submitCheckInOut({ employeeId, action: "check_in" });
      return {
        success: result.success,
        data: { timestamp: result.timestamp, message: result.message },
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check in",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkOut = useCallback(async (employeeId: string): Promise<ActionResult<{ timestamp: string; message: string }>> => {
    setIsLoading(true);
    setLastAction("check_out");
    try {
      const result = await submitCheckInOut({ employeeId, action: "check_out" });
      return {
        success: result.success,
        data: { timestamp: result.timestamp, message: result.message },
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check out",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // LEAVE ACTIONS
  // ============================================

  const applyLeave = useCallback(async (params: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<ActionResult<{ requestId: string; daysRequested: number }>> => {
    setIsLoading(true);
    setLastAction("apply_leave");
    try {
      const result = await submitLeaveRequest(params);
      return {
        success: result.success,
        data: { requestId: result.requestId, daysRequested: result.daysRequested },
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit leave request",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // REGULARIZATION ACTIONS
  // ============================================

  const submitRegularizationAction = useCallback(async (params: {
    employeeId: string;
    date: string;
    requestType: "missed_checkin" | "missed_checkout" | "correction";
    requestedTime: string;
    reason: string;
  }): Promise<ActionResult<{ requestId: string }>> => {
    setIsLoading(true);
    setLastAction("regularization");
    try {
      const result = await submitRegularization(params);
      return {
        success: result.success,
        data: { requestId: result.requestId },
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit regularization",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // MANAGER ACTIONS
  // ============================================

  const approveRequest = useCallback(async (approvalId: string, comment?: string): Promise<ActionResult> => {
    setIsLoading(true);
    setLastAction("approve");
    try {
      const result = await processApproval({ approvalId, action: "approve", comment });
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to approve request",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectRequest = useCallback(async (approvalId: string, comment?: string): Promise<ActionResult> => {
    setIsLoading(true);
    setLastAction("reject");
    try {
      const result = await processApproval({ approvalId, action: "reject", comment });
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reject request",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // DATA REFRESH ACTIONS
  // ============================================

  const refreshLeaveBalance = useCallback(async (employeeId: string): Promise<ActionResult> => {
    setIsLoading(true);
    setLastAction("refresh_leave");
    try {
      const data = await getLeaveBalance({ employeeId });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to refresh leave balance",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAttendance = useCallback(async (employeeId: string): Promise<ActionResult> => {
    setIsLoading(true);
    setLastAction("refresh_attendance");
    try {
      const data = await getAttendanceStatus({ employeeId });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to refresh attendance",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    checkIn,
    checkOut,
    applyLeave,
    submitRegularization: submitRegularizationAction,
    approveRequest,
    rejectRequest,
    refreshLeaveBalance,
    refreshAttendance,
    isLoading,
    lastAction,
  };
}
