/**
 * SplashScreen – a beautiful, animated loading and error-recovery screen.
 *
 * Features:
 *  - Animated gradient-like layered background
 *  - Floating particle dots for depth
 *  - SplashLogo with pulse and float animations
 *  - Smooth fade-in for text and controls
 *  - Graceful error state with retry
 */

import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SplashLogo } from "../components/SplashLogo";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface SplashScreenProps {
  /** If set, shows the error state with retry/skip buttons. */
  error: string | null;
  /** Called when the user taps "Retry". */
  onRetry: () => void;
  /** Called when the user taps "Skip to manual login". */
  onSkip: () => void;
}

// ── Floating particle config ──

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * SCREEN_W,
  y: Math.random() * SCREEN_H,
  size: 2 + Math.random() * 4,
  duration: 3000 + Math.random() * 4000,
  delay: Math.random() * 2000,
  color:
    i % 3 === 0
      ? "rgba(233, 69, 96, 0.3)" // red
      : i % 3 === 1
        ? "rgba(125, 211, 252, 0.25)" // blue
        : "rgba(255, 215, 0, 0.2)", // gold
}));

// ── Particle component ──

function FloatingParticle({
  x,
  y,
  size,
  duration,
  delay,
  color,
}: (typeof PARTICLES)[0]) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30 - Math.random() * 40],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.8, 0.1],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateY }],
        opacity,
      }}
    />
  );
}

// ── Main SplashScreen ──

export function SplashScreen({ error, onRetry, onSkip }: SplashScreenProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 1200,
        delay: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Loading dots animation
    Animated.loop(
      Animated.timing(dotAnim, {
        toValue: 3,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Background layers (simulated gradient) ── */}
      <View style={styles.bgLayer1} />
      <View style={styles.bgLayer2} />
      <View style={styles.bgLayer3} />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p) => (
        <FloatingParticle key={p.id} {...p} />
      ))}

      {/* ── Content ── */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        {/* Logo */}
        <SplashLogo size={140} />

        {/* App name */}
        <View style={styles.titleRow}>
          <Text style={styles.titleAI}>AI</Text>
          <Text style={styles.titleMain}> Tour Guide</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Point your camera at any landmark{"\n"}and discover its story
        </Text>

        {/* ── Loading / Error state ── */}
        {!error ? (
          <View style={styles.loadingSection}>
            {/* Custom animated loading bar */}
            <View style={styles.loadingTrack}>
              <LoadingBar />
            </View>
            <Text style={styles.loadingText}>Connecting to server…</Text>
          </View>
        ) : (
          <Animated.View style={[styles.errorSection, { opacity: fadeIn }]}>
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>
                Skip to manual login →
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* ── Bottom branding ── */}
      <Animated.View style={[styles.bottomBrand, { opacity: fadeIn }]}>
        <Text style={styles.versionText}>v0.1.0 · Powered by AI</Text>
      </Animated.View>
    </View>
  );
}

// ── Custom animated loading bar ──

function LoadingBar() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, SCREEN_W * 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.loadingBarFill,
        { transform: [{ translateX }] },
      ]}
    />
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1117",
  },

  // Background gradient layers
  bgLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0d1117",
  },
  bgLayer2: {
    position: "absolute",
    top: 0,
    left: -SCREEN_W * 0.3,
    width: SCREEN_W * 1.2,
    height: SCREEN_H * 0.6,
    borderBottomLeftRadius: SCREEN_W,
    borderBottomRightRadius: SCREEN_W,
    backgroundColor: "rgba(15, 52, 96, 0.4)",
  },
  bgLayer3: {
    position: "absolute",
    bottom: -SCREEN_H * 0.15,
    right: -SCREEN_W * 0.2,
    width: SCREEN_W * 0.8,
    height: SCREEN_W * 0.8,
    borderRadius: SCREEN_W * 0.4,
    backgroundColor: "rgba(233, 69, 96, 0.06)",
  },

  // Content
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  // Title
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
    marginBottom: 12,
  },
  titleAI: {
    fontSize: 36,
    fontWeight: "900",
    color: "#e94560",
    letterSpacing: 2,
  },
  titleMain: {
    fontSize: 36,
    fontWeight: "300",
    color: "#ffffff",
    letterSpacing: 0.5,
  },

  // Tagline
  tagline: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 48,
  },

  // Loading
  loadingSection: {
    alignItems: "center",
    width: "100%",
  },
  loadingTrack: {
    width: SCREEN_W * 0.5,
    height: 3,
    backgroundColor: "rgba(233, 69, 96, 0.15)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  loadingBarFill: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#e94560",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Error
  errorSection: {
    alignItems: "center",
    width: "100%",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(233, 69, 96, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(233, 69, 96, 0.2)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
    maxWidth: 340,
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  errorText: {
    color: "#ff8a9e",
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    // Glow
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 13,
  },

  // Bottom
  bottomBrand: {
    alignItems: "center",
    paddingBottom: 40,
  },
  versionText: {
    color: "rgba(255, 255, 255, 0.15)",
    fontSize: 11,
    letterSpacing: 1,
  },
});

