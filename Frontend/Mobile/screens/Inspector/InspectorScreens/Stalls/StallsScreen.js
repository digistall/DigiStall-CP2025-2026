import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../StallHolder/StallScreen/Settings/components/ThemeComponents/ThemeContext";

const { width, height } = Dimensions.get("window");

// Mock data for stalls (frontend only)
const mockStalls = [
  {
    stall_id: 1,
    stall_no: "A-001",
    stall_location: "Ground Floor, Section A",
    branch_name: "Naga City Public Market",
    floor_name: "Ground Floor",
    section_name: "Section A",
    stall_status: "Occupied",
    stallholder_name: "Juan Dela Cruz",
    business_type: "Dry Goods",
    rental_price: 5000,
    stall_size: "2x3 meters",
  },
  {
    stall_id: 2,
    stall_no: "A-002",
    stall_location: "Ground Floor, Section A",
    branch_name: "Naga City Public Market",
    floor_name: "Ground Floor",
    section_name: "Section A",
    stall_status: "Vacant",
    stallholder_name: null,
    business_type: null,
    rental_price: 4500,
    stall_size: "2x2 meters",
  },
  {
    stall_id: 3,
    stall_no: "B-015",
    stall_location: "Ground Floor, Section B",
    branch_name: "Naga City Public Market",
    floor_name: "Ground Floor",
    section_name: "Section B",
    stall_status: "Occupied",
    stallholder_name: "Maria Santos",
    business_type: "Wet Market - Fish",
    rental_price: 6000,
    stall_size: "3x3 meters",
  },
  {
    stall_id: 4,
    stall_no: "B-016",
    stall_location: "Ground Floor, Section B",
    branch_name: "Naga City Public Market",
    floor_name: "Ground Floor",
    section_name: "Section B",
    stall_status: "Under Maintenance",
    stallholder_name: null,
    business_type: null,
    rental_price: 5500,
    stall_size: "3x2 meters",
  },
  {
    stall_id: 5,
    stall_no: "C-022",
    stall_location: "2nd Floor, Section C",
    branch_name: "Naga City Public Market",
    floor_name: "2nd Floor",
    section_name: "Section C",
    stall_status: "Occupied",
    stallholder_name: "Pedro Reyes",
    business_type: "Cooked Food",
    rental_price: 7000,
    stall_size: "4x3 meters",
  },
  {
    stall_id: 6,
    stall_no: "C-023",
    stall_location: "2nd Floor, Section C",
    branch_name: "Naga City Public Market",
    floor_name: "2nd Floor",
    section_name: "Section C",
    stall_status: "Vacant",
    stallholder_name: null,
    business_type: null,
    rental_price: 6500,
    stall_size: "3x3 meters",
  },
];

const StallsScreen = ({ onSelectStall }) => {
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stalls, setStalls] = useState(mockStalls);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const filters = [
    { id: "all", label: "All" },
    { id: "occupied", label: "Occupied" },
    { id: "vacant", label: "Vacant" },
    { id: "maintenance", label: "Maintenance" },
  ];

  const filteredStalls = stalls.filter((item) => {
    const matchesSearch = 
      item.stall_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.stall_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.stallholder_name && item.stallholder_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.business_type && item.business_type.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = 
      selectedFilter === "all" ||
      (selectedFilter === "occupied" && item.stall_status === "Occupied") ||
      (selectedFilter === "vacant" && item.stall_status === "Vacant") ||
      (selectedFilter === "maintenance" && item.stall_status === "Under Maintenance");
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Occupied":
        return { bg: "#dbeafe", text: "#1d4ed8", icon: "checkmark-circle" };
      case "Vacant":
        return { bg: "#d1fae5", text: "#059669", icon: "add-circle" };
      case "Under Maintenance":
        return { bg: "#fef3c7", text: "#d97706", icon: "construct" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", icon: "help-circle" };
    }
  };

  const renderStallCard = ({ item }) => {
    const statusColors = getStatusColor(item.stall_status);
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.card }]}
        onPress={() => onSelectStall && onSelectStall(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.stallBadge, { backgroundColor: '#f59e0b' }]}>
            <Ionicons name="business" size={20} color="#ffffff" />
            <Text style={styles.stallBadgeText}>{item.stall_no}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Ionicons name={statusColors.icon} size={14} color={statusColors.text} />
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.stall_status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {item.stall_location}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="resize-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              Size: {item.stall_size}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              ₱{item.rental_price.toLocaleString()}/month
            </Text>
          </View>
        </View>

        {item.stall_status === "Occupied" && (
          <>
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
                    {item.business_type}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => onSelectStall && onSelectStall(item, 'report')}
            >
              <Ionicons name="document-text-outline" size={18} color="#f59e0b" />
              <Text style={styles.reportButtonText}>Report Violation</Text>
            </TouchableOpacity>
          </>
        )}
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
          placeholder="Search stall, location, or stallholder..."
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
        {filteredStalls.length} stall{filteredStalls.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="business-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Stalls Found</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {searchQuery ? "Try adjusting your search or filters" : "Pull down to refresh"}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredStalls}
        renderItem={renderStallCard}
        keyExtractor={(item) => item.stall_id.toString()}
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
});

export default StallsScreen;
