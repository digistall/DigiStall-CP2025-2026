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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shared-mobile/COMPONENTS/ThemeComponents/ThemeContext";
import ApiService from "@employee-mobile/SERVICES/ApiService";

const { width, height } = Dimensions.get("window");

// Mock data for stallholders (frontend only)
const mockStallholders = [
  {
    stallholder_id: 1,
    stallholder_name: "Juan Dela Cruz",
    stall_no: "A-001",
    branch_name: "Naga City Public Market",
    business_type: "Dry Goods",
    compliance_status: "Compliant",
    contact_number: "09123456789",
    stall_location: "Ground Floor, Section A",
  },
  {
    stallholder_id: 2,
    stallholder_name: "Maria Santos",
    stall_no: "B-015",
    branch_name: "Naga City Public Market",
    business_type: "Wet Market - Fish",
    compliance_status: "Non-Compliant",
    contact_number: "09987654321",
    stall_location: "Ground Floor, Section B",
  },
  {
    stallholder_id: 3,
    stallholder_name: "Pedro Reyes",
    stall_no: "C-022",
    branch_name: "Naga City Public Market",
    business_type: "Cooked Food",
    compliance_status: "Compliant",
    contact_number: "09456789123",
    stall_location: "2nd Floor, Section C",
  },
  {
    stallholder_id: 4,
    stallholder_name: "Ana Garcia",
    stall_no: "A-010",
    branch_name: "Naga City Public Market",
    business_type: "Clothing",
    compliance_status: "Compliant",
    contact_number: "09789123456",
    stall_location: "Ground Floor, Section A",
  },
  {
    stallholder_id: 5,
    stallholder_name: "Carlos Mendoza",
    stall_no: "B-003",
    branch_name: "Naga City Public Market",
    business_type: "Wet Market - Meat",
    compliance_status: "Non-Compliant",
    contact_number: "09321654987",
    stall_location: "Ground Floor, Section B",
  },
];

const StallholdersScreen = ({ onSelectStallholder }) => {
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stallholders, setStallholders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [error, setError] = useState(null);

  // Load stallholders on component mount
  useEffect(() => {
    loadStallholders();
  }, []);

  const loadStallholders = async () => {
    try {
      console.log('📋 Loading stallholders...');
      setError(null);
      
      const response = await ApiService.getInspectorStallholders();
      
      if (response.success) {
        console.log('✅ Stallholders loaded:', response.count);
        setStallholders(response.data || []);
      } else {
        console.error('❌ Failed to load stallholders:', response.message);
        setError(response.message);
      }
    } catch (error) {
      console.error('❌ Error loading stallholders:', error);
      setError('Failed to load stallholders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStallholders();
  }, []);

  const filters = [
    { id: "all", label: "All" },
    { id: "compliant", label: "Compliant" },
    { id: "non-compliant", label: "Non-Compliant" },
  ];

  const filteredStallholders = stallholders.filter((item) => {
    const matchesSearch = 
      (item.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.stall_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.contact_number?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      selectedFilter === "all" ||
      (selectedFilter === "compliant" && item.compliance_status === "Compliant") ||
      (selectedFilter === "non-compliant" && item.compliance_status === "Non-Compliant");
    
    return matchesSearch && matchesFilter;
  });

  const getComplianceColor = (status) => {
    switch (status) {
      case "Compliant":
        return { bg: "#d1fae5", text: "#059669" };
      case "Non-Compliant":
        return { bg: "#fee2e2", text: "#dc2626" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  const renderStallholderCard = ({ item }) => {
    const complianceColors = getComplianceColor(item.compliance_status);
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.card }]}
        onPress={() => onSelectStallholder && onSelectStallholder(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.avatarText}>
                {(item.full_name || 'N/A').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </Text>
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.stallholderName, { color: theme.colors.text }]}>
              {item.full_name || 'Unknown Stallholder'}
            </Text>
            <Text style={[styles.businessType, { color: theme.colors.textSecondary }]}>
              {item.email || 'No email'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: complianceColors.bg }]}>
            <Text style={[styles.statusText, { color: complianceColors.text }]}>
              {item.compliance_status}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              Stall: {item.stall_number || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {item.branch_name || 'Unknown Branch'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {item.contact_number || 'No contact'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => onSelectStallholder && onSelectStallholder(item, 'report')}
        >
          <Ionicons name="document-text-outline" size={18} color="#f59e0b" />
          <Text style={styles.reportButtonText}>Report Violation</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Header component moved outside FlatList to prevent keyboard dismissal

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={[styles.emptyTitle, { color: theme.colors.text, marginTop: 16 }]}>
            Loading Stallholders...
          </Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Error Loading Data</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadStallholders}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Stallholders Found</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          {searchQuery ? "Try adjusting your search or filters" : "Pull down to refresh"}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar - Outside FlatList to prevent keyboard dismissal */}
      <View style={styles.headerContainer}>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search stallholder, stall, or business..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
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
          {filteredStallholders.length} stallholder{filteredStallholders.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <FlatList
        data={filteredStallholders}
        renderItem={renderStallholderCard}
        keyExtractor={(item) => item.stallholder_id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: width * 0.04,
    paddingBottom: 32,
  },
  headerContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: width * 0.04,
    paddingBottom: 8,
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
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
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
    fontSize: 14,
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
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  stallholderName: {
    fontSize: 16,
    fontWeight: '700',
  },
  businessType: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  cardDetails: {
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
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  reportButtonText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
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
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StallholdersScreen;
