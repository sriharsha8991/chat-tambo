/**
 * Dashboard & Live Query Types
 *
 * Types for the pin-to-dashboard system where chat-rendered components
 * can be pinned and re-rendered on a personal dashboard with live data.
 */

// ============================================
// QUERY DESCRIPTOR
// ============================================

/**
 * A serializable descriptor that fully identifies a data query.
 * Stored in the DB alongside pinned components so data can be
 * re-fetched without involving the LLM.
 */
export interface QueryDescriptor {
  /** Registered query identifier (e.g. "leaveBalance", "pendingApprovals") */
  queryId: string;
  /** Parameters passed to the query function */
  params: Record<string, unknown>;
}

// ============================================
// GRID LAYOUT
// ============================================

/** Position and size of a widget within a react-grid-layout grid */
export interface GridLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

// ============================================
// PINNED WIDGET
// ============================================

/** A component pinned to the user's personal dashboard */
export interface PinnedWidget {
  id: string;
  employeeId: string;
  componentName: string;
  queryDescriptor: QueryDescriptor;
  layout: GridLayout;
  title?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// QUERY RESULT
// ============================================

/** Generic result returned by useLiveQuery */
export interface QueryResult<T = unknown> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// ============================================
// COMPONENT REGISTRY ENTRY
// ============================================

/** Metadata for a registered component */
export interface ComponentRegistryEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  defaultLayout: GridLayout;
  /** Human-readable label for the dashboard */
  label: string;
  /** Which persona(s) typically use this component */
  persona: Array<"employee" | "manager" | "hr">;
}
