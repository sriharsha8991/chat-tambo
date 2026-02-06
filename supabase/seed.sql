-- ============================================
-- SEED DATA FOR HR SYSTEM
-- Run this after creating the schema
-- ============================================

-- ============================================
-- INSERT EMPLOYEES
-- ============================================

-- First, insert HR (no manager)
INSERT INTO employees (id, employee_id, name, email, role, department, manager_id, join_date)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'ZP-0101', 'Ananya Patel', 'ananya.patel@company.com', 'hr', 'Human Resources', NULL, '2021-05-01');

-- Then insert Manager (reports to HR)
INSERT INTO employees (id, employee_id, name, email, role, department, manager_id, join_date)
VALUES 
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'ZP-0501', 'Rajesh Kumar', 'rajesh.kumar@company.com', 'manager', 'Engineering', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '2022-01-10');

-- Finally insert Employees (report to Manager)
INSERT INTO employees (id, employee_id, name, email, role, department, manager_id, join_date)
VALUES 
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'ZP-1001', 'Priya Sharma', 'priya.sharma@company.com', 'employee', 'Engineering', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '2023-06-15'),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'ZP-1002', 'Amit Patel', 'amit.patel@company.com', 'employee', 'Engineering', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '2023-08-20'),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'ZP-1003', 'Sneha Reddy', 'sneha.reddy@company.com', 'employee', 'Engineering', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '2024-01-10'),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'ZP-1004', 'Vikram Singh', 'vikram.singh@company.com', 'employee', 'Design', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '2023-11-05'),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'ZP-1005', 'Kavitha Nair', 'kavitha.nair@company.com', 'employee', 'Engineering', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '2024-03-01');

-- ============================================
-- INSERT LEAVE BALANCES (2026)
-- ============================================

-- Priya Sharma
INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year) VALUES
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'casual', 12, 4, 2026),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'sick', 10, 2, 2026),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'earned', 15, 5, 2026),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'wfh', 24, 8, 2026),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'comp_off', 3, 1, 2026);

-- Amit Patel
INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year) VALUES
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'casual', 12, 3, 2026),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'sick', 10, 1, 2026),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'earned', 15, 2, 2026),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'wfh', 24, 10, 2026),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'comp_off', 2, 0, 2026);

-- Sneha Reddy
INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year) VALUES
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'casual', 12, 2, 2026),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'sick', 10, 0, 2026),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'earned', 15, 0, 2026),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'wfh', 24, 5, 2026),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'comp_off', 1, 0, 2026);

-- Vikram Singh
INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year) VALUES
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'casual', 12, 5, 2026),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'sick', 10, 3, 2026),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'earned', 15, 8, 2026),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'wfh', 24, 12, 2026),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'comp_off', 4, 2, 2026);

-- Kavitha Nair
INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year) VALUES
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'casual', 12, 1, 2026),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'sick', 10, 0, 2026),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'earned', 15, 0, 2026),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'wfh', 24, 3, 2026),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'comp_off', 0, 0, 2026);

-- Rajesh Kumar (Manager)
INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year) VALUES
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'casual', 15, 3, 2026),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'sick', 12, 1, 2026),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'earned', 20, 5, 2026),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'wfh', 30, 10, 2026),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'comp_off', 5, 1, 2026);

-- Ananya Patel (HR)
INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days, year) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'casual', 15, 2, 2026),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'sick', 12, 0, 2026),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'earned', 20, 3, 2026),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'wfh', 30, 5, 2026),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'comp_off', 5, 0, 2026);

-- ============================================
-- INSERT SAMPLE LEAVE REQUESTS
-- ============================================

-- Pending request from Priya
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status, submitted_at)
VALUES 
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'casual', '2026-02-10', '2026-02-10', 1, 'Family function', 'pending', '2026-02-03T10:00:00Z');

-- Approved request from Amit
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status, submitted_at, reviewed_at, reviewed_by, review_comment)
VALUES 
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'sick', '2026-01-28', '2026-01-28', 1, 'Fever', 'approved', '2026-01-28T08:00:00Z', '2026-01-28T09:30:00Z', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Get well soon');

-- ============================================
-- INSERT SAMPLE ATTENDANCE
-- ============================================

-- Priya's attendance
INSERT INTO attendance (employee_id, date, check_in, check_out, status, hours_worked) VALUES
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', '2026-02-03', '09:05:00', '18:30:00', 'present', 9.42),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', '2026-02-04', '09:15:00', '18:00:00', 'present', 8.75),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', '2026-02-05', '09:00:00', '18:15:00', 'present', 9.25);

-- ============================================
-- INSERT SAMPLE POLICIES
-- ============================================

INSERT INTO policies (title, category, content) VALUES
  ('Leave Policy', 'Leave', 'Employees are entitled to 12 days of casual leave, 10 days of sick leave, and 15 days of earned leave per year. Leave requests must be submitted at least 2 days in advance for planned leaves.'),
  ('Work From Home Policy', 'Attendance', 'Employees can avail up to 24 WFH days per year. WFH requests should be submitted at least 1 day in advance. Core working hours (10 AM - 4 PM) must be maintained.'),
  ('Attendance Regularization', 'Attendance', 'Missed check-in/check-out can be regularized within 7 days of the occurrence. All regularization requests require manager approval.');

-- ============================================
-- INSERT SAMPLE NOTIFICATIONS
-- ============================================

-- Notification for manager about pending request
INSERT INTO notifications (employee_id, type, title, message, related_id)
SELECT 
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'new_request',
  'New Leave Request',
  'Priya Sharma has requested 1 day(s) of casual leave from 2026-02-10 to 2026-02-10',
  id
FROM leave_requests 
WHERE employee_id = 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f' AND status = 'pending'
LIMIT 1;
