import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

/**
 * PaymentReceiptModal
 * Displays a receipt confirmation after a successful payment.
 */
const PaymentReceiptModal = ({ visible, onClose, receipt }) => {
  if (!receipt) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Success Icon */}
            <View style={styles.iconWrapper}>
              <Ionicons name="checkmark-circle" size={64} color="#059669" />
            </View>

            <Text style={styles.title}>Payment Successful</Text>
            <Text style={styles.subtitle}>Transaction recorded</Text>

            {/* Receipt Card */}
            <View style={styles.receiptCard}>
              {/* Reference Number */}
              <View style={styles.refRow}>
                <Text style={styles.refLabel}>Reference No.</Text>
                <Text style={styles.refValue}>{receipt.reference_no}</Text>
              </View>

              <View style={styles.divider} />

              {/* Details */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendor</Text>
                <Text style={styles.detailValue}>{receipt.vendor_name}</Text>
              </View>

              {receipt.vendor_identifier && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vendor ID</Text>
                  <Text style={styles.detailValue}>
                    {receipt.vendor_identifier}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>
                  {receipt.location_name || "N/A"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Collector</Text>
                <Text style={styles.detailValue}>{receipt.collector_name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {formatDate(receipt.time_date)}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Amount */}
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount Paid</Text>
                <Text style={styles.amountValue}>
                  ₱{parseFloat(receipt.amount).toFixed(2)}
                </Text>
              </View>

              {/* Status */}
              <View style={styles.statusRow}>
                <View style={styles.statusBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color="#059669"
                  />
                  <Text style={styles.statusText}>
                    {receipt.status || "completed"}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: width - 40,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
  },
  iconWrapper: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  refRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  refLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  refValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    maxWidth: "60%",
    textAlign: "right",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  amountValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#059669",
  },
  statusRow: {
    alignItems: "center",
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
    textTransform: "capitalize",
  },
  closeBtn: {
    marginHorizontal: 24,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});

export default PaymentReceiptModal;
