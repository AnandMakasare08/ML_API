import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// 🔁 Replace with your Render URL after deploying
const API_URL = "https://your-app-name.onrender.com/predict";

const PlantDiseaseScreen = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (fromCamera = false) => {
    // Ask for permission
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to continue.");
      return;
    }

    const pickerResult = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

    if (!pickerResult.canceled) {
      setImage(pickerResult.assets[0]);
      setResult(null); // clear previous result
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: image.uri,
        name: "plant.jpg",
        type: "image/jpeg",
      });

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        Alert.alert("Error", data.error || "Prediction failed.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Could not reach the server. Make sure your backend is running.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "#16a34a";
    if (confidence >= 50) return "#f59e0b";
    return "#dc2626";
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌿 Plant Disease Detector</Text>
      <Text style={styles.subtitle}>Upload a leaf photo to detect disease</Text>

      {/* Image Preview */}
      {image ? (
        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>📷 No image selected</Text>
        </View>
      )}

      {/* Pick Image Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage(false)}>
          <Text style={styles.secondaryButtonText}>🖼 Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage(true)}>
          <Text style={styles.secondaryButtonText}>📷 Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Analyze Button */}
      {image && (
        <TouchableOpacity
          style={[styles.analyzeButton, loading && { opacity: 0.6 }]}
          onPress={analyzeImage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.analyzeText}>🔍 Analyze Plant</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Result Card */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>🌱 Detection Result</Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Plant</Text>
            <Text style={styles.resultValue}>{result.plant}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Status</Text>
            <Text style={[styles.resultValue, { color: result.is_healthy ? "#16a34a" : "#dc2626" }]}>
              {result.is_healthy ? "✅ Healthy" : `⚠️ ${result.disease}`}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Confidence</Text>
            <Text style={[styles.resultValue, { color: getConfidenceColor(result.confidence) }]}>
              {result.confidence}%
            </Text>
          </View>

          {/* Top 3 Predictions */}
          <Text style={styles.top3Title}>Top 3 Predictions</Text>
          {result.top3.map((item, index) => (
            <View key={index} style={styles.top3Row}>
              <Text style={styles.top3Label}>
                {index + 1}. {item.plant} — {item.disease}
              </Text>
              <Text style={[styles.top3Confidence, { color: getConfidenceColor(item.confidence) }]}>
                {item.confidence}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#f0fdf4",
    flexGrow: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#15803d",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  imagePreview: {
    width: 280,
    height: 280,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#86efac",
  },
  imagePlaceholder: {
    width: 280,
    height: 280,
    borderRadius: 16,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#86efac",
    borderStyle: "dashed",
  },
  placeholderText: {
    color: "#6b7280",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#16a34a",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#16a34a",
    fontWeight: "600",
    fontSize: 15,
  },
  analyzeButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 4,
    width: "100%",
    alignItems: "center",
  },
  analyzeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#15803d",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  resultLabel: {
    color: "#6b7280",
    fontSize: 15,
  },
  resultValue: {
    fontWeight: "600",
    fontSize: 15,
    color: "#111",
    maxWidth: "60%",
    textAlign: "right",
  },
  top3Title: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#374151",
  },
  top3Row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  top3Label: {
    fontSize: 13,
    color: "#4b5563",
    flex: 1,
  },
  top3Confidence: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default PlantDiseaseScreen;
