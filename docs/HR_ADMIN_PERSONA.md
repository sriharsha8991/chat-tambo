# 🏢 HR Admin Persona Documentation

## Overview

The **HR Admin Persona** represents an HR administrator in the Zoho People HR system. This persona has the highest level of access including system-wide dashboards, policy management, cross-department visibility, and all manager/employee functions.

**Mock User:** Ananya Patel (ZP-0101) - Human Resources Department

---

## 🧩 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HR ADMIN PERSONA                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     SystemDashboard                           │   │
│  │                                                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │   │
│  │  │ Total    │ │ Present  │ │ On Leave │ │ Pending  │        │   │
│  │  │ Employees│ │ Today    │ │ Today    │ │ Approvals│        │   │
│  │  │   247    │ │   189    │ │   23     │ │   12     │        │   │
│  │  │   +3     │ │  -5.2%   │ │  +8.3%   │ │  +4      │        │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │   │
│  │                                                               │   │
│  │  ┌──────────┐ ┌──────────┐                                   │   │
│  │  │Compliance│ │Escalation│                                   │   │
│  │  │ Score    │ │ Count    │                                   │   │
│  │  │   92%    │ │    3     │                                   │   │
│  │  │  +2.1%   │ │   -1     │                                   │   │
│  │  └──────────┘ └──────────┘                                   │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      PolicyViewer                             │   │
│  │                                                               │   │
│  │  🔍 Search: [leave policy________________] [Search]          │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ 📋 Leave Policy                         Updated: Jan 15 │ │   │
│  │  │ Category: HR Policies                                   │ │   │
│  │  │                                                         │ │   │
│  │  │ Employees are entitled to:                              │ │   │
│  │  │ • 12 days Casual Leave                                  │ │   │
│  │  │ • 6 days Sick Leave                                     │ │   │
│  │  │ • 15 days Earned Leave                                  │ │   │
│  │  │ ...                                                     │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ 📋 Attendance Guidelines                 Updated: Dec 1 │ │   │
│  │  │ Category: Attendance                                    │ │   │
│  │  │ ...                                                     │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  + ALL MANAGER COMPONENTS (inherited)                               │
│  + ALL EMPLOYEE COMPONENTS (inherited)                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Components

### 1. SystemDashboard
**Location:** `src/components/hr/admin/SystemDashboard.tsx`

**Purpose:** High-level dashboard showing organization-wide HR metrics with trend indicators.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `metrics` | `SystemMetrics` | Current system metrics |
| `previousMetrics` | `SystemMetrics?` | Previous period for comparison |

**Data Structure:**
```typescript
interface SystemMetrics {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingApprovals: number;
  complianceScore: number;  // Percentage 0-100
  escalations: number;
}
```

**Features:**
- 6 metric cards in responsive grid
- Trend indicators (up/down arrows with percentages)
- Color-coded metrics:
  - Green: Positive trends
  - Red: Negative trends / Escalations
  - Blue: Neutral information
- Real-time summary of HR operations

**Metric Cards:**

| Metric | Icon | Description |
|--------|------|-------------|
| Total Employees | Users | Organization headcount |
| Present Today | UserCheck | Currently checked-in |
| On Leave | Calendar | On approved leave |
| Pending Approvals | ClipboardList | Awaiting manager/HR action |
| Compliance Score | Shield | Policy compliance percentage |
| Escalations | AlertTriangle | Issues requiring attention |

---

### 2. PolicyViewer
**Location:** `src/components/hr/admin/PolicyViewer.tsx`

**Purpose:** Searchable interface for viewing and finding HR policies and documents.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `policies` | `PolicyDocument[]` | Array of policies |
| `searchQuery` | `string?` | Pre-filled search query |

**Data Structure:**
```typescript
interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}
```

**Policy Categories:**
- HR Policies (Leave, Conduct, Benefits)
- Attendance (Check-in rules, WFH, Regularization)
- Compliance (Legal requirements, Audits)
- Operations (Processes, Workflows)

**Features:**
- Full-text search across titles and content
- Category filtering
- Collapsible policy cards
- Last updated timestamps
- Responsive design for reading

**Connected Tools:**
- `searchPolicies` - Searches and returns matching policies

---

## 🔧 Tools Available

| Tool | Description | Trigger Phrases |
|------|-------------|-----------------|
| `searchPolicies` | Search HR policies | "What's the leave policy?", "Show WFH guidelines" |
| + All Manager Tools | Inherited | Same as manager |
| + All Employee Tools | Inherited | Same as employee |

---

## 🔄 Policy Search Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   POLICY SEARCH WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

      User                        Tambo AI                   
        │                            │                        
        │  "What is the WFH policy?" │                        
        ├───────────────────────────▶│                        
        │                            │                        
        │                            │  searchPolicies({      
        │                            │    query: "WFH policy" 
        │                            │  })                    
        │                            │                        
        │                            ▼                        
        │                   ┌─────────────────┐               
        │                   │   hr-data.ts    │               
        │                   │  searchPolicies │               
        │                   └────────┬────────┘               
        │                            │                        
        │                            │ Returns matching       
        │                            │ policies               
        │                            │                        
        │                            ▼                        
        │   PolicyViewer with        │                        
        │   WFH-related policies     │                        
        │◀───────────────────────────┤                        
        │                            │                        
        │   [User reads policy]      │                        
        │                            │                        
        │   "Can I do WFH on         │                        
        │    Mondays?"               │                        
        ├───────────────────────────▶│                        
        │                            │                        
        │   AI extracts from policy  │                        
        │   content and responds     │                        
        │◀───────────────────────────┤                        
        │                            │                        
```

---

## 📊 System Dashboard Metrics Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Tambo AI  │     │ Component   │     │   hr-data.ts    │
│             │     │ Render      │     │ Mock Data       │
└──────┬──────┘     └──────┬──────┘     └────────┬────────┘
       │                   │                     │
       │ "Show HR          │                     │
       │  dashboard"       │                     │
       │                   │                     │
       │ Constructs props  │                     │
       │ from context      │                     │
       ├──────────────────▶│                     │
       │                   │                     │
       │                   │  SystemDashboard   │
       │                   │  rendered with     │
       │                   │  metrics           │
       │                   │                     │
       │                   ▼                     │
       │            ┌─────────────┐              │
       │            │ Dashboard   │              │
       │            │ displays    │              │
       │            │ 6 metric    │              │
       │            │ cards       │              │
       │            └─────────────┘              │
       │                                         │
```

---

## 📱 Context Provided

The `TamboWrapper` automatically provides this context for HR admin:

```typescript
{
  current_user: {
    employeeId: "ZP-0101",
    name: "Ananya Patel",
    email: "ananya.patel@company.com",
    role: "hr",
    department: "Human Resources",
    managerId: undefined
  },
  user_context: {
    isCheckedInToday: true,
    hasMissedCheckout: false,
    pendingApprovals: 12,
    escalations: 3,
    notifications: 8
  },
  persona_info: {
    currentPersona: "hr",
    canViewTeam: true,
    canApprove: true,
    canViewSystemDashboard: true,
    canManagePolicies: true
  }
}
```

---

## 💬 Sample Conversations

### Viewing System Dashboard
```
User: "Show me the HR dashboard"
AI: [Renders SystemDashboard with current metrics]
    Shows: 247 employees, 189 present, 23 on leave, 12 pending approvals, 92% compliance, 3 escalations
```

### Searching Policies
```
User: "What's our leave policy?"
AI: [Calls searchPolicies with query="leave policy"]
    [Renders PolicyViewer with matching policies]
    Shows: Leave Policy, Public Holidays, Comp-off Guidelines
```

### Handling Escalations
```
User: "What are the current escalations?"
AI: Shows escalation details from dashboard
    "There are 3 escalations:
    1. Pending approval > 5 days - Amit's leave
    2. Compliance alert - Missing check-outs
    3. Policy violation - Unauthorized WFH"
```

### Cross-Department Visibility
```
User: "How many people are on leave in Engineering?"
AI: [Has access to all departments]
    "5 employees from Engineering are on leave today:
    - Priya Sharma (Casual Leave)
    - Sneha Reddy (Sick Leave)
    ..."
```

---

## 🔗 Complete Component Hierarchy

```
                         ┌──────────────────────┐
                         │    TamboProvider     │
                         │    (API Key, Tools,  │
                         │     Components)      │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   TamboWrapper       │
                         │   (contextHelpers)   │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   PersonaContext     │
                         │   (role = "hr")      │
                         └──────────┬───────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ HR Admin      │          │ Manager       │          │ Employee      │
│ Components    │          │ Components    │          │ Components    │
├───────────────┤          ├───────────────┤          ├───────────────┤
│SystemDashboard│          │ApprovalQueue  │          │CheckInOutCard │
│PolicyViewer   │          │ApprovalDetail │          │LeaveBalance   │
│               │          │TeamOverview   │          │LeaveRequest   │
│               │          │               │          │RequestStatus  │
│               │          │               │          │Attendance     │
│               │          │               │          │Regularization │
└───────────────┘          └───────────────┘          └───────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                         ┌──────────▼───────────┐
                         │     useTambo()       │
                         │   sendThreadMessage  │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   Tambo AI Engine    │
                         │   (Tool Execution)   │
                         └──────────────────────┘
```

---

## 🔒 Permission Matrix

| Feature | Employee | Manager | HR Admin |
|---------|:--------:|:-------:|:--------:|
| Check-in/out | ✅ | ✅ | ✅ |
| View own attendance | ✅ | ✅ | ✅ |
| Apply for leave | ✅ | ✅ | ✅ |
| Submit regularization | ✅ | ✅ | ✅ |
| View leave balance | ✅ | ✅ | ✅ |
| View team members | ❌ | ✅ | ✅ |
| Approve/reject requests | ❌ | ✅ | ✅ |
| View pending approvals | ❌ | ✅ | ✅ |
| View system dashboard | ❌ | ❌ | ✅ |
| View all policies | ❌ | ❌ | ✅ |
| View escalations | ❌ | ❌ | ✅ |
| Cross-department access | ❌ | ❌ | ✅ |

---

## 🎨 Component Styling

HR Admin specific styling:
- **Emerald (#10B981)** - Compliance/Positive metrics
- **Blue (#3B82F6)** - Employee counts, Information
- **Amber (#F59E0B)** - Pending items, Warnings
- **Red (#EF4444)** - Escalations, Alerts
- **Purple (#8B5CF6)** - Special features

Dashboard Cards:
- Rounded corners with subtle shadows
- Hover effects for interactivity
- Responsive grid (2 cols mobile, 3 cols desktop)
- Trend arrows with percentage change

Policy Viewer:
- Clean card-based layout
- Collapsible sections
- Search highlighting
- Category badges
