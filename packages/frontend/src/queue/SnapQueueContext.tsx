import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type {
  SnapQueueItem,
  SnapQueueItemStatus,
  SnapQueueCounts,
  SnapResult,
} from "./types";

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

let nextId = 1;

/** Generate a simple unique ID for queue items. */
export function generateQueueId(): string {
  return `snap-${Date.now()}-${nextId++}`;
}

/**
 * Extract the top landmark name from a SnapResult, if available.
 */
export function extractLandmarkName(result: SnapResult): string | null {
  const landmarks = result.landmark?.landmarks;
  if (landmarks && landmarks.length > 0) {
    return landmarks[0].name;
  }
  return null;
}

// ────────────────────────────────────────────────────────
// Reducer
// ────────────────────────────────────────────────────────

export type QueueAction =
  | {
      type: "ENQUEUE";
      item: SnapQueueItem;
    }
  | {
      type: "UPDATE_STATUS";
      id: string;
      status: SnapQueueItemStatus;
      snapResult?: SnapResult;
      error?: string;
    }
  | {
      type: "REMOVE";
      id: string;
    }
  | {
      type: "CLEAR";
    };

export function queueReducer(
  state: SnapQueueItem[],
  action: QueueAction
): SnapQueueItem[] {
  switch (action.type) {
    case "ENQUEUE":
      return [...state, action.item];

    case "UPDATE_STATUS":
      return state.map((item) => {
        if (item.id !== action.id) return item;

        const updated: SnapQueueItem = {
          ...item,
          status: action.status,
        };

        if (action.status === "ready" && action.snapResult) {
          updated.snapResult = action.snapResult;
          updated.landmarkName = extractLandmarkName(action.snapResult);
        }

        if (action.status === "error" && action.error) {
          updated.error = action.error;
        }

        return updated;
      });

    case "REMOVE":
      return state.filter((item) => item.id !== action.id);

    case "CLEAR":
      return [];

    default:
      return state;
  }
}

// ────────────────────────────────────────────────────────
// Context value interface
// ────────────────────────────────────────────────────────

export interface SnapQueueContextValue {
  /** All queue items in insertion order (FIFO). */
  items: SnapQueueItem[];

  /** Derived counts for badges / indicators. */
  counts: SnapQueueCounts;

  /**
   * Add a new snap to the queue in 'pending' status.
   * Returns the generated queue item ID.
   */
  enqueue: (imageBase64: string, locale: string, gps?: { lat: number; lng: number }) => string;

  /**
   * Transition a queue item to a new status.
   * Optionally attach a SnapResult (for 'ready') or error message (for 'error').
   */
  updateStatus: (
    id: string,
    status: SnapQueueItemStatus,
    data?: { snapResult?: SnapResult; error?: string }
  ) => void;

  /** Remove a single item from the queue. */
  remove: (id: string) => void;

  /** Clear all items from the queue. */
  clear: () => void;
}

// ────────────────────────────────────────────────────────
// Context + Provider
// ────────────────────────────────────────────────────────

const SnapQueueContext = createContext<SnapQueueContextValue | null>(null);

export function SnapQueueProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(queueReducer, []);

  const enqueue = useCallback(
    (imageBase64: string, locale: string, gps?: { lat: number; lng: number }): string => {
      const id = generateQueueId();
      const item: SnapQueueItem = {
        id,
        status: "pending",
        locale,
        imageBase64,
        gps,
        snapResult: null,
        error: null,
        createdAt: Date.now(),
        landmarkName: null,
      };
      dispatch({ type: "ENQUEUE", item });
      return id;
    },
    []
  );

  const updateStatus = useCallback(
    (
      id: string,
      status: SnapQueueItemStatus,
      data?: { snapResult?: SnapResult; error?: string }
    ) => {
      dispatch({
        type: "UPDATE_STATUS",
        id,
        status,
        snapResult: data?.snapResult,
        error: data?.error,
      });
    },
    []
  );

  const remove = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const counts: SnapQueueCounts = useMemo(() => {
    const c: SnapQueueCounts = {
      total: items.length,
      pending: 0,
      processing: 0,
      ready: 0,
      error: 0,
    };
    for (const item of items) {
      c[item.status]++;
    }
    return c;
  }, [items]);

  const value: SnapQueueContextValue = useMemo(
    () => ({ items, counts, enqueue, updateStatus, remove, clear }),
    [items, counts, enqueue, updateStatus, remove, clear]
  );

  return (
    <SnapQueueContext.Provider value={value}>
      {children}
    </SnapQueueContext.Provider>
  );
}

// ────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────

/**
 * Access the snap queue from any component inside `<SnapQueueProvider>`.
 */
export function useSnapQueue(): SnapQueueContextValue {
  const ctx = useContext(SnapQueueContext);
  if (!ctx) {
    throw new Error("useSnapQueue must be used within a <SnapQueueProvider>");
  }
  return ctx;
}

