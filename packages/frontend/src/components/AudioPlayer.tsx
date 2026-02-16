import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { getAudioUrl, getAccessToken } from "../api/client";

interface AudioPlayerProps {
  /** Relative audio URL from snap response, e.g. "/audio/uuid" */
  audioUrl: string;
  /** Voice used for narration */
  voice?: string;
  /** Auto-play on mount (default: false) */
  autoPlay?: boolean;
  /**
   * Called just before this player starts playing.
   * Use to pause other audio sources (e.g. the global playlist player).
   */
  onWillPlay?: () => void;
  /**
   * When true, externally pauses this player (e.g. when the global
   * playlist player resumes). The user can still manually resume.
   */
  externalPaused?: boolean;
}

export function AudioPlayer({
  audioUrl,
  voice,
  autoPlay = false,
  onWillPlay,
  externalPaused = false,
}: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Set audio mode on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    return () => {
      // Cleanup: unload sound on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // External pause: when another audio source (e.g. global playlist player) starts,
  // pause this standalone player to avoid competing audio streams.
  useEffect(() => {
    if (externalPaused && isPlaying && soundRef.current) {
      soundRef.current.pauseAsync().catch(() => {});
    }
  }, [externalPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load audio
  useEffect(() => {
    loadAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [audioUrl]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Unload previous sound if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const fullUrl = getAudioUrl(audioUrl);
      const token = getAccessToken();

      const { sound } = await Audio.Sound.createAsync(
        {
          uri: fullUrl,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
        { shouldPlay: autoPlay },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsLoaded(true);
      setIsLoading(false);

      if (autoPlay) {
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Failed to load audio:", err);
      setError("Failed to load audio narration");
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setError(`Playback error: ${status.error}`);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setPositionMs(status.positionMillis);
    setDurationMs(status.durationMillis || 0);

    // Reset when playback finishes
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMs(0);
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  };

  const handlePlayPause = async () => {
    if (!soundRef.current || !isLoaded) return;

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        // Pause other audio sources before playing
        onWillPlay?.();
        await soundRef.current.playAsync();
      }
    } catch (err) {
      console.error("Play/pause error:", err);
    }
  };

  const handleRestart = async () => {
    if (!soundRef.current || !isLoaded) return;

    try {
      onWillPlay?.();
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
    } catch (err) {
      console.error("Restart error:", err);
    }
  };

  // Format time as m:ss
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Progress percentage
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>🎙️ Audio Narration</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAudio}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>🎙️ Audio Narration</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#e94560" />
          <Text style={styles.loadingText}>Loading audio...</Text>
        </View>
      ) : (
        <>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
              <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.restartButton}
              onPress={handleRestart}
              disabled={!isLoaded}
            >
              <Text style={styles.controlIcon}>⏮</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              disabled={!isLoaded}
            >
              <Text style={styles.playIcon}>
                {isPlaying ? "⏸" : "▶️"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Voice info */}
          {voice && (
            <Text style={styles.voiceText}>Voice: {voice}</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#eee",
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#888",
    fontSize: 13,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 12,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "#0f3460",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#e94560",
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeText: {
    color: "#666",
    fontSize: 11,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  restartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0f3460",
    justifyContent: "center",
    alignItems: "center",
  },
  controlIcon: {
    fontSize: 16,
    color: "#ccc",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e94560",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    fontSize: 24,
    color: "#fff",
  },
  voiceText: {
    color: "#555",
    fontSize: 11,
    marginTop: 8,
  },
  errorText: {
    color: "#e94560",
    fontSize: 13,
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#0f3460",
    borderRadius: 8,
  },
  retryText: {
    color: "#ccc",
    fontSize: 13,
  },
});

