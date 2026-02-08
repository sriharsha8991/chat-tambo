import { getDb, isSupabaseConfigured, Attendance } from './base';
import { resolveEmployeeUuid } from './utils';

export async function getAttendanceRecords(employeeId: string, limit = 30): Promise<Attendance[]> {
  if (!isSupabaseConfigured()) return [];

  const employeeUuid = await resolveEmployeeUuid(employeeId);

  const { data, error } = await getDb()
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeUuid)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching attendance records:', error);
    return [];
  }

  return (data as Attendance[]) || [];
}

export async function getTodayAttendance(employeeId: string): Promise<Attendance | null> {
  if (!isSupabaseConfigured()) return null;

  const employeeUuid = await resolveEmployeeUuid(employeeId);
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await getDb()
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeUuid)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching today attendance:', error);
    return null;
  }

  return (data as Attendance | null) || null;
}

export async function upsertAttendance(record: {
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: 'present' | 'absent' | 'wfh' | 'on_leave' | 'half_day' | 'holiday';
  hoursWorked?: number | null;
}): Promise<Attendance | null> {
  if (!isSupabaseConfigured()) return null;

  const employeeUuid = await resolveEmployeeUuid(record.employeeId);
  const normalizedStatus = record.status === 'on_leave' ? 'absent' : record.status;

  const { data, error } = await getDb()
    .from('attendance')
    .upsert(
      {
        employee_id: employeeUuid,
        date: record.date,
        check_in: record.checkIn,
        check_out: record.checkOut,
        status: normalizedStatus,
        hours_worked: record.hoursWorked,
      },
      { onConflict: 'employee_id,date' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting attendance:', error);
    return null;
  }

  return data as Attendance;
}
