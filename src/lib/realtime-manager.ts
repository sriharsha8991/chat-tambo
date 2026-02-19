/**
 * @file Realtime Channel Manager (Singleton)
 * @description Ensures ONE Supabase channel per table, shared across all
 * subscribers. Ref-counted: a channel is created when the first listener
 * attaches and removed only when the last listener detaches.
 */

import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type ChangeCallback = () => void;

/** Tables we subscribe to */
const TABLES = [
  "leave_requests",
  "regularization_requests",
  "notifications",
  "attendance",
  "announcements",
  "documents",
  "document_acknowledgments",
] as const;

export type HRTable = (typeof TABLES)[number];

interface TableEntry {
  channel: RealtimeChannel;
  listeners: Set<ChangeCallback>;
  debounceTimer?: ReturnType<typeof setTimeout>;
}

const DEBOUNCE_MS = 300;

const channels = new Map<HRTable, TableEntry>();

function isConfigured(): boolean {
  return Boolean(
    supabase &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Subscribe to changes on a Supabase table.
 * Returns an unsubscribe function.
 */
export function subscribe(table: HRTable, cb: ChangeCallback): () => void {
  if (!isConfigured()) return () => {};

  let entry = channels.get(table);

  if (!entry) {
    // First subscriber — create the channel
    const channel = supabase!
      .channel(`rt-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          // Debounce fan-out: coalesce rapid changes (e.g. batch inserts)
          const e = channels.get(table);
          if (!e) return;
          clearTimeout(e.debounceTimer);
          e.debounceTimer = setTimeout(() => {
            e.listeners.forEach((fn) => {
              try {
                fn();
              } catch (err) {
                console.error(`[RealtimeManager] listener error on ${table}:`, err);
              }
            });
          }, DEBOUNCE_MS);
        },
      )
      .subscribe();

    entry = { channel, listeners: new Set() };
    channels.set(table, entry);
  }

  entry.listeners.add(cb);

  return () => {
    const current = channels.get(table);
    if (!current) return;
    current.listeners.delete(cb);

    if (current.listeners.size === 0) {
      // Last subscriber gone — tear down channel
      clearTimeout(current.debounceTimer);
      supabase?.removeChannel(current.channel);
      channels.delete(table);
    }
  };
}

/**
 * Subscribe to multiple tables at once.
 * Returns a single unsubscribe function that removes all.
 */
export function subscribeMany(
  tables: HRTable[],
  cb: ChangeCallback,
): () => void {
  const unsubs = tables.map((t) => subscribe(t, cb));
  return () => unsubs.forEach((u) => u());
}

/**
 * Get the number of active channels (useful for debugging).
 */
export function activeChannelCount(): number {
  return channels.size;
}
