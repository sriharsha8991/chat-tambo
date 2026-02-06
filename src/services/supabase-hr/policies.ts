import { getDb, isSupabaseConfigured, PolicyRow } from './base';
import { createNotification } from './notifications';

export async function searchPolicies(query: string): Promise<PolicyRow[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getDb()
    .from('policies')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`);

  if (error) {
    console.error('Error searching policies:', error);
    return [];
  }

  return (data as PolicyRow[]) || [];
}

export async function createPolicy(input: {
  title: string;
  category: string;
  content: string;
  lastUpdated?: string;
}): Promise<PolicyRow | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getDb()
    .from('policies')
    .insert({
      title: input.title,
      category: input.category,
      content: input.content,
      last_updated: input.lastUpdated || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating policy:', error);
    return null;
  }

  await createNotification({
    employeeId: null,
    audienceRole: 'all',
    type: 'policy_created',
    title: input.title,
    message: 'A new policy has been published.',
    relatedId: (data as PolicyRow).id,
  });

  return data as PolicyRow;
}

export async function updatePolicy(
  id: string,
  updates: Partial<{ title: string; category: string; content: string; lastUpdated: string }>
): Promise<PolicyRow | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getDb()
    .from('policies')
    .update({
      title: updates.title,
      category: updates.category,
      content: updates.content,
      last_updated: updates.lastUpdated || new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating policy:', error);
    return null;
  }

  await createNotification({
    employeeId: null,
    audienceRole: 'all',
    type: 'policy_updated',
    title: updates.title || 'Policy Updated',
    message: 'A policy has been updated.',
    relatedId: (data as PolicyRow).id,
  });

  return data as PolicyRow;
}

export async function deletePolicy(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await getDb().from('policies').delete().eq('id', id);

  if (error) {
    console.error('Error deleting policy:', error);
    return false;
  }

  return true;
}
