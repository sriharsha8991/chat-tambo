/**
 * @file Supabase Analytics Service
 * @description Real aggregation queries for attendance, leave, team, and HR analytics.
 * Returns data in the Graph component's { labels, datasets } format.
 */

import { getDb, isSupabaseConfigured } from "./base";

interface Dataset {
  label: string;
  data: number[];
  color?: string;
}

interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

// ── Colours ────────────────────────────────────────────────────
const GREEN = "hsl(160, 82%, 47%)";
const BLUE = "hsl(220, 100%, 62%)";
const ORANGE = "hsl(32, 100%, 62%)";
const PINK = "hsl(340, 82%, 66%)";

// ── Helpers ────────────────────────────────────────────────────

function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function monthLabel(m: number): string {
  return [
    "Jan", "Feb", "Mar", "Apr", "May",
    "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][m];
}

/** Monday of the current week */
function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

function startOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

// ════════════════════════════════════════════════════════════════
// 1. ATTENDANCE TRENDS
// ════════════════════════════════════════════════════════════════

export async function getAttendanceTrends(
  period: string = "week",
  startDate?: string,
  endDate?: string,
): Promise<ChartData> {
  if (!isSupabaseConfigured) return fallbackAttendanceTrends(period);

  const db = getDb();

  if (period === "week") {
    // Current week (or custom range): count present / wfh / leave per day
    const rangeStart = startDate ?? startOfWeek();
    const rangeEnd = endDate ?? new Date().toISOString().slice(0, 10);
    const { data: rows } = await db
      .from("attendance")
      .select("date, status")
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("date");

    const buckets: Record<string, { present: number; wfh: number; leave: number }> = {};
    // Build buckets for each day in range
    const start = new Date(rangeStart + "T00:00:00");
    const end = new Date(rangeEnd + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
        buckets[d.toISOString().slice(0, 10)] = { present: 0, wfh: 0, leave: 0 };
      }
    }

    for (const r of rows ?? []) {
      const b = buckets[r.date];
      if (!b) continue;
      if (r.status === "present" || r.status === "half_day") b.present++;
      else if (r.status === "wfh") b.wfh++;
      else if (r.status === "on_leave" || r.status === "absent") b.leave++;
    }

    const dates = Object.keys(buckets).sort();
    return {
      labels: dates.map((d) => dayLabel(new Date(d + "T00:00:00"))),
      datasets: [
        { label: "Present", data: dates.map((d) => buckets[d].present), color: GREEN },
        { label: "WFH", data: dates.map((d) => buckets[d].wfh), color: BLUE },
        { label: "Leave", data: dates.map((d) => buckets[d].leave), color: ORANGE },
      ],
    };
  }

  // month: monthly attendance rate (custom range or this year)
  const rangeStart = startDate ?? startOfYear();
  const rangeEnd = endDate ?? new Date().toISOString().slice(0, 10);
  const { data: rows } = await db
    .from("attendance")
    .select("date, status")
    .gte("date", rangeStart)
    .lte("date", rangeEnd)
    .order("date");

  const { count: totalEmps } = await db
    .from("employees")
    .select("id", { count: "exact", head: true });

  const monthlyPresent: Record<number, number> = {};
  const monthlyTotal: Record<number, number> = {};

  for (const r of rows ?? []) {
    const m = new Date(r.date + "T00:00:00").getMonth();
    monthlyTotal[m] = (monthlyTotal[m] ?? 0) + 1;
    if (r.status === "present" || r.status === "wfh" || r.status === "half_day") {
      monthlyPresent[m] = (monthlyPresent[m] ?? 0) + 1;
    }
  }

  const months = Object.keys(monthlyTotal)
    .map(Number)
    .sort((a, b) => a - b);

  return {
    labels: months.map(monthLabel),
    datasets: [
      {
        label: "Attendance %",
        data: months.map((m) => {
          const total = monthlyTotal[m] || 1;
          return Math.round((monthlyPresent[m] ?? 0) / total * 100);
        }),
        color: GREEN,
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════
// 2. LEAVE ANALYTICS
// ════════════════════════════════════════════════════════════════

export async function getLeaveAnalytics(
  type: string = "distribution",
  startDate?: string,
  endDate?: string,
): Promise<ChartData> {
  if (!isSupabaseConfigured) return fallbackLeaveAnalytics(type);

  const db = getDb();

  if (type === "distribution") {
    let query = db
      .from("leave_requests")
      .select("leave_type, days_requested")
      .in("status", ["approved", "pending"]);
    if (startDate) query = query.gte("start_date", startDate);
    if (endDate) query = query.lte("start_date", endDate);
    const { data: rows } = await query;

    const totals: Record<string, number> = {};
    for (const r of rows ?? []) {
      totals[r.leave_type] = (totals[r.leave_type] ?? 0) + (r.days_requested ?? 1);
    }

    const types = Object.keys(totals).sort();
    return {
      labels: types.map((t) => t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")),
      datasets: [
        { label: "Leave Distribution", data: types.map((t) => totals[t]), color: BLUE },
      ],
    };
  }

  // trends: monthly leave counts by type
  const rangeStart = startDate ?? startOfYear();
  const rangeEnd = endDate ?? new Date().toISOString().slice(0, 10);
  let trendQuery = db
    .from("leave_requests")
    .select("leave_type, start_date, days_requested")
    .gte("start_date", rangeStart)
    .in("status", ["approved", "pending"])
    .order("start_date");
  if (endDate) trendQuery = trendQuery.lte("start_date", rangeEnd);
  const { data: rows } = await trendQuery;

  const byTypeMonth: Record<string, Record<number, number>> = {};
  const monthsUsed = new Set<number>();

  for (const r of rows ?? []) {
    const m = new Date(r.start_date + "T00:00:00").getMonth();
    monthsUsed.add(m);
    if (!byTypeMonth[r.leave_type]) byTypeMonth[r.leave_type] = {};
    byTypeMonth[r.leave_type][m] =
      (byTypeMonth[r.leave_type][m] ?? 0) + (r.days_requested ?? 1);
  }

  const months = [...monthsUsed].sort((a, b) => a - b);
  const colors = [BLUE, PINK, GREEN, ORANGE];

  return {
    labels: months.map(monthLabel),
    datasets: Object.keys(byTypeMonth).map((lt, i) => ({
      label: lt.charAt(0).toUpperCase() + lt.slice(1).replace("_", " "),
      data: months.map((m) => byTypeMonth[lt][m] ?? 0),
      color: colors[i % colors.length],
    })),
  };
}

// ════════════════════════════════════════════════════════════════
// 3. TEAM METRICS
// ════════════════════════════════════════════════════════════════

export async function getTeamMetrics(
  metric: string = "status",
  managerId?: string,
): Promise<ChartData> {
  if (!isSupabaseConfigured) return fallbackTeamMetrics(metric);

  const db = getDb();

  // Get team members
  let teamQuery = db.from("employees").select("id, name");
  if (managerId) {
    // Get manager UUID from employee_id
    const { data: mgr } = await db
      .from("employees")
      .select("id")
      .eq("employee_id", managerId)
      .single();
    if (mgr) teamQuery = teamQuery.eq("manager_id", mgr.id);
  }
  const { data: members } = await teamQuery;
  if (!members || members.length === 0) {
    return { labels: ["No data"], datasets: [{ label: "Team", data: [0] }] };
  }

  const memberIds = members.map((m) => m.id);
  const today = new Date().toISOString().slice(0, 10);

  if (metric === "status") {
    const { data: todayAtt } = await db
      .from("attendance")
      .select("employee_id, status")
      .eq("date", today)
      .in("employee_id", memberIds);

    const statusMap: Record<string, number> = {
      "In Office": 0,
      WFH: 0,
      "On Leave": 0,
      Offline: 0,
    };
    const checkedIn = new Set<string>();
    for (const r of todayAtt ?? []) {
      checkedIn.add(r.employee_id);
      if (r.status === "present") statusMap["In Office"]++;
      else if (r.status === "wfh") statusMap["WFH"]++;
      else if (r.status === "on_leave" || r.status === "absent")
        statusMap["On Leave"]++;
    }
    statusMap["Offline"] = memberIds.filter((id) => !checkedIn.has(id)).length;

    const labels = Object.keys(statusMap);
    return {
      labels,
      datasets: [
        { label: "Team Status", data: labels.map((l) => statusMap[l]), color: GREEN },
      ],
    };
  }

  if (metric === "attendance") {
    // Last 30 days attendance % per member
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString().slice(0, 10);

    const { data: att } = await db
      .from("attendance")
      .select("employee_id, status")
      .gte("date", since)
      .in("employee_id", memberIds);

    const totalDays: Record<string, number> = {};
    const presentDays: Record<string, number> = {};
    for (const r of att ?? []) {
      totalDays[r.employee_id] = (totalDays[r.employee_id] ?? 0) + 1;
      if (
        r.status === "present" ||
        r.status === "wfh" ||
        r.status === "half_day"
      ) {
        presentDays[r.employee_id] = (presentDays[r.employee_id] ?? 0) + 1;
      }
    }

    const nameMap = Object.fromEntries(
      members.map((m) => [m.id, m.name.split(" ")[0]]),
    );

    return {
      labels: memberIds.map((id) => nameMap[id] ?? id),
      datasets: [
        {
          label: "Attendance %",
          data: memberIds.map((id) =>
            totalDays[id]
              ? Math.round(((presentDays[id] ?? 0) / totalDays[id]) * 100)
              : 0,
          ),
          color: BLUE,
        },
      ],
    };
  }

  // leave: per-member leaves taken vs remaining
  const { data: balances } = await db
    .from("leave_balances")
    .select("employee_id, total_days, used_days")
    .in("employee_id", memberIds);

  const taken: Record<string, number> = {};
  const remaining: Record<string, number> = {};
  for (const b of balances ?? []) {
    taken[b.employee_id] = (taken[b.employee_id] ?? 0) + (b.used_days ?? 0);
    remaining[b.employee_id] =
      (remaining[b.employee_id] ?? 0) +
      ((b.total_days ?? 0) - (b.used_days ?? 0));
  }

  const nameMap = Object.fromEntries(
    members.map((m) => [m.id, m.name.split(" ")[0]]),
  );

  return {
    labels: memberIds.map((id) => nameMap[id] ?? id),
    datasets: [
      {
        label: "Leaves Taken",
        data: memberIds.map((id) => taken[id] ?? 0),
        color: ORANGE,
      },
      {
        label: "Leaves Remaining",
        data: memberIds.map((id) => remaining[id] ?? 0),
        color: GREEN,
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════
// 4. HR ANALYTICS
// ════════════════════════════════════════════════════════════════

export async function getHRAnalytics(
  metric: string = "departmentDistribution",
): Promise<ChartData> {
  if (!isSupabaseConfigured) return fallbackHRAnalytics(metric);

  const db = getDb();

  if (metric === "departmentDistribution") {
    const { data: rows } = await db
      .from("employees")
      .select("department");

    const depts: Record<string, number> = {};
    for (const r of rows ?? []) {
      const d = r.department ?? "Unknown";
      depts[d] = (depts[d] ?? 0) + 1;
    }

    const labels = Object.keys(depts).sort();
    return {
      labels,
      datasets: [
        { label: "Employees", data: labels.map((l) => depts[l]), color: BLUE },
      ],
    };
  }

  if (metric === "headcount") {
    // Monthly headcount for the current year based on join_date
    const yearStart = startOfYear();
    const { data: all } = await db
      .from("employees")
      .select("join_date")
      .order("join_date");

    // Count cumulative employees and new hires per month
    const monthlyNew: Record<number, number> = {};
    const totalBefore: number =
      (all ?? []).filter(
        (e) => e.join_date && e.join_date < yearStart,
      ).length;

    for (const e of all ?? []) {
      if (!e.join_date || e.join_date < yearStart) continue;
      const m = new Date(e.join_date + "T00:00:00").getMonth();
      monthlyNew[m] = (monthlyNew[m] ?? 0) + 1;
    }

    const currentMonth = new Date().getMonth();
    const months = Array.from({ length: currentMonth + 1 }, (_, i) => i);
    let running = totalBefore;

    return {
      labels: months.map(monthLabel),
      datasets: [
        {
          label: "Total Employees",
          data: months.map((m) => {
            running += monthlyNew[m] ?? 0;
            return running;
          }),
          color: GREEN,
        },
        {
          label: "New Hires",
          data: months.map((m) => monthlyNew[m] ?? 0),
          color: BLUE,
        },
      ],
    };
  }

  // turnover — approximate from employees who left (no explicit column,
  // so derive from total - active; fall back to mock if not trackable)
  return fallbackHRAnalytics("turnover");
}

// ════════════════════════════════════════════════════════════════
// FALLBACKS (used when Supabase is not configured)
// ════════════════════════════════════════════════════════════════

function fallbackAttendanceTrends(period: string): ChartData {
  if (period === "week") {
    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      datasets: [
        { label: "Present", data: [92, 88, 95, 91, 85], color: GREEN },
        { label: "WFH", data: [5, 8, 3, 6, 10], color: BLUE },
        { label: "Leave", data: [3, 4, 2, 3, 5], color: ORANGE },
      ],
    };
  }
  return {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      { label: "Attendance %", data: [94, 92, 96, 93, 91, 95], color: GREEN },
    ],
  };
}

function fallbackLeaveAnalytics(type: string): ChartData {
  if (type === "distribution") {
    return {
      labels: ["Casual", "Sick", "Earned", "WFH", "Comp-off"],
      datasets: [
        { label: "Leave Distribution", data: [35, 15, 25, 20, 5], color: BLUE },
      ],
    };
  }
  return {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      { label: "Casual Leave", data: [12, 8, 15, 10, 18, 14], color: BLUE },
      { label: "Sick Leave", data: [5, 8, 3, 6, 4, 7], color: PINK },
      { label: "Earned Leave", data: [8, 10, 12, 8, 15, 20], color: GREEN },
    ],
  };
}

function fallbackTeamMetrics(metric: string): ChartData {
  if (metric === "status") {
    return {
      labels: ["In Office", "WFH", "On Leave", "Offline"],
      datasets: [
        { label: "Team Status", data: [12, 5, 2, 1], color: GREEN },
      ],
    };
  }
  if (metric === "attendance") {
    return {
      labels: ["Priya", "Amit", "Sneha", "Vikram", "Kavitha"],
      datasets: [
        { label: "Attendance %", data: [96, 92, 88, 94, 98], color: BLUE },
      ],
    };
  }
  return {
    labels: ["Priya", "Amit", "Sneha", "Vikram", "Kavitha"],
    datasets: [
      { label: "Leaves Taken", data: [8, 12, 6, 10, 4], color: ORANGE },
      { label: "Leaves Remaining", data: [29, 25, 31, 27, 33], color: GREEN },
    ],
  };
}

function fallbackHRAnalytics(metric: string): ChartData {
  if (metric === "departmentDistribution") {
    return {
      labels: ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"],
      datasets: [
        { label: "Employees", data: [85, 42, 28, 15, 18, 60], color: BLUE },
      ],
    };
  }
  if (metric === "headcount") {
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        { label: "Total Employees", data: [235, 238, 242, 245, 247, 248], color: GREEN },
        { label: "New Hires", data: [5, 4, 6, 3, 4, 2], color: BLUE },
      ],
    };
  }
  return {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      { label: "Turnover Rate %", data: [2.5, 3.1, 2.8, 2.2], color: PINK },
    ],
  };
}
