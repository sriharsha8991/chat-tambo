import { getDb, isSupabaseConfigured, AnnouncementRow } from './base';

export async function getAnnouncements(role?: string): Promise<AnnouncementRow[]> {
  if (!isSupabaseConfigured()) return [];

  let query = getDb()
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (role) {
    query = query.in('audience_role', ['all', role]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }

  const now = new Date().toISOString();
  return ((data as AnnouncementRow[]) || []).filter(
    (item) => !item.expires_at || item.expires_at > now
  );
}

export async function createAnnouncement(input: {
  title: string;
  content: string;
  audienceRole: 'all' | 'employee' | 'manager' | 'hr';
  pinned?: boolean;
  createdBy?: string | null;
  expiresAt?: string | null;
}): Promise<AnnouncementRow | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getDb()
    .from('announcements')
    .insert({
      title: input.title,
      content: input.content,
      audience_role: input.audienceRole,
      pinned: input.pinned ?? false,
      created_by: input.createdBy || null,
      expires_at: input.expiresAt || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating announcement:', error);
    return null;
  }

  return data as AnnouncementRow;
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<{
    title: string;
    content: string;
    audienceRole: 'all' | 'employee' | 'manager' | 'hr';
    pinned: boolean;
    expiresAt: string | null;
  }>
): Promise<AnnouncementRow | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getDb()
    .from('announcements')
    .update({
      title: updates.title,
      content: updates.content,
      audience_role: updates.audienceRole,
      pinned: updates.pinned,
      expires_at: updates.expiresAt,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating announcement:', error);
    return null;
  }

  return data as AnnouncementRow;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await getDb().from('announcements').delete().eq('id', id);

  if (error) {
    console.error('Error deleting announcement:', error);
    return false;
  }

  return true;
}
