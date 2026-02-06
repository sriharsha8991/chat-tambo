import { getDb, isSupabaseConfigured, LeaveBalanceRow } from './base';
import { resolveEmployeeUuid } from './utils';

export interface LeaveBalance {
  leave_type: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

export async function getLeaveBalances(employeeId: string): Promise<LeaveBalance[]> {
  if (!isSupabaseConfigured()) return [];

  const employeeUuid = await resolveEmployeeUuid(employeeId);
  const currentYear = new Date().getFullYear();

  const { data, error } = await getDb()
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employeeUuid)
    .eq('year', currentYear);

  if (error) {
    console.error('Error fetching leave balances:', error);
    return [];
  }

  return ((data as LeaveBalanceRow[]) || []).map(b => ({
    leave_type: b.leave_type,
    total_days: b.total_days,
    used_days: b.used_days,
    remaining_days: b.total_days - b.used_days,
  }));
}

export async function updateLeaveBalance(
  employeeId: string,
  leaveType: string,
  usedDays: number
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const employeeUuid = await resolveEmployeeUuid(employeeId);
  const currentYear = new Date().getFullYear();

  const { error } = await getDb()
    .from('leave_balances')
    .update({ used_days: usedDays })
    .eq('employee_id', employeeUuid)
    .eq('leave_type', leaveType)
    .eq('year', currentYear);

  if (error) {
    console.error('Error updating leave balance:', error);
    return false;
  }

  return true;
}
