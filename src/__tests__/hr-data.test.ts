import { describe, expect, it } from "vitest";
import {
  getAttendanceStatus,
  getLeaveBalance,
  getMockEmployees,
} from "@/services/hr-data";

describe("hr-data (json store)", () => {
  it("returns mock employees", () => {
    const employees = getMockEmployees();

    expect(Array.isArray(employees)).toBe(true);
    expect(employees.length).toBeGreaterThan(0);
    expect(employees[0]).toHaveProperty("id");
    expect(employees[0]).toHaveProperty("role");
  });

  it("returns leave balance for a known employee", async () => {
    const balances = await getLeaveBalance({ employeeId: "ZP-1001" });

    expect(Array.isArray(balances)).toBe(true);
    expect(balances.length).toBeGreaterThan(0);

    const casual = balances.find((item) => item.leaveType === "casual");
    expect(casual).toBeDefined();
    expect(casual?.totalDays).toBeGreaterThan(0);
  });

  it("returns attendance status structure", async () => {
    const status = await getAttendanceStatus({ employeeId: "ZP-1001" });

    expect(status).toHaveProperty("records");
    expect(status).toHaveProperty("summary");
    expect(status).toHaveProperty("todayStatus");
    expect(Array.isArray(status.records)).toBe(true);
  });
});
