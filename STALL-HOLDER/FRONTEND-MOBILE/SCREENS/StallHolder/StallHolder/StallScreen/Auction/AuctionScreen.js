import { useState, useMemo, useEffect } from "react";
import { ScrollView, StyleSheet, Dimensions, Text, View, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@shared-mobile/COMPONENTS/ThemeComponents/ThemeContext";
import AuctionCard from "./Components/AuctionCardComponents/AuctionCard";
import SearchFilterBar from "../Stall/components/SearchFilter/SearchFilterBar";
import AuctionReminderModal from "../Auction/Components/AuctionReminderComponent/AuctionReminderModal";
import { AuctionTimings } from "./Components/shared/constants";
import UserStorageService from "@stall-holder-mobile/SERVICES/UserStorageService";
import ApiService from "@stall-holder-mobile/SERVICES/ApiService";

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

  // Handle pre-registration for auction - calls the joinAuction API
  // This creates an auction_participants record (no application record)
  const handlePreRegister = async (stallId) => {
    console.log('🔔 Pre-registering for auction - stall:', stallId);
    
    try {
      // Get user data from storage
      const userData = await UserStorageService.getUserData();
      if (!userData || !userData.user) {
        Alert.alert('Error', 'User not logged in. Please login again.');
        return;
      }
      
      const applicantId = userData.user.applicant_id;
      
      // Check if already pre-registered locally
      if (preRegisteredStalls.includes(stallId)) {
        console.log('⚠️ Already pre-registered for stall:', stallId);
        return;
      }
      
      // Call the joinAuction API to register in auction_participants table
      console.log('📤 Calling joinAuction API...');
      const response = await ApiService.joinAuction(applicantId, stallId);
      
      if (response.success) {
        console.log('✅ Successfully joined auction:', response.data);
        
        // Update local state
        setPreRegisteredStalls((prev) => {
          const updated = prev.includes(stallId) ? prev : [...prev, stallId];
          console.log('✅ Updated pre-registered stalls:', updated);
          return updated;
        });
        
        // Update stall status in the list
        setAuctionStallsData(prevStalls => 
          prevStalls.map(s => 
            s.id === stallId ? { 
              ...s, 
              status: 'joined_auction',
              isApplied: true,
              canApply: false
            } : s
          )
        );
      } else {
        console.error('❌ Failed to join auction:', response.message);
        Alert.alert('Error', response.message || 'Failed to pre-register for auction.');
      }
    } catch (error) {
      console.error('❌ Error pre-registering for auction:', error);
      Alert.alert('Error', 'Failed to pre-register for auction. Please try again.');
    }
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
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading auction stalls...</Text>
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
                    { color: theme.colors.text },
                  ]}
                >
                  {filteredAndSortedStalls.length}{" "}
                  {filteredAndSortedStalls.length === 1 ? "stall" : "stalls"}{" "}
                  available for auction
                </Text>
                <View style={[styles.liveIndicator, { backgroundColor: theme.colors.primaryLight }]}>
                  <View style={styles.liveDot} />
                  <Text
                    style={[styles.liveText, { color: theme.colors.success }]}
                  >
                    Live Updates
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
                  <Text style={[styles.noResultsText, { color: theme.colors.text }]}>No Auction Stalls Found</Text>
                  <Text style={[styles.noResultsSubtext, { color: theme.colors.textSecondary }]}>
                    Try adjusting your search or filter criteria, or check back later for new auction listings.
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
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
    paddingVertical: 14,
    marginHorizontal: width * 0.04,
    marginTop: 12,
    borderRadius: 12,
  },
  resultsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsText: {
    fontSize: width * 0.038,
    fontWeight: '700',
    flex: 1,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  liveText: {
    fontSize: width * 0.028,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: width * 0.04,
    paddingTop: 15,
    paddingBottom: 20,
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default AuctionScreen;
