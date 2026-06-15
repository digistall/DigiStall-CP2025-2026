import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AddPaymentForm from "./AddPaymentForm";
import { API_CONFIG, NetworkUtils } from "../../../config/shared/networkConfig";
import UserStorageService from "../../../services/UserStorageService";

const PaymentScreen = ({ autoOpenQR = false, onQROpened, preSelectedVendor = null, onPreSelectedVendorUsed }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collectorName, setCollectorName] = useState("Collector");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadCollectorName();
    fetchPayments(1, true);
  }, []);

  // Auto-open QR scanner when navigated from dashboard quick action
  useEffect(() => {
    if (autoOpenQR) {
      setShowAddForm(true);
      if (onQROpened) onQROpened();
    }
  }, [autoOpenQR]);

  // Auto-open payment form when vendor is pre-selected from vendor list
  useEffect(() => {
    if (preSelectedVendor) {
      setShowAddForm(true);
      if (onPreSelectedVendorUsed) onPreSelectedVendorUsed();
    }
  }, [preSelectedVendor]);

  const loadCollectorName = async () => {
    try {
      const userData = await UserStorageService.getUserData();
      const staff = userData?.staff;
      if (staff) {
        const name = `${staff.first_name || ""} ${staff.last_name || ""}`.trim();
        if (name) setCollectorName(name);
      }
    } catch (error) {
      console.error("Error loading collector name:", error);
    }
  };

  const fetchPayments = async (pageNum = 1, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);

      const userData = await UserStorageService.getUserData();
      const token = userData?.token;
      const server = await NetworkUtils.getActiveServer();

      const headers = { ...API_CONFIG.HEADERS };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(
        `${server}/api/collector/daily-payments?page=${pageNum}&limit=20`,
        { method: "GET", headers, signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success && data.data) {
        if (pageNum === 1) {
          setPayments(data.data);
        } else {
          setPayments((prev) => [...prev, ...data.data]);
        }
        setPage(pageNum);
        setHasMore(
          data.pagination
            ? pageNum < data.pagination.totalPages
            : data.data.length === 20
        );
      } else {
        // API returned but no data — probably no payments yet
        if (pageNum === 1) {
          setPayments([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Payment fetch timed out");
      } else {
        console.error("Error fetching payments:", error);
      }
      // Don't leave in loading state on error
      if (pageNum === 1) {
        setPayments([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPayments(1, false);
  }, []);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchPayments(page + 1, false);
  };

  const handleAddPayment = () => {
    // Refresh list after successful payment
    fetchPayments(1, false);
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "paid":
        return styles.paid;
      case "pending":
        return styles.pending;
      case "failed":
      case "cancelled":
        return styles.failed;
      default:
        return styles.pending;
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "Paid";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return status || "Unknown";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("en-PH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const renderPayment = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.ref}>{item.reference_no}</Text>
        <Text style={styles.amount}>₱{parseFloat(item.amount).toFixed(2)}</Text>
      </View>
      <Text style={styles.meta}>
        {item.vendor_name}
        {item.vendor_identifier ? ` • ${item.vendor_identifier}` : ""}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.status, getStatusStyle(item.status)]}>
          {getStatusLabel(item.status)}
        </Text>
        <Text style={styles.date}>{formatDate(item.time_date)}</Text>
      </View>
    </View>
  );

  const Header = () => (
    <View style={styles.headerRow}>
      <Text style={styles.title}>Payments</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh-outline" size={18} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Add Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const Footer = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      );
    }
    return <View style={{ height: 32 }} />;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.receipt_id)}
        renderItem={renderPayment}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add Payment" to record a collection
            </Text>
          </View>
        )}
        contentContainerStyle={styles.content}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
      />

      <AddPaymentForm
        visible={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddPayment}
        collectorName={collectorName}
        autoOpenScanner={autoOpenQR}
        preSelectedVendor={preSelectedVendor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 8,
    borderRadius: 6,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  separator: {
    height: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ref: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
  },
  meta: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
    color: "#fff",
  },
  paid: { backgroundColor: "#16a34a" },
  pending: { backgroundColor: "#f59e0b" },
  failed: { backgroundColor: "#ef4444" },
  date: {
    fontSize: 12,
    color: "#6b7280",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});

export default PaymentScreen;
