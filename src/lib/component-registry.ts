/**
 * Component Registry
 *
 * Maps component names (as registered in tambo.ts) to their React component
 * and default dashboard layout metadata.
 *
 * Both Tambo rendering and the pinned dashboard use this single source of truth.
 */

import { Graph } from "@/components/tambo/graph";
import {
  CheckInOutCard,
  LeaveBalanceCard,
  LeaveRequestForm,
  RequestStatusList,
  AttendanceTimeline,
  RegularizationForm,
  ApprovalQueue,
  TeamOverview,
  ApprovalDetail,
  SystemDashboard,
  PolicyViewer,
  AnnouncementsFeed,
  DocumentsAcknowledgeList,
  AnnouncementBoard,
  DocumentCenter,
  PolicyManager,
  SalarySlipForm,
} from "@/components/hr";
import type { ComponentRegistryEntry, GridLayout } from "@/types/dashboard";

// ============================================
// REGISTRY
// ============================================

export const componentRegistry: Record<string, ComponentRegistryEntry> = {
  Graph: {
    component: Graph,
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    label: "Chart",
    persona: ["employee", "manager", "hr"],
  },
  CheckInOutCard: {
    component: CheckInOutCard,
    defaultLayout: { x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
    label: "Check In / Out",
    persona: ["employee"],
  },
  LeaveBalanceCard: {
    component: LeaveBalanceCard,
    defaultLayout: { x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    label: "Leave Balance",
    persona: ["employee"],
  },
  LeaveRequestForm: {
    component: LeaveRequestForm,
    defaultLayout: { x: 0, y: 0, w: 5, h: 5, minW: 4, minH: 4 },
    label: "Leave Request",
    persona: ["employee"],
  },
  SalarySlipForm: {
    component: SalarySlipForm,
    defaultLayout: { x: 0, y: 0, w: 5, h: 4, minW: 4, minH: 3 },
    label: "Salary Slip",
    persona: ["employee"],
  },
  RequestStatusList: {
    component: RequestStatusList,
    defaultLayout: { x: 0, y: 0, w: 5, h: 4, minW: 4, minH: 3 },
    label: "My Requests",
    persona: ["employee"],
  },
  AttendanceTimeline: {
    component: AttendanceTimeline,
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    label: "Attendance History",
    persona: ["employee"],
  },
  RegularizationForm: {
    component: RegularizationForm,
    defaultLayout: { x: 0, y: 0, w: 5, h: 4, minW: 4, minH: 3 },
    label: "Regularization",
    persona: ["employee"],
  },
  ApprovalQueue: {
    component: ApprovalQueue,
    defaultLayout: { x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 3 },
    label: "Pending Approvals",
    persona: ["manager", "hr"],
  },
  TeamOverview: {
    component: TeamOverview,
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    label: "Team Overview",
    persona: ["manager"],
  },
  ApprovalDetail: {
    component: ApprovalDetail,
    defaultLayout: { x: 0, y: 0, w: 5, h: 4, minW: 4, minH: 3 },
    label: "Approval Detail",
    persona: ["manager", "hr"],
  },
  SystemDashboard: {
    component: SystemDashboard,
    defaultLayout: { x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 2 },
    label: "System Dashboard",
    persona: ["hr"],
  },
  PolicyViewer: {
    component: PolicyViewer,
    defaultLayout: { x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 3 },
    label: "Policies",
    persona: ["employee", "manager", "hr"],
  },
  AnnouncementsFeed: {
    component: AnnouncementsFeed,
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    label: "Announcements",
    persona: ["employee", "manager", "hr"],
  },
  DocumentsAcknowledgeList: {
    component: DocumentsAcknowledgeList,
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    label: "Documents",
    persona: ["employee", "manager", "hr"],
  },
  AnnouncementBoard: {
    component: AnnouncementBoard,
    defaultLayout: { x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 3 },
    label: "Announcement Board",
    persona: ["hr"],
  },
  DocumentCenter: {
    component: DocumentCenter,
    defaultLayout: { x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 3 },
    label: "Document Center",
    persona: ["hr"],
  },
  PolicyManager: {
    component: PolicyManager,
    defaultLayout: { x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 3 },
    label: "Policy Manager",
    persona: ["hr"],
  },
};

// ============================================
// HELPERS
// ============================================

/** Get the React component by registered name, or null */
export function getComponent(name: string): React.ComponentType<Record<string, unknown>> | null {
  return componentRegistry[name]?.component ?? null;
}

/** Get the default dashboard grid layout for a component */
export function getDefaultLayout(name: string): GridLayout {
  return (
    componentRegistry[name]?.defaultLayout ?? { x: 0, y: 0, w: 4, h: 3 }
  );
}

/** Get all registered component names */
export function getRegisteredComponentNames(): string[] {
  return Object.keys(componentRegistry);
}

/** Get display label for a component */
export function getComponentLabel(name: string): string {
  return componentRegistry[name]?.label ?? name;
}
