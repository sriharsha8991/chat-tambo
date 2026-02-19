/**
 * Pinned Widgets — Supabase CRUD
 *
 * Stores component descriptors that users pin from chat onto their
 * personal dashboard. Only stores component name + query descriptor +
 * layout — never raw data, prompts, or LLM logic.
 */

import { getDb, isSupabaseConfigured } from './base';
import type { PinnedWidgetRow } from '@/types/database';
import { resolveEmployeeUuid } from './utils';

// ============================================
// READ
// ============================================

export async function getPinnedWidgets(employeeId: string): Promise<PinnedWidgetRow[]> {
  if (!isSupabaseConfigured()) return [];

  const employeeUuid = await resolveEmployeeUuid(employeeId);

  const { data, error } = await getDb()
    .from('pinned_widgets')
    .select('*')
    .eq('employee_id', employeeUuid)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching pinned widgets:', error);
    return [];
  }

  return (data as PinnedWidgetRow[]) || [];
}

// ============================================
// CREATE
// ============================================

export async function pinWidget(input: {
  employeeId: string;
  componentName: string;
  queryDescriptor: Record<string, unknown>;
  layout?: Record<string, unknown>;
  title?: string | null;
  orderIndex?: number;
}): Promise<PinnedWidgetRow | null> {
  if (!isSupabaseConfigured()) return null;

  const employeeUuid = await resolveEmployeeUuid(input.employeeId);

  // Get next order index if not provided
  let orderIndex = input.orderIndex ?? 0;
  if (!input.orderIndex && input.orderIndex !== 0) {
    const { data: existing } = await getDb()
      .from('pinned_widgets')
      .select('order_index')
      .eq('employee_id', employeeUuid)
      .order('order_index', { ascending: false })
      .limit(1);
    const maxOrder = (existing as Array<{ order_index: number }> | null)?.[0]?.order_index ?? -1;
    orderIndex = maxOrder + 1;
  }

  const { data, error } = await getDb()
    .from('pinned_widgets')
    .insert({
      employee_id: employeeUuid,
      component_name: input.componentName,
      query_descriptor: input.queryDescriptor,
      layout: input.layout || {},
      title: input.title || null,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) {
    // Duplicate detected
    if (error.code === '23505') {
      console.warn('Widget already pinned:', input.componentName);
      return null;
    }
    console.error('Error pinning widget:', error);
    return null;
  }

  return data as PinnedWidgetRow;
}

// ============================================
// DELETE
// ============================================

export async function unpinWidget(widgetId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await getDb()
    .from('pinned_widgets')
    .delete()
    .eq('id', widgetId);

  if (error) {
    console.error('Error unpinning widget:', error);
    return false;
  }

  return true;
}

// ============================================
// UPDATE LAYOUT (after drag/resize)
// ============================================

export async function updateWidgetTitle(
  widgetId: string,
  title: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await getDb()
    .from('pinned_widgets')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', widgetId);

  if (error) {
    console.error('Error updating widget title:', error);
    return false;
  }

  return true;
}

export async function updateWidgetLayout(
  widgetId: string,
  layout: Record<string, unknown>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await getDb()
    .from('pinned_widgets')
    .update({ layout })
    .eq('id', widgetId);

  if (error) {
    console.error('Error updating widget layout:', error);
    return false;
  }

  return true;
}

// ============================================
// BATCH UPDATE LAYOUTS (after drag-end)
// ============================================

export async function batchUpdateLayouts(
  updates: Array<{ id: string; layout: Record<string, unknown> }>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  // Supabase doesn't support batch upsert by arbitrary ID easily,
  // so we run them in parallel.
  const results = await Promise.all(
    updates.map(({ id, layout }) =>
      getDb()
        .from('pinned_widgets')
        .update({ layout })
        .eq('id', id)
    )
  );

  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    console.error('Some layout updates failed:', failed.map((f) => f.error));
    return false;
  }

  return true;
}

// ============================================
// CLEAR ALL (for a user)
// ============================================

export async function clearAllPinnedWidgets(employeeId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const employeeUuid = await resolveEmployeeUuid(employeeId);

  const { error } = await getDb()
    .from('pinned_widgets')
    .delete()
    .eq('employee_id', employeeUuid);

  if (error) {
    console.error('Error clearing pinned widgets:', error);
    return false;
  }

  return true;
}
