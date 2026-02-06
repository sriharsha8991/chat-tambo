import { getDb, isSupabaseConfigured } from './base';

export async function getSystemMetrics(): Promise<{
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingApprovals: number;
}> {
  if (!isSupabaseConfigured()) {
    return { totalEmployees: 0, presentToday: 0, onLeave: 0, pendingApprovals: 0 };
  }

  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const [employees, attendance, leaveRequests, pendingLeave, pendingReg] = await Promise.all([
    db.from('employees').select('id', { count: 'exact' }),
    db.from('attendance').select('id', { count: 'exact' }).eq('date', today).eq('status', 'present'),
    db.from('leave_requests').select('id', { count: 'exact' }).eq('status', 'approved').lte('start_date', today).gte('end_date', today),
    db.from('leave_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
    db.from('regularization_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
  ]);

  return {
    totalEmployees: employees.count || 0,
    presentToday: attendance.count || 0,
    onLeave: leaveRequests.count || 0,
    pendingApprovals: (pendingLeave.count || 0) + (pendingReg.count || 0),
  };
}
