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
          department: string;
          manager_id: string | null;
          join_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          name: string;
          email: string;
          role: "employee" | "manager" | "hr";
          department: string;
          manager_id?: string | null;
          join_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          name?: string;
          email?: string;
          role?: "employee" | "manager" | "hr";
          department?: string;
          manager_id?: string | null;
          join_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: "present" | "absent" | "wfh" | "on_leave" | "half_day" | "holiday";
          hours_worked: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: "present" | "absent" | "wfh" | "on_leave" | "half_day" | "holiday";
          hours_worked?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: "present" | "absent" | "wfh" | "on_leave" | "half_day" | "holiday";
          hours_worked?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      regularization_requests: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          request_type: "missed_checkin" | "missed_checkout" | "correction";
          requested_time: string;
          reason: string;
          status: "pending" | "approved" | "rejected";
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          request_type: "missed_checkin" | "missed_checkout" | "correction";
          requested_time: string;
          reason: string;
          status?: "pending" | "approved" | "rejected";
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          request_type?: "missed_checkin" | "missed_checkout" | "correction";
          requested_time?: string;
          reason?: string;
          status?: "pending" | "approved" | "rejected";
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leave_balances: {
        Row: {
          id: string;
          employee_id: string;
          leave_type: string;
          total_days: number;
          used_days: number;
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          leave_type: string;
          total_days: number;
          used_days?: number;
          year?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          leave_type?: string;
          total_days?: number;
          used_days?: number;
          year?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leave_requests: {
        Row: {
          id: string;
          employee_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          days_requested: number;
          reason: string;
          status: "pending" | "approved" | "rejected" | "cancelled";
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          days_requested: number;
          reason: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          leave_type?: string;
          start_date?: string;
          end_date?: string;
          days_requested?: number;
          reason?: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      policies: {
        Row: {
          id: string;
          title: string;
          category: string;
          content: string;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          content: string;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          content?: string;
          last_updated?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          audience_role: string;
          pinned: boolean;
          created_by: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          audience_role: string;
          pinned?: boolean;
          created_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          audience_role?: string;
          pinned?: boolean;
          created_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          file_path: string;
          audience_role: string;
          requires_ack: boolean;
          created_by: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          file_path: string;
          audience_role: string;
          requires_ack?: boolean;
          created_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          file_path?: string;
          audience_role?: string;
          requires_ack?: boolean;
          created_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      document_acknowledgments: {
        Row: {
          id: string;
          document_id: string;
          employee_id: string;
          acknowledged_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          employee_id: string;
          acknowledged_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          employee_id?: string;
          acknowledged_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          employee_id: string | null;
          audience_role: string;
          type: string;
          title: string;
          message: string;
          related_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          audience_role?: string;
          type: string;
          title: string;
          message: string;
          related_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          audience_role?: string;
          type?: string;
          title?: string;
          message?: string;
          related_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
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
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentAcknowledgment = Database["public"]["Tables"]["document_acknowledgments"]["Row"];
