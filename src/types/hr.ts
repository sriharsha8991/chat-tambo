/**
 * HR Domain Types
 * Application-level types for the HR workspace
 */

export type PersonaRole = "employee" | "manager" | "hr";

export interface UserProfile {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: PersonaRole;
  department: string;
  managerId?: string;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "absent" | "half_day" | "wfh" | "holiday";
  hoursWorked?: number;
}

export interface LeaveBalanceInfo {
  leaveType: "casual" | "sick" | "earned" | "wfh" | "comp_off";
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  label: string;
}

export interface RequestStatus {
  id: string;
  type: "leave" | "regularization";
  title: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  details: string;
}

export interface ApprovalItem {
  id: string;
  type: "leave" | "regularization";
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  title: string;
  details: string;
  submittedAt: string;
  priority: "normal" | "urgent";
}

export interface TeamMember {
  id: string;
  employeeId: string;
  name: string;
  avatarUrl?: string;
  status: "available" | "on_leave" | "wfh" | "absent";
  todayAttendance?: {
    checkIn?: string;
    checkOut?: string;
  };
}

export interface SystemMetrics {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingApprovals: number;
  complianceScore: number;
  escalations: number;
}

export interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audienceRole: string;
  pinned: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string | null;
  filePath: string;
  audienceRole: string;
  requiresAck: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

// User context for proactive rendering
export interface UserContext {
  user: UserProfile;
  isCheckedInToday: boolean;
  hasMissedCheckout: boolean;
  missedCheckoutDate?: string;
  pendingRequests: RequestStatus[];
  pendingApprovals: number;
  escalations: number;
  isWorkingHours: boolean;
  notifications: number;
}

// Proactive rule types
export interface ProactiveRule {
  id: string;
  condition: (ctx: UserContext) => boolean;
  components: string[];
  priority: number;
  message?: string;
}

// Component props schemas will be defined alongside components
export type AttendanceStatus = "checked_in" | "checked_out" | "not_checked_in" | "missed_checkout";
