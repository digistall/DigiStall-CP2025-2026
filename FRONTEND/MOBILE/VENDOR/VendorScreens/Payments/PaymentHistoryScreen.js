import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../components/ThemeComponents/ThemeContext";
import ApiService from "../../../services/ApiService";
import UserStorageService from "../../../services/UserStorageService";

const { width } = Dimensions.get("window");

// ── Status badge helper ─────────────────────────────────────────────────────
const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "paid":
      return { bg: "#d1fae5", text: "#059669", icon: "checkmark-circle", label: "Paid" };
    case "missing":
      return { bg: "#fee2e2", text: "#dc2626", icon: "close-circle", label: "Missing" };
    case "pending":
      return { bg: "#fef3c7", text: "#d97706", icon: "time", label: "Pending" };
    default:
      return { bg: "#f3f4f6", text: "#6b7280", icon: "help-circle", label: status || "Unknown" };
  }
};

const PaymentHistoryScreen = () => {
  const { theme } = useTheme();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [vendorId, setVendorId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    initLoad();
  }, []);

  const initLoad = async () => {
    try {
      const userData = await UserStorageService.getUserData();
      const vid = userData?.vendor?.vendor_id;
      if (vid) {
        setVendorId(vid);
        await Promise.all([fetchPayments(vid, 1, true), fetchSummary(vid)]);
      }
    } catch (error) {
      console.error("Error initializing payment history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (vid) => {
    try {
      const response = await ApiService.getVendorPaymentSummary(vid);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error("Error fetching payment summary:", error);
    }
  };

  const fetchPayments = async (vid, pageNum = 1, isInitial = false) => {
    try {
      const response = await ApiService.getVendorPayments(vid, pageNum, 20);
      if (response.success && response.data) {
        if (pageNum === 1) {
          setPayments(response.data);
        } else {
          setPayments((prev) => [...prev, ...response.data]);
        }
        setPage(pageNum);
        setHasMore(
          response.pagination
            ? pageNum < response.pagination.totalPages
            : response.data.length === 20
        );
      } else {
        if (pageNum === 1) setPayments([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      if (pageNum === 1) setPayments([]);
      setHasMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    if (!vendorId) return;
    setRefreshing(true);
    await Promise.all([fetchPayments(vendorId, 1, false), fetchSummary(vendorId)]);
    setRefreshing(false);
  }, [vendorId]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || !vendorId) return;
    setLoadingMore(true);
    fetchPayments(vendorId, page + 1, false).finally(() => setLoadingMore(false));
  };

  const filters = ["All", "Paid", "Missing"];

  const filteredPayments = payments.filter((p) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Paid") return p.status?.toLowerCase() === "completed";
    if (activeFilter === "Missing") return p.status?.toLowerCase() === "missing";
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("en-PH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── Render payment card ─────────────────────────────────────────────────
  const renderPaymentCard = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View style={[styles.paymentCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardRow}>
          <Text style={[styles.refNo, { color: theme.colors.text }]} numberOfLines={1}>
            {item.reference_no}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.collector_name}
            </Text>
          </View>
          <Text style={[styles.amount, { color: item.status === "missing" ? "#dc2626" : "#059669" }]}>
            {item.status === "missing" ? "Missing" : `₱${item.amount.toFixed(2)}`}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
          <Text style={styles.dateText}>{formatDate(item.time_date)}</Text>
        </View>
      </View>
    );
  };

  // ── Summary Header ──────────────────────────────────────────────────────
  const ListHeader = () => (
    <View>
      {/* Today's Status Card */}
      <LinearGradient
        colors={
          summary?.today?.hasPaid
            ? ["#10b981", "#059669"]
            : ["#f59e0b", "#d97706"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.todayCard}
      >
        <View style={styles.todayContent}>
          <Text style={styles.todayLabel}>Today's Payment</Text>
          <Text style={styles.todayStatus}>
            {summary?.today?.hasPaid
              ? `₱${summary.today.amount.toFixed(2)} — Paid`
              : summary?.today?.status === "missing"
                ? "Marked Missing"
                : "Not Yet Collected"}
          </Text>
          <Text style={styles.todayHint}>
            {summary?.today?.hasPaid
              ? "Your daily fee has been collected."
              : "The collector has not recorded your payment yet."}
          </Text>
        </View>
        <Ionicons
          name={summary?.today?.hasPaid ? "checkmark-circle" : "time"}
          size={56}
          color="rgba(255,255,255,0.3)"
        />
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statValue, { color: "#1d4ed8" }]}>
            {summary?.thisMonth?.totalPayments || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            This Month
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statValue, { color: "#059669" }]}>
            ₱{(summary?.thisMonth?.totalAmount || 0).toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Monthly Total
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statValue, { color: "#dc2626" }]}>
            {summary?.thisMonth?.missingCount || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Missed
          </Text>
        </View>
      </View>

      {/* Section title + filter */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Payment History
      </Text>

      <View style={styles.filterRow}>
        {filters.map((f) => {
          const isActive = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
                { backgroundColor: isActive ? "#1d4ed8" : theme.colors.card },
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                  { color: isActive ? "#ffffff" : theme.colors.textSecondary },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading payment history...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => String(item.receipt_id)}
        renderItem={renderPaymentCard}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={() => (
          <View style={[styles.emptyContainer, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No payment records found
            </Text>
            <Text style={[styles.emptySubtext, { color: "#9ca3af" }]}>
              Your payment history will appear here once the collector records transactions.
            </Text>
          </View>
        )}
        ListFooterComponent={() =>
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#1d4ed8" />
            </View>
          ) : (
            <View style={{ height: 32 }} />
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1d4ed8"]}
            tintColor="#1d4ed8"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
      />
    </View>
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
  },
  listContent: {
    padding: width * 0.04,
    paddingBottom: 32,
  },

  /* Today's card */
  todayCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  todayContent: {
    flex: 1,
    paddingRight: 12,
  },
  todayLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  todayStatus: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "700",
    marginTop: 4,
  },
  todayHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
    lineHeight: 18,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },

  /* Section title */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  /* Filters */
  filterRow: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    borderColor: "#1d4ed8",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },

  /* Payment card */
  paymentCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refNo: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 13,
    flexShrink: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: "#9ca3af",
  },

  /* Empty */
  emptyContainer: {
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },

  /* Footer */
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});

export default PaymentHistoryScreen;
