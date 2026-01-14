import { useState, useMemo, useEffect } from "react";
import { ScrollView, StyleSheet, Dimensions, Text, View, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../Settings/components/ThemeComponents/ThemeContext";
import AuctionCard from "./Components/AuctionCardComponents/AuctionCard";
import SearchFilterBar from "../Stall/components/SearchFilter/SearchFilterBar";
import AuctionReminderModal from "../Auction/Components/AuctionReminderComponent/AuctionReminderModal";
import { AuctionTimings } from "./Components/shared/constants";
import UserStorageService from "../../../../services/UserStorageService";
import ApiService from "../../../../services/ApiService";

const { width } = Dimensions.get("window");

const AuctionScreen = () => {
  const { theme } = useTheme();
  const [showReminder, setShowReminder] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedSort, setSelectedSort] = useState("default");
  const [auctionStallsData, setAuctionStallsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableFilters, setAvailableFilters] = useState(['ALL', 'PRE-REGISTERED']); // Dynamic filters

  const [preRegisteredStalls, setPreRegisteredStalls] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load auction stalls on component mount
  useEffect(() => {
    loadAuctionStalls();
  }, []);

  const loadAuctionStalls = async () => {
    try {
      setLoading(true);
      
      // Get user data from storage
      const userData = await UserStorageService.getUserData();
      console.log('🔍 User Data:', userData ? 'Found' : 'Not Found');
      
      if (!userData || !userData.user) {
        Alert.alert('Error', 'User not logged in. Please login again.');
        setAuctionStallsData([]);
        return;
      }
      
      const applicantId = userData.user.applicant_id;
      console.log('👤 Applicant ID:', applicantId);
      
      // Fetch auction stalls from backend API
      console.log('🔄 Fetching auction stalls...');
      const response = await ApiService.getStallsByType('Auction', applicantId);
      
      console.log('📦 API Response:', {
        success: response.success,
        totalCount: response.data?.total_count,
        stallsLength: response.data?.stalls?.length,
        message: response.message
      });
      
      if (response.success && response.data.stalls && response.data.stalls.length > 0) {
        console.log('✅ Found', response.data.stalls.length, 'auction stalls');
        
        const auctionStalls = response.data.stalls.map(stall => ({
          id: stall.id,
          stallNumber: stall.stallNumber,
          price: stall.price,
          priceValue: stall.priceValue,
          currentBid: stall.currentBid || stall.priceValue,
          currentBidder: stall.currentBidder || null,
          location: stall.branch.name,
          floor: stall.floorSection,
          size: stall.size,
          status: stall.canApply ? 'available' : (stall.isApplied ? 'applied' : 'unavailable'),
          auctionDate: stall.auctionDate || "To be announced",
          startTime: stall.startTime || "To be announced",
          image: stall.image,
          stallDescription: stall.description,
          branchId: stall.branch.id,
          priceType: stall.priceType,
          stallLocation: stall.location,
          canApply: stall.canApply,
          isApplied: stall.isApplied
        }));
        
        console.log('📝 Transformed stalls:', auctionStalls.length);
        setAuctionStallsData(auctionStalls);
        
        // Extract unique locations for filter
        const uniqueLocations = [...new Set(auctionStalls.map(stall => stall.location))];
        setAvailableFilters(['ALL', 'PRE-REGISTERED', ...uniqueLocations]);
        
        // Show info message about area restriction
        if (response.data.restriction_info) {
          const areas = response.data.restriction_info.areas_with_access?.join(', ') || 'your applied areas';
          console.log(`ℹ️ Showing auction stalls from: ${areas}`);
        }
      } else {
        console.log('⚠️ No auction stalls available:', response.message);
        setAuctionStallsData([]);
        
        // Show informative message if no applications exist
        if (response.data?.restriction_message) {
          console.log('📢 Showing restriction alert');
          Alert.alert(
            'No Auction Stalls Available',
            'You need to apply to a stall first to see auction stalls in that area. Please go to the Stall tab to submit your first application.',
            [{ text: 'OK' }]
          );
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading auction stalls:', error);
      Alert.alert('Error', 'Failed to load auction stalls. Please try again.');
      setAuctionStallsData([]);
    } finally {
      console.log('🏁 Loading complete');
      setLoading(false);
    }
  };

  const handlePreRegister = (stallId) => {
    console.log('🔔 Pre-registering stall:', stallId);
    console.log('📋 Current pre-registered stalls:', preRegisteredStalls);
    setPreRegisteredStalls((prev) => {
      const updated = prev.includes(stallId) ? prev : [...prev, stallId];
      console.log('✅ Updated pre-registered stalls:', updated);
      return updated;
    });
  };

  // Auto-refresh every 5 seconds to update auction status
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setLastRefresh(new Date());
    }, AuctionTimings.AUTO_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, []);

  const auctionSortOptions = [
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
    { label: "Stall Number", value: "stall_number" },
    { label: "Default", value: "default" },
  ];

  // filter and sort logic
  const filteredAndSortedStalls = useMemo(() => {
    console.log('🔍 Filter Logic - Selected Filter:', selectedFilter);
    console.log('🔍 Pre-registered stalls:', preRegisteredStalls);
    console.log('🔍 Total stalls:', auctionStallsData.length);
    
    let filtered = [...auctionStallsData];

    // search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (stall) =>
          stall.stallNumber.toLowerCase().includes(searchLower) ||
          stall.location.toLowerCase().includes(searchLower) ||
          stall.floor.toLowerCase().includes(searchLower) ||
          stall.status.toLowerCase().includes(searchLower)
      );
    }

    // status filter
    if (selectedFilter === "PRE-REGISTERED") {
      console.log('🔍 Filtering for PRE-REGISTERED stalls...');
      filtered = filtered.filter((stall) => {
        const isIncluded = preRegisteredStalls.includes(stall.id);
        console.log(`  Stall ${stall.id} (${stall.stallNumber}): ${isIncluded ? '✅ INCLUDED' : '❌ EXCLUDED'}`);
        return isIncluded;
      });
      console.log('🔍 After PRE-REGISTERED filter:', filtered.length, 'stalls');
    } else if (selectedFilter !== "ALL") {
      // Filter by location/branch
      filtered = filtered.filter((stall) => 
        stall.location === selectedFilter
      );
    }

    // sort
    if (selectedSort === "price_asc") {
      filtered.sort((a, b) => a.priceValue - b.priceValue);
    } else if (selectedSort === "price_desc") {
      filtered.sort((a, b) => b.priceValue - a.priceValue);
    } else if (selectedSort === "stall_number") {
      filtered.sort(
        (a, b) => parseInt(a.stallNumber) - parseInt(b.stallNumber)
      );
    }

    return filtered;
  }, [searchText, selectedFilter, selectedSort, preRegisteredStalls, auctionStallsData]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <AuctionReminderModal
          visible={showReminder}
          onClose={() => setShowReminder(false)}
        />

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading auction stalls...</Text>
          </View>
        ) : (
          <>
            {/* Header */}
            {!showReminder && (
              <>
                {/* Title Header */}
                <SearchFilterBar
                  searchText={searchText}
                  onSearchChange={setSearchText}
                  selectedFilter={selectedFilter}
              onFilterSelect={setSelectedFilter}
              selectedSort={selectedSort}
              onSortSelect={setSelectedSort}
              searchPlaceholder="Search stalls, floor, or status..."
              filters={availableFilters}
              sortOptions={auctionSortOptions}
            />
            {/* Results Header */}
            <View
              style={[
                styles.resultsHeader,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.resultsContent}>
                <Text
                  style={[
                    styles.resultsText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {filteredAndSortedStalls.length}{" "}
                  {filteredAndSortedStalls.length === 1 ? "stall" : "stalls"}{" "}
                  available for auction
                </Text>
                <View style={styles.refreshIndicator}>
                  <Text
                    style={[styles.liveText, { color: theme.colors.primary }]}
                  >
                    Auto-refreshes for updates
                  </Text>
                </View>
              </View>
            </View>

            {/* Stalls List */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Auction Cards */}
              {filteredAndSortedStalls.length > 0 ? (
                filteredAndSortedStalls.map((stall) => (
                  <AuctionCard
                    key={stall.id}
                    stall={stall}
                    onPreRegister={handlePreRegister}
                    isPreRegistered={preRegisteredStalls.includes(stall.id)}
                  />
                ))
              ) : (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No stalls found</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try adjusting your search or filter criteria
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
            )}
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  titleHeader: {
    paddingHorizontal: width * 0.04,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: width * 0.06,
    fontWeight: "bold",
  },
  resultsHeader: {
    paddingHorizontal: width * 0.04,
    paddingVertical: 12,
  },
  resultsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsText: {
    fontSize: width * 0.035,
  },
  refreshIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveText: {
    fontSize: width * 0.032,
    fontWeight: "500",
    fontStyle: "italic",
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: width * 0.04,
    paddingTop: 15,
    paddingBottom: 10,
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default AuctionScreen;
