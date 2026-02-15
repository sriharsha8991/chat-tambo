# API Reference

> Complete documentation for all HTTP endpoints in the Zoho People AI application.

---

## Table of Contents

- [Overview](#overview)
- [Base URLs](#base-urls)
- [HR API — GET Actions](#hr-api--get-actions)
- [HR API — POST Actions](#hr-api--post-actions)
- [Query API](#query-api)
- [Analytics Service](#analytics-service)
- [Error Handling](#error-handling)

---

## Overview

The application exposes two API routes, both running on the **Node.js runtime**:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/hr` | GET, POST | All HR CRUD operations (45 actions) |
| `/api/query` | POST | Named query resolution for dashboard widgets |

All requests and responses use JSON. The API uses **action-based dispatch** — a single endpoint handles multiple operations via an `action` parameter.

---

## Base URLs

```
Development:  http://localhost:3000/api/hr
Production:   https://your-domain.com/api/hr
```

---

## HR API — GET Actions

**Endpoint:** `GET /api/hr?action={actionName}&{params}`

All parameters are passed via query string.

---

### Employee Operations

#### `getEmployee`

Fetch a single employee by ID.

```
GET /api/hr?action=getEmployee&employeeId=ZP-1001
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `employeeId` | Yes | Employee ID (e.g., `ZP-1001`) |

**Response:** Employee object or `404` if not found.

```json
{
  "id": "c3d4e5f6-...",
  "employee_id": "ZP-1001",
  "name": "Priya Sharma",
  "email": "priya.sharma@company.com",
  "role": "employee",
  "department": "Engineering",
  "manager_id": "b2c3d4e5-...",
  "join_date": "2023-06-15"
}
```

---

#### `getAllEmployees`

Fetch all employees in the system.

```
GET /api/hr?action=getAllEmployees
```

**Response:** Array of employee objects.

---

#### `getDirectReports`

Fetch employees who report to a specific manager.

```
GET /api/hr?action=getDirectReports&managerId=b2c3d4e5-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `managerId` | Yes | Manager's internal UUID |

**Response:** Array of employee objects (or `[]`).

---

#### `getTeamMembers`

Fetch team members for a manager with attendance status.

```
GET /api/hr?action=getTeamMembers&managerId=b2c3d4e5-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `managerId` | Yes | Manager's internal UUID |

**Response:** Array of team member objects with today's status.

---

#### `getPersonaUsers`

Fetch one representative employee per persona role (employee, manager, hr).

```
GET /api/hr?action=getPersonaUsers
```

**Response:** Array of 3 employee objects (one per role).

---

### Attendance Operations

#### `getAttendanceRecords`

Fetch attendance history for an employee.

```
GET /api/hr?action=getAttendanceRecords&employeeId=c3d4e5f6-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `employeeId` | Yes | Employee's internal UUID |

**Response:** Array of attendance records.

---

#### `getTodayAttendance`

Fetch today's check-in/check-out status for an employee.

```
GET /api/hr?action=getTodayAttendance&employeeId=c3d4e5f6-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `employeeId` | Yes | Employee's internal UUID |

**Response:** Attendance record for today (or `null`).

```json
{
  "id": "...",
  "employee_id": "c3d4e5f6-...",
  "date": "2026-02-15",
  "check_in": "09:15:00",
  "check_out": null,
  "status": "present",
  "hours_worked": null
}
```

---

### Leave Operations

#### `getLeaveBalances`

Fetch all leave type balances for an employee.

```
GET /api/hr?action=getLeaveBalances&employeeId=c3d4e5f6-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `employeeId` | Yes | Employee's internal UUID |

**Response:** Array of leave balance objects.

```json
[
  {
    "employee_id": "c3d4e5f6-...",
    "leave_type": "casual",
    "total_days": 12,
    "used_days": 4,
    "year": 2026
  }
]
```

---

#### `getLeaveRequests`

Fetch leave requests, optionally filtered by employee.

```
GET /api/hr?action=getLeaveRequests
GET /api/hr?action=getLeaveRequests&employeeId=c3d4e5f6-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `employeeId` | No | Filter by employee UUID |

**Response:** Array of leave request objects.

---

#### `getPendingLeaveRequests`

Fetch pending leave requests, optionally filtered by manager.

```
GET /api/hr?action=getPendingLeaveRequests&managerId=b2c3d4e5-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `managerId` | No | Filter to requests from this manager's reports |

**Response:** Array of pending leave requests.

---

### Approval Operations

#### `getPendingApprovals`

Fetch all pending approvals (leave + regularization) for a manager.

```
GET /api/hr?action=getPendingApprovals&managerId=b2c3d4e5-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `managerId` | Yes | Manager's internal UUID |

**Response:** Combined array of pending leave requests and regularization requests.

---

### Regularization Operations

#### `getRegularizationRequests`

Fetch regularization requests, optionally filtered by employee.

```
GET /api/hr?action=getRegularizationRequests&employeeId=c3d4e5f6-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `employeeId` | No | Filter by employee UUID |

**Response:** Array of regularization request objects.

---

### Notification Operations

#### `getNotifications`

Fetch notifications for an employee or role.

```
GET /api/hr?action=getNotifications&employeeId=c3d4e5f6-...&role=employee
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `employeeId` | No | Filter by employee UUID |
| `role` | No | Filter by audience role (`employee`, `manager`, `hr`) |

**Response:** Array of notification objects.

---

### Policy Operations

#### `searchPolicies`

Search policies by keyword.

```
GET /api/hr?action=searchPolicies&query=leave
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `query` | Yes | Non-empty search keyword |

**Response:** Array of matching policy objects.

---

#### `getPolicies`

Fetch all policies.

```
GET /api/hr?action=getPolicies
```

**Response:** Array of all policy objects.

```json
[
  {
    "id": "...",
    "title": "Leave Policy",
    "category": "HR Policies",
    "content": "Employees are entitled to...",
    "last_updated": "2026-01-15T00:00:00Z"
  }
]
```

---

### Announcement & Document Operations

#### `getAnnouncements`

```
GET /api/hr?action=getAnnouncements&role=employee
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `role` | No | Filter by audience role |

---

#### `getDocuments`

```
GET /api/hr?action=getDocuments&role=employee
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `role` | No | Filter by audience role |

---

#### `getAcknowledgedDocumentIds`

```
GET /api/hr?action=getAcknowledgedDocumentIds&employeeId=c3d4e5f6-...
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `employeeId` | Yes | Employee's internal UUID |

**Response:** Array of acknowledged document ID strings.

---

### System Operations

#### `getSystemMetrics`

Fetch organization-wide HR metrics.

```
GET /api/hr?action=getSystemMetrics
```

**Response:**

```json
{
  "totalEmployees": 7,
  "presentToday": 5,
  "onLeave": 1,
  "pendingApprovals": 3,
  "complianceScore": 92,
  "escalations": 0
}
```

---

#### `getBackendType`

Check which backend is configured.

```
GET /api/hr?action=getBackendType
```

**Response:** `{ "backend": "supabase" }`

---

### Dashboard Operations

#### `getPinnedWidgets`

Fetch a user's pinned dashboard widgets.

```
GET /api/hr?action=getPinnedWidgets&employeeId=ZP-1001
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `employeeId` | Yes | Employee ID string |

**Response:** Array of pinned widget objects.

---

## HR API — POST Actions

**Endpoint:** `POST /api/hr`

**Request body:** JSON with `action` field plus action-specific fields.

---

### Attendance

#### `addOrUpdateAttendance`

```json
{
  "action": "addOrUpdateAttendance",
  "employeeId": "c3d4e5f6-...",
  "record": {
    "date": "2026-02-15",
    "check_in": "09:15:00",
    "status": "present"
  }
}
```

**Response:** `{ "success": true }`

---

### Leave Requests

#### `createLeaveRequest`

```json
{
  "action": "createLeaveRequest",
  "request": {
    "employeeId": "c3d4e5f6-...",
    "leaveType": "casual",
    "startDate": "2026-02-20",
    "endDate": "2026-02-21",
    "daysRequested": 2,
    "reason": "Family function"
  }
}
```

**Response:** Created leave request object with generated ID and `status: "pending"`.

---

#### `approveLeaveRequest`

```json
{
  "action": "approveLeaveRequest",
  "requestId": "leave-request-uuid",
  "reviewerId": "manager-uuid",
  "comment": "Approved"
}
```

---

#### `rejectLeaveRequest`

```json
{
  "action": "rejectLeaveRequest",
  "requestId": "leave-request-uuid",
  "reviewerId": "manager-uuid",
  "comment": "Insufficient leave balance"
}
```

---

### Regularization

#### `createRegularizationRequest`

```json
{
  "action": "createRegularizationRequest",
  "request": {
    "employeeId": "c3d4e5f6-...",
    "date": "2026-02-14",
    "requestType": "missed_checkout",
    "requestedTime": "18:30",
    "reason": "Forgot to check out"
  }
}
```

---

#### `approveRegularization` / `rejectRegularization`

Same shape as leave approval — `requestId`, `reviewerId`, optional `comment`.

---

### Notifications

#### `markNotificationRead`

```json
{
  "action": "markNotificationRead",
  "notificationId": "notification-uuid"
}
```

---

### Announcements

#### `createAnnouncement`

```json
{
  "action": "createAnnouncement",
  "announcement": {
    "title": "Office Closure Notice",
    "content": "The office will be closed on...",
    "audience_role": "all",
    "pinned": false,
    "created_by": "hr-uuid"
  }
}
```

#### `updateAnnouncement`

```json
{
  "action": "updateAnnouncement",
  "id": "announcement-uuid",
  "updates": { "pinned": true }
}
```

#### `deleteAnnouncement`

```json
{
  "action": "deleteAnnouncement",
  "id": "announcement-uuid"
}
```

---

### Documents

#### `createDocument`

```json
{
  "action": "createDocument",
  "document": {
    "title": "Employee Handbook",
    "description": "Updated handbook for 2026",
    "file_path": "/uploads/handbook.pdf",
    "audience_role": "all",
    "requires_ack": true,
    "created_by": "hr-uuid"
  }
}
```

#### `deleteDocument`

Also deletes the file from disk at `public/uploads/` if present.

```json
{
  "action": "deleteDocument",
  "id": "document-uuid"
}
```

#### `acknowledgeDocument`

```json
{
  "action": "acknowledgeDocument",
  "employeeId": "c3d4e5f6-...",
  "documentId": "document-uuid"
}
```

---

### Policies

#### `createPolicy`

```json
{
  "action": "createPolicy",
  "policy": {
    "title": "Remote Work Policy",
    "category": "HR Policies",
    "content": "Employees may work from home up to..."
  }
}
```

#### `updatePolicy`

```json
{
  "action": "updatePolicy",
  "id": "policy-uuid",
  "updates": { "content": "Updated content..." }
}
```

#### `deletePolicy`

```json
{
  "action": "deletePolicy",
  "id": "policy-uuid"
}
```

---

### Leave Balance

#### `updateLeaveBalance`

```json
{
  "action": "updateLeaveBalance",
  "employeeId": "c3d4e5f6-...",
  "leaveType": "casual",
  "usedDays": 5
}
```

---

### Pinned Widgets

#### `pinWidget`

```json
{
  "action": "pinWidget",
  "employeeId": "ZP-1001",
  "componentName": "LeaveBalanceCard",
  "queryDescriptor": { "queryId": "leaveBalance", "params": {} },
  "layout": { "x": 0, "y": 0, "w": 4, "h": 3 },
  "title": "My Leave Balance"
}
```

#### `unpinWidget`

```json
{
  "action": "unpinWidget",
  "widgetId": "widget-uuid"
}
```

#### `updateWidgetLayout`

```json
{
  "action": "updateWidgetLayout",
  "widgetId": "widget-uuid",
  "layout": { "x": 4, "y": 0, "w": 6, "h": 4 }
}
```

#### `updateWidgetTitle`

```json
{
  "action": "updateWidgetTitle",
  "widgetId": "widget-uuid",
  "title": "Renamed Widget"
}
```

#### `batchUpdateWidgetLayouts`

```json
{
  "action": "batchUpdateWidgetLayouts",
  "updates": [
    { "widgetId": "uuid-1", "layout": { "x": 0, "y": 0, "w": 4, "h": 3 } },
    { "widgetId": "uuid-2", "layout": { "x": 4, "y": 0, "w": 8, "h": 4 } }
  ]
}
```

#### `clearAllPinnedWidgets`

```json
{
  "action": "clearAllPinnedWidgets",
  "employeeId": "ZP-1001"
}
```

---

## Query API

**Endpoint:** `POST /api/query`

Used by `useLiveQuery` hook to fetch data for dashboard widgets.

### Request

```json
{
  "queryId": "leaveBalance",
  "params": { "employeeId": "c3d4e5f6-..." }
}
```

### Supported Query IDs

| Query ID | Parameters | Service Function |
|----------|------------|------------------|
| `attendanceStatus` | `employeeId` | `getTodayAttendance` |
| `leaveBalance` | `employeeId` | `getLeaveBalances` |
| `requestStatus` | `employeeId` | `getLeaveRequests` |
| `pendingApprovals` | `managerId` | `getAllPendingApprovals` |
| `teamMembers` | `managerId` | `getTeamMembers` |
| `systemMetrics` | — | `getSystemMetrics` |
| `policies` | `query?` | `searchPolicies` / `getPolicies` |
| `announcements` | — | `getAnnouncements` |
| `documents` | — | `getDocuments` |
| `acknowledgedDocumentIds` | `employeeId` | `getAcknowledgedDocumentIds` |
| `allEmployees` | — | `getAllEmployees` |
| `attendanceTrends` | `period?`, `startDate?`, `endDate?` | `getAttendanceTrends` |
| `leaveAnalytics` | `type?`, `startDate?`, `endDate?` | `getLeaveAnalytics` |
| `teamMetrics` | `metric?`, `managerId?` | `getTeamMetrics` |
| `hrAnalytics` | `metric?` | `getHRAnalytics` |

### Response

```json
{
  "data": { ... },
  "queryId": "leaveBalance",
  "timestamp": "2026-02-15T10:30:00.000Z"
}
```

---

## Analytics Service

The analytics functions (`src/services/supabase-hr/analytics.ts`) return chart-ready data in a standard format:

```typescript
interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}
```

### `getAttendanceTrends(period?, startDate?, endDate?)`

| Period | Labels | Datasets |
|--------|--------|----------|
| `"week"` (default) | `["Mon", "Tue", ...]` | Present, WFH, Leave counts |
| `"month"` | `["Jan", "Feb", ...]` | Attendance % per month |

### `getLeaveAnalytics(type?, startDate?, endDate?)`

| Type | Labels | Datasets |
|------|--------|----------|
| `"distribution"` (default) | `["Casual", "Sick", ...]` | Total days by leave type |
| `"trends"` | `["Jan", "Feb", ...]` | Monthly count per leave type |

### `getTeamMetrics(metric?, managerId?)`

| Metric | Labels | Datasets |
|--------|--------|----------|
| `"status"` (default) | `["In Office", "WFH", ...]` | Count per status |
| `"attendance"` | Employee names | 30-day attendance % |
| Other | Employee names | Leave Taken + Leave Remaining |

### `getHRAnalytics(metric?)`

| Metric | Labels | Datasets |
|--------|--------|----------|
| `"departmentDistribution"` (default) | Department names | Employee count per department |
| `"headcount"` | `["Jan", "Feb", ...]` | Total Employees + New Hires |
| Other | `["Q1", "Q2", ...]` | Turnover Rate % (mock) |

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Description of what went wrong"
}
```

### HTTP Status Codes

| Code | When |
|------|------|
| `200` | Successful operation |
| `400` | Missing required parameters or unknown action |
| `404` | Entity not found (e.g., employee) |
| `500` | Internal server error (Supabase query failure) |

### Error Patterns by Route

**`/api/hr` GET:**
- Missing params → `400` with `"X is required"` message
- Unknown action → `400` with `"Unknown action: X"` message
- Entity not found → `404`
- Server error → `500` with error message included

**`/api/hr` POST:**
- Missing params → `400`
- Unknown action → `400`
- Server error → `500` (error message **not** included for security)

**`/api/query`:**
- Missing `queryId` → `400` with `"queryId (string) is required"`
- Unknown `queryId` → `400` with `"Unknown queryId: X"`
- Execution failure → `500` with `"Query execution failed: X"`
