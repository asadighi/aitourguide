import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useBackgroundSnapContext } from "../queue/BackgroundSnapContext";
import { useSnapQueue } from "../queue/SnapQueueContext";

interface CameraScreenProps {
  locale: string;
  onOpenLocalePicker: () => void;
  localeFlag: string;
  onOpenPlaylist: () => void;
}

export function CameraScreen({
  locale,
  onOpenLocalePicker,
  localeFlag,
  onOpenPlaylist,
}: CameraScreenProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Queue integration (uses global context — processing continues when CameraScreen unmounts)
  const { dispatchSnap } = useBackgroundSnapContext();
  const { counts } = useSnapQueue();

  // Flash animation for snap feedback
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === "granted");
    })();
  }, []);

  // --- Get current GPS (best-effort) ---
  const getGps = async (): Promise<
    { lat: number; lng: number } | undefined
  > => {
    if (!hasLocationPermission) return undefined;
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch {
      return undefined;
    }
  };

  // --- Brief flash to confirm a snap was queued ---
  const showFlash = () => {
    flashOpacity.setValue(0.6);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  // --- Resize image to reduce upload size (max 1024px on longest side) ---
  const resizeForUpload = async (uri: string): Promise<string | null> => {
    try {
      const resized = await manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.6, format: SaveFormat.JPEG, base64: true }
      );
      return resized.base64 ?? null;
    } catch {
      return null;
    }
  };

  // --- Camera snap (non-blocking) ---
  const handleSnap = async () => {
    if (!cameraRef.current) return;

    try {
      // Capture at low quality — we'll resize anyway
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
      });

      if (!photo?.uri) {
        Alert.alert("Error", "Failed to capture photo");
        return;
      }

      // Resize to 1024px wide, compress to 60% — typically ~100-300KB base64
      const base64 = await resizeForUpload(photo.uri);
      if (!base64) {
        Alert.alert("Error", "Failed to process photo");
        return;
      }

      const gps = await getGps();
      dispatchSnap(base64, locale, gps);
      showFlash();
    } catch (err) {
      Alert.alert(
        "Snap Failed",
        err instanceof Error ? err.message : "Failed to capture photo."
      );
    }
  };

  // --- Pick image from gallery (non-blocking) ---
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      // Convert HEIC→JPEG, resize to 1024px, and get base64
      const base64 = await resizeForUpload(result.assets[0].uri);
      if (!base64) {
        throw new Error("Failed to read picked image");
      }

      const gps = await getGps();
      dispatchSnap(base64, locale, gps);
      showFlash();
    } catch (err) {
      Alert.alert(
        "Pick Failed",
        err instanceof Error ? err.message : "Failed to pick image."
      );
    }
  };

  // --- Queue badge: shows total items, with color based on status ---
  const badgeCount = counts.total;
  const badgeHasProcessing = counts.processing > 0 || counts.pending > 0;

  // --- Permission screens ---
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera access is needed to identify landmarks
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
        <Text style={styles.hintText}>— or for simulator testing —</Text>
        <View style={{ height: 12 }} />
        <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
          <Text style={styles.galleryButtonText}>📷 Pick from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Main camera view ---
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          {/* Flash overlay for snap feedback */}
          <Animated.View
            style={[styles.flashOverlay, { opacity: flashOpacity }]}
            pointerEvents="none"
          />

          <View style={styles.topBar}>
            <Text style={styles.title}>🏛️ AI Tour Guide</Text>

            {/* Locale button */}
            <TouchableOpacity
              style={styles.localeButton}
              onPress={onOpenLocalePicker}
              activeOpacity={0.7}
            >
              <Text style={styles.localeButtonText}>{localeFlag}</Text>
            </TouchableOpacity>

            {/* Queue badge */}
            {badgeCount > 0 && (
              <TouchableOpacity
                style={styles.queueBadgeButton}
                onPress={onOpenPlaylist}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.queueBadge,
                    badgeHasProcessing && styles.queueBadgeProcessing,
                  ]}
                >
                  <Text style={styles.queueBadgeText}>{badgeCount}</Text>
                </View>
                <Text style={styles.queueBadgeLabel}>
                  {badgeHasProcessing ? "⏳" : "✅"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.buttonRow}>
              {/* Gallery picker */}
              <TouchableOpacity
                style={styles.galleryCircle}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <Text style={styles.galleryEmoji}>🖼️</Text>
              </TouchableOpacity>

              {/* Main shutter */}
              <TouchableOpacity
                style={styles.snapButton}
                onPress={handleSnap}
                activeOpacity={0.7}
              >
                <View style={styles.snapButtonInner} />
              </TouchableOpacity>

              {/* Playlist button (or spacer) */}
              {badgeCount > 0 ? (
                <TouchableOpacity
                  style={styles.playlistCircle}
                  onPress={onOpenPlaylist}
                  activeOpacity={0.7}
                >
                  <Text style={styles.playlistEmoji}>📋</Text>
                  {badgeCount > 0 && (
                    <View style={styles.miniCountBadge}>
                      <Text style={styles.miniCountText}>{badgeCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.galleryCircle} />
              )}
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  localeButton: {
    position: "absolute",
    right: 20,
    top: 58,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  localeButtonText: {
    fontSize: 22,
  },
  queueBadgeButton: {
    position: "absolute",
    left: 20,
    top: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  queueBadge: {
    backgroundColor: "#4caf50",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  queueBadgeProcessing: {
    backgroundColor: "#ff9800",
  },
  queueBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  queueBadgeLabel: {
    fontSize: 14,
    marginLeft: 4,
  },
  bottomBar: {
    paddingBottom: 40,
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  snapButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 24,
  },
  snapButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e94560",
  },
  galleryCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryEmoji: {
    fontSize: 24,
  },
  playlistCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  playlistEmoji: {
    fontSize: 22,
  },
  miniCountBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#e94560",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  miniCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  processingContainer: {
    alignItems: "center",
  },
  processingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  permissionText: {
    color: "#eee",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  hintText: {
    color: "#666",
    fontSize: 13,
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#e94560",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  galleryButton: {
    backgroundColor: "#16213e",
    borderWidth: 1,
    borderColor: "#e94560",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  galleryButtonText: {
    color: "#e94560",
    fontSize: 16,
    fontWeight: "600",
  },
});
