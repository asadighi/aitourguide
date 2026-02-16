/**
 * NowPlayingBar – a compact floating mini-player shown at the bottom
 * of every screen when the playlist player is active.
 *
 * Shows: landmark name, phase indicator, play/pause, skip next/prev.
 * Tapping the landmark name could optionally navigate to the item.
 */

import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { usePlaylistPlayerContext } from "../queue/PlaylistPlayerContext";
import { useSnapQueue } from "../queue/SnapQueueContext";

interface NowPlayingBarProps {
  /** Optional: called when user taps the landmark name / info area. */
  onPress?: () => void;
}

export function NowPlayingBar({ onPress }: NowPlayingBarProps) {
  const player = usePlaylistPlayerContext();
  const { items } = useSnapQueue();

  // Only show when something is actively playing or paused
  const isActive =
    player.currentItemId !== null && player.phase !== "idle";

  if (!isActive) return null;

  const currentItem = items.find((i) => i.id === player.currentItemId);
  const landmarkName = currentItem?.landmarkName ?? "Unknown landmark";

  const isPlaying = player.phase === "narration" || player.phase === "intro";
  const isPaused = player.phase === "paused";
  const isIntro = player.phase === "intro";

  const phaseLabel = isIntro
    ? "Introducing…"
    : isPaused
      ? "Paused"
      : "Playing";

  return (
    <View style={styles.container}>
      {/* ── Info area ── */}
      <TouchableOpacity
        style={styles.info}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        {isIntro ? (
          <ActivityIndicator
            size="small"
            color="#e94560"
            style={styles.phaseIndicator}
          />
        ) : (
          <Text style={styles.phaseIcon}>
            {isPaused ? "⏸" : "🎙️"}
          </Text>
        )}
        <View style={styles.textArea}>
          <Text style={styles.landmarkName} numberOfLines={1}>
            {landmarkName}
          </Text>
          <Text style={styles.phaseText}>{phaseLabel}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Compact controls ── */}
      <View style={styles.controls}>
        {/* Skip Prev */}
        <TouchableOpacity
          style={[styles.controlBtn, !player.hasPrev && styles.controlDisabled]}
          onPress={player.skipPrev}
          disabled={!player.hasPrev}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={[
              styles.controlIcon,
              !player.hasPrev && styles.controlIconDisabled,
            ]}
          >
            ⏮
          </Text>
        </TouchableOpacity>

        {/* Play / Pause */}
        {isPlaying ? (
          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={player.pause}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.playPauseIcon}>⏸</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={player.play}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.playPauseIcon}>▶️</Text>
          </TouchableOpacity>
        )}

        {/* Skip Next */}
        <TouchableOpacity
          style={[styles.controlBtn, !player.hasNext && styles.controlDisabled]}
          onPress={player.skipNext}
          disabled={!player.hasNext}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={[
              styles.controlIcon,
              !player.hasNext && styles.controlIconDisabled,
            ]}
          >
            ⏭
          </Text>
        </TouchableOpacity>

        {/* Stop */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={player.stop}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.controlIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    borderTopWidth: 1,
    borderTopColor: "#0f3460",
    paddingHorizontal: 12,
    paddingVertical: 10,
    // Subtle glow at top
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  info: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  phaseIndicator: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  phaseIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 20,
    textAlign: "center",
  },
  textArea: {
    flex: 1,
  },
  landmarkName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#eee",
  },
  phaseText: {
    fontSize: 11,
    color: "#e94560",
    marginTop: 1,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0f3460",
    justifyContent: "center",
    alignItems: "center",
  },
  controlDisabled: {
    opacity: 0.3,
  },
  controlIcon: {
    fontSize: 13,
    color: "#ccc",
  },
  controlIconDisabled: {
    color: "#555",
  },
  playPauseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e94560",
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseIcon: {
    fontSize: 18,
    color: "#fff",
  },
});

