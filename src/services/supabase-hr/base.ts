import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type Employee = Database['public']['Tables']['employees']['Row'];
export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type RegularizationRequest = Database['public']['Tables']['regularization_requests']['Row'];
export type LeaveBalanceRow = Database['public']['Tables']['leave_balances']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type PolicyRow = Database['public']['Tables']['policies']['Row'];
export type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];
export type DocumentRow = Database['public']['Tables']['documents']['Row'];
export type DocumentAcknowledgmentRow = Database['public']['Tables']['document_acknowledgments']['Row'];

export type { Database };
export { isSupabaseConfigured };

export const getDb = () => getSupabase();
