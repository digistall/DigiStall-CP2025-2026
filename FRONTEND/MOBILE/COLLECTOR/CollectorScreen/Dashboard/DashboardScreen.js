import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import UserStorageService from "../../../services/UserStorageService";
import { API_CONFIG, NetworkUtils } from "../../../config/shared/networkConfig";

const { width } = Dimensions.get("window");

// ── Status badge helper ─────────────────────────────────────────────────────
const getStatusStyle = (status) => {
  switch (status) {
    case "Paid":
    case "completed":
      return { bg: "#d1fae5", text: "#059669", icon: "checkmark-circle" };
    case "Pending":
    case "pending":
      return { bg: "#fef3c7", text: "#d97706", icon: "time" };
    case "Failed":
    case "failed":
    case "cancelled":
      return { bg: "#fee2e2", text: "#dc2626", icon: "close-circle" };
    default:
      return { bg: "#f3f4f6", text: "#6b7280", icon: "help-circle" };
  }
};

// ── Dashboard Screen ────────────────────────────────────────────────────────
const DashboardScreen = ({ onNavigate, theme, isDarkMode }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collectorName, setCollectorName] = useState("Collector");
  const [stats, setStats] = useState({
    paymentsCollected: 0,
    missingPayments: 0,
    vendorPaid: 0,
    unpaidVendors: 0,
  });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadCollectorName(), fetchDashboardData()]);
    setLoading(false);
  };

  const loadCollectorName = async () => {
    try {
      const userData = await UserStorageService.getUserData();
      const staff = userData?.staff;
      if (staff) {
        const name =
          staff.fullname ||
          staff.name ||
          `${staff.first_name || ""} ${staff.last_name || ""}`.trim();
        if (name) setCollectorName(name);
      }
    } catch (error) {
      console.error("Error loading collector name:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const userData = await UserStorageService.getUserData();
      const token = userData?.token;
      const server = await NetworkUtils.getActiveServer();

      const headers = { ...API_CONFIG.HEADERS };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch recent payments for dashboard
      const response = await fetch(
        `${server}/api/collector/daily-payments?page=1&limit=5`,
        { method: "GET", headers }
      );
      const data = await response.json();

      if (data.success && data.data) {
        setTransactions(data.data);

        // Calculate stats from all payments
        const totalCount = data.pagination?.totalRecords || data.data.length;
        const paidCount = data.data.filter(
          (p) => p.status?.toLowerCase() === "completed"
        ).length;
        const pendingCount = data.data.filter(
          (p) => p.status?.toLowerCase() === "pending"
        ).length;

        setStats({
          paymentsCollected: totalCount,
          missingPayments: pendingCount,
          vendorPaid: paidCount,
          unpaidVendors: data.data.length - paidCount,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getFirstName = () => {
    return collectorName.split(" ")[0];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("en-PH", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── Stats card definitions ──────────────────────────────────────────────
  const statsData = [
    {
      id: "payments_collected",
      title: "Collections",
      value: stats.paymentsCollected.toString(),
      icon: "cash",
      color: "#10b981",
      bgColor: "#d1fae5",
    },
    {
      id: "missing_payments",
      title: "Pending",
      value: stats.missingPayments.toString(),
      icon: "alert-circle",
      color: "#ef4444",
      bgColor: "#fee2e2",
    },
    {
      id: "vendor_paid",
      title: "Vendor Paid",
      value: stats.vendorPaid.toString(),
      icon: "checkmark-done-circle",
      color: "#3b82f6",
      bgColor: "#dbeafe",
    },
    {
      id: "unpaid_vendors",
      title: "Unpaid",
      value: stats.unpaidVendors.toString(),
      icon: "warning",
      color: "#f59e0b",
      bgColor: "#fef3c7",
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#10b981"]}
          tintColor="#10b981"
        />
      }
    >
      {/* ── Welcome Card ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={["#10b981", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeCard}
      >
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
          <Text style={styles.welcomeName}>{getFirstName()}! 💰</Text>
          <Text style={styles.welcomeSubtext}>
            Here's a summary of today's payment activity.
          </Text>
        </View>
        <View style={styles.welcomeIconContainer}>
          <Ionicons name="wallet" size={80} color="rgba(255,255,255,0.2)" />
        </View>
      </LinearGradient>

      {/* ── Stats Cards ──────────────────────────────────────────────── */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {statsData.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: stat.bgColor },
                ]}
              >
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>
                {loading ? "..." : stat.value}
              </Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Quick Tools ──────────────────────────────────────────────── */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quick Tools</Text>

        {/* Scan QR Code Button */}
        <TouchableOpacity
          style={[styles.quickToolButton, { marginBottom: 12 }]}
          activeOpacity={0.85}
          onPress={() => onNavigate && onNavigate("scanQR")}
        >
          <LinearGradient
            colors={["#10b981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.quickToolGradient}
          >
            <View style={styles.quickToolIconWrap}>
              <Ionicons name="qr-code" size={28} color="#ffffff" />
            </View>
            <View style={styles.quickToolTextWrap}>
              <Text style={styles.quickToolTitle}>Scan QR Code</Text>
              <Text style={styles.quickToolSubtitle}>
                Scan vendor QR for quick payment
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color="rgba(255,255,255,0.7)"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Add Daily Payment Button */}
        <TouchableOpacity
          style={styles.quickToolButton}
          activeOpacity={0.85}
          onPress={() => onNavigate && onNavigate("payment")}
        >
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.quickToolGradient}
          >
            <View style={styles.quickToolIconWrap}>
              <Ionicons name="add-circle" size={28} color="#ffffff" />
            </View>
            <View style={styles.quickToolTextWrap}>
              <Text style={styles.quickToolTitle}>Add Daily Payment</Text>
              <Text style={styles.quickToolSubtitle}>
                Record a new payment transaction
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color="rgba(255,255,255,0.7)"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Recent Transactions ──────────────────────────────────────── */}
      <View style={[styles.sectionContainer, styles.lastSection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate("payment")}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactions.length > 0 ? (
          transactions.map((txn) => {
            const statusStyle = getStatusStyle(txn.status);
            return (
              <View key={txn.receipt_id} style={styles.txnCard}>
                {/* Row 1 – Reference & Status */}
                <View style={styles.txnRow}>
                  <Text style={styles.txnReference} numberOfLines={1}>
                    {txn.reference_no}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Ionicons
                      name={statusStyle.icon}
                      size={14}
                      color={statusStyle.text}
                    />
                    <Text
                      style={[styles.statusText, { color: statusStyle.text }]}
                    >
                      {txn.status}
                    </Text>
                  </View>
                </View>

                {/* Row 2 – Vendor & Amount */}
                <View style={styles.txnMetaRow}>
                  <View style={styles.txnMeta}>
                    <Ionicons name="storefront" size={14} color="#6b7280" />
                    <Text style={styles.txnMetaText} numberOfLines={1}>
                      {txn.vendor_name}
                    </Text>
                  </View>
                  <Text style={styles.txnAmount}>
                    ₱{parseFloat(txn.amount).toFixed(2)}
                  </Text>
                </View>

                {/* Row 3 – Date */}
                <View style={styles.txnFooter}>
                  <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                  <Text style={styles.txnDate}>
                    {formatDate(txn.time_date)}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No recent transactions</Text>
            <Text style={styles.emptySubtext}>
              Payment records will appear here
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD_WIDTH = (width - width * 0.12) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  /* Welcome */
  welcomeCard: {
    margin: width * 0.04,
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
  },
  welcomeContent: {
    flex: 1,
    paddingRight: 16,
  },
  welcomeGreeting: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  welcomeName: {
    fontSize: 28,
    color: "#ffffff",
    fontWeight: "700",
    marginTop: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
    lineHeight: 20,
  },
  welcomeIconContainer: {
    position: "absolute",
    right: -10,
    bottom: -10,
    opacity: 0.3,
  },

  /* Sections */
  sectionContainer: {
    paddingHorizontal: width * 0.04,
    marginBottom: 16,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
    marginBottom: 16,
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  statTitle: {
    fontSize: 12,
    marginTop: 4,
    color: "#6b7280",
  },

  /* Quick Tools */
  quickToolButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickToolGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  quickToolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  quickToolTextWrap: {
    flex: 1,
  },
  quickToolTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  quickToolSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  /* Transaction Cards */
  txnCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  txnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  txnReference: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
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
  txnMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  txnMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  txnMetaText: {
    fontSize: 13,
    color: "#6b7280",
    flexShrink: 1,
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  txnFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
  },
  txnDate: {
    fontSize: 12,
    color: "#9ca3af",
  },

  /* Loading / Empty */
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    color: "#6b7280",
  },
  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "center",
  },
});

export default DashboardScreen;
