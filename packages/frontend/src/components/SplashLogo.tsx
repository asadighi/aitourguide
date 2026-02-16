/**
 * SplashLogo – an animated logo built entirely with React Native views.
 *
 * Concept: A stylized compass/location pin with radiating rings,
 * combining a landmark silhouette (column icon) with an AI sparkle.
 * Animated with pulsing glow rings and a gentle floating motion.
 */

import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Easing } from "react-native";

interface SplashLogoProps {
  size?: number;
}

export function SplashLogo({ size = 160 }: SplashLogoProps) {
  // Animations
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse ring animation (continuous)
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();

    // Gentle float up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow rotation for outer ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Sparkle twinkle
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const outerRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.2, 0],
  });

  const s = size;
  const center = s / 2;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: s * 1.8,
          height: s * 1.8,
          transform: [{ translateY: floatY }],
        },
      ]}
    >
      {/* ── Pulse ring (expanding outward) ── */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: s * 0.85,
            height: s * 0.85,
            borderRadius: s * 0.425,
            left: s * 1.8 / 2 - s * 0.425,
            top: s * 1.8 / 2 - s * 0.425,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* ── Rotating outer ring with dashes ── */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: s * 1.1,
            height: s * 1.1,
            borderRadius: s * 0.55,
            left: s * 1.8 / 2 - s * 0.55,
            top: s * 1.8 / 2 - s * 0.55,
            transform: [{ rotate: outerRotation }],
          },
        ]}
      >
        {/* Compass dots around the ring */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const dotR = s * 0.5;
          const dotSize = i % 2 === 0 ? 6 : 4;
          return (
            <View
              key={deg}
              style={[
                styles.compassDot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  left: s * 0.55 + Math.cos(rad) * dotR - dotSize / 2,
                  top: s * 0.55 + Math.sin(rad) * dotR - dotSize / 2,
                  backgroundColor:
                    i % 2 === 0 ? "#e94560" : "rgba(233, 69, 96, 0.4)",
                },
              ]}
            />
          );
        })}
      </Animated.View>

      {/* ── Main circle (gradient-like layered) ── */}
      <View
        style={[
          styles.mainCircleOuter,
          {
            width: s * 0.75,
            height: s * 0.75,
            borderRadius: s * 0.375,
            left: s * 1.8 / 2 - s * 0.375,
            top: s * 1.8 / 2 - s * 0.375,
          },
        ]}
      >
        <View
          style={[
            styles.mainCircleInner,
            {
              width: s * 0.65,
              height: s * 0.65,
              borderRadius: s * 0.325,
            },
          ]}
        >
          {/* ── Landmark icon: stylized column/pillar ── */}
          <View style={styles.landmarkIcon}>
            {/* Column top (pediment) */}
            <View
              style={[
                styles.pediment,
                { width: s * 0.28, height: s * 0.04 },
              ]}
            />
            {/* Column capitals */}
            <View
              style={[
                styles.capital,
                { width: s * 0.24, height: s * 0.025 },
              ]}
            />
            {/* Column shafts */}
            <View style={styles.columnsRow}>
              <View
                style={[
                  styles.columnShaft,
                  { width: s * 0.045, height: s * 0.16 },
                ]}
              />
              <View
                style={[
                  styles.columnShaft,
                  { width: s * 0.045, height: s * 0.16 },
                ]}
              />
              <View
                style={[
                  styles.columnShaft,
                  { width: s * 0.045, height: s * 0.16 },
                ]}
              />
            </View>
            {/* Base */}
            <View
              style={[
                styles.base,
                { width: s * 0.28, height: s * 0.035 },
              ]}
            />
          </View>
        </View>
      </View>

      {/* ── AI Sparkle (top-right of logo) ── */}
      <Animated.View
        style={[
          styles.sparkleContainer,
          {
            right: s * 1.8 / 2 - s * 0.48,
            top: s * 1.8 / 2 - s * 0.48,
            opacity: sparkleAnim,
          },
        ]}
      >
        <View style={styles.sparkle}>
          <View style={[styles.sparkleArm, styles.sparkleH]} />
          <View style={[styles.sparkleArm, styles.sparkleV]} />
          <View style={[styles.sparkleArm, styles.sparkleD1]} />
          <View style={[styles.sparkleArm, styles.sparkleD2]} />
        </View>
      </Animated.View>

      {/* ── Second sparkle (bottom-left, smaller) ── */}
      <Animated.View
        style={[
          styles.sparkleContainerSmall,
          {
            left: s * 1.8 / 2 - s * 0.55,
            bottom: s * 1.8 / 2 - s * 0.42,
            opacity: sparkleAnim.interpolate({
              inputRange: [0.3, 1],
              outputRange: [1, 0.3],
            }),
          },
        ]}
      >
        <View style={styles.sparkleSmall}>
          <View style={[styles.sparkleArmSmall, styles.sparkleH]} />
          <View style={[styles.sparkleArmSmall, styles.sparkleV]} />
        </View>
      </Animated.View>

      {/* ── Location pin dot (bottom center) ── */}
      <View
        style={[
          styles.pinDot,
          {
            left: s * 1.8 / 2 - 4,
            top: s * 1.8 / 2 + s * 0.52,
          },
        ]}
      />
      <View
        style={[
          styles.pinShadow,
          {
            left: s * 1.8 / 2 - 12,
            top: s * 1.8 / 2 + s * 0.58,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#e94560",
  },
  outerRing: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(233, 69, 96, 0.2)",
    borderStyle: "dashed",
  },
  compassDot: {
    position: "absolute",
  },
  mainCircleOuter: {
    position: "absolute",
    backgroundColor: "#e94560",
    alignItems: "center",
    justifyContent: "center",
    // Glow effect
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  mainCircleInner: {
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e94560",
  },
  landmarkIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  pediment: {
    backgroundColor: "#e94560",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: 2,
  },
  capital: {
    backgroundColor: "rgba(233, 69, 96, 0.7)",
    marginBottom: 2,
  },
  columnsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    paddingHorizontal: 4,
    gap: 6,
  },
  columnShaft: {
    backgroundColor: "#e94560",
    borderRadius: 2,
  },
  base: {
    backgroundColor: "#e94560",
    marginTop: 2,
    borderRadius: 1,
  },
  sparkleContainer: {
    position: "absolute",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkle: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleArm: {
    position: "absolute",
    backgroundColor: "#ffd700",
  },
  sparkleH: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  sparkleV: {
    width: 2,
    height: 16,
    borderRadius: 1,
  },
  sparkleD1: {
    width: 12,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },
  sparkleD2: {
    width: 12,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: "-45deg" }],
  },
  sparkleContainerSmall: {
    position: "absolute",
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleSmall: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleArmSmall: {
    position: "absolute",
    backgroundColor: "#7dd3fc",
    width: 10,
    height: 1.5,
    borderRadius: 1,
  },
  pinDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e94560",
  },
  pinShadow: {
    position: "absolute",
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(233, 69, 96, 0.15)",
  },
});

