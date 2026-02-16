/**
 * Pure state machine for the playlist player.
 *
 * Separated from usePlaylistPlayer so the state transitions
 * can be unit-tested without mocking expo-av / expo-speech.
 */

export type PlaybackPhase =
  | "idle"        // Nothing playing
  | "intro"       // Speaking landmark intro via device TTS
  | "narration"   // Playing server-generated narration audio
  | "paused";     // Narration is paused (can resume)

export interface PlaylistPlayerState {
  /** Queue item ID currently being played (or paused). null when idle. */
  currentItemId: string | null;
  /** Current phase of playback */
  phase: PlaybackPhase;
  /** Set of queue item IDs that have finished playing. */
  playedItemIds: string[];
  /** True when user explicitly stopped — suppresses auto-play until next manual play. */
  stoppedByUser: boolean;
}

export const INITIAL_STATE: PlaylistPlayerState = {
  currentItemId: null,
  phase: "idle",
  playedItemIds: [],
  stoppedByUser: false,
};

export type PlayerAction =
  | { type: "PLAY_ITEM"; itemId: string }
  | { type: "INTRO_STARTED" }
  | { type: "INTRO_FINISHED" }
  | { type: "NARRATION_STARTED" }
  | { type: "NARRATION_FINISHED" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" }
  | { type: "ITEM_REMOVED"; itemId: string }
  | { type: "RESET" };

export function playerReducer(
  state: PlaylistPlayerState,
  action: PlayerAction
): PlaylistPlayerState {
  switch (action.type) {
    case "PLAY_ITEM":
      return {
        ...state,
        currentItemId: action.itemId,
        phase: "intro",
        stoppedByUser: false,
      };

    case "INTRO_STARTED":
      // Confirm we're in intro phase (no-op if already there)
      return state.phase === "intro" ? state : { ...state, phase: "intro" };

    case "INTRO_FINISHED":
      // Transition from intro → narration
      if (state.phase !== "intro") return state;
      return { ...state, phase: "narration" };

    case "NARRATION_STARTED":
      // Confirm narration phase
      return state.phase === "narration" ? state : { ...state, phase: "narration" };

    case "NARRATION_FINISHED": {
      // Narration done → mark item as played, go idle
      if (!state.currentItemId) return { ...state, phase: "idle" };
      const alreadyPlayed = state.playedItemIds.includes(state.currentItemId);
      return {
        ...state,
        phase: "idle",
        currentItemId: null,
        playedItemIds: alreadyPlayed
          ? state.playedItemIds
          : [...state.playedItemIds, state.currentItemId],
      };
    }

    case "PAUSE":
      if (state.phase !== "narration") return state;
      return { ...state, phase: "paused" };

    case "RESUME":
      if (state.phase !== "paused") return state;
      return { ...state, phase: "narration" };

    case "STOP":
      return { ...state, currentItemId: null, phase: "idle", stoppedByUser: true };

    case "ITEM_REMOVED":
      // If the removed item is currently playing, stop
      if (state.currentItemId === action.itemId) {
        return { ...state, currentItemId: null, phase: "idle" };
      }
      // Also clean it from played list
      return {
        ...state,
        playedItemIds: state.playedItemIds.filter((id) => id !== action.itemId),
      };

    case "RESET":
      return INITIAL_STATE;

    default:
      return state;
  }
}

// ── Pure helpers for the player ────────────────────────────

/**
 * Find the next playable item ID from the queue, starting after `afterItemId`.
 * Returns null if none found. Skips error items and items without audio.
 */
export function findNextPlayableItemId(
  queueItemIds: string[],
  queueItemStatuses: Map<string, { status: string; hasAudio: boolean }>,
  afterItemId: string | null,
  playedItemIds: string[]
): string | null {
  const startIndex = afterItemId
    ? queueItemIds.indexOf(afterItemId) + 1
    : 0;

  for (let i = startIndex; i < queueItemIds.length; i++) {
    const id = queueItemIds[i];
    const info = queueItemStatuses.get(id);
    if (
      info &&
      info.status === "ready" &&
      info.hasAudio &&
      !playedItemIds.includes(id)
    ) {
      return id;
    }
  }
  return null;
}

/**
 * Find the previous playable item ID from the queue, starting before `beforeItemId`.
 */
export function findPrevPlayableItemId(
  queueItemIds: string[],
  queueItemStatuses: Map<string, { status: string; hasAudio: boolean }>,
  beforeItemId: string | null
): string | null {
  const endIndex = beforeItemId
    ? queueItemIds.indexOf(beforeItemId) - 1
    : queueItemIds.length - 1;

  for (let i = endIndex; i >= 0; i--) {
    const id = queueItemIds[i];
    const info = queueItemStatuses.get(id);
    if (info && info.status === "ready" && info.hasAudio) {
      return id;
    }
  }
  return null;
}

