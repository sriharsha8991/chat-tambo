# HR System Test Scenarios

This document contains 20 test scenarios covering all personas and features of the Zoho People HR System.

---

## Test Data Reference

| Persona | Employee ID | Internal ID | Name | Role |
|---------|-------------|-------------|------|------|
| Employee | ZP-1001 | emp-001 | Priya Sharma | employee |
| Employee | ZP-1002 | emp-002 | Amit Patel | employee |
| Employee | ZP-1003 | emp-003 | Sneha Reddy | employee |
| Manager | ZP-0501 | mgr-001 | Rajesh Kumar | manager |
| HR | ZP-0101 | hr-001 | Ananya Patel | hr |

---

## Manual UI Rendering & Data Display Checklist (HR)

- [ ] HR dashboard loads without spinner and shows metrics cards populated from Supabase.
- [ ] Announcements Board renders existing announcements and pinned items appear first.
- [ ] Posting a new announcement shows it in the board and in employee/manager feeds.
- [ ] Document Center shows uploaded PDFs with correct title/description and open link.
- [ ] Uploading a PDF adds a new document row without refresh.
- [ ] Policy Manager lists policies and allows create/edit/delete with immediate UI updates.
- [ ] Policy Viewer renders policies with correct category badges and last updated dates.
- [ ] Empty states appear with the expected message when no announcements/documents/policies exist.
- [ ] Loading states show skeletons while data is being fetched.

---

## 🧑‍💼 EMPLOYEE PERSONA (Priya Sharma - ZP-1001)

### Test 1: Check Leave Balance
**Question:** "What is my leave balance?"

**Expected Result:** Should display leave balances for:
- Casual Leave: 12 total, 4 used, 8 remaining
- Sick Leave: 10 total, 2 used, 8 remaining
- Earned Leave: 15 total, 5 used, 10 remaining
- WFH: 24 total, 8 used, 16 remaining
- Comp Off: 3 total, 1 used, 2 remaining

---

### Test 2: Apply for Casual Leave
**Question:** "I want to apply for 2 days casual leave from February 15 to February 16, 2026 for a family function"

**Expected Result:** 
- Leave request should be created with status "pending"
- Request ID should be generated (format: LV-XXXX)
- Message confirming submission and pending approval

---

### Test 3: Apply for Sick Leave
**Question:** "Apply for sick leave on February 10, 2026 as I'm not feeling well"

**Expected Result:**
- 1-day sick leave request created
- Status: pending
- Reason captured: "not feeling well" or similar

---

### Test 4: Check Request Status
**Question:** "Show me my pending leave requests"

**Expected Result:**
- List of all leave requests submitted by Priya
- Should include recently submitted requests
- Display status (pending/approved/rejected)

---

### Test 5: Check-In for the Day
**Question:** "Mark my check-in for today"

**Expected Result:**
- Check-in recorded with current timestamp
- Confirmation message with check-in time
- Attendance record created/updated

---

### Test 6: Check Attendance History
**Question:** "Show my attendance for this week"

**Expected Result:**
- Display attendance records
- Show check-in/check-out times
- Show total hours worked
- Show attendance summary (present days, absent days, etc.)

---

### Test 7: Submit Regularization Request
**Question:** "I forgot to check out yesterday. Please submit a regularization request for 6:30 PM checkout"

**Expected Result:**
- Regularization request created
- Request type: missed_checkout
- Requested time: 18:30
- Status: pending

---

### Test 8: Check Notifications
**Question:** "Do I have any notifications?"

**Expected Result:**
- List of notifications for the employee
- Show read/unread status
- Include notification types (leave approved, reminders, etc.)

---

## 👨‍💼 MANAGER PERSONA (Rajesh Kumar - ZP-0501)

### Test 9: View Pending Approvals
**Question:** "Show me all pending approvals"

**Expected Result:**
- List of pending leave requests from team members
- List of pending regularization requests
- Include employee name, request type, dates, reason

---

### Test 10: Approve Leave Request
**Question:** "Approve Priya's casual leave request"

**Expected Result:**
- Leave request status updated to "approved"
- Leave balance deducted from employee
- Notification sent to employee
- Confirmation message

---

### Test 11: Reject Leave Request with Comment
**Question:** "Reject Amit's leave request with comment 'Project deadline approaching, please reschedule'"

**Expected Result:**
- Leave request status updated to "rejected"
- Comment saved with rejection
- Notification sent to employee
- Leave balance NOT deducted

---

### Test 12: View Team Status
**Question:** "Show me my team's status today"

**Expected Result:**
- List of direct reports (5 employees)
- Status for each: available, wfh, on_leave, or absent
- Check-in/check-out times for present employees

---

### Test 13: View Team Member's Leave Balance
**Question:** "What is Sneha's leave balance?"

**Expected Result:**
- Display Sneha Reddy's (emp-003) leave balances
- All 5 leave types with total/used/remaining

---

### Test 14: Approve Regularization Request
**Question:** "Approve the pending regularization request for Vikram"

**Expected Result:**
- Regularization request approved
- Attendance record updated
- Notification sent to employee

---

## 👩‍💼 HR PERSONA (Ananya Patel - ZP-0101)

### Test 15: View System Dashboard/Metrics
**Question:** "Show me the HR dashboard metrics"

**Expected Result:**
- Total employees count
- Present today count
- On leave count
- Pending approvals count
- Compliance score
- Any escalations

---

### Test 16: View All Employees
**Question:** "List all employees in the system"

**Expected Result:**
- Complete list of all 7 employees
- Include: name, employee ID, department, role, manager

---

### Test 17: Search Company Policies
**Question:** "What is the leave policy?"

**Expected Result:**
- Return relevant policies from the policy database
- Include policy title, content, last updated date
- Match search terms in title/content

---

### Test 18: View Attendance Trends
**Question:** "Show me the attendance trends for this week"

**Expected Result:**
- Chart/data showing:
  - Present percentage by day
  - WFH percentage by day
  - Leave percentage by day
- Weekly summary

---

### Test 19: View All Pending Leave Requests
**Question:** "Show all pending leave requests across the organization"

**Expected Result:**
- List all pending leave requests
- Include employee details
- Show request dates and reasons
- For escalation/oversight purposes

---

### Test 20: View Employee Details
**Question:** "Show me details for employee ZP-1003"

**Expected Result:**
- Employee: Sneha Reddy
- Department: Engineering
- Role: Employee
- Manager: Rajesh Kumar (mgr-001)
- Join Date: 2024-01-10

---

## 🔄 END-TO-END FLOW TESTS

### Flow Test 1: Leave Application to Approval
1. **Employee (Priya):** "Apply for casual leave from March 1-3, 2026 for vacation"
2. **Manager (Rajesh):** "Show pending approvals"
3. **Manager (Rajesh):** "Approve Priya's leave request"
4. **Employee (Priya):** "Check my leave balance" 
   - Casual leave should show 3 more days used

---

### Flow Test 2: Leave Application to Rejection
1. **Employee (Amit):** "Apply for earned leave from February 20-25, 2026"
2. **Manager (Rajesh):** "Reject Amit's leave request with comment 'Critical sprint'"
3. **Employee (Amit):** "Check my request status"
   - Should show rejected with comment

---

### Flow Test 3: Attendance and Regularization
1. **Employee (Sneha):** "Mark my check-in"
2. *(Simulate missing checkout)*
3. **Employee (Sneha):** "Submit regularization for missed checkout at 7 PM"
4. **Manager (Rajesh):** "Approve Sneha's regularization"
5. **Employee (Sneha):** "Show my attendance"
   - Should show corrected record

---

## 📊 Expected API Calls per Test

| Test # | Primary API Calls |
|--------|-------------------|
| 1 | `getLeaveBalances` |
| 2 | `createLeaveRequest` |
| 3 | `createLeaveRequest` |
| 4 | `getLeaveRequests` |
| 5 | `addOrUpdateAttendance` |
| 6 | `getAttendanceRecords` |
| 7 | `createRegularizationRequest` |
| 8 | `getNotifications` |
| 9 | `getPendingApprovals` |
| 10 | `approveLeaveRequest`, `updateLeaveBalance` |
| 11 | `rejectLeaveRequest` |
| 12 | `getDirectReports`, `getAttendanceRecords` |
| 13 | `getLeaveBalances` |
| 14 | `approveRegularization` |
| 15 | `getSystemMetrics` |
| 16 | `getAllEmployees` |
| 17 | `searchPolicies` |
| 18 | `getAttendanceTrends` |
| 19 | `getPendingLeaveRequests` |
| 20 | `getEmployee` |

---

## ✅ Test Execution Checklist

- [ ] Test 1: Check Leave Balance (Employee)
- [ ] Test 2: Apply Casual Leave (Employee)
- [ ] Test 3: Apply Sick Leave (Employee)
- [ ] Test 4: Check Request Status (Employee)
- [ ] Test 5: Check-In (Employee)
- [ ] Test 6: Attendance History (Employee)
- [ ] Test 7: Regularization Request (Employee)
- [ ] Test 8: Check Notifications (Employee)
- [ ] Test 9: View Pending Approvals (Manager)
- [ ] Test 10: Approve Leave (Manager)
- [ ] Test 11: Reject Leave with Comment (Manager)
- [ ] Test 12: View Team Status (Manager)
- [ ] Test 13: View Team Member Leave Balance (Manager)
- [ ] Test 14: Approve Regularization (Manager)
- [ ] Test 15: HR Dashboard Metrics (HR)
- [ ] Test 16: List All Employees (HR)
- [ ] Test 17: Search Policies (HR)
- [ ] Test 18: Attendance Trends (HR)
- [ ] Test 19: All Pending Requests (HR)
- [ ] Test 20: View Employee Details (HR)

---

## 🐛 Edge Cases to Test

1. **Insufficient Leave Balance:** Apply for more days than available
2. **Weekend/Holiday Leave:** Apply for leave on non-working days
3. **Overlapping Leave:** Apply when already on approved leave
4. **Self-Approval:** Manager trying to approve own request
5. **Invalid Employee ID:** API calls with non-existent employee
6. **Double Check-In:** Check-in when already checked in
7. **Check-Out without Check-In:** Attempting checkout without prior checkin
8. **Past Date Leave:** Applying leave for past dates
9. **Empty Reason:** Submitting request without reason
10. **Large Date Range:** Leave request spanning multiple months

---

## 📝 Notes

- All tests should be run against the local development server
- Ensure store.json is reset to initial state before running flow tests
- Check console for any API errors during testing
- Verify JSON file updates after write operations
