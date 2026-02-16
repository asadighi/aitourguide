import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { SUPPORTED_LOCALES, type LocaleOption } from "../config/locales";

interface LocalePickerProps {
  visible: boolean;
  currentLocale: string;
  onSelect: (locale: string) => void;
  onClose: () => void;
}

export function LocalePicker({
  visible,
  currentLocale,
  onSelect,
  onClose,
}: LocalePickerProps) {
  const renderItem = ({ item }: { item: LocaleOption }) => {
    const isSelected = item.code === currentLocale;

    return (
      <TouchableOpacity
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => {
          onSelect(item.code);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.labelGroup}>
          <Text style={[styles.label, isSelected && styles.labelSelected]}>
            {item.label}
          </Text>
          {item.label !== item.englishName && (
            <Text style={styles.englishName}>{item.englishName}</Text>
          )}
        </View>
        {isSelected && <Text style={styles.check}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🌍 Select Language</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Content and narration will be generated in the selected language
        </Text>

        {/* Locale list */}
        <FlatList
          data={SUPPORTED_LOCALES}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#e94560",
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#16213e",
    borderRadius: 8,
  },
  closeText: {
    color: "#e94560",
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rowSelected: {
    borderColor: "#e94560",
    backgroundColor: "#1e2a4a",
  },
  flag: {
    fontSize: 28,
    marginRight: 14,
  },
  labelGroup: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: "#eee",
  },
  labelSelected: {
    color: "#e94560",
  },
  englishName: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  check: {
    fontSize: 20,
    color: "#e94560",
    fontWeight: "bold",
  },
});

