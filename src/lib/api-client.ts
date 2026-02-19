/**
 * @file Shared API Client
 * @description Single HTTP helper used by all client-side code.
 *
 * Replaces duplicate get/post helpers in hr-api-client.ts and usePinnedWidgets.ts.
 */

const API_BASE = "/api/hr";

/**
 * GET request to the unified HR API route.
 */
export async function apiGet<T>(
  action: string,
  params?: Record<string, string>,
): Promise<T> {
  const searchParams = new URLSearchParams({ action, ...params });
  const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

/**
 * POST request to the unified HR API route.
 */
export async function apiPost<T>(
  action: string,
  data: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "API request failed");
  }
  return response.json();
}

/**
 * Dispatch global event to notify UI components that HR data has changed.
 */
export function notifyDataUpdate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hr-data-updated"));
  }
}

/**
 * Stable JSON stringify with sorted keys — avoids key-order sensitivity.
 */
export function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return "";
  if (typeof obj !== "object") return JSON.stringify(obj);
  return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}
