import { useRef, useCallback, useEffect } from "react";
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

/**
 * Hook that bridges the snap queue with the API.
 *
 * `dispatchSnap()` immediately enqueues a snap and starts
 * background processing. The camera never blocks.
 *
 * Concurrency is capped at MAX_CONCURRENT in-flight API calls.
 * Excess snaps wait in a local pending queue and auto-start
 * when a slot opens.
 */
export function useBackgroundSnap() {
  const { enqueue, updateStatus, counts } = useSnapQueue();

  // Track jobs waiting for a concurrency slot
  const pendingJobs = useRef<PendingJob[]>([]);
  // Track number of currently in-flight API calls
  const inFlightCount = useRef(0);
  // Flag to prevent processing after unmount
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  /**
   * Process the next pending job if we're under the concurrency limit.
   * Calls itself recursively (via then()) to drain the pending queue.
   */
  const processNext = useCallback(() => {
    if (unmounted.current) return;
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
        if (unmounted.current) return;
        updateStatus(job.id, "ready", { snapResult: result });
      })
      .catch((err) => {
        if (unmounted.current) return;
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

  return {
    /** Dispatch a snap for background processing. Returns queue item ID. */
    dispatchSnap,
    /** Number of currently in-flight API calls. */
    get inFlightCount() {
      return inFlightCount.current;
    },
  };
}

