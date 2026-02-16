import React, { createContext, useContext, useRef, useCallback, useEffect } from "react";
import { useSnapQueue } from "./SnapQueueContext";
import { api } from "../api/client";

/** Maximum number of snap API calls in flight at once.
 * Keep at 2 to avoid OpenAI rate-limit contention (each snap
 * triggers vision + guide + TTS calls sequentially). */
const MAX_CONCURRENT = 2;

interface PendingJob {
  id: string;
  imageBase64: string;
  locale: string;
  gps?: { lat: number; lng: number };
}

export interface BackgroundSnapContextValue {
  /** Dispatch a snap for background processing. Returns queue item ID. */
  dispatchSnap: (
    imageBase64: string,
    locale: string,
    gps?: { lat: number; lng: number }
  ) => string;
}

const BackgroundSnapCtx = createContext<BackgroundSnapContextValue | null>(null);

/**
 * Provider that manages background snap processing at the app level.
 *
 * IMPORTANT: This must live at the App root (never unmounts) so that
 * in-flight API calls always deliver their results to the queue,
 * regardless of which screen the user is viewing.
 */
export function BackgroundSnapProvider({ children }: { children: React.ReactNode }) {
  const { enqueue, updateStatus } = useSnapQueue();

  // Track jobs waiting for a concurrency slot
  const pendingJobs = useRef<PendingJob[]>([]);
  // Track number of currently in-flight API calls
  const inFlightCount = useRef(0);

  /**
   * Process the next pending job if we're under the concurrency limit.
   * Calls itself recursively (via finally()) to drain the pending queue.
   */
  const processNext = useCallback(() => {
    if (inFlightCount.current >= MAX_CONCURRENT) return;
    if (pendingJobs.current.length === 0) return;

    const job = pendingJobs.current.shift()!;
    inFlightCount.current++;

    // Mark as processing in the queue context
    updateStatus(job.id, "processing");

    // Fire the API call — intentionally not awaited
    api
      .snap(job.imageBase64, job.gps, job.locale)
      .then((result) => {
        updateStatus(job.id, "ready", { snapResult: result });
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to process snap";
        updateStatus(job.id, "error", { error: message });
      })
      .finally(() => {
        inFlightCount.current--;
        // Try to start the next pending job
        processNext();
      });

    // Try to fill more slots if available
    processNext();
  }, [updateStatus]);

  /**
   * Dispatch a snap: enqueue it and start background processing.
   *
   * Returns the queue item ID immediately.
   * The camera can call this and keep going — no blocking.
   */
  const dispatchSnap = useCallback(
    (
      imageBase64: string,
      locale: string,
      gps?: { lat: number; lng: number }
    ): string => {
      // Add to the React queue state (visible in UI immediately)
      const id = enqueue(imageBase64, locale, gps);

      // Add to the processing pipeline
      pendingJobs.current.push({ id, imageBase64, locale, gps });

      // Kick off processing (no-op if already at max concurrency)
      processNext();

      return id;
    },
    [enqueue, processNext]
  );

  const value: BackgroundSnapContextValue = { dispatchSnap };

  return (
    <BackgroundSnapCtx.Provider value={value}>
      {children}
    </BackgroundSnapCtx.Provider>
  );
}

/**
 * Access the background snap dispatcher from any component.
 */
export function useBackgroundSnapContext(): BackgroundSnapContextValue {
  const ctx = useContext(BackgroundSnapCtx);
  if (!ctx) {
    throw new Error(
      "useBackgroundSnapContext must be used within a <BackgroundSnapProvider>"
    );
  }
  return ctx;
}

