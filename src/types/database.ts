/**
 * Supabase Database Types
 * Auto-generated types for HR database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          employee_id: string;
          name: string;
          email: string;
          role: "employee" | "manager" | "hr";
          department: string | null;
          manager_id: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          name: string;
          email: string;
          role: "employee" | "manager" | "hr";
          department?: string | null;
          manager_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          name?: string;
          email?: string;
          role?: "employee" | "manager" | "hr";
          department?: string | null;
          manager_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: "present" | "absent" | "half_day" | "wfh" | "holiday" | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: "present" | "absent" | "half_day" | "wfh" | "holiday" | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: "present" | "absent" | "half_day" | "wfh" | "holiday" | null;
          source?: string;
          created_at?: string;
        };
      };
      regularization_requests: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          request_type: "missed_checkin" | "missed_checkout" | "correction";
          requested_time: string | null;
          reason: string | null;
          status: "pending" | "approved" | "rejected";
          approver_id: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          request_type: "missed_checkin" | "missed_checkout" | "correction";
          requested_time?: string | null;
          reason?: string | null;
          status?: "pending" | "approved" | "rejected";
          approver_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          request_type?: "missed_checkin" | "missed_checkout" | "correction";
          requested_time?: string | null;
          reason?: string | null;
          status?: "pending" | "approved" | "rejected";
          approver_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
      };
      leave_balances: {
        Row: {
          id: string;
          employee_id: string;
          leave_type: string;
          total_days: number;
          used_days: number;
          year: number;
        };
        Insert: {
          id?: string;
          employee_id: string;
          leave_type: string;
          total_days: number;
          used_days?: number;
          year?: number;
        };
        Update: {
          id?: string;
          employee_id?: string;
          leave_type?: string;
          total_days?: number;
          used_days?: number;
          year?: number;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          employee_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          days: number;
          reason: string | null;
          status: "pending" | "approved" | "rejected" | "cancelled";
          approver_id: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          days: number;
          reason?: string | null;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          approver_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          leave_type?: string;
          start_date?: string;
          end_date?: string;
          days?: number;
          reason?: string | null;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          approver_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
      };
      policies: {
        Row: {
          id: string;
          title: string;
          category: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string | null;
          content?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      pending_approvals: {
        Row: {
          type: string;
          id: string;
          employee_id: string;
          created_at: string;
          status: string;
        };
      };
    };
  };
};

// Convenience types
export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type RegularizationRequest = Database["public"]["Tables"]["regularization_requests"]["Row"];
export type LeaveBalance = Database["public"]["Tables"]["leave_balances"]["Row"];
export type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];
export type Policy = Database["public"]["Tables"]["policies"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
