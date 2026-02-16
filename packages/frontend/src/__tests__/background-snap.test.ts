/**
 * Tests for the background snap processing pipeline.
 *
 * Since useBackgroundSnap is a React hook that depends on context,
 * we test the underlying concurrency and queue logic by simulating
 * the processing pipeline with plain functions and promises.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { queueReducer } from "../queue/SnapQueueContext";
import type { SnapQueueItem, SnapResult } from "../queue/types";

// ── Mock SnapResult factory ──────────────────────────────────

function makeMockSnapResult(name: string): SnapResult {
  return {
    landmark: {
      schema: "landmark_identification.v1",
      landmarks: [
        {
          name,
          confidence: 0.95,
          location: { city: "Test City", country: "Test Country" },
          category: "monument",
          brief_description: `A description of ${name}`,
        },
      ],
      needs_clarification: false,
      clarification_message: null,
    },
    guide: {
      schema: "guide_content.v1",
      landmark_name: name,
      locale: "en",
      title: `Guide: ${name}`,
      summary: `Summary of ${name}`,
      facts: [{ heading: "Fact", body: "A fact" }],
      narration_script: `Welcome to ${name}!`,
      fun_fact: null,
      confidence_note: null,
    },
    cached: false,
    audio: {
      audioId: `audio-${name}`,
      url: `/audio/audio-${name}`,
      cached: false,
      voice: "nova",
    },
    ads: [],
  };
}

function makeItem(id: string, status: SnapQueueItem["status"] = "pending"): SnapQueueItem {
  return {
    id,
    status,
    locale: "en",
    imageBase64: "base64",
    snapResult: null,
    error: null,
    createdAt: Date.now(),
    landmarkName: null,
  };
}

// ── Concurrency simulation ───────────────────────────────────

/**
 * Simulates the background processing pipeline from useBackgroundSnap.
 * This mirrors the logic in the hook but without React dependencies,
 * making it fully testable.
 */
function createProcessingPipeline(
  maxConcurrent: number,
  apiCall: (id: string) => Promise<SnapResult>
) {
  const pendingJobs: { id: string }[] = [];
  let inFlight = 0;
  const statusLog: { id: string; status: string; landmarkName?: string; error?: string }[] = [];

  function processNext(): void {
    if (inFlight >= maxConcurrent) return;
    if (pendingJobs.length === 0) return;

    const job = pendingJobs.shift()!;
    inFlight++;
    statusLog.push({ id: job.id, status: "processing" });

    apiCall(job.id)
      .then((result) => {
        statusLog.push({
          id: job.id,
          status: "ready",
          landmarkName: result.landmark.landmarks[0]?.name,
        });
      })
      .catch((err) => {
        statusLog.push({
          id: job.id,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown",
        });
      })
      .finally(() => {
        inFlight--;
        processNext();
      });

    // Try to fill more slots
    processNext();
  }

  function dispatch(id: string): void {
    pendingJobs.push({ id });
    processNext();
  }

  return {
    dispatch,
    get inFlight() {
      return inFlight;
    },
    get statusLog() {
      return statusLog;
    },
    get pendingCount() {
      return pendingJobs.length;
    },
  };
}

// ── Tests ────────────────────────────────────────────────────

describe("Background Snap Processing – Concurrency", () => {
  it("processes a single snap immediately", async () => {
    const pipeline = createProcessingPipeline(3, async (id) =>
      makeMockSnapResult(`Landmark-${id}`)
    );

    pipeline.dispatch("snap-1");

    // Wait for async resolution
    await new Promise((r) => setTimeout(r, 10));

    expect(pipeline.statusLog).toEqual([
      { id: "snap-1", status: "processing" },
      { id: "snap-1", status: "ready", landmarkName: "Landmark-snap-1" },
    ]);
    expect(pipeline.inFlight).toBe(0);
  });

  it("processes up to 3 snaps concurrently", async () => {
    let resolvers: (() => void)[] = [];

    const pipeline = createProcessingPipeline(3, (id) => {
      return new Promise<SnapResult>((resolve) => {
        resolvers.push(() => resolve(makeMockSnapResult(`Landmark-${id}`)));
      });
    });

    pipeline.dispatch("s1");
    pipeline.dispatch("s2");
    pipeline.dispatch("s3");

    // All 3 should be in-flight immediately
    expect(pipeline.inFlight).toBe(3);
    expect(pipeline.pendingCount).toBe(0);

    // Resolve all
    resolvers.forEach((r) => r());
    await new Promise((r) => setTimeout(r, 10));

    expect(pipeline.inFlight).toBe(0);
    const readyEntries = pipeline.statusLog.filter((e) => e.status === "ready");
    expect(readyEntries).toHaveLength(3);
  });

  it("queues 4th snap when at max concurrency (3)", async () => {
    let resolvers: (() => void)[] = [];

    const pipeline = createProcessingPipeline(3, (id) => {
      return new Promise<SnapResult>((resolve) => {
        resolvers.push(() => resolve(makeMockSnapResult(`Landmark-${id}`)));
      });
    });

    pipeline.dispatch("s1");
    pipeline.dispatch("s2");
    pipeline.dispatch("s3");
    pipeline.dispatch("s4"); // This should wait

    expect(pipeline.inFlight).toBe(3);
    expect(pipeline.pendingCount).toBe(1); // s4 waiting

    // Only 3 "processing" entries so far
    const processingEntries = pipeline.statusLog.filter(
      (e) => e.status === "processing"
    );
    expect(processingEntries).toHaveLength(3);

    // Resolve first snap — s4 should start
    resolvers[0]();
    await new Promise((r) => setTimeout(r, 10));

    expect(pipeline.inFlight).toBe(3); // s2, s3, s4 now in flight
    expect(pipeline.pendingCount).toBe(0);

    // s4 should now be processing
    const allProcessing = pipeline.statusLog.filter(
      (e) => e.status === "processing"
    );
    expect(allProcessing).toHaveLength(4);

    // Resolve remaining
    resolvers.slice(1).forEach((r) => r());
    await new Promise((r) => setTimeout(r, 10));

    expect(pipeline.inFlight).toBe(0);
    const allReady = pipeline.statusLog.filter((e) => e.status === "ready");
    expect(allReady).toHaveLength(4);
  });

  it("handles errors without blocking other snaps", async () => {
    let callCount = 0;
    const pipeline = createProcessingPipeline(3, async (id) => {
      callCount++;
      if (id === "s2") throw new Error("Network timeout");
      return makeMockSnapResult(`Landmark-${id}`);
    });

    pipeline.dispatch("s1");
    pipeline.dispatch("s2"); // This one will fail
    pipeline.dispatch("s3");

    await new Promise((r) => setTimeout(r, 10));

    expect(pipeline.inFlight).toBe(0);
    expect(callCount).toBe(3);

    const readyEntries = pipeline.statusLog.filter((e) => e.status === "ready");
    expect(readyEntries).toHaveLength(2);

    const errorEntries = pipeline.statusLog.filter((e) => e.status === "error");
    expect(errorEntries).toHaveLength(1);
    expect(errorEntries[0].id).toBe("s2");
    expect(errorEntries[0].error).toBe("Network timeout");
  });

  it("drains 6 snaps with max concurrency 3 in correct order", async () => {
    const completionOrder: string[] = [];
    let resolvers: Map<string, () => void> = new Map();

    const pipeline = createProcessingPipeline(3, (id) => {
      return new Promise<SnapResult>((resolve) => {
        resolvers.set(id, () => {
          completionOrder.push(id);
          resolve(makeMockSnapResult(`Landmark-${id}`));
        });
      });
    });

    // Dispatch 6 snaps
    for (let i = 1; i <= 6; i++) {
      pipeline.dispatch(`s${i}`);
    }

    // First 3 should be in-flight, 3 pending
    expect(pipeline.inFlight).toBe(3);
    expect(pipeline.pendingCount).toBe(3);

    // Complete s1 → s4 should start
    resolvers.get("s1")!();
    await new Promise((r) => setTimeout(r, 10));
    expect(pipeline.inFlight).toBe(3); // s2, s3, s4

    // Complete s2 → s5 should start
    resolvers.get("s2")!();
    await new Promise((r) => setTimeout(r, 10));
    expect(pipeline.inFlight).toBe(3); // s3, s4, s5

    // Complete s3 → s6 should start
    resolvers.get("s3")!();
    await new Promise((r) => setTimeout(r, 10));
    expect(pipeline.inFlight).toBe(3); // s4, s5, s6

    // Complete remaining
    resolvers.get("s4")!();
    resolvers.get("s5")!();
    resolvers.get("s6")!();
    await new Promise((r) => setTimeout(r, 10));

    expect(pipeline.inFlight).toBe(0);
    expect(completionOrder).toEqual(["s1", "s2", "s3", "s4", "s5", "s6"]);

    const allReady = pipeline.statusLog.filter((e) => e.status === "ready");
    expect(allReady).toHaveLength(6);
  });
});

describe("Background Snap Processing – Reducer Integration", () => {
  it("full lifecycle: enqueue → processing → ready with snapResult", () => {
    let state: SnapQueueItem[] = [];

    // Enqueue
    const item = makeItem("snap-1", "pending");
    state = queueReducer(state, { type: "ENQUEUE", item });
    expect(state[0].status).toBe("pending");
    expect(state[0].landmarkName).toBeNull();

    // Processing
    state = queueReducer(state, {
      type: "UPDATE_STATUS",
      id: "snap-1",
      status: "processing",
    });
    expect(state[0].status).toBe("processing");

    // Ready
    const result = makeMockSnapResult("Eiffel Tower");
    state = queueReducer(state, {
      type: "UPDATE_STATUS",
      id: "snap-1",
      status: "ready",
      snapResult: result,
    });
    expect(state[0].status).toBe("ready");
    expect(state[0].landmarkName).toBe("Eiffel Tower");
    expect(state[0].snapResult).toBe(result);
  });

  it("full lifecycle: enqueue → processing → error", () => {
    let state: SnapQueueItem[] = [];

    const item = makeItem("snap-2", "pending");
    state = queueReducer(state, { type: "ENQUEUE", item });

    state = queueReducer(state, {
      type: "UPDATE_STATUS",
      id: "snap-2",
      status: "processing",
    });

    state = queueReducer(state, {
      type: "UPDATE_STATUS",
      id: "snap-2",
      status: "error",
      error: "Server returned 500",
    });

    expect(state[0].status).toBe("error");
    expect(state[0].error).toBe("Server returned 500");
    expect(state[0].snapResult).toBeNull();
  });

  it("mixed queue: multiple items in various lifecycle stages", () => {
    let state: SnapQueueItem[] = [];

    // Add 4 items
    for (let i = 1; i <= 4; i++) {
      state = queueReducer(state, {
        type: "ENQUEUE",
        item: makeItem(`snap-${i}`),
      });
    }

    // Move first 3 to processing (simulating max concurrency = 3)
    for (let i = 1; i <= 3; i++) {
      state = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: `snap-${i}`,
        status: "processing",
      });
    }

    // snap-4 stays pending
    expect(state[3].status).toBe("pending");

    // snap-1 completes
    state = queueReducer(state, {
      type: "UPDATE_STATUS",
      id: "snap-1",
      status: "ready",
      snapResult: makeMockSnapResult("Colosseum"),
    });

    // snap-4 starts processing (slot freed)
    state = queueReducer(state, {
      type: "UPDATE_STATUS",
      id: "snap-4",
      status: "processing",
    });

    // snap-2 errors
    state = queueReducer(state, {
      type: "UPDATE_STATUS",
      id: "snap-2",
      status: "error",
      error: "Timeout",
    });

    // Verify final state
    expect(state[0].status).toBe("ready");
    expect(state[0].landmarkName).toBe("Colosseum");
    expect(state[1].status).toBe("error");
    expect(state[1].error).toBe("Timeout");
    expect(state[2].status).toBe("processing");
    expect(state[3].status).toBe("processing");
  });
});

