/**
 * usePlaylistPlayer – manages sequential audio playback across the snap queue.
 *
 * Flow per item:
 *   1. Speak intro via expo-speech: "Next up: [landmark name]"
 *   2. Play server-generated narration audio via expo-av
 *   3. Auto-advance to next ready item in queue order
 *
 * Supports: play, pause, resume, skip-next, skip-prev, stop.
 * Persists across camera ↔ playlist navigation (state lives in context).
 */

import { useReducer, useRef, useCallback, useEffect } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import * as Speech from "expo-speech";
import { getAudioUrl, getAccessToken } from "../api/client";
import { useSnapQueue } from "./SnapQueueContext";
import type { SnapQueueItem } from "./types";
import {
  playerReducer,
  INITIAL_STATE,
  findNextPlayableItemId,
  findPrevPlayableItemId,
  type PlaybackPhase,
} from "./playlistPlayerReducer";

export interface PlaylistPlayerControls {
  /** Start playing from the beginning (first unplayed ready item), or resume if paused. */
  play: () => void;
  /** Pause the current narration. */
  pause: () => void;
  /** Skip to the next ready item in queue order. */
  skipNext: () => void;
  /** Skip to the previous ready item (replays it). */
  skipPrev: () => void;
  /** Stop playback entirely. */
  stop: () => void;
}

export interface PlaylistPlayerInfo {
  /** The queue item ID currently being played/paused, or null. */
  currentItemId: string | null;
  /** Current playback phase. */
  phase: PlaybackPhase;
  /** IDs of items that have been fully played. */
  playedItemIds: string[];
  /** Whether there is a next playable item. */
  hasNext: boolean;
  /** Whether there is a previous playable item. */
  hasPrev: boolean;
}

// ── Helpers ────────────────────────────────────────────────

/** Build a status lookup Map from queue items. */
function buildStatusMap(items: SnapQueueItem[]) {
  return new Map(
    items.map((i) => [
      i.id,
      {
        status: i.status,
        hasAudio: !!i.snapResult?.audio?.url,
        landmarkName: i.landmarkName,
        audioUrl: i.snapResult?.audio?.url ?? null,
      },
    ])
  );
}

// ── Hook ───────────────────────────────────────────────────

export function usePlaylistPlayer(): PlaylistPlayerControls & PlaylistPlayerInfo {
  const { items } = useSnapQueue();
  const [state, dispatch] = useReducer(playerReducer, INITIAL_STATE);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMountedRef = useRef(true);
  /** Guard: true while playItemDirect is running (prevents double-fire from auto-advance). */
  const isPlayingRef = useRef(false);

  // Build lookup structures from current queue (used by controls + derived state)
  const queueItemIds = items.map((i) => i.id);
  const queueItemStatuses = buildStatusMap(items);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Configure audio mode once
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);

  // If the currently playing item gets removed from the queue, stop playback
  useEffect(() => {
    if (
      state.currentItemId &&
      !queueItemIds.includes(state.currentItemId)
    ) {
      cleanupAudio();
      Speech.stop();
      dispatch({ type: "ITEM_REMOVED", itemId: state.currentItemId });
    }
  }, [queueItemIds, state.currentItemId]);

  // ── Audio cleanup helper ──────────────────────────────────

  const cleanupAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // Ignore errors during cleanup
      }
      soundRef.current = null;
    }
  };

  // ── Core: play a specific item (uses item data directly) ──

  const playItemDirect = useCallback(
    async (item: SnapQueueItem) => {
      if (item.status !== "ready" || !item.snapResult?.audio?.url) return;
      if (isPlayingRef.current) return; // Already playing — prevent double-fire
      isPlayingRef.current = true;

      // Stop any current playback
      await cleanupAudio();
      Speech.stop();

      dispatch({ type: "PLAY_ITEM", itemId: item.id });

      // Phase 1: Speak intro (with timeout — Speech.speak may never fire callbacks)
      const landmarkName = item.landmarkName ?? "landmark";
      const introText = `Next up: ${landmarkName}`;

      try {
        await Promise.race([
          new Promise<void>((resolve) => {
            Speech.speak(introText, {
              language: "en", // Intros are always in English for now
              rate: 1.0,
              onDone: () => resolve(),
              onStopped: () => resolve(),
              onError: () => resolve(), // Don't block on speech errors
            });
          }),
          // Timeout: if Speech doesn't fire any callback within 4s, skip intro
          new Promise<void>((resolve) => setTimeout(resolve, 4000)),
        ]);
      } catch {
        // Speech completely failed — just skip the intro
      }

      if (!isMountedRef.current) {
        isPlayingRef.current = false;
        return;
      }
      dispatch({ type: "INTRO_FINISHED" });

      // Phase 2: Load and play narration audio
      try {
        const fullUrl = getAudioUrl(item.snapResult.audio.url);
        const token = getAccessToken();

        const { sound } = await Audio.Sound.createAsync(
          {
            uri: fullUrl,
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
          },
          { shouldPlay: true }
        );

        if (!isMountedRef.current) {
          await sound.unloadAsync();
          isPlayingRef.current = false;
          return;
        }

        soundRef.current = sound;
        isPlayingRef.current = false; // Clear guard — narration is now managed by expo-av callbacks
        dispatch({ type: "NARRATION_STARTED" });

        // Listen for playback completion
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            dispatch({ type: "NARRATION_FINISHED" });
          }
        });
      } catch (err) {
        console.error("Failed to play narration:", err);
        isPlayingRef.current = false;
        dispatch({ type: "NARRATION_FINISHED" });
      }
    },
    [] // No deps — uses item data passed directly as argument
  );

  // Keep a stable ref so the auto-advance effect always calls the latest version
  const playItemDirectRef = useRef(playItemDirect);
  playItemDirectRef.current = playItemDirect;

  // ── Auto-advance: when idle + not stopped, find & play next ──
  //
  // Depends on `items` directly so it fires whenever any item changes status.
  // Guards (phase !== idle, stoppedByUser) prevent unnecessary work.

  useEffect(() => {
    if (state.phase !== "idle") return;
    if (state.stoppedByUser) return;
    if (isPlayingRef.current) return; // playItemDirect is already in-flight

    // Compute fresh lookup from current items (NOT from closure)
    const ids = items.map((i) => i.id);
    const statuses = buildStatusMap(items);

    const nextId = findNextPlayableItemId(
      ids,
      statuses,
      state.playedItemIds.length > 0
        ? state.playedItemIds[state.playedItemIds.length - 1]
        : null,
      state.playedItemIds
    );

    if (nextId) {
      const nextItem = items.find((i) => i.id === nextId);
      if (nextItem) {
        playItemDirectRef.current(nextItem);
      }
    }
  }, [items, state.phase, state.stoppedByUser, state.playedItemIds]);

  // ── Controls ──────────────────────────────────────────────

  const play = useCallback(() => {
    if (state.phase === "paused" && soundRef.current) {
      // Resume paused narration
      soundRef.current.playAsync().catch(() => {});
      dispatch({ type: "RESUME" });
      return;
    }

    if (state.phase !== "idle") return;

    // Find first unplayed ready item
    const nextId = findNextPlayableItemId(
      queueItemIds,
      queueItemStatuses,
      null, // Start from beginning
      state.playedItemIds
    );

    if (nextId) {
      const item = items.find((i) => i.id === nextId);
      if (item) {
        isPlayingRef.current = false; // Clear guard — user explicitly pressed play
        playItemDirect(item);
      }
    }
  }, [state.phase, queueItemIds, queueItemStatuses, state.playedItemIds, items, playItemDirect]);

  const pause = useCallback(() => {
    if (state.phase === "narration" && soundRef.current) {
      soundRef.current.pauseAsync().catch(() => {});
      dispatch({ type: "PAUSE" });
    }
  }, [state.phase]);

  const skipNext = useCallback(() => {
    const nextId = findNextPlayableItemId(
      queueItemIds,
      queueItemStatuses,
      state.currentItemId,
      [] // Don't skip already-played items when manually skipping
    );

    if (nextId) {
      const item = items.find((i) => i.id === nextId);
      if (item) {
        isPlayingRef.current = false; // Clear guard — user explicitly requested skip
        playItemDirect(item);
      }
    } else {
      // No next item — stop
      isPlayingRef.current = false;
      cleanupAudio();
      Speech.stop();
      dispatch({ type: "STOP" });
    }
  }, [queueItemIds, queueItemStatuses, state.currentItemId, items, playItemDirect]);

  const skipPrev = useCallback(() => {
    const prevId = findPrevPlayableItemId(
      queueItemIds,
      queueItemStatuses,
      state.currentItemId
    );

    if (prevId) {
      const item = items.find((i) => i.id === prevId);
      if (item) {
        isPlayingRef.current = false; // Clear guard — user explicitly requested skip
        playItemDirect(item);
      }
    }
  }, [queueItemIds, queueItemStatuses, state.currentItemId, items, playItemDirect]);

  const stop = useCallback(async () => {
    isPlayingRef.current = false;
    await cleanupAudio();
    Speech.stop();
    dispatch({ type: "STOP" });
  }, []);

  // ── Derived state ─────────────────────────────────────────

  const hasNext = !!findNextPlayableItemId(
    queueItemIds,
    queueItemStatuses,
    state.currentItemId,
    []
  );

  const hasPrev = !!findPrevPlayableItemId(
    queueItemIds,
    queueItemStatuses,
    state.currentItemId
  );

  return {
    // Info
    currentItemId: state.currentItemId,
    phase: state.phase,
    playedItemIds: state.playedItemIds,
    hasNext,
    hasPrev,
    // Controls
    play,
    pause,
    skipNext,
    skipPrev,
    stop,
  };
}
