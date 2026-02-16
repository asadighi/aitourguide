/**
 * Unit tests for the playlist player state machine (pure reducer + helpers).
 *
 * These test the playerReducer, findNextPlayableItemId, and findPrevPlayableItemId
 * without any expo-av or expo-speech dependencies.
 */
import { describe, it, expect } from "vitest";
import {
  playerReducer,
  INITIAL_STATE,
  findNextPlayableItemId,
  findPrevPlayableItemId,
  type PlaylistPlayerState,
  type PlayerAction,
} from "../queue/playlistPlayerReducer";

// ── Helpers ──────────────────────────────────────────────

function makeStatuses(
  items: Array<{ id: string; status: string; hasAudio: boolean }>
) {
  return new Map(
    items.map((i) => [i.id, { status: i.status, hasAudio: i.hasAudio }])
  );
}

// ── playerReducer tests ─────────────────────────────────

describe("playerReducer – PLAY_ITEM", () => {
  it("transitions to intro phase with the given item ID", () => {
    const state = playerReducer(INITIAL_STATE, {
      type: "PLAY_ITEM",
      itemId: "snap-1",
    });
    expect(state.currentItemId).toBe("snap-1");
    expect(state.phase).toBe("intro");
    expect(state.playedItemIds).toEqual([]);
    expect(state.stoppedByUser).toBe(false);
  });

  it("replaces currently playing item", () => {
    const playing: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const state = playerReducer(playing, {
      type: "PLAY_ITEM",
      itemId: "snap-2",
    });
    expect(state.currentItemId).toBe("snap-2");
    expect(state.phase).toBe("intro");
  });

  it("clears stoppedByUser flag when playing", () => {
    const stopped: PlaylistPlayerState = {
      ...INITIAL_STATE,
      stoppedByUser: true,
    };
    const state = playerReducer(stopped, {
      type: "PLAY_ITEM",
      itemId: "snap-1",
    });
    expect(state.stoppedByUser).toBe(false);
  });
});

describe("playerReducer – INTRO_STARTED", () => {
  it("is no-op when already in intro", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "intro",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "INTRO_STARTED" });
    expect(next).toBe(s); // Same reference
  });

  it("sets phase to intro when not already there", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "idle",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "INTRO_STARTED" });
    expect(next.phase).toBe("intro");
  });
});

describe("playerReducer – INTRO_FINISHED", () => {
  it("transitions from intro to narration", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "intro",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "INTRO_FINISHED" });
    expect(next.phase).toBe("narration");
    expect(next.currentItemId).toBe("snap-1");
  });

  it("is no-op when not in intro phase", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "INTRO_FINISHED" });
    expect(next).toBe(s);
  });
});

describe("playerReducer – NARRATION_FINISHED", () => {
  it("marks item as played and goes idle", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "NARRATION_FINISHED" });
    expect(next.phase).toBe("idle");
    expect(next.currentItemId).toBeNull();
    expect(next.playedItemIds).toEqual(["snap-1"]);
  });

  it("does not duplicate ID in playedItemIds", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: ["snap-1"],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "NARRATION_FINISHED" });
    expect(next.playedItemIds).toEqual(["snap-1"]);
  });

  it("appends to existing playedItemIds", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-2",
      phase: "narration",
      playedItemIds: ["snap-1"],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "NARRATION_FINISHED" });
    expect(next.playedItemIds).toEqual(["snap-1", "snap-2"]);
  });

  it("handles null currentItemId gracefully", () => {
    const s: PlaylistPlayerState = {
      currentItemId: null,
      phase: "narration",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "NARRATION_FINISHED" });
    expect(next.phase).toBe("idle");
    expect(next.playedItemIds).toEqual([]);
  });
});

describe("playerReducer – PAUSE / RESUME", () => {
  it("PAUSE transitions from narration to paused", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "PAUSE" });
    expect(next.phase).toBe("paused");
    expect(next.currentItemId).toBe("snap-1");
  });

  it("PAUSE is no-op when not in narration", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "intro",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "PAUSE" });
    expect(next).toBe(s);
  });

  it("RESUME transitions from paused to narration", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "paused",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "RESUME" });
    expect(next.phase).toBe("narration");
    expect(next.currentItemId).toBe("snap-1");
  });

  it("RESUME is no-op when not paused", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "RESUME" });
    expect(next).toBe(s);
  });

  it("full pause/resume cycle preserves state", () => {
    let s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: ["snap-0"],
      stoppedByUser: false,
    };
    s = playerReducer(s, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
    expect(s.currentItemId).toBe("snap-1");
    expect(s.playedItemIds).toEqual(["snap-0"]);

    s = playerReducer(s, { type: "RESUME" });
    expect(s.phase).toBe("narration");
    expect(s.currentItemId).toBe("snap-1");
    expect(s.playedItemIds).toEqual(["snap-0"]);
  });
});

describe("playerReducer – STOP", () => {
  it("clears current item, goes idle, and sets stoppedByUser", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: ["snap-0"],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "STOP" });
    expect(next.phase).toBe("idle");
    expect(next.currentItemId).toBeNull();
    expect(next.stoppedByUser).toBe(true);
    // playedItemIds preserved (stop doesn't erase history)
    expect(next.playedItemIds).toEqual(["snap-0"]);
  });

  it("works from paused state", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "paused",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "STOP" });
    expect(next.phase).toBe("idle");
    expect(next.currentItemId).toBeNull();
    expect(next.stoppedByUser).toBe(true);
  });

  it("works from intro state", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "intro",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, { type: "STOP" });
    expect(next.phase).toBe("idle");
    expect(next.currentItemId).toBeNull();
    expect(next.stoppedByUser).toBe(true);
  });
});

describe("playerReducer – ITEM_REMOVED", () => {
  it("stops playback when currently playing item is removed", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: ["snap-0"],
      stoppedByUser: false,
    };
    const next = playerReducer(s, {
      type: "ITEM_REMOVED",
      itemId: "snap-1",
    });
    expect(next.phase).toBe("idle");
    expect(next.currentItemId).toBeNull();
  });

  it("cleans removed item from playedItemIds", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-2",
      phase: "narration",
      playedItemIds: ["snap-0", "snap-1"],
      stoppedByUser: false,
    };
    const next = playerReducer(s, {
      type: "ITEM_REMOVED",
      itemId: "snap-0",
    });
    expect(next.playedItemIds).toEqual(["snap-1"]);
    expect(next.currentItemId).toBe("snap-2"); // Unchanged
  });

  it("is no-op for unrelated item when not in playedItemIds", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: [],
      stoppedByUser: false,
    };
    const next = playerReducer(s, {
      type: "ITEM_REMOVED",
      itemId: "snap-99",
    });
    expect(next.currentItemId).toBe("snap-1");
    expect(next.phase).toBe("narration");
  });
});

describe("playerReducer – RESET", () => {
  it("returns to initial state", () => {
    const s: PlaylistPlayerState = {
      currentItemId: "snap-3",
      phase: "paused",
      playedItemIds: ["snap-1", "snap-2"],
      stoppedByUser: true,
    };
    const next = playerReducer(s, { type: "RESET" });
    expect(next).toEqual(INITIAL_STATE);
  });
});

// ── Full lifecycle test ─────────────────────────────────

describe("playerReducer – full playback lifecycle", () => {
  it("plays through intro → narration → finished → idle", () => {
    let s: PlaylistPlayerState = INITIAL_STATE;

    // Start playing
    s = playerReducer(s, { type: "PLAY_ITEM", itemId: "snap-1" });
    expect(s).toEqual({
      currentItemId: "snap-1",
      phase: "intro",
      playedItemIds: [],
      stoppedByUser: false,
    });

    // Intro finishes
    s = playerReducer(s, { type: "INTRO_FINISHED" });
    expect(s).toEqual({
      currentItemId: "snap-1",
      phase: "narration",
      playedItemIds: [],
      stoppedByUser: false,
    });

    // Narration finishes
    s = playerReducer(s, { type: "NARRATION_FINISHED" });
    expect(s).toEqual({
      currentItemId: null,
      phase: "idle",
      playedItemIds: ["snap-1"],
      stoppedByUser: false,
    });
  });

  it("plays two items sequentially with pause in between", () => {
    let s: PlaylistPlayerState = INITIAL_STATE;

    // Item 1: full playback
    s = playerReducer(s, { type: "PLAY_ITEM", itemId: "snap-1" });
    s = playerReducer(s, { type: "INTRO_FINISHED" });
    s = playerReducer(s, { type: "NARRATION_FINISHED" });
    expect(s.playedItemIds).toEqual(["snap-1"]);

    // Item 2: with pause
    s = playerReducer(s, { type: "PLAY_ITEM", itemId: "snap-2" });
    s = playerReducer(s, { type: "INTRO_FINISHED" });
    s = playerReducer(s, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
    expect(s.currentItemId).toBe("snap-2");

    s = playerReducer(s, { type: "RESUME" });
    expect(s.phase).toBe("narration");

    s = playerReducer(s, { type: "NARRATION_FINISHED" });
    expect(s.playedItemIds).toEqual(["snap-1", "snap-2"]);
    expect(s.phase).toBe("idle");
  });

  it("handles skip mid-narration (PLAY_ITEM overrides)", () => {
    let s: PlaylistPlayerState = INITIAL_STATE;

    s = playerReducer(s, { type: "PLAY_ITEM", itemId: "snap-1" });
    s = playerReducer(s, { type: "INTRO_FINISHED" });
    expect(s.phase).toBe("narration");

    // Skip to next item (PLAY_ITEM again)
    s = playerReducer(s, { type: "PLAY_ITEM", itemId: "snap-2" });
    expect(s.currentItemId).toBe("snap-2");
    expect(s.phase).toBe("intro");
    // snap-1 was NOT finished, so not in playedItemIds
    expect(s.playedItemIds).toEqual([]);
  });
});

// ── findNextPlayableItemId tests ────────────────────────

describe("findNextPlayableItemId", () => {
  const ids = ["s1", "s2", "s3", "s4", "s5"];
  const statuses = makeStatuses([
    { id: "s1", status: "ready", hasAudio: true },
    { id: "s2", status: "error", hasAudio: false },
    { id: "s3", status: "ready", hasAudio: true },
    { id: "s4", status: "processing", hasAudio: false },
    { id: "s5", status: "ready", hasAudio: true },
  ]);

  it("returns first ready item with audio when starting from null", () => {
    const next = findNextPlayableItemId(ids, statuses, null, []);
    expect(next).toBe("s1");
  });

  it("skips error items", () => {
    const next = findNextPlayableItemId(ids, statuses, "s1", []);
    expect(next).toBe("s3"); // s2 is error, skipped
  });

  it("skips processing items", () => {
    const next = findNextPlayableItemId(ids, statuses, "s3", []);
    expect(next).toBe("s5"); // s4 is processing, skipped
  });

  it("returns null when no more items after current", () => {
    const next = findNextPlayableItemId(ids, statuses, "s5", []);
    expect(next).toBeNull();
  });

  it("skips already-played items", () => {
    const next = findNextPlayableItemId(ids, statuses, null, ["s1"]);
    expect(next).toBe("s3");
  });

  it("skips items without audio", () => {
    const noAudioStatuses = makeStatuses([
      { id: "s1", status: "ready", hasAudio: false },
      { id: "s2", status: "ready", hasAudio: true },
    ]);
    const next = findNextPlayableItemId(
      ["s1", "s2"],
      noAudioStatuses,
      null,
      []
    );
    expect(next).toBe("s2");
  });

  it("returns null for empty queue", () => {
    const next = findNextPlayableItemId([], new Map(), null, []);
    expect(next).toBeNull();
  });

  it("returns null when all items played", () => {
    const next = findNextPlayableItemId(ids, statuses, null, [
      "s1",
      "s3",
      "s5",
    ]);
    expect(next).toBeNull();
  });
});

// ── findPrevPlayableItemId tests ────────────────────────

describe("findPrevPlayableItemId", () => {
  const ids = ["s1", "s2", "s3", "s4", "s5"];
  const statuses = makeStatuses([
    { id: "s1", status: "ready", hasAudio: true },
    { id: "s2", status: "error", hasAudio: false },
    { id: "s3", status: "ready", hasAudio: true },
    { id: "s4", status: "processing", hasAudio: false },
    { id: "s5", status: "ready", hasAudio: true },
  ]);

  it("returns previous ready item with audio", () => {
    const prev = findPrevPlayableItemId(ids, statuses, "s5");
    expect(prev).toBe("s3"); // s4 is processing, s3 is ready
  });

  it("skips error items going backward", () => {
    const prev = findPrevPlayableItemId(ids, statuses, "s3");
    expect(prev).toBe("s1"); // s2 is error
  });

  it("returns null when no previous items", () => {
    const prev = findPrevPlayableItemId(ids, statuses, "s1");
    expect(prev).toBeNull();
  });

  it("returns last ready item when starting from null", () => {
    const prev = findPrevPlayableItemId(ids, statuses, null);
    expect(prev).toBe("s5");
  });

  it("returns null for empty queue", () => {
    const prev = findPrevPlayableItemId([], new Map(), null);
    expect(prev).toBeNull();
  });
});

