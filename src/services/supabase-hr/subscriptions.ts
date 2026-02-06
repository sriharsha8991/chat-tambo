import { getDb, isSupabaseConfigured, LeaveRequest, NotificationRow } from './base';

export function subscribeToLeaveRequests(
  callback: (payload: { eventType: string; new: LeaveRequest | null; old: LeaveRequest | null }) => void
) {
  if (!isSupabaseConfigured()) return null;
  const db = getDb();

  return db
    .channel('leave_requests_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leave_requests' },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as LeaveRequest | null,
          old: payload.old as LeaveRequest | null,
        });
      }
    )
    .subscribe();
}

export function subscribeToNotifications(
  employeeId: string,
  callback: (notification: NotificationRow) => void
) {
  if (!isSupabaseConfigured()) return null;
  const db = getDb();

  return db
    .channel(`notifications_${employeeId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${employeeId}`,
      },
      (payload) => {
        callback(payload.new as NotificationRow);
      }
    )
    .subscribe();
}
