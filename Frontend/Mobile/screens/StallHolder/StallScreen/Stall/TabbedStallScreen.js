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

// Import services
import ApiService from '../../../../services/ApiService';
import UserStorageService from '../../../../services/UserStorageService';

const { width } = Dimensions.get('window');

const TabbedStallScreen = () => {
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

  // Tab configuration
  const tabs = [
    { 
      id: 'Fixed Price', 
      label: 'Fixed Price', 
      icon: require('../../../../assets/Home-Image/Fixed.png')
    },
    { 
      id: 'Auction', 
      label: 'Auction', 
      icon: require('../../../../assets/Home-Image/Auction.png')
    },
    { 
      id: 'Raffle', 
      label: 'Raffle', 
      icon: require('../../../../assets/Home-Image/Raffle.png')
    },
  ];

  // Load user data and stalls when component mounts or tab changes
  useEffect(() => {
    loadUserDataAndStalls();
  }, [activeTab]);

  // Filter and sort stalls when data or filters change
  useEffect(() => {
    filterAndSortStalls();
  }, [stallsData, selectedFilter, selectedSort, searchText]);

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
        fullName: userData.user.full_name,
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
          status: stall.isApplied ? 'applied' : (stall.canApply ? 'available' : 'locked'),
          image: stall.image,
          branchId: stall.branch.id,
          priceType: stall.priceType,
          stallLocation: stall.location,
          description: stall.description,
          canApply: stall.canApply,
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

    setFilteredStalls(filtered);
  };

  const handleStallApplication = async (stallId) => {
    if (!userData || !userData.user || !userData.user.applicant_id) {
      Alert.alert('Error', 'Please login again to apply for stalls.');
      return;
    }
    
    if (!userData.user) {
      Alert.alert('Error', 'User information not available. Please login again.');
      return;
    }
    
    const applicantId = userData.user.applicant_id;
    
    if (!applicantId) {
      Alert.alert('Error', 'User ID not found. Please login again.');
      return;
    }

    try {
      setApplying(stallId);

      // Simple application data
      const applicationData = {
        applicantId: applicantId,
        stallId: stallId,
        businessName: userData.user.full_name + "'s Business",
        businessType: 'General Trade'
      };

      console.log('📝 Submitting application:', applicationData);

      const response = await ApiService.submitApplication(applicationData);

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
        Alert.alert('Application Failed', response.message || 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('❌ Application error:', error);
      Alert.alert('Error', 'Failed to submit application. Please check your connection and try again.');
    } finally {
      setApplying(null);
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
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => handleTabPress(tab.id)}
          >
            <Image 
              source={tab.icon} 
              style={[
                styles.tabIcon,
                activeTab === tab.id && styles.activeTabIcon
              ]}
              resizeMode="contain"
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
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
      />

      {/* Stalls List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading {activeTab} stalls...</Text>
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
                <Text style={styles.resultsText}>
                  {filteredStalls.length} {activeTab} stall{filteredStalls.length !== 1 ? 's' : ''} found
                </Text>
              </View>
              
              {filteredStalls.map((stall) => (
                <StallCard
                  key={stall.id}
                  stall={stall}
                  onApply={() => handleStallApplication(stall.id)}
                  isApplying={applying === stall.id}
                  stallType={activeTab}
                />
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Image 
                source={require('../../../../assets/Home-Image/StallIcon.png')} 
                style={styles.emptyIcon}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>No {activeTab} Stalls Found</Text>
              <Text style={styles.emptyText}>
                {searchText || selectedFilter !== 'ALL' 
                  ? 'Try adjusting your search or filter criteria'
                  : `No ${activeTab} stalls are currently available in your area`
                }
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
    tintColor: '#6b7280',
  },
  activeTabIcon: {
    tintColor: '#ffffff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
    paddingVertical: 16, // Only vertical padding
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
    tintColor: '#9ca3af',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default TabbedStallScreen;