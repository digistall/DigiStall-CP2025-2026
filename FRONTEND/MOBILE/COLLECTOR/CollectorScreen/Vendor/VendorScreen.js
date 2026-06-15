import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API_CONFIG, NetworkUtils } from "../../../config/shared/networkConfig";
import UserStorageService from "../../../services/UserStorageService";

const { width } = Dimensions.get("window");

// ── Status helpers ──────────────────────────────────────────────────────────
const getStatusStyle = (status) => {
  switch (status) {
    case "Paid":
      return { bg: "#d1fae5", text: "#059669" };
    case "Unpaid":
      return { bg: "#fee2e2", text: "#dc2626" };
    case "Pending":
      return { bg: "#fef3c7", text: "#d97706" };
    default:
      return { bg: "#f3f4f6", text: "#6b7280" };
  }
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ── Component ───────────────────────────────────────────────────────────────
const VendorScreen = ({ onPayVendor }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [assignedLocation, setAssignedLocation] = useState("Loading...");
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const userData = await UserStorageService.getUserData();
      const token = userData?.token;
      const server = await NetworkUtils.getActiveServer();

      const headers = { ...API_CONFIG.HEADERS };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${server}/api/payments/daily/vendors`, {
        method: "GET",
        headers,
      });
      const data = await response.json();

      if (data.success && data.data) {
        const mapped = data.data.map((v) => ({
          id: String(v.vendor_id),
          vendorName: v.vendor_name,
          businessName: v.business_name || "N/A",
          vendorIdentifier: v.vendor_identifier || null,
          paymentStatus: v.payment_status || "Unpaid",
        }));
        setVendors(mapped);

        // Try to get assigned location from staff data
        const staff = userData?.staff;
        if (staff?.assigned_location || staff?.location_name) {
          setAssignedLocation(
            staff.assigned_location || staff.location_name
          );
        } else {
          setAssignedLocation("All Locations");
        }
      }
    } catch (error) {
      console.error("Error loading vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVendors().finally(() => setRefreshing(false));
  }, []);

  // Filter + search
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      searchQuery.length === 0 ||
      v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.vendorIdentifier || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "All" || v.paymentStatus === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const filters = ["All", "Paid", "Unpaid", "Pending"];

  // Counts
  const paidCount = vendors.filter((v) => v.paymentStatus === "Paid").length;
  const unpaidCount = vendors.filter((v) => v.paymentStatus === "Unpaid").length;

  // ── Render vendor card ──────────────────────────────────────────────────
  const renderVendorCard = ({ item }) => {
    const status = getStatusStyle(item.paymentStatus);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          if (onPayVendor && item.paymentStatus !== "Paid") {
            onPayVendor({
              vendor_id: item.id,
              vendor_name: item.vendorName,
              vendor_identifier: item.vendorIdentifier,
            });
          }
        }}
      >
        <View style={styles.cardHeader}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(item.vendorName)}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.headerInfo}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {item.vendorName}
            </Text>
            <View style={styles.businessRow}>
              <Ionicons name="storefront-outline" size={13} color="#6b7280" />
              <Text style={styles.businessName} numberOfLines={1}>
                {item.businessName}
              </Text>
            </View>
            {item.vendorIdentifier && (
              <View style={styles.identifierRow}>
                <Ionicons name="card-outline" size={12} color="#9ca3af" />
                <Text style={styles.identifierText}>
                  {item.vendorIdentifier}
                </Text>
              </View>
            )}
          </View>

          {/* Status badge + pay indicator */}
          <View style={styles.cardActions}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>
                {item.paymentStatus}
              </Text>
            </View>
            {item.paymentStatus !== "Paid" && onPayVendor && (
              <View style={styles.payHint}>
                <Ionicons name="cash-outline" size={14} color="#059669" />
                <Text style={styles.payHintText}>Tap to pay</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── List header (location + search + filters) ──────────────────────────
  const ListHeader = () => (
    <View>
      {/* Assigned Location Banner */}
      <LinearGradient
        colors={["#10b981", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.locationBanner}
      >
        <View style={styles.locationIconWrap}>
          <Ionicons name="location" size={22} color="#ffffff" />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Assigned Location</Text>
          <Text style={styles.locationName}>{assignedLocation}</Text>
        </View>
        <View style={styles.locationStats}>
          <Text style={styles.locationStatValue}>{vendors.length}</Text>
          <Text style={styles.locationStatLabel}>Vendors</Text>
        </View>
      </LinearGradient>

      {/* Quick stats row */}
      <View style={styles.quickStats}>
        <View style={[styles.quickStatCard, { backgroundColor: "#d1fae5" }]}>
          <Ionicons name="checkmark-circle" size={18} color="#059669" />
          <Text style={[styles.quickStatValue, { color: "#059669" }]}>
            {paidCount}
          </Text>
          <Text style={styles.quickStatLabel}>Paid</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: "#fee2e2" }]}>
          <Ionicons name="close-circle" size={18} color="#dc2626" />
          <Text style={[styles.quickStatValue, { color: "#dc2626" }]}>
            {unpaidCount}
          </Text>
          <Text style={styles.quickStatLabel}>Unpaid</Text>
        </View>
      </View>

      {/* Section title */}
      <Text style={styles.sectionTitle}>Vendors on Location</Text>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendor, business, or ID..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const isActive = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {filteredVendors.length}{" "}
        {filteredVendors.length === 1 ? "vendor" : "vendors"} found
      </Text>
    </View>
  );

  // ── Empty state ─────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyText}>No vendors found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery.length > 0 || activeFilter !== "All"
          ? "Try adjusting your search or filter"
          : "Vendors will appear here once assigned"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading vendors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.id}
        renderItem={renderVendorCard}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        ListFooterComponent={<View style={{ height: 24 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#10b981"]}
            tintColor="#10b981"
          />
        }
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
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
  listContent: {
    padding: width * 0.04,
    paddingBottom: 32,
  },

  /* Location Banner */
  locationBanner: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  locationName: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "700",
    marginTop: 2,
  },
  locationStats: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  locationStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  locationStatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },

  /* Quick Stats */
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },

  /* Section */
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },

  /* Search */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#1f2937",
    paddingVertical: 0,
  },

  /* Filters */
  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },

  /* Results */
  resultsCount: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 12,
  },

  /* Vendor Card */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  businessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  businessName: {
    fontSize: 13,
    color: "#6b7280",
    flexShrink: 1,
  },
  identifierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  identifierText: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
  },
  cardActions: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  payHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  payHintText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },

  /* Empty */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    backgroundColor: "#ffffff",
    borderRadius: 16,
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

export default VendorScreen;
