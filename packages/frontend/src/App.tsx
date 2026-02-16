import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { api } from "./api/client";
import { CameraScreen } from "./screens/CameraScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { ClarificationScreen } from "./screens/ClarificationScreen";

type SnapResult = Awaited<ReturnType<typeof api.snap>>;
type Screen = "loading" | "login" | "camera" | "results" | "clarification";

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // Auto-login for development
  useEffect(() => {
    (async () => {
      try {
        const result = await api.devLogin(
          "dev@aitourguide.com",
          "Dev User",
          "end_user"
        );
        setUser(result.user);
        setScreen("camera");
      } catch {
        // Dev login failed - show login screen
        setScreen("login");
      }
    })();
  }, []);

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
      // For now, find the selected landmark and show results
      // In future, this would re-call the API with the selected choice
      const selectedLandmark = snapResult.landmark.landmarks.find(
        (l) => l.name === landmarkName
      );
      if (selectedLandmark) {
        // Show results with the selected landmark as the primary one
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
    setScreen("camera");
  }, []);

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

  // Loading Screen
  if (screen === "loading") {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Login Screen (dev-only for MVP)
  if (screen === "login") {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.title}>🏛️ AI Tour Guide</Text>
        <Text style={styles.subtitle}>
          Point your camera at a landmark to discover its story
        </Text>
        <TouchableOpacity style={styles.loginButton} onPress={handleDevLogin}>
          <Text style={styles.loginButtonText}>Dev Login</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>OAuth (Google + Apple) coming soon</Text>
      </View>
    );
  }

  // Camera Screen
  if (screen === "camera") {
    return (
      <>
        <StatusBar style="light" />
        <CameraScreen
          onResult={handleResult}
          onClarification={handleClarification}
        />
      </>
    );
  }

  // Results Screen
  if (screen === "results" && snapResult) {
    return (
      <>
        <StatusBar style="light" />
        <ResultsScreen
          result={snapResult}
          onBack={handleBackToCamera}
          onShare={handleShare}
        />
      </>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#e94560",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#eee",
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.8,
  },
  loadingText: {
    marginTop: 16,
    color: "#888",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
});
