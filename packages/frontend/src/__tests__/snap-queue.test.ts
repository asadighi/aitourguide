import { describe, it, expect } from "vitest";
import {
  queueReducer,
  extractLandmarkName,
  generateQueueId,
} from "../queue/SnapQueueContext";
import type { SnapQueueItem, SnapResult } from "../queue/types";

// ── Helpers ──────────────────────────────────────────────

function makeItem(overrides: Partial<SnapQueueItem> = {}): SnapQueueItem {
  return {
    id: overrides.id ?? "test-1",
    status: overrides.status ?? "pending",
    locale: overrides.locale ?? "en",
    imageBase64: overrides.imageBase64 ?? "base64data",
    gps: overrides.gps,
    snapResult: overrides.snapResult ?? null,
    error: overrides.error ?? null,
    createdAt: overrides.createdAt ?? Date.now(),
    landmarkName: overrides.landmarkName ?? null,
  };
}

function makeMockSnapResult(landmarkName: string): SnapResult {
  return {
    landmark: {
      schema: "landmark_identification.v1",
      landmarks: [
        {
          name: landmarkName,
          confidence: 0.95,
          location: { city: "Paris", country: "France" },
          category: "monument",
          brief_description: "A famous landmark",
        },
      ],
      needs_clarification: false,
      clarification_message: null,
    },
    guide: {
      schema: "guide_content.v1",
      landmark_name: landmarkName,
      locale: "en",
      title: `Guide to ${landmarkName}`,
      summary: `Summary of ${landmarkName}`,
      facts: [{ heading: "History", body: "Some history" }],
      narration_script: `Welcome to ${landmarkName}!`,
      fun_fact: null,
      confidence_note: null,
    },
    cached: false,
    audio: {
      audioId: "audio-1",
      url: "/audio/audio-1",
      cached: false,
      voice: "nova",
    },
    ads: [],
  };
}

// ── Tests ────────────────────────────────────────────────

describe("SnapQueue – queueReducer", () => {
  describe("ENQUEUE", () => {
    it("adds an item to an empty queue", () => {
      const item = makeItem({ id: "snap-1" });
      const result = queueReducer([], { type: "ENQUEUE", item });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("snap-1");
      expect(result[0].status).toBe("pending");
    });

    it("appends item to the end (FIFO order)", () => {
      const existing = [makeItem({ id: "snap-1" }), makeItem({ id: "snap-2" })];
      const newItem = makeItem({ id: "snap-3" });
      const result = queueReducer(existing, { type: "ENQUEUE", item: newItem });

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("snap-1");
      expect(result[1].id).toBe("snap-2");
      expect(result[2].id).toBe("snap-3");
    });

    it("preserves all fields on the enqueued item", () => {
      const item = makeItem({
        id: "snap-42",
        locale: "fr",
        imageBase64: "abc123",
        gps: { lat: 48.8584, lng: 2.2945 },
      });
      const result = queueReducer([], { type: "ENQUEUE", item });

      expect(result[0]).toMatchObject({
        id: "snap-42",
        status: "pending",
        locale: "fr",
        imageBase64: "abc123",
        gps: { lat: 48.8584, lng: 2.2945 },
        snapResult: null,
        error: null,
        landmarkName: null,
      });
    });
  });

  describe("UPDATE_STATUS", () => {
    it("transitions pending → processing", () => {
      const state = [makeItem({ id: "snap-1", status: "pending" })];
      const result = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: "snap-1",
        status: "processing",
      });

      expect(result[0].status).toBe("processing");
      expect(result[0].snapResult).toBeNull();
      expect(result[0].error).toBeNull();
    });

    it("transitions processing → ready with snapResult", () => {
      const state = [makeItem({ id: "snap-1", status: "processing" })];
      const snapResult = makeMockSnapResult("Eiffel Tower");
      const result = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: "snap-1",
        status: "ready",
        snapResult,
      });

      expect(result[0].status).toBe("ready");
      expect(result[0].snapResult).toBe(snapResult);
      expect(result[0].landmarkName).toBe("Eiffel Tower");
      expect(result[0].error).toBeNull();
    });

    it("transitions processing → error with message", () => {
      const state = [makeItem({ id: "snap-1", status: "processing" })];
      const result = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: "snap-1",
        status: "error",
        error: "Network timeout",
      });

      expect(result[0].status).toBe("error");
      expect(result[0].error).toBe("Network timeout");
      expect(result[0].snapResult).toBeNull();
    });

    it("does not modify other items in the queue", () => {
      const state = [
        makeItem({ id: "snap-1", status: "ready" }),
        makeItem({ id: "snap-2", status: "processing" }),
        makeItem({ id: "snap-3", status: "pending" }),
      ];
      const result = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: "snap-2",
        status: "error",
        error: "Failed",
      });

      expect(result[0].status).toBe("ready");
      expect(result[1].status).toBe("error");
      expect(result[1].error).toBe("Failed");
      expect(result[2].status).toBe("pending");
    });

    it("is a no-op for a non-existent ID", () => {
      const state = [makeItem({ id: "snap-1", status: "pending" })];
      const result = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: "non-existent",
        status: "processing",
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("pending");
    });
  });

  describe("REMOVE", () => {
    it("removes the specified item", () => {
      const state = [
        makeItem({ id: "snap-1" }),
        makeItem({ id: "snap-2" }),
        makeItem({ id: "snap-3" }),
      ];
      const result = queueReducer(state, { type: "REMOVE", id: "snap-2" });

      expect(result).toHaveLength(2);
      expect(result.map((i) => i.id)).toEqual(["snap-1", "snap-3"]);
    });

    it("returns unchanged state when removing non-existent ID", () => {
      const state = [makeItem({ id: "snap-1" })];
      const result = queueReducer(state, { type: "REMOVE", id: "nope" });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("snap-1");
    });

    it("returns empty array when removing last item", () => {
      const state = [makeItem({ id: "snap-1" })];
      const result = queueReducer(state, { type: "REMOVE", id: "snap-1" });

      expect(result).toHaveLength(0);
    });
  });

  describe("CLEAR", () => {
    it("removes all items", () => {
      const state = [
        makeItem({ id: "snap-1" }),
        makeItem({ id: "snap-2" }),
        makeItem({ id: "snap-3" }),
      ];
      const result = queueReducer(state, { type: "CLEAR" });

      expect(result).toHaveLength(0);
    });

    it("is a no-op on an already empty queue", () => {
      const result = queueReducer([], { type: "CLEAR" });
      expect(result).toHaveLength(0);
    });
  });

  describe("FIFO order preservation", () => {
    it("maintains insertion order across mixed operations", () => {
      let state: SnapQueueItem[] = [];

      // Enqueue 3 items
      state = queueReducer(state, { type: "ENQUEUE", item: makeItem({ id: "A" }) });
      state = queueReducer(state, { type: "ENQUEUE", item: makeItem({ id: "B" }) });
      state = queueReducer(state, { type: "ENQUEUE", item: makeItem({ id: "C" }) });

      // Update B to processing
      state = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: "B",
        status: "processing",
      });

      // Remove A
      state = queueReducer(state, { type: "REMOVE", id: "A" });

      // Enqueue D
      state = queueReducer(state, { type: "ENQUEUE", item: makeItem({ id: "D" }) });

      // Order should be B, C, D
      expect(state.map((i) => i.id)).toEqual(["B", "C", "D"]);
      expect(state[0].status).toBe("processing");
      expect(state[1].status).toBe("pending");
      expect(state[2].status).toBe("pending");
    });
  });

  describe("multiple items in different states simultaneously", () => {
    it("supports items in all four states at once", () => {
      let state: SnapQueueItem[] = [];

      state = queueReducer(state, { type: "ENQUEUE", item: makeItem({ id: "s1" }) });
      state = queueReducer(state, { type: "ENQUEUE", item: makeItem({ id: "s2" }) });
      state = queueReducer(state, { type: "ENQUEUE", item: makeItem({ id: "s3" }) });
      state = queueReducer(state, { type: "ENQUEUE", item: makeItem({ id: "s4" }) });

      state = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: "s1",
        status: "ready",
        snapResult: makeMockSnapResult("Eiffel Tower"),
      });
      state = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: "s2",
        status: "processing",
      });
      state = queueReducer(state, {
        type: "UPDATE_STATUS",
        id: "s3",
        status: "error",
        error: "Timeout",
      });
      // s4 stays pending

      expect(state[0].status).toBe("ready");
      expect(state[0].landmarkName).toBe("Eiffel Tower");
      expect(state[1].status).toBe("processing");
      expect(state[2].status).toBe("error");
      expect(state[2].error).toBe("Timeout");
      expect(state[3].status).toBe("pending");
    });
  });
});

describe("SnapQueue – extractLandmarkName", () => {
  it("extracts the top landmark name", () => {
    const result = makeMockSnapResult("Colosseum");
    expect(extractLandmarkName(result)).toBe("Colosseum");
  });

  it("returns null when landmarks array is empty", () => {
    const result = makeMockSnapResult("x");
    result.landmark.landmarks = [];
    expect(extractLandmarkName(result)).toBeNull();
  });

  it("returns the first landmark when multiple exist", () => {
    const result = makeMockSnapResult("Tower A");
    result.landmark.landmarks.push({
      name: "Tower B",
      confidence: 0.5,
      location: { city: null, country: null },
      category: "building",
      brief_description: "Second guess",
    });
    expect(extractLandmarkName(result)).toBe("Tower A");
  });
});

describe("SnapQueue – generateQueueId", () => {
  it("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateQueueId());
    }
    expect(ids.size).toBe(100);
  });

  it("IDs start with 'snap-' prefix", () => {
    const id = generateQueueId();
    expect(id.startsWith("snap-")).toBe(true);
  });
});

