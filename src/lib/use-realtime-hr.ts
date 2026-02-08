/**
 * @file Real-time HR Data Hook
 * @description Client-side hook for subscribing to real-time HR data changes via Supabase
 * 
 * This hook provides real-time updates for:
 * - Leave requests (new submissions, approvals, rejections)
 * - Regularization requests
 * - Notifications
 * - Attendance updates
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { notifyDataUpdate } from '@/services/hr-api-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type SubscriptionCallback = () => void;

interface RealtimeHROptions {
  employeeId?: string;
  managerId?: string;
  onLeaveRequestChange?: SubscriptionCallback;
  onRegularizationChange?: SubscriptionCallback;
  onNotificationChange?: SubscriptionCallback;
  onAttendanceChange?: SubscriptionCallback;
}

/**
 * Hook for subscribing to real-time HR data changes
 * Automatically cleans up subscriptions on unmount
 */
export function useRealtimeHR(options: RealtimeHROptions = {}) {
  const {
    employeeId,
    managerId,
    onLeaveRequestChange,
    onRegularizationChange,
    onNotificationChange,
    onAttendanceChange,
  } = options;

  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Universal data update handler - triggers UI refresh
  const handleDataChange = useCallback((callback?: SubscriptionCallback) => {
    console.log('[Realtime HR] Data changed, triggering UI refresh');
    notifyDataUpdate(); // Trigger the global event for components that listen
    callback?.();
  }, []);

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('[Realtime HR] Supabase not configured, skipping real-time subscriptions');
      return;
    }

    console.log('[Realtime HR] Setting up real-time subscriptions', { employeeId, managerId });

    // Channel for leave requests
    const leaveChannel = supabase
      .channel('leave-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_requests',
        },
        (payload) => {
          console.log('[Realtime HR] Leave request change:', payload.eventType);
          handleDataChange(onLeaveRequestChange);
        }
      )
      .subscribe();

    channelsRef.current.push(leaveChannel);

    // Channel for regularization requests
    const regChannel = supabase
      .channel('regularization-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'regularization_requests',
        },
        (payload) => {
          console.log('[Realtime HR] Regularization change:', payload.eventType);
          handleDataChange(onRegularizationChange);
        }
      )
      .subscribe();

    channelsRef.current.push(regChannel);

    // Channel for notifications
    const notifChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('[Realtime HR] Notification change:', payload.eventType);
          handleDataChange(onNotificationChange);
        }
      )
      .subscribe();

    channelsRef.current.push(notifChannel);

    // Channel for attendance
    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
        },
        (payload) => {
          console.log('[Realtime HR] Attendance change:', payload.eventType);
          handleDataChange(onAttendanceChange);
        }
      )
      .subscribe();

    channelsRef.current.push(attendanceChannel);

    // Channel for announcements
    const announcementsChannel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          console.log('[Realtime HR] Announcements change');
          handleDataChange();
        }
      )
      .subscribe();

    channelsRef.current.push(announcementsChannel);

    // Channel for documents
    const documentsChannel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
        },
        () => {
          console.log('[Realtime HR] Documents change');
          handleDataChange();
        }
      )
      .subscribe();

    channelsRef.current.push(documentsChannel);

    // Channel for document acknowledgments
    const acknowledgmentsChannel = supabase
      .channel('document-ack-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_acknowledgments',
        },
        () => {
          console.log('[Realtime HR] Document acknowledgments change');
          handleDataChange();
        }
      )
      .subscribe();

    channelsRef.current.push(acknowledgmentsChannel);

    // Cleanup on unmount
    return () => {
      console.log('[Realtime HR] Cleaning up subscriptions');
      channelsRef.current.forEach((channel) => {
        supabase?.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [employeeId, managerId, handleDataChange, onLeaveRequestChange, onRegularizationChange, onNotificationChange, onAttendanceChange]);

  return {
    isSupabaseConfigured: Boolean(
      supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };
}

/**
 * Simple hook to check backend type
 */
export function useBackendType() {
  const isSupabaseConfigured = Boolean(
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return {
    backend: isSupabaseConfigured ? 'supabase' : 'json',
    isSupabase: isSupabaseConfigured,
    isJson: !isSupabaseConfigured,
  };
}
