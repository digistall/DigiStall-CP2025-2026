import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRScannerModal from "./QRScannerModal";
import PaymentReceiptModal from "./PaymentReceiptModal";
import { API_CONFIG, NetworkUtils } from "../../../config/shared/networkConfig";
import UserStorageService from "../../../services/UserStorageService";

const { width } = Dimensions.get("window");

// ── Status logic ────────────────────────────────────────────────────────────
const getPaymentStatus = (amount, isMissing) => {
  if (isMissing) return { label: "Missing", color: "#ef4444", bg: "#fee2e2" };
  const num = parseFloat(amount) || 0;
  if (num === 0) return { label: "No Amount", color: "#6b7280", bg: "#f3f4f6" };
  if (num < 25)
    return { label: "Incomplete", color: "#d97706", bg: "#fef3c7" };
  return { label: "Complete", color: "#059669", bg: "#d1fae5" };
};

// ═════════════════════════════════════════════════════════════════════════════
const AddPaymentForm = ({ visible, onClose, onSubmit, collectorName, autoOpenScanner = false }) => {
  // Form state
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isMissing, setIsMissing] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // API integration state
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [lookingUpVendor, setLookingUpVendor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const amountInputRef = useRef(null);
  const hasAutoOpened = useRef(false);

  // Derived
  const status = getPaymentStatus(amount, isMissing);
  const filteredVendors = vendors.filter(
    (v) =>
      v.vendor_name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (v.vendor_identifier || "").toLowerCase().includes(vendorSearch.toLowerCase())
  );

  // Load vendors list when form opens
  useEffect(() => {
    if (visible) {
      fetchVendors();
      // Auto-open QR scanner if triggered from dashboard quick action
      if (autoOpenScanner && !hasAutoOpened.current) {
        hasAutoOpened.current = true;
        setTimeout(() => setShowQRScanner(true), 300);
      }
    } else {
      hasAutoOpened.current = false;
    }
  }, [visible]);

  // ── API Calls ─────────────────────────────────────────────────────────────

  const getAuthHeaders = async () => {
    const userData = await UserStorageService.getUserData();
    const token = userData?.token;
    const headers = { ...API_CONFIG.HEADERS };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const server = await NetworkUtils.getActiveServer();
      const headers = await getAuthHeaders();
      const response = await fetch(`${server}/api/payments/daily/vendors`, {
        method: "GET",
        headers,
      });
      const data = await response.json();
      if (data.success && data.data) {
        // Map to consistent format
        setVendors(
          data.data.map((v) => ({
            vendor_id: v.vendor_id,
            vendor_name: v.vendor_name,
            vendor_identifier: v.vendor_identifier || null,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoadingVendors(false);
    }
  };

  const lookupVendorByIdentifier = async (vendorIdentifier) => {
    setLookingUpVendor(true);
    try {
      const server = await NetworkUtils.getActiveServer();
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${server}/api/collector/vendors/qr/${encodeURIComponent(vendorIdentifier)}`,
        { method: "GET", headers }
      );
      const data = await response.json();

      if (data.success && data.data) {
        const vendor = data.data;
        const vendorObj = {
          vendor_id: vendor.vendor_id,
          vendor_name: vendor.vendor_name,
          vendor_identifier: vendor.vendor_identifier,
          location_name: vendor.assigned_location?.location_name || "N/A",
        };
        setSelectedVendor(vendorObj);
        setVendorSearch(vendor.vendor_name);
        setDropdownOpen(false);
        return vendorObj;
      } else {
        Alert.alert(
          "Vendor Not Found",
          data.message || "No vendor found for this QR code."
        );
        return null;
      }
    } catch (error) {
      console.error("Error looking up vendor:", error);
      Alert.alert("Network Error", "Could not connect to server. Please try again.");
      return null;
    } finally {
      setLookingUpVendor(false);
    }
  };

  const submitPayment = async () => {
    if (!selectedVendor || submitting) return;

    const parsedAmount = parseFloat(amount) || 0;
    if (!isMissing && parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount or mark as missing.");
      return;
    }

    setSubmitting(true);
    try {
      const server = await NetworkUtils.getActiveServer();
      const headers = await getAuthHeaders();
      const response = await fetch(`${server}/api/collector/daily-payments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          vendorId: selectedVendor.vendor_id,
          amount: isMissing ? 0 : parsedAmount,
          status: isMissing ? "missing" : "completed",
        }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        // Show receipt
        setReceiptData(data.data);
        setShowReceipt(true);

        // Notify parent of successful payment
        if (onSubmit) {
          onSubmit({
            vendorId: data.data.vendor_id,
            vendorName: data.data.vendor_name,
            collectorName: data.data.collector_name,
            amount: data.data.amount,
            referenceNo: data.data.reference_no,
            status: isMissing ? "Missing" : "Complete",
            date: data.data.time_date,
          });
        }
      } else {
        Alert.alert(
          "Payment Failed",
          data.message || "Could not process payment. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      Alert.alert("Network Error", "Could not connect to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setVendorSearch(vendor.vendor_name);
    setDropdownOpen(false);
  };

  const handleQRScanned = async ({ vendorIdentifier, vendorId, error }) => {
    setShowQRScanner(false);

    if (error) {
      Alert.alert("Invalid QR Code", error);
      return;
    }

    const identifier = vendorIdentifier || vendorId;
    if (!identifier) {
      Alert.alert("Invalid QR Code", "No vendor identifier found in the QR code.");
      return;
    }

    // Call backend to validate and retrieve vendor info
    await lookupVendorByIdentifier(identifier);
  };

  const handleQuickAmount = (val) => {
    setAmount(val);
  };

  const handleReset = () => {
    setVendorSearch("");
    setSelectedVendor(null);
    setDropdownOpen(false);
    setAmount("");
    setIsMissing(false);
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setReceiptData(null);
    handleReset();
    onClose();
  };

  const handleAdd = () => {
    submitPayment();
  };

  const isValid = selectedVendor !== null && (isMissing || parseFloat(amount) > 0);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Daily Payment</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Collector Name (autofilled) ──────────────────────────── */}
            <Text style={styles.label}>Collector Name</Text>
            <View style={styles.autofilledField}>
              <Ionicons name="person" size={18} color="#3b82f6" />
              <Text style={styles.autofilledText}>
                {collectorName || "Collector"}
              </Text>
            </View>

            {/* ── Vendor Name / ID (dropdown + QR scan) ─────────────── */}
            <Text style={styles.label}>Vendor Name / ID</Text>

            {/* QR Scan Button */}
            <TouchableOpacity
              style={styles.qrScanButton}
              onPress={() => setShowQRScanner(true)}
              disabled={lookingUpVendor}
            >
              {lookingUpVendor ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Ionicons name="qr-code-outline" size={22} color="#2563eb" />
              )}
              <Text style={styles.qrScanButtonText}>
                {lookingUpVendor ? "Looking up vendor..." : "Scan QR Code"}
              </Text>
              <Ionicons name="camera-outline" size={18} color="#6b7280" />
            </TouchableOpacity>

            <Text style={styles.orDividerText}>or search manually</Text>

            <View style={styles.dropdownWrapper}>
              <View style={styles.inputRow}>
                <Ionicons name="storefront-outline" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Search vendor name or ID..."
                  placeholderTextColor="#9ca3af"
                  value={vendorSearch}
                  onChangeText={(text) => {
                    setVendorSearch(text);
                    setSelectedVendor(null);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                />
                {loadingVendors ? (
                  <ActivityIndicator size="small" color="#9ca3af" />
                ) : (
                  <TouchableOpacity
                    onPress={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <Ionicons
                      name={dropdownOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Dropdown list */}
              {dropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView
                    style={styles.dropdownScroll}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredVendors.length > 0 ? (
                      filteredVendors.map((item) => (
                        <TouchableOpacity
                          key={item.vendor_id}
                          style={[
                            styles.dropdownItem,
                            selectedVendor?.vendor_id === item.vendor_id &&
                              styles.dropdownItemActive,
                          ]}
                          onPress={() => handleSelectVendor(item)}
                        >
                          <Text style={styles.dropdownItemName}>
                            {item.vendor_name}
                          </Text>
                          <Text style={styles.dropdownItemId}>
                            {item.vendor_identifier || `#${item.vendor_id}`}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.dropdownEmpty}>
                        {loadingVendors ? "Loading vendors..." : "No vendors found"}
                      </Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {selectedVendor && (
              <View style={styles.selectedChip}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.selectedChipText}>
                  {selectedVendor.vendor_name}
                  {selectedVendor.vendor_identifier
                    ? ` (${selectedVendor.vendor_identifier})`
                    : ` (#${selectedVendor.vendor_id})`}
                </Text>
              </View>
            )}

            {/* Show location if available from QR lookup */}
            {selectedVendor?.location_name &&
              selectedVendor.location_name !== "N/A" && (
                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={14} color="#6b7280" />
                  <Text style={styles.locationText}>
                    {selectedVendor.location_name}
                  </Text>
                </View>
              )}

            {/* ── Mark as Missing Toggle ─────────────────────────────── */}
            <TouchableOpacity
              style={[
                styles.missingToggle,
                isMissing && styles.missingToggleActive,
              ]}
              onPress={() => {
                setIsMissing(!isMissing);
                if (!isMissing) setAmount("0");
                else setAmount("");
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMissing ? "checkbox" : "square-outline"}
                size={22}
                color={isMissing ? "#ef4444" : "#9ca3af"}
              />
              <View style={styles.missingToggleContent}>
                <Text
                  style={[
                    styles.missingToggleText,
                    isMissing && styles.missingToggleTextActive,
                  ]}
                >
                  Mark as Missing
                </Text>
                <Text style={styles.missingToggleHint}>
                  Vendor cannot pay today
                </Text>
              </View>
            </TouchableOpacity>

            {/* ── Amount ───────────────────────────────────────────────── */}
            <Text style={styles.label}>Amount</Text>
            <View style={[styles.inputRow, isMissing && styles.inputDisabled]}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                ref={amountInputRef}
                style={styles.input}
                placeholder={isMissing ? "0.00 (Missing)" : "0.00"}
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={isMissing ? "0" : amount}
                onChangeText={setAmount}
                editable={!isMissing}
              />
            </View>

            {/* Quick amount buttons */}
            <Text style={styles.quickLabel}>Quick Amount</Text>
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={[
                  styles.quickBtn,
                  amount === "15.00" && styles.quickBtnActive,
                ]}
                onPress={() => handleQuickAmount("15.00")}
              >
                <Text
                  style={[
                    styles.quickBtnText,
                    amount === "15.00" && styles.quickBtnTextActive,
                  ]}
                >
                  ₱ 15.00
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quickBtn,
                  amount === "25.00" && styles.quickBtnActive,
                ]}
                onPress={() => handleQuickAmount("25.00")}
              >
                <Text
                  style={[
                    styles.quickBtnText,
                    amount === "25.00" && styles.quickBtnTextActive,
                  ]}
                >
                  ₱ 25.00
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Status (auto-calculated) ─────────────────────────────── */}
            <Text style={styles.label}>Status</Text>
            <View
              style={[styles.statusDisplay, { backgroundColor: status.bg }]}
            >
              <Ionicons
                name={
                  status.label === "Complete"
                    ? "checkmark-circle"
                    : status.label === "Incomplete"
                      ? "alert-circle"
                      : "close-circle"
                }
                size={20}
                color={status.color}
              />
              <Text style={[styles.statusDisplayText, { color: status.color }]}>
                {status.label}
              </Text>
              <Text style={styles.statusHint}>
                {status.label === "Missing"
                  ? "Vendor cannot pay today"
                  : status.label === "No Amount"
                    ? "Enter an amount"
                    : status.label === "Incomplete"
                      ? `₱${(parseFloat(amount) || 0).toFixed(2)} of ₱25.00`
                      : "Full payment received"}
              </Text>
            </View>

            {/* Spacer */}
            <View style={{ height: 16 }} />
          </ScrollView>

          {/* ── Bottom Actions ────────────────────────────────────────── */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, !isValid && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!isValid || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons
                  name={isMissing ? "alert-circle" : "add-circle"}
                  size={20}
                  color="#ffffff"
                />
              )}
              <Text style={styles.addBtnText}>
                {submitting
                  ? "Processing..."
                  : isMissing
                    ? "Record Missing"
                    : "Add Payment"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanned={handleQRScanned}
      />

      {/* Receipt Confirmation Modal */}
      <PaymentReceiptModal
        visible={showReceipt}
        onClose={handleReceiptClose}
        receipt={receiptData}
      />
    </Modal>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  /* Labels */
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 10,
    marginBottom: 8,
  },

  /* QR Scan Button */
  qrScanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#eff6ff",
    borderWidth: 2,
    borderColor: "#bfdbfe",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  qrScanButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563eb",
    flex: 1,
  },
  orDividerText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 8,
  },

  /* Autofilled field */
  autofilledField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  autofilledText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e40af",
  },

  /* Input row */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 4,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1f2937",
    paddingVertical: Platform.OS === "ios" ? 0 : 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3b82f6",
  },

  /* Dropdown */
  dropdownWrapper: {
    zIndex: 10,
  },
  dropdownList: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemActive: {
    backgroundColor: "#eff6ff",
  },
  dropdownItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  dropdownItemId: {
    fontSize: 12,
    color: "#9ca3af",
  },
  dropdownEmpty: {
    textAlign: "center",
    paddingVertical: 16,
    fontSize: 14,
    color: "#9ca3af",
  },

  /* Selected chip */
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  selectedChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },

  /* Location info */
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#6b7280",
  },

  /* Missing toggle */
  missingToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  missingToggleActive: {
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
  },
  missingToggleContent: {
    flex: 1,
  },
  missingToggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  missingToggleTextActive: {
    color: "#dc2626",
  },
  missingToggleHint: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },

  /* Disabled input */
  inputDisabled: {
    backgroundColor: "#f3f4f6",
    opacity: 0.6,
  },

  /* Quick amount */
  quickRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  quickBtnActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  quickBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
  },
  quickBtnTextActive: {
    color: "#3b82f6",
  },

  /* Status display */
  statusDisplay: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    flexWrap: "wrap",
  },
  statusDisplayText: {
    fontSize: 15,
    fontWeight: "700",
  },
  statusHint: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: "auto",
  },

  /* Action buttons */
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  addBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#2563eb",
  },
  addBtnDisabled: {
    backgroundColor: "#93c5fd",
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
});

export default AddPaymentForm;
