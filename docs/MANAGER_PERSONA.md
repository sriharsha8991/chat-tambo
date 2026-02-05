# 👔 Manager Persona Documentation

## Overview

The **Manager Persona** represents a team lead or manager in the Zoho People HR system. This persona has access to team management functions, approval workflows, and team visibility, in addition to basic employee functions.

**Mock User:** Rajesh Kumar (ZP-0501) - Engineering Department Manager

---

## 🧩 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MANAGER PERSONA                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      ApprovalQueue                            │   │
│  │                                                               │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │   │ Leave Req   │  │ Regularize  │  │ WFH Request │         │   │
│  │   │ from Priya  │  │ from Amit   │  │ from Sneha  │  ...    │   │
│  │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │   │
│  │          │                │                │                  │   │
│  │          └────────────────┼────────────────┘                  │   │
│  │                           ▼                                   │   │
│  └───────────────────────────┬───────────────────────────────────┘   │
│                              │                                       │
│                              │ Click for Details                     │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     ApprovalDetail                            │   │
│  │                                                               │   │
│  │   Employee: Priya Sharma                                     │   │
│  │   Request: Casual Leave - Feb 10-11                          │   │
│  │   Reason: Family function                                    │   │
│  │                                                               │   │
│  │   ┌─────────────┐         ┌─────────────┐                   │   │
│  │   │   Approve   │         │   Reject    │                   │   │
│  │   └──────┬──────┘         └──────┬──────┘                   │   │
│  │          │                       │                           │   │
│  │          └───────────┬───────────┘                           │   │
│  │                      ▼                                       │   │
│  │              sendThreadMessage()                             │   │
│  │              → Tambo AI                                      │   │
│  │              → processApproval tool                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      TeamOverview                             │   │
│  │                                                               │   │
│  │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │   │
│  │   │ PS  │ │ AP  │ │ SR  │ │ VS  │ │ KN  │                   │   │
│  │   │ 🟢  │ │ 🟡  │ │ 🔵  │ │ 🟢  │ │ ⚫  │                   │   │
│  │   │ In  │ │ WFH │ │Leave│ │ In  │ │ Off │                   │   │
│  │   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                   │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  + ALL EMPLOYEE COMPONENTS (inherited)                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Components

### 1. ApprovalQueue
**Location:** `src/components/hr/manager/ApprovalQueue.tsx`

**Purpose:** Displays a list of pending approval requests from team members with quick approve/reject actions.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `approvals` | `ApprovalItem[]` | Array of pending approvals |
| `onApprove` | `function?` | Callback for approve action |
| `onReject` | `function?` | Callback for reject action |
| `onViewDetails` | `function?` | Callback to view details |

**Data Structure:**
```typescript
interface ApprovalItem {
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

**Tambo Integration:**
```typescript
const tambo = useTambo();

const handleApprove = async (approval: ApprovalItem) => {
  if (tambo?.sendThreadMessage) {
    await tambo.sendThreadMessage(
      `Approve ${approval.employeeName}'s ${approval.type} request (ID: ${approval.id}): ${approval.title}`,
      { streamResponse: true }
    );
    setMessage({ type: "success", text: `Approved ${approval.employeeName}'s request` });
  }
};

const handleReject = async (approval: ApprovalItem) => {
  if (tambo?.sendThreadMessage) {
    await tambo.sendThreadMessage(
      `Reject ${approval.employeeName}'s ${approval.type} request (ID: ${approval.id}): ${approval.title}`,
      { streamResponse: true }
    );
  }
};
```

**Features:**
- Badge showing total pending count
- Urgent request highlighting (red border)
- Scrollable list for many items
- Loading states during actions
- Success/error message display

**Connected Tools:**
- `getPendingApprovals` - Fetches pending items
- `processApproval` - Processes approve/reject

---

### 2. ApprovalDetail
**Location:** `src/components/hr/manager/ApprovalDetail.tsx`

**Purpose:** Detailed view of a single approval request with full information and action buttons.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `approval` | `ApprovalItem` | The approval item to display |
| `onApprove` | `function?` | Approve callback |
| `onReject` | `function?` | Reject callback |
| `onBack` | `function?` | Back navigation callback |
| `isLoading` | `boolean?` | Loading state |

**Tambo Integration:**
```typescript
const tambo = useTambo();

const handleAction = async (selectedAction: "approve" | "reject") => {
  setAction(selectedAction);
  
  if (selectedAction === "approve") {
    if (tambo?.sendThreadMessage) {
      const msg = comment 
        ? `Approve ${approval.employeeName}'s ${type.label} request (ID: ${approval.id}) with comment: ${comment}`
        : `Approve ${approval.employeeName}'s ${type.label} request (ID: ${approval.id})`;
      await tambo.sendThreadMessage(msg, { streamResponse: true });
    }
  } else {
    if (tambo?.sendThreadMessage) {
      const msg = comment 
        ? `Reject ${approval.employeeName}'s ${type.label} request (ID: ${approval.id}) with reason: ${comment}`
        : `Reject ${approval.employeeName}'s ${type.label} request (ID: ${approval.id})`;
      await tambo.sendThreadMessage(msg, { streamResponse: true });
    }
  }
};
```

**Features:**
- Employee avatar and info
- Request type icon with color coding
- Date/time formatting
- Optional comment field
- Dual action buttons

**Connected Tools:**
- `processApproval` - Triggered via Tambo message

---

### 3. TeamOverview
**Location:** `src/components/hr/manager/TeamOverview.tsx`

**Purpose:** Dashboard showing team members' current status and availability.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `members` | `TeamMember[]` | Array of team members |

**Data Structure:**
```typescript
interface TeamMember {
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

**Status Display:**
| Status | Icon | Color |
|--------|------|-------|
| Available | 🟢 | Green |
| WFH | 🟡 | Yellow |
| On Leave | 🔵 | Blue |
| Offline | ⚫ | Gray |

**Features:**
- Grid layout of team members
- Avatar with initials
- Status badge
- Check-in time display
- Team statistics summary

---

## 🔧 Tools Available

| Tool | Description | Trigger Phrases |
|------|-------------|-----------------|
| `getPendingApprovals` | Fetch pending requests | "Show pending approvals", "What needs my attention?" |
| `processApproval` | Approve or reject | "Approve Priya's leave", "Reject the regularization" |
| + All Employee Tools | Inherited | Same as employee |

---

## 🔄 Approval Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPROVAL WORKFLOW                             │
└─────────────────────────────────────────────────────────────────┘

   Employee                    Tambo AI                    Manager
      │                           │                           │
      │  "Apply for leave"        │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │  LeaveRequestForm         │                           │
      │◀──────────────────────────┤                           │
      │                           │                           │
      │  [Fills & Submits]        │                           │
      ├──────────────────────────▶│                           │
      │                           │                           │
      │                           │  submitLeaveRequest()     │
      │                           ├────────────────────────────┤
      │                           │                            │
      │                           │  (Request stored)          │
      │                           │◀───────────────────────────┤
      │                           │                           │
      │  "Request submitted"      │                           │
      │◀──────────────────────────┤                           │
      │                           │                           │
      │                           │                           │
      │                           │  "Show pending approvals" │
      │                           │◀──────────────────────────┤
      │                           │                           │
      │                           │  getPendingApprovals()    │
      │                           ├───────────────────────────▶│
      │                           │                           │
      │                           │  ApprovalQueue            │
      │                           ├──────────────────────────▶│
      │                           │                           │
      │                           │  [Manager clicks Approve] │
      │                           │◀──────────────────────────┤
      │                           │                           │
      │                           │  processApproval()        │
      │                           ├───────────────────────────▶│
      │                           │                           │
      │  (Status updated)         │  "Approved successfully"  │
      │◀──────────────────────────┤──────────────────────────▶│
      │                           │                           │
```

---

## 📱 Context Provided

The `TamboWrapper` automatically provides this context for manager:

```typescript
{
  current_user: {
    employeeId: "ZP-0501",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@company.com",
    role: "manager",
    department: "Engineering",
    managerId: undefined
  },
  user_context: {
    isCheckedInToday: true,
    hasMissedCheckout: false,
    pendingApprovals: 5,
    notifications: 5
  },
  persona_info: {
    currentPersona: "manager",
    canViewTeam: true,
    canApprove: true,
    canViewSystemDashboard: false,
    canManagePolicies: false
  }
}
```

---

## 💬 Sample Conversations

### Viewing Pending Approvals
```
User: "Show my pending approvals"
AI: [Calls getPendingApprovals tool with managerId]
    [Renders ApprovalQueue with 5 items]
```

### Quick Approve from Queue
```
User: [Clicks Approve on Priya's leave request in ApprovalQueue]
Component: [Sends "Approve Priya Sharma's leave request (ID: req-001)" via sendThreadMessage]
AI: [Calls processApproval tool]
    [Shows success message]
```

### Detailed Review and Reject
```
User: "Show me details of Amit's regularization request"
AI: [Renders ApprovalDetail for Amit's request]
User: [Enters comment "Please submit on time next time" and clicks Reject]
Component: [Sends "Reject Amit Patel's Regularization request with reason: Please submit on time..." via sendThreadMessage]
AI: [Calls processApproval with action=reject]
    [Confirms rejection]
```

### Team Visibility
```
User: "Who's in office today?"
AI: [Renders TeamOverview component]
    Shows: Priya (Available), Amit (WFH), Sneha (On Leave), etc.
```

---

## 🔗 Component Relationships

```
                    ┌─────────────────┐
                    │ TamboProvider   │
                    │ (contextHelpers)│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  PersonaContext │
                    │  (role=manager) │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ Approval    │   │ Approval    │   │ Team        │
    │ Queue       │◀─▶│ Detail      │   │ Overview    │
    └──────┬──────┘   └──────┬──────┘   └─────────────┘
           │                 │
           │    useTambo()   │
           ▼                 ▼
    ┌─────────────────────────────┐
    │    sendThreadMessage()      │
    │    "Approve/Reject..."      │
    └──────────────┬──────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │      Tambo AI               │
    │      processApproval tool   │
    └─────────────────────────────┘
```

---

## 🎨 Component Styling

Manager-specific styling:
- **Blue (#3B82F6)** - Leave requests
- **Purple (#8B5CF6)** - Regularization requests  
- **Green (#10B981)** - WFH requests, Approve button
- **Red (#EF4444)** - Urgent badges, Reject button
- **Amber (#F59E0B)** - Warning states

Priority Indicators:
- Normal: Standard border
- Urgent: Red border + red badge + highlighted background
