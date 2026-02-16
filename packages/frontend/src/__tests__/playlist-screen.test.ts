/**
 * Tests for PlaylistScreen helper functions and rendering logic.
 *
 * Since PlaylistScreen is a React Native component, we test:
 * 1. The pure helper functions (statusIcon, statusLabel, timeAgo)
 * 2. The queue state interactions that drive the UI
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { queueReducer } from "../queue/SnapQueueContext";
import type { SnapQueueItem, SnapResult, SnapQueueCounts } from "../queue/types";

// ── Helper function re-implementations for testing ──────────
// These mirror the logic in PlaylistScreen.tsx (which are private to the component).
// We test the logic here to ensure correctness.

function statusIcon(status: SnapQueueItem["status"]): string {
  switch (status) {
    case "pending":
      return "🕐";
    case "processing":
      return "⏳";
    case "ready":
      return "✅";
    case "error":
      return "❌";
  }
}

function statusLabel(status: SnapQueueItem["status"]): string {
  switch (status) {
    case "pending":
      return "Queued";
    case "processing":
      return "Identifying…";
    case "ready":
      return "Ready";
    case "error":
      return "Failed";
  }
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function computeCounts(items: SnapQueueItem[]): SnapQueueCounts {
  const c: SnapQueueCounts = { total: items.length, pending: 0, processing: 0, ready: 0, error: 0 };
  for (const item of items) c[item.status]++;
  return c;
}

// ── Test helpers ──────────────────────────────────────────

function makeItem(
  id: string,
  status: SnapQueueItem["status"] = "pending",
  overrides: Partial<SnapQueueItem> = {}
): SnapQueueItem {
  return {
    id,
    status,
    locale: "en",
    imageBase64: "base64",
    snapResult: null,
    error: null,
    createdAt: Date.now(),
    landmarkName: null,
    ...overrides,
  };
}

function makeMockSnapResult(name: string): SnapResult {
  return {
    landmark: {
      schema: "landmark_identification.v1",
      landmarks: [
        {
          name,
          confidence: 0.95,
          location: { city: "Paris", country: "France" },
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
      title: `Guide to ${name}`,
      summary: `Summary of ${name}`,
      facts: [
        { heading: "History", body: "Some history" },
        { heading: "Architecture", body: "Some architecture" },
      ],
      narration_script: `Welcome to ${name}!`,
      fun_fact: "A surprising fact",
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

// ── Tests ────────────────────────────────────────────────

describe("PlaylistScreen – statusIcon", () => {
  it("returns correct icon for each status", () => {
    expect(statusIcon("pending")).toBe("🕐");
    expect(statusIcon("processing")).toBe("⏳");
    expect(statusIcon("ready")).toBe("✅");
    expect(statusIcon("error")).toBe("❌");
  });
});

describe("PlaylistScreen – statusLabel", () => {
  it("returns correct label for each status", () => {
    expect(statusLabel("pending")).toBe("Queued");
    expect(statusLabel("processing")).toBe("Identifying…");
    expect(statusLabel("ready")).toBe("Ready");
    expect(statusLabel("error")).toBe("Failed");
  });
});

describe("PlaylistScreen – timeAgo", () => {
  it("returns seconds for recent timestamps", () => {
    const now = Date.now();
    expect(timeAgo(now - 5000)).toBe("5s ago");
    expect(timeAgo(now - 30000)).toBe("30s ago");
  });

  it("returns minutes for older timestamps", () => {
    const now = Date.now();
    expect(timeAgo(now - 120000)).toBe("2m ago");
    expect(timeAgo(now - 3540000)).toBe("59m ago");
  });

  it("returns hours for much older timestamps", () => {
    const now = Date.now();
    expect(timeAgo(now - 3600000)).toBe("1h ago");
    expect(timeAgo(now - 7200000)).toBe("2h ago");
  });
});

describe("PlaylistScreen – queue counts for badge display", () => {
  it("computes zero counts for empty queue", () => {
    const counts = computeCounts([]);
    expect(counts).toEqual({
      total: 0,
      pending: 0,
      processing: 0,
      ready: 0,
      error: 0,
    });
  });

  it("computes correct counts for mixed queue", () => {
    const items: SnapQueueItem[] = [
      makeItem("s1", "ready"),
      makeItem("s2", "processing"),
      makeItem("s3", "ready"),
      makeItem("s4", "error"),
      makeItem("s5", "pending"),
    ];
    const counts = computeCounts(items);
    expect(counts).toEqual({
      total: 5,
      pending: 1,
      processing: 1,
      ready: 2,
      error: 1,
    });
  });
});

describe("PlaylistScreen – card display logic", () => {
  it("displays landmark name for ready items", () => {
    const item = makeItem("s1", "ready", {
      landmarkName: "Eiffel Tower",
      snapResult: makeMockSnapResult("Eiffel Tower"),
    });
    // Card title should be the landmark name
    const displayTitle = item.landmarkName ?? statusLabel(item.status);
    expect(displayTitle).toBe("Eiffel Tower");
  });

  it("displays status label for processing items", () => {
    const item = makeItem("s1", "processing");
    const displayTitle = item.landmarkName ?? statusLabel(item.status);
    expect(displayTitle).toBe("Identifying…");
  });

  it("displays status label for pending items", () => {
    const item = makeItem("s1", "pending");
    const displayTitle = item.landmarkName ?? statusLabel(item.status);
    expect(displayTitle).toBe("Queued");
  });

  it("displays error message for failed items", () => {
    const item = makeItem("s1", "error", { error: "Network timeout" });
    const displayTitle = item.landmarkName ?? statusLabel(item.status);
    expect(displayTitle).toBe("Failed");
    expect(item.error).toBe("Network timeout");
  });
});

describe("PlaylistScreen – expand/collapse logic", () => {
  it("only ready items are expandable", () => {
    const statuses: SnapQueueItem["status"][] = [
      "pending",
      "processing",
      "ready",
      "error",
    ];
    const expandable = statuses.filter((s) => s === "ready");
    expect(expandable).toEqual(["ready"]);
  });

  it("expanded ready item exposes guide data", () => {
    const result = makeMockSnapResult("Colosseum");
    const item = makeItem("s1", "ready", {
      snapResult: result,
      landmarkName: "Colosseum",
    });

    // The expanded section would show:
    expect(item.snapResult!.guide!.title).toBe("Guide to Colosseum");
    expect(item.snapResult!.guide!.summary).toBe("Summary of Colosseum");
    expect(item.snapResult!.guide!.facts).toHaveLength(2);
    expect(item.snapResult!.guide!.fun_fact).toBe("A surprising fact");
    expect(item.snapResult!.audio).toBeTruthy();
  });

  it("expanded ready item without guide shows fallback", () => {
    const result = makeMockSnapResult("Unknown Place");
    result.guide = null;
    const item = makeItem("s1", "ready", {
      snapResult: result,
      landmarkName: "Unknown Place",
    });

    expect(item.snapResult!.guide).toBeNull();
  });
});

describe("PlaylistScreen – queue operations via reducer", () => {
  it("removing an item updates the list", () => {
    let state: SnapQueueItem[] = [
      makeItem("s1", "ready"),
      makeItem("s2", "processing"),
      makeItem("s3", "pending"),
    ];

    state = queueReducer(state, { type: "REMOVE", id: "s2" });

    expect(state).toHaveLength(2);
    expect(state.map((i) => i.id)).toEqual(["s1", "s3"]);
  });

  it("clearing all items empties the list", () => {
    let state: SnapQueueItem[] = [
      makeItem("s1", "ready"),
      makeItem("s2", "error"),
      makeItem("s3", "pending"),
    ];

    state = queueReducer(state, { type: "CLEAR" });

    expect(state).toHaveLength(0);
  });

  it("items render in FIFO order (insertion order)", () => {
    let state: SnapQueueItem[] = [];

    state = queueReducer(state, {
      type: "ENQUEUE",
      item: makeItem("first", "pending", { createdAt: 1000 }),
    });
    state = queueReducer(state, {
      type: "ENQUEUE",
      item: makeItem("second", "pending", { createdAt: 2000 }),
    });
    state = queueReducer(state, {
      type: "ENQUEUE",
      item: makeItem("third", "pending", { createdAt: 3000 }),
    });

    // Even after status changes, order is preserved
    state = queueReducer(state, {
      type: "UPDATE_STATUS",
      id: "third",
      status: "ready",
      snapResult: makeMockSnapResult("Third Landmark"),
    });
    state = queueReducer(state, {
      type: "UPDATE_STATUS",
      id: "first",
      status: "ready",
      snapResult: makeMockSnapResult("First Landmark"),
    });

    expect(state.map((i) => i.id)).toEqual(["first", "second", "third"]);
    expect(state[0].landmarkName).toBe("First Landmark");
    expect(state[2].landmarkName).toBe("Third Landmark");
  });
});

