import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSnapQueue } from "../queue/SnapQueueContext";
import { usePlaylistPlayerContext } from "../queue/PlaylistPlayerContext";
import type { SnapQueueItem } from "../queue/types";

interface PlaylistScreenProps {
  onBackToCamera: () => void;
  onViewResult: (item: SnapQueueItem) => void;
}

// ── Status display helpers ────────────────────────────────

function statusIcon(
  status: SnapQueueItem["status"],
  isCurrentlyPlaying: boolean,
  isPlayed: boolean
): string {
  if (isCurrentlyPlaying) return "▶️";
  if (isPlayed && status === "ready") return "✓";
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

function statusLabel(
  status: SnapQueueItem["status"],
  isCurrentlyPlaying: boolean,
  phase: string,
  isPlayed: boolean
): string {
  if (isCurrentlyPlaying) {
    return phase === "intro" ? "Introducing…" : "Playing";
  }
  if (isPlayed && status === "ready") return "Played";
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

// ── PlaylistItem component ────────────────────────────────

function PlaylistItem({
  item,
  expanded,
  isCurrentlyPlaying,
  isPlayed,
  phase,
  onToggle,
  onRemove,
  onViewResult,
}: {
  item: SnapQueueItem;
  expanded: boolean;
  isCurrentlyPlaying: boolean;
  isPlayed: boolean;
  phase: string;
  onToggle: () => void;
  onRemove: () => void;
  onViewResult: () => void;
}) {
  const isReady = item.status === "ready";
  const isError = item.status === "error";
  const isProcessing =
    item.status === "processing" || item.status === "pending";

  return (
    <View
      style={[
        styles.card,
        isError && styles.cardError,
        isCurrentlyPlaying && styles.cardPlaying,
      ]}
    >
      {/* ── Header row (always visible) ── */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={isReady ? onToggle : undefined}
        activeOpacity={isReady ? 0.7 : 1}
      >
        <View style={styles.cardHeaderLeft}>
          {isProcessing ? (
            <ActivityIndicator
              size="small"
              color="#ff9800"
              style={styles.statusSpinner}
            />
          ) : isCurrentlyPlaying && phase === "intro" ? (
            <ActivityIndicator
              size="small"
              color="#e94560"
              style={styles.statusSpinner}
            />
          ) : (
            <Text style={styles.statusIconText}>
              {statusIcon(item.status, isCurrentlyPlaying, isPlayed)}
            </Text>
          )}

          <View style={styles.cardInfo}>
            <Text
              style={[
                styles.cardTitle,
                isCurrentlyPlaying && styles.cardTitlePlaying,
                isPlayed && !isCurrentlyPlaying && styles.cardTitlePlayed,
              ]}
              numberOfLines={1}
            >
              {item.landmarkName ??
                statusLabel(item.status, isCurrentlyPlaying, phase, isPlayed)}
            </Text>
            <Text style={styles.cardMeta}>
              {isCurrentlyPlaying
                ? statusLabel(item.status, true, phase, false)
                : `${item.locale.toUpperCase()} · ${timeAgo(item.createdAt)}`}
            </Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          {isReady && (
            <Text style={styles.expandArrow}>{expanded ? "▲" : "▼"}</Text>
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* ── Error message ── */}
      {isError && item.error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>⚠️ {item.error}</Text>
        </View>
      )}

      {/* ── Expanded detail (ready items only) ── */}
      {expanded && isReady && item.snapResult && (
        <View style={styles.expandedSection}>
          {item.snapResult.guide ? (
            <>
              <Text style={styles.guideTitle}>
                {item.snapResult.guide.title}
              </Text>
              <Text style={styles.guideSummary} numberOfLines={3}>
                {item.snapResult.guide.summary}
              </Text>

              {/* Fact count + fun fact indicator */}
              <View style={styles.statsRow}>
                <Text style={styles.statText}>
                  📚 {item.snapResult.guide.facts.length} facts
                </Text>
                {item.snapResult.guide.fun_fact && (
                  <Text style={styles.statText}>🎉 Fun fact</Text>
                )}
                {item.snapResult.audio && (
                  <Text style={styles.statText}>🎙️ Audio</Text>
                )}
              </View>

              {/* View full details button */}
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={onViewResult}
                activeOpacity={0.7}
              >
                <Text style={styles.viewDetailsText}>
                  View Full Details →
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noGuideText}>
              No guide content available
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ── TransportControls component ──────────────────────────

function TransportControls({
  phase,
  hasNext,
  hasPrev,
  hasPlayable,
  onPlay,
  onPause,
  onSkipNext,
  onSkipPrev,
  onStop,
}: {
  phase: string;
  hasNext: boolean;
  hasPrev: boolean;
  hasPlayable: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  onStop: () => void;
}) {
  const isPlaying = phase === "narration" || phase === "intro";
  const isPaused = phase === "paused";
  const isIdle = phase === "idle";

  return (
    <View style={styles.transport}>
      {/* Skip Prev */}
      <TouchableOpacity
        style={[styles.transportButton, !hasPrev && styles.transportDisabled]}
        onPress={onSkipPrev}
        disabled={!hasPrev}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.transportIcon,
            !hasPrev && styles.transportIconDisabled,
          ]}
        >
          ⏮
        </Text>
      </TouchableOpacity>

      {/* Play / Pause */}
      {isPlaying ? (
        <TouchableOpacity
          style={styles.transportPlayButton}
          onPress={onPause}
          activeOpacity={0.7}
        >
          <Text style={styles.transportPlayIcon}>⏸</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.transportPlayButton,
            !hasPlayable && styles.transportDisabled,
          ]}
          onPress={onPlay}
          disabled={!hasPlayable}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.transportPlayIcon,
              !hasPlayable && styles.transportIconDisabled,
            ]}
          >
            ▶️
          </Text>
        </TouchableOpacity>
      )}

      {/* Stop (only when playing or paused) */}
      {(isPlaying || isPaused) && (
        <TouchableOpacity
          style={styles.transportButton}
          onPress={onStop}
          activeOpacity={0.7}
        >
          <Text style={styles.transportIcon}>⏹</Text>
        </TouchableOpacity>
      )}

      {/* Skip Next */}
      <TouchableOpacity
        style={[styles.transportButton, !hasNext && styles.transportDisabled]}
        onPress={onSkipNext}
        disabled={!hasNext}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.transportIcon,
            !hasNext && styles.transportIconDisabled,
          ]}
        >
          ⏭
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── PlaylistScreen ────────────────────────────────────────

export function PlaylistScreen({
  onBackToCamera,
  onViewResult,
}: PlaylistScreenProps) {
  const { items, counts, remove, clear } = useSnapQueue();
  const player = usePlaylistPlayerContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasPlayable = items.some(
    (i) =>
      i.status === "ready" &&
      !!i.snapResult?.audio?.url &&
      !player.playedItemIds.includes(i.id)
  );

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRemove = (id: string, name: string | null) => {
    Alert.alert(
      "Remove Snap",
      `Remove ${name ?? "this snap"} from the playlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (expandedId === id) setExpandedId(null);
            remove(id);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear Playlist",
      `Remove all ${counts.total} snaps from the playlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            player.stop();
            setExpandedId(null);
            clear();
          },
        },
      ]
    );
  };

  // ── Empty state ──
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📷</Text>
        <Text style={styles.emptyTitle}>No snaps yet</Text>
        <Text style={styles.emptyHint}>
          Go back and snap some landmarks!{"\n"}Each snap will appear here in
          your playlist.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToCamera}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back to Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={onBackToCamera}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBackText}>← Camera</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>📋 Playlist</Text>

        <View style={styles.headerCounts}>
          {counts.processing + counts.pending > 0 && (
            <Text style={styles.countBadgeProcessing}>
              ⏳ {counts.processing + counts.pending}
            </Text>
          )}
          {counts.ready > 0 && (
            <Text style={styles.countBadgeReady}>✅ {counts.ready}</Text>
          )}
          {counts.error > 0 && (
            <Text style={styles.countBadgeError}>❌ {counts.error}</Text>
          )}
        </View>
      </View>

      {/* ── Transport controls ── */}
      <TransportControls
        phase={player.phase}
        hasNext={player.hasNext}
        hasPrev={player.hasPrev}
        hasPlayable={hasPlayable}
        onPlay={player.play}
        onPause={player.pause}
        onSkipNext={player.skipNext}
        onSkipPrev={player.skipPrev}
        onStop={player.stop}
      />

      {/* ── List ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {items.map((item) => (
          <PlaylistItem
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            isCurrentlyPlaying={player.currentItemId === item.id}
            isPlayed={player.playedItemIds.includes(item.id)}
            phase={player.phase}
            onToggle={() => handleToggle(item.id)}
            onRemove={() => handleRemove(item.id, item.landmarkName)}
            onViewResult={() => onViewResult(item)}
          />
        ))}
      </ScrollView>

      {/* ── Bottom actions ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={onBackToCamera}
          activeOpacity={0.7}
        >
          <Text style={styles.cameraButtonText}>📷 Snap More</Text>
        </TouchableOpacity>

        {counts.total > 1 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>🗑 Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#16213e",
    borderBottomWidth: 1,
    borderBottomColor: "#0f3460",
  },
  headerBackButton: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  headerBackText: {
    color: "#e94560",
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerCounts: {
    flexDirection: "row",
    gap: 8,
  },
  countBadgeProcessing: {
    color: "#ff9800",
    fontSize: 13,
    fontWeight: "600",
  },
  countBadgeReady: {
    color: "#4caf50",
    fontSize: 13,
    fontWeight: "600",
  },
  countBadgeError: {
    color: "#f44336",
    fontSize: 13,
    fontWeight: "600",
  },

  // Transport controls
  transport: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#16213e",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#0f3460",
  },
  transportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0f3460",
    justifyContent: "center",
    alignItems: "center",
  },
  transportPlayButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e94560",
    justifyContent: "center",
    alignItems: "center",
  },
  transportDisabled: {
    opacity: 0.3,
  },
  transportIcon: {
    fontSize: 18,
    color: "#ccc",
  },
  transportIconDisabled: {
    color: "#555",
  },
  transportPlayIcon: {
    fontSize: 24,
    color: "#fff",
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Card
  card: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardError: {
    borderLeftWidth: 3,
    borderLeftColor: "#f44336",
  },
  cardPlaying: {
    borderLeftWidth: 3,
    borderLeftColor: "#e94560",
    backgroundColor: "#1e2a4a",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusSpinner: {
    width: 26,
    height: 26,
    marginRight: 12,
  },
  statusIconText: {
    fontSize: 20,
    marginRight: 12,
    width: 26,
    textAlign: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#eee",
  },
  cardTitlePlaying: {
    color: "#e94560",
  },
  cardTitlePlayed: {
    color: "#888",
  },
  cardMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expandArrow: {
    color: "#888",
    fontSize: 12,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Error
  errorSection: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  errorText: {
    color: "#f44336",
    fontSize: 13,
  },

  // Expanded
  expandedSection: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e94560",
    marginTop: 10,
    marginBottom: 6,
  },
  guideSummary: {
    fontSize: 13,
    color: "#bbb",
    lineHeight: 19,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statText: {
    fontSize: 12,
    color: "#888",
  },
  viewDetailsButton: {
    backgroundColor: "#e94560",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noGuideText: {
    color: "#666",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 10,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#e94560",
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#1a1a2e",
    borderTopWidth: 1,
    borderTopColor: "#16213e",
  },
  cameraButton: {
    flex: 1,
    backgroundColor: "#e94560",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cameraButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    backgroundColor: "#16213e",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(244,67,54,0.3)",
  },
  clearButtonText: {
    color: "#f44336",
    fontSize: 14,
    fontWeight: "600",
  },

  // Shared
  backButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
