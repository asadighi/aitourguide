import type { api } from "../api/client";

/**
 * The full snap API response type, reused from the API client.
 */
export type SnapResult = Awaited<ReturnType<typeof api.snap>>;

/**
 * Status lifecycle for a queue item:
 *   pending → processing → ready
 *                        → error
 */
export type SnapQueueItemStatus = "pending" | "processing" | "ready" | "error";

/**
 * A single item in the snap queue.
 */
export interface SnapQueueItem {
  /** Unique identifier for this queue entry */
  id: string;

  /** Current processing status */
  status: SnapQueueItemStatus;

  /** Locale used for this snap */
  locale: string;

  /** Base64-encoded image (kept for potential retry) */
  imageBase64: string;

  /** Optional GPS coordinates at time of snap */
  gps?: { lat: number; lng: number };

  /** Resolved snap result (populated when status = 'ready') */
  snapResult: SnapResult | null;

  /** Error message (populated when status = 'error') */
  error: string | null;

  /** When this snap was queued */
  createdAt: number;

  /**
   * Display-friendly landmark name, extracted from snapResult.
   * Null while still processing.
   */
  landmarkName: string | null;
}

/**
 * Derived counts from the queue, useful for badge displays.
 */
export interface SnapQueueCounts {
  total: number;
  pending: number;
  processing: number;
  ready: number;
  error: number;
}

