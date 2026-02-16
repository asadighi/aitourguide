import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { api } from "../api/client";

interface CameraScreenProps {
  onResult: (result: Awaited<ReturnType<typeof api.snap>>) => void;
  onClarification: (result: Awaited<ReturnType<typeof api.snap>>) => void;
}

export function CameraScreen({ onResult, onClarification }: CameraScreenProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === "granted");
    })();
  }, []);

  // --- Shared logic: get GPS, call API, route result ---
  const processImage = async (base64: string) => {
    // Get GPS if available
    let gps: { lat: number; lng: number } | undefined;
    if (hasLocationPermission) {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        gps = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
      } catch {
        // GPS is optional, continue without it
      }
    }

    // Call snap API
    const result = await api.snap(base64, gps, "en");

    if (result.landmark.needs_clarification) {
      onClarification(result);
    } else {
      onResult(result);
    }
  };

  // --- Camera snap ---
  const handleSnap = async () => {
    if (isProcessing || !cameraRef.current) return;

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (!photo?.base64) {
        Alert.alert("Error", "Failed to capture photo");
        return;
      }

      await processImage(photo.base64);
    } catch (err) {
      Alert.alert(
        "Identification Failed",
        err instanceof Error
          ? err.message
          : "Failed to identify landmark. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Pick image from gallery (for simulator / dev testing) ---
  const handlePickImage = async () => {
    if (isProcessing) return;

    try {
      // Don't request base64 or quality from the picker — iOS simulator
      // HEIC photos fail with "Cannot load representation of type public.jpeg".
      // Instead, get the URI and use expo-image-manipulator for the conversion.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      setIsProcessing(true);

      // Use image-manipulator to convert HEIC→JPEG and get base64
      // This handles the native format conversion properly on iOS
      const manipulated = await manipulateAsync(
        result.assets[0].uri,
        [], // no transforms needed
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      if (!manipulated.base64) {
        throw new Error("Failed to read picked image");
      }

      await processImage(manipulated.base64);
    } catch (err) {
      Alert.alert(
        "Identification Failed",
        err instanceof Error
          ? err.message
          : "Failed to identify landmark. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

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
          <View style={styles.topBar}>
            <Text style={styles.title}>🏛️ AI Tour Guide</Text>
          </View>

          <View style={styles.bottomBar}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.processingText}>
                  Identifying landmark...
                </Text>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                {/* Gallery picker — useful on simulator or when you want a saved photo */}
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

                {/* Spacer to keep shutter centered */}
                <View style={styles.galleryCircle} />
              </View>
            )}
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
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
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
