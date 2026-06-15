import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  Share,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../components/ThemeComponents/ThemeContext";
import UserStorageService from "../../../services/UserStorageService";
import QRCode from "react-native-qrcode-svg";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const { width } = Dimensions.get("window");
const QR_SIZE = width * 0.6;

const MyQRCodeScreen = () => {
  const { theme } = useTheme();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      const userData = await UserStorageService.getUserData();
      if (userData?.vendor) {
        setVendorData(userData.vendor);
      }
    } catch (error) {
      console.error("Error loading vendor data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Build the QR payload — only public identifiers, never sensitive data
  const getQRPayload = useCallback(() => {
    if (!vendorData?.vendor_identifier) return null;
    return JSON.stringify({
      vendorIdentifier: vendorData.vendor_identifier,
      version: 1,
    });
  }, [vendorData]);

  // Share/Save QR code as image
  const handleShareQR = async () => {
    if (!qrRef.current) return;

    setSaving(true);
    try {
      qrRef.current.toDataURL(async (dataURL) => {
        try {
          const filename = `${FileSystem.cacheDirectory}vendor-qr-${vendorData.vendor_identifier}.png`;
          await FileSystem.writeAsStringAsync(filename, dataURL, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(filename, {
              mimeType: "image/png",
              dialogTitle: "Share My QR Code",
            });
          } else {
            // Fallback: share text
            await Share.share({
              message: `My Vendor QR Code - ${vendorData.vendor_identifier}`,
            });
          }
        } catch (error) {
          console.error("Error sharing QR:", error);
          Alert.alert("Error", "Could not share QR code. Please try again.");
        } finally {
          setSaving(false);
        }
      });
    } catch (error) {
      console.error("Error generating QR image:", error);
      setSaving(false);
      Alert.alert("Error", "Could not generate QR image.");
    }
  };

  const handleDownloadQR = async () => {
    if (!qrRef.current) return;

    setSaving(true);
    try {
      qrRef.current.toDataURL(async (dataURL) => {
        try {
          const filename = `${FileSystem.documentDirectory}vendor-qr-${vendorData.vendor_identifier}.png`;
          await FileSystem.writeAsStringAsync(filename, dataURL, {
            encoding: FileSystem.EncodingType.Base64,
          });
          Alert.alert(
            "QR Code Saved",
            "Your QR code has been saved to app storage. Use the Share button to send it elsewhere."
          );
        } catch (error) {
          console.error("Error saving QR:", error);
          Alert.alert("Error", "Could not save QR code.");
        } finally {
          setSaving(false);
        }
      });
    } catch (error) {
      setSaving(false);
      Alert.alert("Error", "Could not generate QR image.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={styles.loadingText}>Loading your QR code...</Text>
      </View>
    );
  }

  const qrPayload = getQRPayload();
  const hasIdentifier = !!vendorData?.vendor_identifier;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <View style={styles.headerSection}>
        <LinearGradient
          colors={["#1d4ed8", "#1e40af"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Ionicons name="qr-code" size={32} color="#ffffff" />
          <Text style={styles.headerTitle}>My Payment QR Code</Text>
          <Text style={styles.headerSubtitle}>
            Show this to the collector for daily payment collection
          </Text>
        </LinearGradient>
      </View>

      {/* QR Code Display */}
      {hasIdentifier ? (
        <View style={[styles.qrCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={qrPayload}
              size={QR_SIZE}
              color="#1f2937"
              backgroundColor="#ffffff"
              getRef={(ref) => (qrRef.current = ref)}
              logo={undefined}
              logoSize={0}
              quietZone={16}
            />
          </View>

          {/* Vendor Identifier */}
          <View style={styles.identifierContainer}>
            <Text style={[styles.identifierLabel, { color: theme.colors.textSecondary }]}>
              Vendor ID
            </Text>
            <Text style={[styles.identifierValue, { color: theme.colors.text }]}>
              {vendorData.vendor_identifier}
            </Text>
          </View>

          {/* Vendor Name */}
          <Text style={[styles.vendorName, { color: theme.colors.text }]}>
            {vendorData.full_name || `${vendorData.first_name || ""} ${vendorData.last_name || ""}`.trim()}
          </Text>

          {/* Location */}
          {vendorData.location_name && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
                {vendorData.location_name}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleShareQR}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#1d4ed8" />
              ) : (
                <Ionicons name="share-outline" size={22} color="#1d4ed8" />
              )}
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDownloadQR}
              disabled={saving}
            >
              <Ionicons name="download-outline" size={22} color="#1d4ed8" />
              <Text style={styles.actionBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // No vendor_identifier assigned
        <View style={[styles.qrCard, styles.noQrCard, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="alert-circle-outline" size={48} color="#d97706" />
          <Text style={[styles.noQrTitle, { color: theme.colors.text }]}>
            QR Code Not Available
          </Text>
          <Text style={[styles.noQrText, { color: theme.colors.textSecondary }]}>
            Your vendor ID has not been assigned yet. Please contact the branch
            manager to set up your vendor identifier.
          </Text>
        </View>
      )}

      {/* Instructions */}
      <View style={[styles.instructionsCard, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
          How it works
        </Text>
        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
            The collector opens the "Scan QR" feature on their app
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
            Show this QR code to the collector
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
            The collector records your daily payment instantly
          </Text>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerSection: {
    paddingHorizontal: width * 0.04,
    paddingTop: 8,
    marginBottom: 16,
  },
  headerGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
    textAlign: "center",
  },
  qrCard: {
    marginHorizontal: width * 0.04,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  noQrCard: {
    paddingVertical: 40,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 16,
  },
  identifierContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  identifierLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  identifierValue: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1d4ed8",
  },
  noQrTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  noQrText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  instructionsCard: {
    marginHorizontal: width * 0.04,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1d4ed8",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  stepText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
    paddingTop: 2,
  },
});

export default MyQRCodeScreen;
