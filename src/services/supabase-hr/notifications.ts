import { getDb, isSupabaseConfigured, NotificationRow } from './base';
import { resolveEmployeeUuid } from './utils';

export async function getNotifications(
  employeeId?: string,
  role?: 'employee' | 'manager' | 'hr'
): Promise<NotificationRow[]> {
  if (!isSupabaseConfigured()) return [];

  let query = getDb()
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (employeeId) {
    const employeeUuid = await resolveEmployeeUuid(employeeId);
    if (role) {
      query = query.or(`employee_id.eq.${employeeUuid},audience_role.in.(all,${role})`);
    } else {
      query = query.eq('employee_id', employeeUuid);
    }
  } else if (role) {
    query = query.in('audience_role', ['all', role]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data as NotificationRow[]) || [];
}

export async function createNotification(notification: {
  employeeId?: string | null;
  audienceRole?: 'all' | 'employee' | 'manager' | 'hr';
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const employeeUuid = notification.employeeId
    ? await resolveEmployeeUuid(notification.employeeId)
    : null;

  const { error } = await getDb()
    .from('notifications')
    .insert({
      employee_id: employeeUuid,
      audience_role: notification.audienceRole || 'employee',
      type: notification.type,
      title: notification.title,
      message: notification.message,
      related_id: notification.relatedId || null,
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
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification read:', error);
    return false;
  }

  return true;
}
