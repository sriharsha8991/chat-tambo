# Component Catalog

> Complete reference for all registered UI components, their props, schemas, and persona mapping.

---

## Table of Contents

- [Overview](#overview)
- [Component Registry](#component-registry)
- [Employee Components](#employee-components)
- [Manager Components](#manager-components)
- [HR Admin Components](#hr-admin-components)
- [Shared Components](#shared-components)
- [Visualization Components](#visualization-components)
- [Tool-to-Component Mapping](#tool-to-component-mapping)
- [Dashboard Presets](#dashboard-presets)
- [Adding New Components](#adding-new-components)

---

## Overview

The system registers **19 components** that the AI can render based on user intent and persona. Components are defined in two places:

| Registry | File | Purpose |
|----------|------|---------|
| Component Registry | `src/lib/component-registry.ts` | React component reference, grid layout, label, persona |
| Tambo Registry | `src/lib/tambo.ts` | AI description, Zod props schema |

Components are organized by persona in `src/components/hr/`:

```
src/components/hr/
├── employee/       # 7 components
├── manager/        # 3 components
├── admin/          # 5 components
└── shared/         # 6 components (cross-persona)
```

---

## Component Registry

Every component is registered in `componentRegistry` with:

```typescript
interface ComponentRegistryEntry {
  component: React.ComponentType;        // The React component
  defaultLayout: GridLayout;              // Default dashboard position
  label: string;                          // Display label
  persona: PersonaRole[];                 // Which personas can access
}
```

### Full Registry Table

| Name | Label | Grid Size | Persona Access |
|------|-------|-----------|----------------|
| `Graph` | Chart | 6×4 | All |
| `CheckInOutCard` | Check In / Out | 4×3 | Employee |
| `LeaveBalanceCard` | Leave Balance | 4×4 | Employee |
| `LeaveRequestForm` | Leave Request | 5×5 | Employee |
| `SalarySlipForm` | Salary Slip | 5×4 | Employee |
| `RequestStatusList` | My Requests | 5×4 | Employee |
| `AttendanceTimeline` | Attendance History | 6×4 | Employee |
| `RegularizationForm` | Regularization | 5×4 | Employee |
| `EmployeeDirectory` | Employee Directory | 12×5 | Manager, HR |
| `ApprovalQueue` | Pending Approvals | 6×5 | Manager, HR |
| `ApprovalDetail` | Approval Detail | 5×4 | Manager, HR |
| `TeamOverview` | Team Overview | 6×4 | Manager |
| `SystemDashboard` | System Dashboard | 12×3 | HR |
| `PolicyViewer` | Policies | 6×5 | All |
| `PolicyManager` | Policy Manager | 6×5 | HR |
| `AnnouncementsFeed` | Announcements | 6×4 | All |
| `AnnouncementBoard` | Announcement Board | 6×5 | HR |
| `DocumentCenter` | Document Center | 6×5 | HR |
| `DocumentsAcknowledgeList` | Documents | 6×4 | All |

---

## Employee Components

### CheckInOutCard

**File:** `src/components/hr/employee/CheckInOutCard.tsx`

Displays today's attendance status with check-in/check-out action buttons.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `"not_checked_in" \| "checked_in" \| "checked_out"` | Yes | Current attendance status |
| `checkInTime` | `string` | No | Check-in time (HH:MM:SS) |
| `checkOutTime` | `string` | No | Check-out time (HH:MM:SS) |
| `totalHours` | `string` | No | Total hours worked (e.g., "8h 30m") |
| `employeeId` | `string` | No | Employee ID for action callbacks |

**AI Trigger Phrases:**
- "Check me in for today"
- "Mark my attendance"
- "What's my check-in status?"

**Connected Tools:** `getAttendanceStatus`, `submitCheckInOut`

---

### LeaveBalanceCard

**File:** `src/components/hr/employee/LeaveBalanceCard.tsx`

Shows all leave type balances with visual progress bars.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `balances` | `LeaveBalanceInfo[]` | Yes | Array of leave type balances |

**LeaveBalanceInfo:**

```typescript
{
  leaveType: string;      // "casual", "sick", "earned", "wfh", "comp_off"
  totalDays: number;      // Total allocated days
  usedDays: number;       // Days used
  remainingDays: number;  // Days remaining
  label: string;          // Display label (e.g., "Casual Leave")
}
```

**AI Trigger Phrases:**
- "Show my leave balance"
- "How many leaves do I have?"
- "What's my remaining casual leave?"

**Connected Tool:** `getLeaveBalance`

---

### LeaveRequestForm

**File:** `src/components/hr/employee/LeaveRequestForm.tsx`

Form for submitting leave applications with type selection, date range, and reason.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `balances` | `LeaveBalanceInfo[]` | Yes | Available leave balances |
| `preselectedType` | `string` | No | Pre-selected leave type |

**AI Trigger Phrases:**
- "Apply for 2 days casual leave from Feb 20"
- "I want to take sick leave tomorrow"
- "Request WFH for next Friday"

**Connected Tool:** `submitLeaveRequest`

---

### SalarySlipForm

**File:** `src/components/hr/shared/SalarySlipForm.tsx`

Quick form to download salary slips by month with single/multi-month mode.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `employeeName` | `string` | No | Name shown on slip |
| `employeeId` | `string` | No | Employee ID on slip |
| `department` | `string` | No | Department name |
| `defaultMode` | `"single" \| "multiple"` | No | Default selection mode |
| `defaultMonth` | `string` | No | Default month (MM) |
| `defaultYear` | `number` | No | Default year (YYYY) |

**AI Trigger Phrases:**
- "Show my salary slip"
- "Download payslip for January"

---

### RequestStatusList

**File:** `src/components/hr/employee/RequestStatusList.tsx`

List of pending and past requests with status badges.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `requests` | `RequestStatus[]` | Yes | Array of requests |
| `maxHeight` | `number` | No | Scroll container max height |

**RequestStatus:**

```typescript
{
  id: string;
  type: "leave" | "regularization" | "wfh";
  title: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  details: string;
}
```

**AI Trigger Phrases:**
- "Show my pending requests"
- "What's the status of my leave request?"

---

### AttendanceTimeline

**File:** `src/components/hr/employee/AttendanceTimeline.tsx`

Timeline view of attendance records with daily check-in/out times and status.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `records` | `AttendanceRecord[]` | Yes | Array of attendance records |
| `maxItems` | `number` | No | Max items to display |

**AttendanceRecord:**

```typescript
{
  date: string;           // YYYY-MM-DD
  checkIn?: string;       // HH:MM
  checkOut?: string;      // HH:MM
  totalHours?: string;    // "8h 30m"
  status: "present" | "absent" | "half_day" | "wfh" | "on_leave" | "holiday" | "regularization_pending";
  notes?: string;
}
```

**AI Trigger Phrases:**
- "Show my attendance this week"
- "Show my attendance history"

**Connected Tool:** `getAttendanceStatus`

---

### RegularizationForm

**File:** `src/components/hr/employee/RegularizationForm.tsx`

Form for submitting attendance corrections (missed check-in/checkout).

**Props Schema:** Empty object (form manages its own state).

**AI Trigger Phrases:**
- "I forgot to check out yesterday"
- "Regularize my attendance for Feb 14"
- "Submit a regularization request"

**Connected Tool:** `submitRegularization`

---

### EmployeeDirectory

**File:** `src/components/hr/employee/EmployeeDirectory.tsx`

Searchable, department-grouped employee card grid with avatar, role badges, and contact info.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `department` | `string` | No | Filter by department |
| `role` | `"employee" \| "manager" \| "hr"` | No | Filter by role |
| `maxItems` | `number` | No | Max employees to display |

**Features:**
- Search by name, email, department, or employee ID
- Department-grouped cards
- Color-coded role badges
- Avatar with initials

**AI Trigger Phrases:**
- "Show the employee directory"
- "Find employees in Engineering"

---

## Manager Components

### ApprovalQueue

**File:** `src/components/hr/manager/ApprovalQueue.tsx`

List of pending approval requests from team members.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `approvals` | `ApprovalItem[]` | Yes | Array of pending approvals |

**ApprovalItem:**

```typescript
{
  id: string;
  type: "leave" | "regularization" | "wfh";
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  details: string;
  submittedAt: string;
  priority: "normal" | "urgent";
}
```

**AI Trigger Phrases:**
- "Show my pending approvals"
- "What requests need my attention?"

**Connected Tool:** `getPendingApprovals`

---

### ApprovalDetail

**File:** `src/components/hr/manager/ApprovalDetail.tsx`

Detailed view of a single approval with employee info and approve/reject buttons.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `approval` | `ApprovalItem` | Yes | The approval to display |
| `isLoading` | `boolean` | No | Loading state |

**AI Trigger Phrases:**
- "Approve Priya's leave request"
- "Show details of the pending regularization"

**Connected Tool:** `processApproval`

---

### TeamOverview

**File:** `src/components/hr/manager/TeamOverview.tsx`

Dashboard showing team members with current status badges (In Office, WFH, On Leave, Offline).

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `members` | `TeamMember[]` | Yes | Array of team members |

**TeamMember:**

```typescript
{
  id: string;
  employeeId: string;
  name: string;
  status: "available" | "on_leave" | "wfh" | "offline";
  todayAttendance?: {
    checkIn?: string;
    checkOut?: string;
  };
}
```

**AI Trigger Phrases:**
- "Show my team's status today"
- "Who is in office?"

---

## HR Admin Components

### SystemDashboard

**File:** `src/components/hr/admin/SystemDashboard.tsx`

Organization-wide metric cards with trend indicators.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `metrics` | `SystemMetrics` | Yes | Current system metrics |
| `previousMetrics` | `SystemMetrics` | No | Previous period for trends |

**SystemMetrics:**

```typescript
{
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingApprovals: number;
  complianceScore: number;   // 0-100
  escalations: number;
}
```

**Features:**
- 6 metric cards in responsive grid
- Trend indicators (up/down arrows with percentages)
- Color-coded: green (positive), red (negative/urgent), blue (neutral)

**AI Trigger Phrases:**
- "Show the HR dashboard"
- "What are the current system metrics?"

---

### PolicyViewer

**File:** `src/components/hr/admin/PolicyViewer.tsx`

Searchable policy display with category badges.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `policies` | `PolicyDocument[]` | Yes | Policies to display |
| `searchQuery` | `string` | No | Pre-filled search |
| `showSearch` | `boolean` | No | Show search input |
| `density` | `"compact" \| "comfortable"` | No | Visual density |
| `maxItems` | `number` | No | Max items |

**AI Trigger Phrases:**
- "What is the leave policy?"
- "Show me the WFH guidelines"
- "Search for attendance policy"

**Connected Tool:** `searchPolicies`

---

### PolicyManager

**File:** `src/components/hr/admin/PolicyManager.tsx`

Full CRUD management interface for policies.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `policies` | `PolicyDocument[]` | Yes | Policies to manage |
| `canCreate` | `boolean` | No | Show create form |
| `canEdit` | `boolean` | No | Allow editing |
| `canDelete` | `boolean` | No | Allow deletion |

---

### AnnouncementBoard

**File:** `src/components/hr/admin/AnnouncementBoard.tsx`

Announcement creation and management interface.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `announcements` | `Announcement[]` | Yes | Announcements to manage |
| `canPost` | `boolean` | No | Show post form |
| `canDelete` | `boolean` | No | Allow deletion |

---

### DocumentCenter

**File:** `src/components/hr/admin/DocumentCenter.tsx`

Document upload (PDF) and management interface.

**Props Schema:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `documents` | `DocumentItem[]` | Yes | Documents to manage |
| `canUpload` | `boolean` | No | Show upload form |
| `canDelete` | `boolean` | No | Allow deletion |

---

## Shared Components

These components are used across multiple personas:

### AnnouncementsFeed

**File:** `src/components/hr/shared/AnnouncementsFeed.tsx`

Read-only announcement feed with pinned items shown first. Available to all personas.

### DocumentsAcknowledgeList

**File:** `src/components/hr/shared/DocumentsAcknowledgeList.tsx`

Document list with acknowledgment buttons. Tracks which documents the employee has acknowledged.

### StatusBadge

**File:** `src/components/hr/shared/StatusBadge.tsx`

Reusable status badge component with color-coded labels (pending=yellow, approved=green, rejected=red).

### LoadingCard

**File:** `src/components/hr/shared/LoadingCard.tsx`

Skeleton loading card for data-fetching states.

### EmptyState

**File:** `src/components/hr/shared/EmptyState.tsx`

Configurable empty state with icon, title, and description.

---

## Visualization Components

### Graph

**File:** `src/components/tambo/graph.tsx`

Recharts-powered chart component supporting multiple chart types.

**Props Schema (`graphSchema`):**

| Prop | Type | Description |
|------|------|-------------|
| `data` | `Array<Record<string, unknown>>` | Chart data points |
| `xKey` | `string` | X-axis data key |
| `yKeys` | `string[]` | Y-axis data keys |
| `type` | `"bar" \| "line" \| "area" \| "pie"` | Chart type |
| `title` | `string` | Chart title |
| `colors` | `string[]` | Custom colors |
| `height` | `number` | Chart height |
| `stacked` | `boolean` | Stacked bars/areas |

**AI Trigger Phrases:**
- "Show attendance trends chart"
- "Show department distribution pie chart"
- "Visualize leave usage over time"

**Connected Tools:** `getAttendanceTrends`, `getLeaveAnalytics`, `getTeamMetrics`, `getHRAnalytics`

---

## Tool-to-Component Mapping

When a tool is called, the AI typically renders one of these associated components:

| Tool | Primary Component | Alternative |
|------|-------------------|-------------|
| `getAttendanceStatus` | `CheckInOutCard` | `AttendanceTimeline` |
| `submitCheckInOut` | `CheckInOutCard` | — |
| `submitRegularization` | `RegularizationForm` | — |
| `getLeaveBalance` | `LeaveBalanceCard` | `LeaveRequestForm` |
| `submitLeaveRequest` | `RequestStatusList` | — |
| `getPendingApprovals` | `ApprovalQueue` | — |
| `processApproval` | `ApprovalDetail` | — |
| `searchPolicies` | `PolicyViewer` | — |
| `getAttendanceTrends` | `Graph` (bar/line) | — |
| `getLeaveAnalytics` | `Graph` (pie/line) | — |
| `getTeamMetrics` | `Graph` (bar) | `TeamOverview` |
| `getHRAnalytics` | `Graph` (bar/pie/line) | `SystemDashboard` |

---

## Dashboard Presets

First-time users get auto-seeded dashboards:

### Employee Preset

| Widget | Query ID | Grid Position |
|--------|----------|---------------|
| CheckInOutCard | `attendanceStatus` | (0,0) 4×3 |
| LeaveBalanceCard | `leaveBalance` | (4,0) 4×3 |
| RequestStatusList | `requestStatus` | (8,0) 4×3 |
| AnnouncementsFeed | `announcements` | (0,3) 6×4 |

### Manager Preset

| Widget | Query ID | Grid Position |
|--------|----------|---------------|
| ApprovalQueue | `pendingApprovals` | (0,0) 6×5 |
| TeamOverview | `teamMembers` | (6,0) 6×4 |
| AnnouncementsFeed | `announcements` | (0,5) 6×4 |

### HR Preset

| Widget | Query ID | Grid Position |
|--------|----------|---------------|
| SystemDashboard | `systemMetrics` | (0,0) 12×3 |
| ApprovalQueue | `pendingApprovals` | (0,3) 6×5 |
| Graph | `hrAnalytics` (departmentDistribution) | (6,3) 6×4 |

---

## Adding New Components

### Step 1: Create the Component

```typescript
// src/components/hr/employee/MyNewComponent.tsx
"use client";
import { z } from "zod";

export const myNewComponentSchema = z.object({
  title: z.string().describe("Component title"),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).describe("Data items"),
});

type Props = z.infer<typeof myNewComponentSchema>;

export function MyNewComponent({ title, items }: Props) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Step 2: Export from Barrel

```typescript
// src/components/hr/employee/index.ts
export { MyNewComponent } from "./MyNewComponent";

// src/components/hr/index.ts
export { MyNewComponent } from "./employee";
```

### Step 3: Register in Component Registry

```typescript
// src/lib/component-registry.ts
import { MyNewComponent } from "@/components/hr";

export const componentRegistry = {
  // ... existing components
  MyNewComponent: {
    component: MyNewComponent,
    defaultLayout: { x: 0, y: 0, w: 5, h: 4, minW: 4, minH: 3 },
    label: "My Widget",
    persona: ["employee"],
  },
};
```

### Step 4: Register with Tambo AI

```typescript
// src/lib/tambo.ts
export const components: TamboComponent[] = [
  // ... existing components
  {
    name: "MyNewComponent",
    description: "AI-facing description of when to use this component...",
    component: comp("MyNewComponent"),
    propsSchema: myNewComponentSchema,
  },
];
```

### Step 5: (Optional) Add Query Resolution

If the component needs a `queryId` for dashboard usage:

```typescript
// src/services/query-resolver.ts
const QUERY_MAP = {
  // ... existing
  myQuery: (p) => unified.myNewFunction(p.someParam),
};
```
