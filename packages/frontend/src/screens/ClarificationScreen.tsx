import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import type { api } from "../api/client";

type SnapResult = Awaited<ReturnType<typeof api.snap>>;

interface ClarificationScreenProps {
  result: SnapResult;
  onSelect: (landmarkName: string) => void;
  onRetry: () => void;
}

export function ClarificationScreen({
  result,
  onSelect,
  onRetry,
}: ClarificationScreenProps) {
  const landmarks = result.landmark.landmarks;
  const message = result.landmark.clarification_message;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.icon}>🤔</Text>
          <Text style={styles.title}>Which landmark did you find?</Text>
          {message && <Text style={styles.subtitle}>{message}</Text>}
        </View>

        <View style={styles.optionsContainer}>
          {landmarks.map((landmark, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={() => onSelect(landmark.name)}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionName}>{landmark.name}</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {Math.round(landmark.confidence * 100)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                {landmark.brief_description}
              </Text>
              {landmark.location.city && (
                <Text style={styles.optionLocation}>
                  📍 {landmark.location.city}
                  {landmark.location.country
                    ? `, ${landmark.location.country}`
                    : ""}
                </Text>
              )}
              <Text style={styles.optionCategory}>
                {landmark.category.charAt(0).toUpperCase() +
                  landmark.category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>📷 Take Another Photo</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e94560",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#0f3460",
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  optionName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#eee",
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: "#0f3460",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: "#e94560",
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
    marginBottom: 8,
  },
  optionLocation: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  optionCategory: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  retryButton: {
    backgroundColor: "#16213e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  retryText: {
    fontSize: 16,
    color: "#e94560",
    fontWeight: "600",
  },
});

