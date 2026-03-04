import React, { useState, useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// ── Sample vendor list (replace with API data later) ────────────────────────
const sampleVendors = [
  { id: "V-001", name: "Juan Dela Cruz" },
  { id: "V-002", name: "Maria Santos" },
  { id: "V-003", name: "Pedro Reyes" },
  { id: "V-004", name: "Ana Garcia" },
  { id: "V-005", name: "Jose Ramos" },
  { id: "V-006", name: "Elena Cruz" },
  { id: "V-007", name: "Carlos Tan" },
];

// ── Status logic ────────────────────────────────────────────────────────────
const getPaymentStatus = (amount) => {
  const num = parseFloat(amount) || 0;
  if (num === 0) return { label: "Missing", color: "#ef4444", bg: "#fee2e2" };
  if (num !== 25)
    return { label: "Incomplete", color: "#d97706", bg: "#fef3c7" };
  return { label: "Complete", color: "#059669", bg: "#d1fae5" };
};

// ── Generate reference number ───────────────────────────────────────────────
const generateReferenceNo = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `REF-${y}${m}${d}-${rand}`;
};

// ═════════════════════════════════════════════════════════════════════════════
const AddPaymentForm = ({ visible, onClose, onSubmit, collectorName }) => {
  // Form state
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [referenceNo, setReferenceNo] = useState(generateReferenceNo());

  const amountInputRef = useRef(null);

  // Derived
  const status = getPaymentStatus(amount);
  const filteredVendors = sampleVendors.filter(
    (v) =>
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.id.toLowerCase().includes(vendorSearch.toLowerCase()),
  );

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setVendorSearch(vendor.name);
    setDropdownOpen(false);
  };

  const handleQuickAmount = (val) => {
    setAmount(val);
  };

  const handleReset = () => {
    setVendorSearch("");
    setSelectedVendor(null);
    setDropdownOpen(false);
    setAmount("");
    setReferenceNo(generateReferenceNo());
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleAdd = () => {
    if (!selectedVendor) return;
    const numAmount = parseFloat(amount) || 0;

    const payment = {
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      collectorName: collectorName || "Collector",
      amount: numAmount,
      referenceNo,
      status: status.label,
      date: new Date().toISOString(),
    };

    onSubmit && onSubmit(payment);
    handleReset();
    onClose();
  };

  const isValid = selectedVendor !== null;

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

            {/* ── Vendor Name / ID (dropdown) ──────────────────────────── */}
            <Text style={styles.label}>Vendor Name / ID</Text>
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
                <TouchableOpacity
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Ionicons
                    name={dropdownOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
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
                          key={item.id}
                          style={[
                            styles.dropdownItem,
                            selectedVendor?.id === item.id &&
                              styles.dropdownItemActive,
                          ]}
                          onPress={() => handleSelectVendor(item)}
                        >
                          <Text style={styles.dropdownItemName}>
                            {item.name}
                          </Text>
                          <Text style={styles.dropdownItemId}>{item.id}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.dropdownEmpty}>No vendors found</Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
            {selectedVendor && (
              <View style={styles.selectedChip}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.selectedChipText}>
                  {selectedVendor.name} ({selectedVendor.id})
                </Text>
              </View>
            )}

            {/* ── Amount ───────────────────────────────────────────────── */}
            <Text style={styles.label}>Amount</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                ref={amountInputRef}
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
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

            {/* ── Reference Number ─────────────────────────────────────── */}
            <Text style={styles.label}>Reference Number</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#9ca3af"
              />
              <TextInput
                style={styles.input}
                placeholder="REF-XXXXXXXX-XXX"
                placeholderTextColor="#9ca3af"
                value={referenceNo}
                onChangeText={setReferenceNo}
              />
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
                  ? "Amount is ₱0.00"
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
              disabled={!isValid}
            >
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.addBtnText}>Add Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
