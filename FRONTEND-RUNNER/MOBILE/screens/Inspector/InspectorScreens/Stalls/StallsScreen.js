import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../components/ThemeComponents/ThemeContext";
import ApiService from "../../../../services/ApiService";

const { width, height } = Dimensions.get("window");

const SentReportsScreen = ({ onSelectReport }) => {
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getInspectorSentReports();
      
      if (response.success) {
        setReports(response.data || []);
      } else {
        Alert.alert('Error', response.message || 'Failed to load reports');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load sent reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports().finally(() => setRefreshing(false));
  }, []);

  const filters = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "resolved", label: "Resolved" },
    { id: "paid", label: "Paid" },
  ];

  const filteredReports = reports.filter((item) => {
    const matchesSearch = 
      (item.receipt_number && item.receipt_number.toString().includes(searchQuery)) ||
      (item.stallholder_name && item.stallholder_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.violation_name && item.violation_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.stall_no && item.stall_no.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = 
      selectedFilter === "all" ||
      (selectedFilter === "open" && item.status === "Open") ||
      (selectedFilter === "resolved" && item.status === "Resolved") ||
      (selectedFilter === "paid" && item.payment_status === "Paid");
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return { bg: "#fef3c7", text: "#d97706", icon: "alert-circle" };
      case "Resolved":
        return { bg: "#d1fae5", text: "#059669", icon: "checkmark-circle" };
      case "Closed":
        return { bg: "#f3f4f6", text: "#6b7280", icon: "close-circle" };
      default:
        return { bg: "#dbeafe", text: "#1d4ed8", icon: "document-text" };
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case "Paid":
        return { bg: "#d1fae5", text: "#059669", icon: "cash" };
      case "Unpaid":
        return { bg: "#fee2e2", text: "#dc2626", icon: "close-circle" };
      case "Partial":
        return { bg: "#fef3c7", text: "#d97706", icon: "time" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", icon: "help-circle" };
    }
  };

  const renderReportCard = ({ item }) => {
    const statusColors = getStatusColor(item.status);
    const paymentColors = getPaymentStatusColor(item.payment_status);
    const reportDate = new Date(item.report_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.card }]}
        onPress={() => onSelectReport && onSelectReport(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.stallBadge, { backgroundColor: '#f59e0b' }]}>
            <Ionicons name="receipt" size={20} color="#ffffff" />
            <Text style={styles.stallBadgeText}>#{item.receipt_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Ionicons name={statusColors.icon} size={14} color={statusColors.text} />
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {reportDate}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="warning-outline" size={16} color="#dc2626" />
            <Text style={[styles.detailText, { color: theme.colors.text, fontWeight: '600' }]}>
              {item.violation_name}
            </Text>
          </View>
          {item.stall_no && (
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                Stall {item.stall_no}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardDivider} />
        
        <View style={styles.stallholderSection}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
            STALLHOLDER
          </Text>
          <View style={styles.stallholderInfo}>
            <View style={[styles.miniAvatar, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.miniAvatarText}>
                {item.stallholder_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.stallholderDetails}>
              <Text style={[styles.stallholderName, { color: theme.colors.text }]}>
                {item.stallholder_name}
              </Text>
              <Text style={[styles.businessType, { color: theme.colors.textSecondary }]}>
                ID: {item.stallholder_id}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.penaltyRow}>
          <View style={styles.penaltyInfo}>
            <Text style={[styles.penaltyLabel, { color: theme.colors.textSecondary }]}>
              Penalty Amount
            </Text>
            <Text style={[styles.penaltyAmount, { color: '#dc2626' }]}>
              ₱{item.penalty_amount ? parseFloat(item.penalty_amount).toLocaleString() : '0'}
            </Text>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: paymentColors.bg }]}>
            <Ionicons name={paymentColors.icon} size={14} color={paymentColors.text} />
            <Text style={[styles.paymentText, { color: paymentColors.text }]}>
              {item.payment_status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search receipt, violation, or stallholder..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive,
              { backgroundColor: selectedFilter === filter.id ? '#f59e0b' : theme.colors.card }
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === filter.id ? '#ffffff' : theme.colors.textSecondary }
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Count */}
      <Text style={[styles.resultsCount, { color: theme.colors.textSecondary }]}>
        {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Reports Found</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {searchQuery ? "Try adjusting your search or filters" : "You haven't submitted any violation reports yet"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredReports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.report_id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#f59e0b']}
            tintColor="#f59e0b"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: width * 0.04,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    shadowColor: '#f59e0b',
    shadowOpacity: 0.3,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  stallBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  stallholderSection: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stallholderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  miniAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  stallholderDetails: {
    flex: 1,
  },
  stallholderName: {
    fontSize: 14,
    fontWeight: '600',
  },
  businessType: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  penaltyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  penaltyInfo: {
    flex: 1,
  },
  penaltyLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  penaltyAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SentReportsScreen;
