import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { api } from "./api/client";
import { CameraScreen } from "./screens/CameraScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { PlaylistScreen } from "./screens/PlaylistScreen";
import { ClarificationScreen } from "./screens/ClarificationScreen";
import { SplashScreen } from "./screens/SplashScreen";
import { LocalePicker } from "./components/LocalePicker";
import { NowPlayingBar } from "./components/NowPlayingBar";
import { SplashLogo } from "./components/SplashLogo";
import { SnapQueueProvider } from "./queue/SnapQueueContext";
import { BackgroundSnapProvider } from "./queue/BackgroundSnapContext";
import { PlaylistPlayerProvider } from "./queue/PlaylistPlayerContext";
import { useSnapQueue } from "./queue/SnapQueueContext";
import type { SnapQueueItem } from "./queue/types";
import {
  DEFAULT_LOCALE,
  loadSavedLocale,
  saveLocale,
  getLocaleOption,
} from "./config/locales";

type SnapResult = Awaited<ReturnType<typeof api.snap>>;
type Screen =
  | "loading"
  | "login"
  | "camera"
  | "playlist"
  | "results"
  | "clarification";

function AppContent() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);
  const [resultSource, setResultSource] = useState<"camera" | "playlist">(
    "camera"
  );
  const [viewingQueueItemId, setViewingQueueItemId] = useState<string | null>(
    null
  );
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // Access queue items for prev/next navigation in results view
  const { items: queueItems } = useSnapQueue();

  // ── Locale state ───────────────────────────────────────────────
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);
  const [localePickerVisible, setLocalePickerVisible] = useState(false);

  // Load persisted locale on mount
  useEffect(() => {
    loadSavedLocale().then(setLocale);
  }, []);

  const handleLocaleChange = useCallback((code: string) => {
    setLocale(code);
    saveLocale(code);
  }, []);

  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Auto-login for development (with timeout so splash doesn't hang forever).
  // We also enforce a minimum splash display time so the user actually sees it.
  const MINIMUM_SPLASH_MS = 4000;

  const attemptLogin = useCallback(async () => {
    setScreen("loading");
    setLoadingError(null);

    const splashStart = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const result = await api.devLogin(
        "dev@aitourguide.com",
        "Dev User",
        "end_user"
      );
      clearTimeout(timeout);

      // Wait remaining time so the splash is visible for at least MINIMUM_SPLASH_MS
      const elapsed = Date.now() - splashStart;
      if (elapsed < MINIMUM_SPLASH_MS) {
        await new Promise((r) => setTimeout(r, MINIMUM_SPLASH_MS - elapsed));
      }

      setUser(result.user);
      setScreen("camera");
    } catch (err) {
      // Still wait the minimum so the error doesn't flash too quickly
      const elapsed = Date.now() - splashStart;
      if (elapsed < MINIMUM_SPLASH_MS) {
        await new Promise((r) => setTimeout(r, MINIMUM_SPLASH_MS - elapsed));
      }

      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Connection timed out — is the backend running?"
          : err instanceof Error
            ? err.message
            : "Could not connect to server";
      setLoadingError(message);
    }
  }, []);

  useEffect(() => {
    attemptLogin();
  }, [attemptLogin]);

  const handleDevLogin = async () => {
    try {
      setScreen("loading");
      const result = await api.devLogin(
        "dev@aitourguide.com",
        "Dev User",
        "end_user"
      );
      setUser(result.user);
      setScreen("camera");
    } catch (err) {
      Alert.alert(
        "Login Failed",
        err instanceof Error ? err.message : "Could not log in"
      );
      setScreen("login");
    }
  };

  // ── Legacy single-result handlers (still used by ClarificationScreen) ──
  const handleResult = useCallback((result: SnapResult) => {
    setSnapResult(result);
    setScreen("results");
  }, []);

  const handleClarification = useCallback((result: SnapResult) => {
    setSnapResult(result);
    setScreen("clarification");
  }, []);

  const handleClarificationSelect = useCallback(
    async (landmarkName: string) => {
      if (!snapResult) return;
      const selectedLandmark = snapResult.landmark.landmarks.find(
        (l) => l.name === landmarkName
      );
      if (selectedLandmark) {
        const updatedResult: SnapResult = {
          ...snapResult,
          landmark: {
            ...snapResult.landmark,
            landmarks: [selectedLandmark],
            needs_clarification: false,
          },
        };
        setSnapResult(updatedResult);
        setScreen("results");
      }
    },
    [snapResult]
  );

  const handleBackToCamera = useCallback(() => {
    setSnapResult(null);
    setResultSource("camera");
    setViewingQueueItemId(null);
    setScreen("camera");
  }, []);

  const handleBackFromResults = useCallback(() => {
    const target = resultSource === "playlist" ? "playlist" : "camera";
    setSnapResult(null);
    setResultSource("camera");
    setViewingQueueItemId(null);
    setScreen(target);
  }, [resultSource]);

  const handleOpenPlaylist = useCallback(() => {
    setScreen("playlist");
  }, []);

  const handleViewPlaylistItem = useCallback((item: SnapQueueItem) => {
    if (item.snapResult) {
      setSnapResult(item.snapResult);
      setViewingQueueItemId(item.id);
      setResultSource("playlist");
      setScreen("results");
    }
  }, []);

  // ── Prev/Next queue item navigation from Results ──

  const readyQueueItems = queueItems.filter(
    (i) => i.status === "ready" && i.snapResult
  );

  const currentReadyIndex = viewingQueueItemId
    ? readyQueueItems.findIndex((i) => i.id === viewingQueueItemId)
    : -1;

  const hasPrevQueueItem = resultSource === "playlist" && currentReadyIndex > 0;
  const hasNextQueueItem =
    resultSource === "playlist" &&
    currentReadyIndex >= 0 &&
    currentReadyIndex < readyQueueItems.length - 1;

  const handlePrevQueueItem = useCallback(() => {
    if (currentReadyIndex <= 0) return;
    const prevItem = readyQueueItems[currentReadyIndex - 1];
    if (prevItem.snapResult) {
      setSnapResult(prevItem.snapResult);
      setViewingQueueItemId(prevItem.id);
    }
  }, [currentReadyIndex, readyQueueItems]);

  const handleNextQueueItem = useCallback(() => {
    if (currentReadyIndex < 0 || currentReadyIndex >= readyQueueItems.length - 1)
      return;
    const nextItem = readyQueueItems[currentReadyIndex + 1];
    if (nextItem.snapResult) {
      setSnapResult(nextItem.snapResult);
      setViewingQueueItemId(nextItem.id);
    }
  }, [currentReadyIndex, readyQueueItems]);

  const handleShare = useCallback(async () => {
    if (!snapResult?.guide) return;

    const landmark = snapResult.landmark.landmarks[0];
    const guide = snapResult.guide;

    try {
      await Share.share({
        message: `🏛️ ${landmark.name}\n\n${guide.summary}\n\n${guide.fun_fact ? `Fun fact: ${guide.fun_fact}\n\n` : ""}Discovered with AI Tour Guide!`,
        title: `AI Tour Guide: ${landmark.name}`,
      });
    } catch {
      // User cancelled sharing
    }
  }, [snapResult]);

  // Loading / Error Screen — beautiful splash
  if (screen === "loading" || loadingError) {
    return (
      <SplashScreen
        error={loadingError}
        onRetry={attemptLogin}
        onSkip={() => {
          setLoadingError(null);
          setScreen("login");
        }}
      />
    );
  }

  // Login Screen (dev-only for MVP)
  if (screen === "login") {
    return (
      <View style={styles.loginContainer}>
        <StatusBar style="light" />
        <View style={styles.loginBgAccent} />
        <View style={styles.loginContent}>
          <SplashLogo size={100} />
          <View style={styles.loginTitleRow}>
            <Text style={styles.loginTitleAI}>AI</Text>
            <Text style={styles.loginTitleMain}> Tour Guide</Text>
          </View>
          <Text style={styles.loginSubtitle}>
            Point your camera at any landmark{"\n"}and discover its story
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleDevLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Get Started</Text>
          </TouchableOpacity>
          <Text style={styles.loginHint}>
            OAuth (Google + Apple) coming soon
          </Text>
        </View>
      </View>
    );
  }

  // Camera Screen
  if (screen === "camera") {
    const localeInfo = getLocaleOption(locale);
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <CameraScreen
          locale={locale}
          onOpenLocalePicker={() => setLocalePickerVisible(true)}
          localeFlag={localeInfo.flag}
          onOpenPlaylist={handleOpenPlaylist}
        />
        <NowPlayingBar onPress={handleOpenPlaylist} />
        <LocalePicker
          visible={localePickerVisible}
          currentLocale={locale}
          onSelect={handleLocaleChange}
          onClose={() => setLocalePickerVisible(false)}
        />
      </View>
    );
  }

  // Playlist Screen
  if (screen === "playlist") {
    return (
      <>
        <StatusBar style="light" />
        <PlaylistScreen
          onBackToCamera={handleBackToCamera}
          onViewResult={handleViewPlaylistItem}
        />
      </>
    );
  }

  // Results Screen (legacy single-result view)
  if (screen === "results" && snapResult) {
    const localeInfo = getLocaleOption(locale);
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <ResultsScreen
          result={snapResult}
          locale={locale}
          localeLabel={`${localeInfo.flag} ${localeInfo.label}`}
          onBack={handleBackFromResults}
          onShare={handleShare}
          onOpenLocalePicker={() => setLocalePickerVisible(true)}
          source={resultSource}
          hasPrevItem={hasPrevQueueItem}
          hasNextItem={hasNextQueueItem}
          onPrevItem={handlePrevQueueItem}
          onNextItem={handleNextQueueItem}
        />
        <NowPlayingBar onPress={() => setScreen("playlist")} />
        <LocalePicker
          visible={localePickerVisible}
          currentLocale={locale}
          onSelect={handleLocaleChange}
          onClose={() => setLocalePickerVisible(false)}
        />
      </View>
    );
  }

  // Clarification Screen
  if (screen === "clarification" && snapResult) {
    return (
      <>
        <StatusBar style="light" />
        <ClarificationScreen
          result={snapResult}
          onSelect={handleClarificationSelect}
          onRetry={handleBackToCamera}
        />
      </>
    );
  }

  // Fallback
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Something went wrong</Text>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleBackToCamera}
      >
        <Text style={styles.loginButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Root App component — wraps everything in SnapQueueProvider + PlaylistPlayerProvider
 * so queue state and audio playback persist across all screens.
 */
export default function App() {
  return (
    <SnapQueueProvider>
      <BackgroundSnapProvider>
        <PlaylistPlayerProvider>
          <AppContent />
        </PlaylistPlayerProvider>
      </BackgroundSnapProvider>
    </SnapQueueProvider>
  );
}

const styles = StyleSheet.create({
  // ── Fallback container ──
  container: {
    flex: 1,
    backgroundColor: "#0d1117",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  // ── Login Screen ──
  loginContainer: {
    flex: 1,
    backgroundColor: "#0d1117",
  },
  loginBgAccent: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(233, 69, 96, 0.06)",
  },
  loginContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loginTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
    marginBottom: 12,
  },
  loginTitleAI: {
    fontSize: 32,
    fontWeight: "900",
    color: "#e94560",
    letterSpacing: 2,
  },
  loginTitleMain: {
    fontSize: 32,
    fontWeight: "300",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  loginSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.45)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 48,
  },
  loginButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 56,
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginHint: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.2)",
    fontStyle: "italic",
  },

  // ── Fallback styles ──
  fallbackTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#e94560",
    marginBottom: 16,
  },
  fallbackButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 10,
  },
  fallbackButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
