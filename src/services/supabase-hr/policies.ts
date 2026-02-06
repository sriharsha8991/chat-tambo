import { getDb, isSupabaseConfigured, PolicyRow } from './base';

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
