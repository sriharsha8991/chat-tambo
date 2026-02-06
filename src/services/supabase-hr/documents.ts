import {
  getDb,
  isSupabaseConfigured,
  DocumentRow,
  DocumentAcknowledgmentRow,
} from './base';
import { resolveEmployeeUuid } from './utils';
import { createNotification } from './notifications';

export async function getDocuments(role?: string): Promise<DocumentRow[]> {
  if (!isSupabaseConfigured()) return [];

  let query = getDb()
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (role) {
    query = query.in('audience_role', ['all', role]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  const now = new Date().toISOString();
  return ((data as DocumentRow[]) || []).filter(
    (item) => !item.expires_at || item.expires_at > now
  );
}

export async function getDocumentById(id: string): Promise<DocumentRow | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getDb()
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching document:', error);
    return null;
  }

  return data as DocumentRow;
}

export async function createDocument(input: {
  title: string;
  description?: string | null;
  filePath: string;
  audienceRole: 'all' | 'employee' | 'manager' | 'hr';
  requiresAck?: boolean;
  createdBy?: string | null;
  expiresAt?: string | null;
}): Promise<DocumentRow | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getDb()
    .from('documents')
    .insert({
      title: input.title,
      description: input.description || null,
      file_path: input.filePath,
      audience_role: input.audienceRole,
      requires_ack: input.requiresAck ?? false,
      created_by: input.createdBy || null,
      expires_at: input.expiresAt || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    return null;
  }

  await createNotification({
    employeeId: null,
    audienceRole: input.audienceRole,
    type: 'document_uploaded',
    title: input.title,
    message: input.description || 'A new document is available.',
    relatedId: (data as DocumentRow).id,
  });

  return data as DocumentRow;
}

export async function deleteDocument(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await getDb().from('documents').delete().eq('id', id);

  if (error) {
    console.error('Error deleting document:', error);
    return false;
  }

  return true;
}

export async function acknowledgeDocument(
  employeeId: string,
  documentId: string
): Promise<DocumentAcknowledgmentRow | null> {
  if (!isSupabaseConfigured()) return null;

  const employeeUuid = await resolveEmployeeUuid(employeeId);

  const { data, error } = await getDb()
    .from('document_acknowledgments')
    .upsert({
      employee_id: employeeUuid,
      document_id: documentId,
      acknowledged_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error acknowledging document:', error);
    return null;
  }

  return data as DocumentAcknowledgmentRow;
}

export async function getAcknowledgedDocumentIds(
  employeeId: string
): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const employeeUuid = await resolveEmployeeUuid(employeeId);

  const { data, error } = await getDb()
    .from('document_acknowledgments')
    .select('document_id')
    .eq('employee_id', employeeUuid);

  if (error) {
    console.error('Error fetching acknowledgments:', error);
    return [];
  }

  return ((data as Array<{ document_id: string }>) || []).map((row) => row.document_id);
}
