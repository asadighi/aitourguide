import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import type { api } from "../api/client";
import { AudioPlayer } from "../components/AudioPlayer";

type SnapResult = Awaited<ReturnType<typeof api.snap>>;

interface ResultsScreenProps {
  result: SnapResult;
  onBack: () => void;
  onShare: () => void;
}

export function ResultsScreen({ result, onBack, onShare }: ResultsScreenProps) {
  const landmark = result.landmark.landmarks[0];
  const guide = result.guide;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.landmarkName}>{landmark.name}</Text>
          <View style={styles.badgeRow}>
            {landmark.location.city && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  📍 {landmark.location.city}, {landmark.location.country}
                </Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                🎯 {Math.round(landmark.confidence * 100)}% match
              </Text>
            </View>
            {result.cached && (
              <View style={[styles.badge, styles.cachedBadge]}>
                <Text style={styles.badgeText}>⚡ Cached</Text>
              </View>
            )}
          </View>
          <Text style={styles.category}>
            {landmark.category.charAt(0).toUpperCase() + landmark.category.slice(1)}
          </Text>
        </View>

        {/* Guide Content */}
        {guide && (
          <>
            <Text style={styles.guideTitle}>{guide.title}</Text>
            <Text style={styles.summary}>{guide.summary}</Text>

            {/* Facts */}
            <View style={styles.factsSection}>
              <Text style={styles.sectionTitle}>📚 Interesting Facts</Text>
              {guide.facts.map((fact, i) => (
                <View key={i} style={styles.factCard}>
                  <Text style={styles.factHeading}>{fact.heading}</Text>
                  <Text style={styles.factBody}>{fact.body}</Text>
                </View>
              ))}
            </View>

            {/* Fun Fact */}
            {guide.fun_fact && (
              <View style={styles.funFactCard}>
                <Text style={styles.funFactLabel}>🎉 Fun Fact</Text>
                <Text style={styles.funFactText}>{guide.fun_fact}</Text>
              </View>
            )}

            {/* Confidence Note */}
            {guide.confidence_note && (
              <View style={styles.confidenceNote}>
                <Text style={styles.confidenceNoteText}>
                  ⚠️ {guide.confidence_note}
                </Text>
              </View>
            )}

            {/* TTS Audio Narration */}
            {result.audio ? (
              <AudioPlayer
                audioUrl={result.audio.url}
                voice={result.audio.voice}
                autoPlay={true}
              />
            ) : (
              <View style={styles.narrationCard}>
                <Text style={styles.narrationLabel}>
                  🎙️ Audio Narration
                </Text>
                <Text style={styles.narrationPlaceholder}>
                  Audio narration unavailable
                </Text>
              </View>
            )}
          </>
        )}

        {/* Ads */}
        {result.ads.length > 0 && (
          <View style={styles.adsSection}>
            <Text style={styles.sectionTitle}>🏪 Nearby Offers</Text>
            {result.ads.map((ad) => (
              <TouchableOpacity
                key={ad.id}
                style={styles.adCard}
                onPress={() => Linking.openURL(ad.link_url)}
              >
                <Text style={styles.adTitle}>{ad.title}</Text>
                <Text style={styles.adBody}>{ad.body}</Text>
                <Text style={styles.adLink}>Learn More →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onBack}
        >
          <Text style={styles.actionButtonText}>📷 New Snap</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={onShare}
        >
          <Text style={styles.actionButtonText}>📤 Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  landmarkName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#e94560",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#16213e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cachedBadge: {
    backgroundColor: "#0f3460",
  },
  badgeText: {
    color: "#ccc",
    fontSize: 12,
  },
  category: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
  guideTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#eee",
    marginBottom: 12,
  },
  summary: {
    fontSize: 16,
    color: "#ccc",
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e94560",
    marginBottom: 12,
  },
  factsSection: {
    marginBottom: 24,
  },
  factCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  factHeading: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e94560",
    marginBottom: 6,
  },
  factBody: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
  funFactCard: {
    backgroundColor: "#0f3460",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#e94560",
  },
  funFactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e94560",
    marginBottom: 6,
  },
  funFactText: {
    fontSize: 14,
    color: "#eee",
    lineHeight: 20,
  },
  confidenceNote: {
    backgroundColor: "#2a1f00",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#f0a500",
  },
  confidenceNoteText: {
    color: "#f0a500",
    fontSize: 13,
  },
  narrationCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  narrationLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#eee",
    marginBottom: 8,
  },
  narrationPlaceholder: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  adsSection: {
    marginBottom: 24,
  },
  adCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  adTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#eee",
    marginBottom: 6,
  },
  adBody: {
    fontSize: 13,
    color: "#aaa",
    marginBottom: 8,
  },
  adLink: {
    fontSize: 13,
    color: "#e94560",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#1a1a2e",
    borderTopWidth: 1,
    borderTopColor: "#16213e",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#16213e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  shareButton: {
    backgroundColor: "#e94560",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

