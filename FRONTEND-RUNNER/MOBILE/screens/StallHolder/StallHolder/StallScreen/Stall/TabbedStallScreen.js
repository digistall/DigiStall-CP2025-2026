import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';

// Import components
import SearchFilterBar from './components/SearchFilter/SearchFilterBar';
import StallCard from './components/StallCard';
import StallDetailsModal from './components/StallDetailsModal';

// Import services
import ApiService from '../../../../services/ApiService';
import UserStorageService from '../../../../services/UserStorageService';
import FavoritesService from '../../../../services/FavoritesService';
import { useTheme } from '../../../../components/ThemeComponents/ThemeContext';
import { getSafeUserName } from "../../../services/DataDisplayUtils";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive layout constants
const isTablet = SCREEN_WIDTH >= 768;
const numColumns = isTablet ? 2 : 1;
const containerPadding = 16;
const cardMargin = 12;
const CARD_WIDTH = isTablet 
  ? (SCREEN_WIDTH - (containerPadding * 2) - (cardMargin * (numColumns - 1))) / numColumns 
  : SCREEN_WIDTH - (containerPadding * 2);

const TabbedStallScreen = () => {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('Fixed Price'); // Default to Fixed Price
  const [stallsData, setStallsData] = useState([]);
  const [filteredStalls, setFilteredStalls] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('default');
  const [searchText, setSearchText] = useState('');
  const [userApplications, setUserApplications] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [availableFilters, setAvailableFilters] = useState(['ALL']);
  
  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState([]);
  
  // Stall details modal state
  const [selectedStall, setSelectedStall] = useState(null);
  const [showStallDetails, setShowStallDetails] = useState(false);

  // Tab configuration
  const tabs = [
    { 
      id: 'Fixed Price', 
      label: 'Fixed Price',
    },
    { 
      id: 'Auction', 
      label: 'Auction',
    },
    { 
      id: 'Raffle', 
      label: 'Raffle',
    },
  ];

  // Load user data and stalls when component mounts or tab changes
  useEffect(() => {
    loadUserDataAndStalls();
  }, [activeTab]);

  // Filter and sort stalls when data or filters change
  useEffect(() => {
    filterAndSortStalls();
  }, [stallsData, selectedFilter, selectedSort, searchText, favoriteIds]);

  // Load favorites when user data is available
  useEffect(() => {
    if (userData?.user?.applicant_id) {
      loadFavorites();
    }
  }, [userData]);

  // Load favorites from storage
  const loadFavorites = async () => {
    try {
      const applicantId = userData?.user?.applicant_id;
      if (!applicantId) return;
      
      const favorites = await FavoritesService.getFavorites(applicantId);
      setFavoriteIds(favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async (stallId) => {
    try {
      const applicantId = userData?.user?.applicant_id;
      if (!applicantId) return;
      
      const isNowFavorite = await FavoritesService.toggleFavorite(applicantId, stallId);
      
      // Update local state
      setFavoriteIds(prev => {
        if (isNowFavorite) {
          return [Number(stallId), ...prev.filter(id => id !== Number(stallId))];
        } else {
          return prev.filter(id => id !== Number(stallId));
        }
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Handle opening stall details modal
  const handleOpenStallDetails = (stall) => {
    setSelectedStall(stall);
    setShowStallDetails(true);
  };

  // Handle closing stall details modal
  const handleCloseStallDetails = () => {
    setShowStallDetails(false);
    setSelectedStall(null);
  };

  const loadUserDataAndStalls = async () => {
    try {
      setLoading(true);
      
      // Get user data from storage
      const userData = await UserStorageService.getUserData();
      
      console.log('🔍 Retrieved user data from storage:', JSON.stringify(userData, null, 2));
      
      if (!userData || !userData.user) {
        console.log('❌ No user data found or missing user object');
        Alert.alert('Error', 'User not logged in. Please login again.');
        return;
      }
      
      setUserData(userData);
      console.log('👤 User data loaded:', {
        fullName: getSafeUserName(userData.user, 'User'),
        applicantId: userData.user.applicant_id,
        username: userData.user.username
      });
      
      // Get user applications
      const applications = userData.applications?.my_applications || [];
      setUserApplications(applications);
      
      const applicantId = userData.user.applicant_id;
      
      if (!applicantId) {
        Alert.alert('Error', 'User ID not found. Please login again.');
        return;
      }
      
      // Fetch stalls by type from backend API
      console.log(`🔄 Loading ${activeTab} stalls...`);
      const response = await ApiService.getStallsByType(activeTab, applicantId);
      
      if (response.success && response.data.stalls && response.data.stalls.length > 0) {
        const transformedStalls = response.data.stalls.map(stall => ({
          id: stall.id,
          stallNumber: stall.stallNumber,
          price: stall.price,
          priceValue: stall.priceValue,
          location: stall.branch.name,
          floor: stall.floorSection,
          size: stall.size,
          status: stall.hasJoinedRaffle ? 'joined_raffle' : 
                  stall.hasJoinedAuction ? 'joined_auction' :
                  stall.isApplied ? 'applied' : 
                  (stall.canApply ? 'available' : 'locked'),
          image: stall.image,
          branchId: stall.branch.id,
          priceType: stall.priceType,
          stallLocation: stall.location,
          description: stall.description,
          canApply: stall.canApply && !stall.hasJoinedRaffle && !stall.hasJoinedAuction,
          hasJoinedRaffle: stall.hasJoinedRaffle || false,
          hasJoinedAuction: stall.hasJoinedAuction || false,
          stallType: activeTab, // Add stall type for filtering
          applicationsInBranch: 0,
          maxApplicationsReached: false
        }));
        
        setStallsData(transformedStalls);
        
        // Extract unique locations for filter
        const uniqueLocations = [...new Set(transformedStalls.map(stall => stall.location))];
        setAvailableFilters(['ALL', ...uniqueLocations]);
        
        console.log(`✅ Loaded ${transformedStalls.length} ${activeTab} stalls`);
        
        // Show info message about area restriction
        if (response.data.restriction_info) {
          const areas = response.data.restriction_info.areas_with_access?.join(', ') || 'your applied areas';
          console.log(`ℹ️ Showing ${activeTab} stalls from: ${areas}`);
        }
      } else {
        console.log(`No ${activeTab} stalls available:`, response.message);
        setStallsData([]);
        setAvailableFilters(['ALL']);
        
        // Show informative message if no stalls found
        if (activeTab === 'Fixed Price' && response.data?.restriction_message) {
          Alert.alert(
            'No Stalls Available',
            'You need to apply to your first stall to see more stalls in that area. Please check with your branch manager or admin to get started.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error(`❌ Error loading ${activeTab} stalls:`, error);
      Alert.alert('Error', `Failed to load ${activeTab} stalls. Please try again.`);
      setStallsData([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortStalls = () => {
    let filtered = [...stallsData];

    // Apply location filter
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(stall => stall.location === selectedFilter);
    }

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(stall =>
        stall.stallNumber.toLowerCase().includes(searchLower) ||
        stall.location.toLowerCase().includes(searchLower) ||
        stall.floor.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    switch (selectedSort) {
      case 'price_low':
        filtered.sort((a, b) => a.priceValue - b.priceValue);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.priceValue - a.priceValue);
        break;
      case 'location':
        filtered.sort((a, b) => a.location.localeCompare(b.location));
        break;
      case 'size':
        filtered.sort((a, b) => a.size.localeCompare(b.size));
        break;
      default:
        // Keep original order
        break;
    }

    // Sort favorites first
    filtered = FavoritesService.sortWithFavoritesFirst(filtered, favoriteIds);

    setFilteredStalls(filtered);
  };

  const handleStallApplication = async (stallId) => {
    console.log('🎯 ====== HANDLE STALL APPLICATION START ======');
    console.log('🎯 stallId:', stallId);
    console.log('🎯 activeTab (stall type):', activeTab);
    console.log('🎯 userData:', JSON.stringify(userData, null, 2));
    
    if (!userData || !userData.user || !userData.user.applicant_id) {
      console.error('❌ User validation failed - missing userData or applicant_id');
      Alert.alert('Error', 'Please login again to apply for stalls.');
      return;
    }
    
    if (!userData.user) {
      console.error('❌ User validation failed - userData.user is missing');
      Alert.alert('Error', 'User information not available. Please login again.');
      return;
    }
    
    const applicantId = userData.user.applicant_id;
    console.log('🎯 applicantId extracted:', applicantId);
    
    if (!applicantId) {
      console.error('❌ applicantId is null/undefined after extraction');
      Alert.alert('Error', 'User ID not found. Please login again.');
      return;
    }

    try {
      setApplying(stallId);
      
      let response;
      
      // Check if this is a Raffle stall - use joinRaffle endpoint instead of submitApplication
      if (activeTab === 'Raffle') {
        console.log('🎰 ====== RAFFLE STALL DETECTED ======');
        console.log('🎰 Calling ApiService.joinRaffle with:');
        console.log('   - applicantId:', applicantId);
        console.log('   - stallId:', stallId);
        
        response = await ApiService.joinRaffle(applicantId, stallId);
        
        console.log('🎰 joinRaffle response:', JSON.stringify(response, null, 2));
        
        if (response.success) {
          Alert.alert(
            'Raffle Joined! 🎉',
            `You have successfully joined the raffle for this stall. Good luck!`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Refresh stalls to show updated status
                  loadUserDataAndStalls();
                }
              }
            ]
          );
        } else {
          console.error('❌ joinRaffle failed:', response.message);
          Alert.alert('Failed to Join Raffle', response.message || 'Failed to join raffle. Please try again.');
        }
      } else if (activeTab === 'Auction') {
        // For Auction stalls, use joinAuction endpoint
        console.log('🔨 ====== AUCTION STALL DETECTED ======');
        console.log('🔨 Calling ApiService.joinAuction with:');
        console.log('   - applicantId:', applicantId);
        console.log('   - stallId:', stallId);
        
        response = await ApiService.joinAuction(applicantId, stallId);
        
        console.log('🔨 joinAuction response:', JSON.stringify(response, null, 2));
        
        if (response.success) {
          Alert.alert(
            'Auction Joined! 🔨',
            `You have successfully joined the auction for this stall. Good luck!`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Refresh stalls to show updated status
                  loadUserDataAndStalls();
                }
              }
            ]
          );
        } else {
          console.error('❌ joinAuction failed:', response.message);
          Alert.alert('Failed to Join Auction', response.message || 'Failed to join auction. Please try again.');
        }
      } else {
        // For Fixed Price stalls, use submitApplication
        console.log('📝 ====== FIXED PRICE STALL (using submitApplication) ======');
        
        const applicationData = {
          applicantId: applicantId,
          stallId: stallId,
          businessName: getSafeUserName(userData.user, 'User') + "'s Business",
          businessType: 'General Trade'
        };

        console.log('📝 Submitting application with data:', JSON.stringify(applicationData, null, 2));

        response = await ApiService.submitApplication(applicationData);
        
        console.log('📝 submitApplication response:', JSON.stringify(response, null, 2));

        if (response.success) {
          Alert.alert(
            'Application Submitted',
            `Your application for ${activeTab} stall has been submitted successfully!`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Refresh stalls to show updated status
                  loadUserDataAndStalls();
                }
              }
            ]
          );
        } else {
          console.error('❌ submitApplication failed:', response.message);
          Alert.alert('Application Failed', response.message || 'Failed to submit application. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ ====== APPLICATION ERROR ======');
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('Error', 'Failed to submit application. Please check your connection and try again.');
    } finally {
      setApplying(null);
      console.log('🎯 ====== HANDLE STALL APPLICATION END ======');
    }
  };

  const handleTabPress = (tabId) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      setSelectedFilter('ALL');
      setSearchText('');
      setSelectedSort('default');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              { backgroundColor: isDark ? theme.colors.card : '#f8f9fa' },
              activeTab === tab.id && [styles.activeTab, { backgroundColor: theme.colors.primary }]
            ]}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: theme.colors.textSecondary },
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Search and Filter Bar */}
      <SearchFilterBar
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        searchText={searchText}
        onSearchChange={setSearchText}
        availableFilters={availableFilters}
        theme={theme}
        isDark={isDark}
      />

      {/* Stalls List */}
      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading {activeTab} stalls...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.stallsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.stallsListContent}
        >
          {filteredStalls.length > 0 ? (
            <>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsText, { color: theme.colors.text }]}>
                  {filteredStalls.length} {activeTab} stall{filteredStalls.length !== 1 ? 's' : ''} found
                </Text>
                <Text style={[styles.resultsSubtext, { color: theme.colors.textSecondary }]}>
                  Tap on a stall to view details
                </Text>
              </View>
              
              <View style={styles.stallsGrid}>
                {filteredStalls.map((stall) => (
                  <StallCard
                    key={stall.id}
                    stall={stall}
                    onApply={() => handleStallApplication(stall.id)}
                    applying={applying === stall.id}
                    stallType={activeTab}
                    theme={theme}
                    isDark={isDark}
                    cardWidth={CARD_WIDTH}
                    isFavorite={favoriteIds.includes(Number(stall.id))}
                    onToggleFavorite={handleToggleFavorite}
                    onPress={handleOpenStallDetails}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No {activeTab} Stalls Found</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {searchText || selectedFilter !== 'ALL' 
                  ? 'Try adjusting your search or filter criteria to find more stalls'
                  : `No ${activeTab} stalls are currently available in your area. Check back later for new listings.`
                }
              </Text>
              {(searchText || selectedFilter !== 'ALL') && (
                <TouchableOpacity 
                  style={[styles.clearFiltersButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    setSearchText('');
                    setSelectedFilter('ALL');
                    setSelectedSort('default');
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Stall Details Modal */}
      <StallDetailsModal
        visible={showStallDetails}
        stall={selectedStall}
        onClose={handleCloseStallDetails}
        onApply={handleStallApplication}
        applying={applying === selectedStall?.id}
        theme={theme}
        isDark={isDark}
        isFavorite={selectedStall ? favoriteIds.includes(Number(selectedStall.id)) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    position: 'relative',
    minHeight: 50,
  },
  activeTab: {
    backgroundColor: '#007bff',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
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
    color: '#6b7280',
    textAlign: 'center',
  },
  stallsList: {
    flex: 1,
  },
  stallsListContent: {
    paddingVertical: 16,
    paddingHorizontal: containerPadding,
  },
  stallsGrid: {
    flexDirection: isTablet ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: isTablet ? 'flex-start' : 'center',
    gap: cardMargin,
  },
  resultsHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  resultsSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 8,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TabbedStallScreen;
