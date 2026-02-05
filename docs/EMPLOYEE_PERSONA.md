# 👤 Employee Persona Documentation

## Overview

The **Employee Persona** represents a regular employee in the Zoho People HR system. This persona has access to self-service HR functions including attendance management, leave requests, and request tracking.

**Mock User:** Priya Sharma (ZP-1001) - Engineering Department

---

## 🧩 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EMPLOYEE PERSONA                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │  CheckInOutCard  │    │ LeaveBalanceCard │    │ RequestStatus  │ │
│  │                  │    │                  │    │     List       │ │
│  │  • Check-in/out  │    │  • Leave types   │    │                │ │
│  │  • Status        │    │  • Balances      │    │  • Pending     │ │
│  │  • Hours worked  │    │  • Progress bars │    │  • History     │ │
│  └────────┬─────────┘    └────────┬─────────┘    └────────────────┘ │
│           │                       │                                  │
│           ▼                       ▼                                  │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │ Regularization   │    │ LeaveRequest     │                       │
│  │     Form         │    │     Form         │                       │
│  │                  │    │                  │                       │
│  │  • Date picker   │    │  • Type select   │                       │
│  │  • Time input    │    │  • Date range    │                       │
│  │  • Reason        │    │  • Reason        │                       │
│  └────────┬─────────┘    └────────┬─────────┘                       │
│           │                       │                                  │
│           └───────────┬───────────┘                                  │
│                       ▼                                              │
│           ┌──────────────────────┐                                   │
│           │  AttendanceTimeline  │                                   │
│           │                      │                                   │
│           │  • Weekly history    │                                   │
│           │  • Status badges     │                                   │
│           │  • Hours summary     │                                   │
│           └──────────────────────┘                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Components

### 1. CheckInOutCard
**Location:** `src/components/hr/employee/CheckInOutCard.tsx`

**Purpose:** Displays today's attendance status and allows check-in/check-out actions.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `status` | `"not_checked_in" \| "checked_in" \| "checked_out"` | Current attendance status |
| `checkInTime` | `string?` | Check-in time (HH:MM:SS) |
| `checkOutTime` | `string?` | Check-out time (HH:MM:SS) |
| `totalHours` | `string?` | Total hours worked (e.g., "8h 30m") |
| `onCheckIn` | `function?` | Callback for check-in action |
| `onCheckOut` | `function?` | Callback for check-out action |

**Tambo Integration:**
```typescript
// When rendered by Tambo without callbacks, uses useTambo hook
const tambo = useTambo();

const handleCheckIn = async () => {
  if (tambo?.sendThreadMessage) {
    await tambo.sendThreadMessage("Check me in for today", { streamResponse: true });
  }
};
```

**Connected Tools:**
- `submitCheckInOut` - Called when employee clicks check-in/out button

---

### 2. LeaveBalanceCard
**Location:** `src/components/hr/employee/LeaveBalanceCard.tsx`

**Purpose:** Shows all leave balances with visual progress indicators.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `balances` | `LeaveBalanceInfo[]` | Array of leave type balances |
| `onApplyLeave` | `function?` | Callback to apply for a specific leave type |

**Data Structure:**
```typescript
interface LeaveBalanceInfo {
  leaveType: string;    // "casual", "sick", "earned", "wfh", "comp_off"
  totalDays: number;    // Total allocated days
  usedDays: number;     // Days used
  remainingDays: number;// Days remaining
  label: string;        // Display name
}
```

**Connected Tools:**
- `getLeaveBalance` - Fetches leave balance data

---

### 3. LeaveRequestForm
**Location:** `src/components/hr/employee/LeaveRequestForm.tsx`

**Purpose:** Form for submitting leave requests with type selection and date range.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `balances` | `LeaveBalanceInfo[]` | Available leave balances |
| `preselectedType` | `string?` | Pre-selected leave type |
| `onSubmit` | `function?` | Submit callback |
| `onCancel` | `function?` | Cancel callback |

**Tambo Integration:**
```typescript
const handleSubmit = async () => {
  if (tambo?.sendThreadMessage) {
    await tambo.sendThreadMessage(
      `Submit my leave request: ${leaveLabel} from ${startDate} to ${endDate}. Reason: ${reason}`,
      { streamResponse: true }
    );
  }
};
```

**Connected Tools:**
- `submitLeaveRequest` - Processes leave request submission

---

### 4. RequestStatusList
**Location:** `src/components/hr/employee/RequestStatusList.tsx`

**Purpose:** Shows status of pending and past requests.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `requests` | `RequestStatus[]` | Array of requests |
| `maxHeight` | `number?` | Maximum scroll height |

**Status Types:** `pending`, `approved`, `rejected`

---

### 5. AttendanceTimeline
**Location:** `src/components/hr/employee/AttendanceTimeline.tsx`

**Purpose:** Visual timeline of attendance history.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `records` | `AttendanceRecord[]` | Attendance records |
| `maxItems` | `number?` | Max items to display |

**Status Types:** `present`, `absent`, `half_day`, `wfh`, `on_leave`, `holiday`, `regularization_pending`

**Connected Tools:**
- `getAttendanceStatus` - Fetches attendance history

---

### 6. RegularizationForm
**Location:** `src/components/hr/employee/RegularizationForm.tsx`

**Purpose:** Form to request attendance regularization for missed check-ins/outs.

**Tambo Integration:**
```typescript
const handleSubmit = async () => {
  if (tambo?.sendThreadMessage) {
    await tambo.sendThreadMessage(
      `Submit my regularization request for ${date}. Type: ${requestType}. Time: ${requestedTime}. Reason: ${reason}`,
      { streamResponse: true }
    );
  }
};
```

**Connected Tools:**
- `submitRegularization` - Processes regularization request

---

## 🔧 Tools Available

| Tool | Description | Trigger Phrases |
|------|-------------|-----------------|
| `getAttendanceStatus` | Fetch attendance data | "Show my attendance", "Am I checked in?" |
| `submitCheckInOut` | Clock in/out | "Check me in", "Clock out" |
| `submitRegularization` | Submit regularization | "I forgot to check out", "Regularize my attendance" |
| `getLeaveBalance` | Fetch leave balances | "Show my leave balance", "How many leaves do I have?" |
| `submitLeaveRequest` | Apply for leave | "Apply for leave", "I want to take 2 days off" |

---

## 🔄 Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Tambo AI  │────▶│  Tools      │────▶│  hr-data.ts     │
│   (Chat)    │     │  (tambo.ts) │     │  (Mock Service) │
└─────────────┘     └─────────────┘     └─────────────────┘
       │                   │                     │
       │                   │                     │
       ▼                   ▼                     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Component  │◀────│  Props      │◀────│  Data Response  │
│  Render     │     │  Schema     │     │                 │
└─────────────┘     └─────────────┘     └─────────────────┘
       │
       │ User Action (button click)
       ▼
┌─────────────┐
│ useTambo()  │
│ sendThread  │───▶ Back to Tambo AI
│ Message     │
└─────────────┘
```

---

## 📱 Context Provided

The `TamboWrapper` automatically provides this context for employee:

```typescript
{
  current_user: {
    employeeId: "ZP-1001",
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    role: "employee",
    department: "Engineering",
    managerId: "mgr-001"
  },
  user_context: {
    isCheckedInToday: false,
    hasMissedCheckout: true,
    missedCheckoutDate: "2026-02-04",
    pendingApprovals: 0,
    notifications: 2
  },
  persona_info: {
    currentPersona: "employee",
    canViewTeam: false,
    canApprove: false,
    canViewSystemDashboard: false
  }
}
```

---

## 💬 Sample Conversations

### Checking Attendance Status
```
User: "Show my attendance status"
AI: [Calls getAttendanceStatus tool]
    [Renders CheckInOutCard + AttendanceTimeline]
```

### Applying for Leave
```
User: "I want to apply for casual leave next Monday"
AI: [Calls getLeaveBalance tool first]
    [Renders LeaveRequestForm with balances]
User: [Fills form and clicks Submit]
Form: [Sends "Submit my leave request..." via sendThreadMessage]
AI: [Calls submitLeaveRequest tool]
    [Confirms submission]
```

### Regularizing Attendance
```
User: "I forgot to check out yesterday"
AI: [Renders RegularizationForm]
User: [Fills form and submits]
AI: [Calls submitRegularization tool]
    [Confirms request sent to manager]
```

---

## 🎨 Component Styling

All employee components use:
- **Tailwind CSS** for styling
- **shadcn/ui** components (Card, Button, Input, Select, etc.)
- **Lucide React** icons
- Consistent color scheme:
  - Blue (#3B82F6) - Check-in actions
  - Green (#10B981) - Success states
  - Red (#EF4444) - Errors/Warnings
  - Purple (#8B5CF6) - Regularization
