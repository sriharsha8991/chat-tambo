import { getDb, isSupabaseConfigured, NotificationRow } from './base';
import { resolveEmployeeUuid } from './utils';

export async function getNotifications(employeeId: string): Promise<NotificationRow[]> {
  if (!isSupabaseConfigured()) return [];

  const employeeUuid = await resolveEmployeeUuid(employeeId);

  const { data, error } = await getDb()
    .from('notifications')
    .select('*')
    .eq('user_id', employeeUuid)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data as NotificationRow[]) || [];
}

export async function createNotification(notification: {
  employeeId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await getDb()
    .from('notifications')
    .insert({
      user_id: notification.employeeId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
    });

  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }

  return true;
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await getDb()
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification read:', error);
    return false;
  }

  return true;
}
