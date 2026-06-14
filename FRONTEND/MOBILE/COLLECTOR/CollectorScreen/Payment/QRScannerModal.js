import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const SCAN_AREA_SIZE = width * 0.7;

const QRScannerModal = ({ visible, onClose, onScanned }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Reset scanned state when modal opens
  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Try parsing as JSON first
      // Supported formats:
      //   {"vendorIdentifier": "VND-000123", "version": 1}  (new standard QR)
      //   {"vendorId": "V-123", "stallId": "S-456"}          (legacy format)
      const parsed = JSON.parse(data);
      
      if (parsed.vendorIdentifier) {
        // New standard QR format
        onScanned({
          vendorIdentifier: parsed.vendorIdentifier,
          vendorId: null,
          stallId: null,
          raw: data,
        });
      } else if (parsed.vendorId) {
        // Legacy format
        onScanned({
          vendorIdentifier: parsed.vendorId,
          vendorId: parsed.vendorId,
          stallId: parsed.stallId || null,
          raw: data,
        });
      } else {
        // JSON but no recognized field
        onScanned({ vendorIdentifier: null, vendorId: null, stallId: null, raw: data, error: "Invalid QR format: missing vendorIdentifier" });
      }
    } catch {
      // Not JSON — try URL format: digistall://VND-000123 or plain ID
      if (data.startsWith("digistall://")) {
        const parts = data.replace("digistall://", "").split("/");
        onScanned({
          vendorIdentifier: parts[0] || null,
          vendorId: parts[0] || null,
          stallId: parts[1] || null,
          raw: data,
        });
      } else {
        // Treat as plain vendor identifier
        onScanned({ vendorIdentifier: data.trim(), vendorId: data.trim(), stallId: null, raw: data });
      }
    }
  };

  const handleRescan = () => {
    setScanned(false);
  };

  // ── Permission states ─────────────────────────────────────────────────────
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.centeredContainer}>
          <Ionicons name="camera-outline" size={64} color="#9ca3af" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan vendor QR codes.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // ── Scanner view ──────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Scan Vendor QR Code</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Scan area frame */}
          <View style={styles.scanAreaContainer}>
            <View style={styles.scanArea}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* Bottom instructions */}
          <View style={styles.bottomBar}>
            <Text style={styles.instruction}>
              {scanned
                ? "QR Code detected!"
                : "Point your camera at the vendor's QR code"}
            </Text>
            {scanned && (
              <TouchableOpacity style={styles.rescanBtn} onPress={handleRescan}>
                <Ionicons name="refresh" size={20} color="#ffffff" />
                <Text style={styles.rescanBtnText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 32,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanAreaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#2563eb",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  bottomBar: {
    alignItems: "center",
    paddingBottom: 60,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: 20,
  },
  instruction: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "500",
  },
  rescanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  rescanBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  permissionBtn: {
    marginTop: 24,
    backgroundColor: "#2563eb",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelLink: {
    marginTop: 16,
    padding: 8,
  },
  cancelLinkText: {
    color: "#6b7280",
    fontSize: 15,
  },
});

export default QRScannerModal;
