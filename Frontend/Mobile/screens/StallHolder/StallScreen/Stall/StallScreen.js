import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  View,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Import components
import SearchFilterBar from './components/SearchFilter/SearchFilterBar';
import StallCard from './components/StallCard';

// Import services
import ApiService from '../../../../services/ApiService';
import UserStorageService from '../../../../services/UserStorageService';

const { width } = Dimensions.get('window');

const StallScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('default');
  const [searchText, setSearchText] = useState('');
  const [stallsData, setStallsData] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null); // Track which stall is being applied to
  const [availableFilters, setAvailableFilters] = useState(['ALL']); // Dynamic filters based on data

  // Load user data and stalls on component mount
  useEffect(() => {
    loadUserDataAndStalls();
  }, []);

  const loadUserDataAndStalls = async () => {
    try {
      setLoading(true);
      
      // Get user data from storage
      const userData = await UserStorageService.getUserData();
      if (!userData || !userData.user) {
        Alert.alert('Error', 'User not logged in. Please login again.');
        return;
      }
      
      setUserData(userData);
      
      // Get user applications from the new backend structure
      const applications = userData.applications?.my_applications || [];
      setUserApplications(applications);
      
      const applicantId = userData.user.applicant_id;
      
      // Fetch Fixed Price stalls from backend API
      const response = await ApiService.getStallsByType('Fixed Price', applicantId);
      
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
          applicationsInBranch: 0, // Will be calculated from applications
          maxApplicationsReached: false
        }));
        
        setStallsData(transformedStalls);
        
        // Extract unique locations for filter
        const uniqueLocations = [...new Set(transformedStalls.map(stall => stall.location))];
        setAvailableFilters(['ALL', ...uniqueLocations]);
        
        // Show info message about area restriction
        if (response.data.restriction_info) {
          const areas = response.data.restriction_info.areas_with_access?.join(', ') || 'your applied areas';
          console.log(`ℹ️ Showing stalls from: ${areas}`);
        }
      } else {
        console.log('No Fixed Price stalls available:', response.message);
        setStallsData([]);
        
        // Show informative message if no applications exist
        if (response.data?.restriction_message) {
          Alert.alert(
            'No Stalls Available',
            'You need to apply to your first stall to see more stalls in that area. Please check with your branch manager or admin to get started.',
            [{ text: 'OK' }]
          );
        }
      }
      
    } catch (error) {
      console.error('Error loading user data and stalls:', error);
      Alert.alert('Error', 'Failed to load stall data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle stall application with improved backend integration
  const handleApplyToStall = async (stall) => {
    try {
      if (!userData || !userData.user) {
        Alert.alert('Error', 'User data not found. Please login again.');
        return;
      }

      // Check if user can apply (based on backend data)
      if (!stall.canApply) {
        if (stall.maxApplicationsReached) {
          Alert.alert(
            'Application Limit Reached', 
            `You have reached the maximum of 2 applications for ${stall.location}. You currently have ${stall.applicationsInBranch} applications in this branch.`
          );
        } else {
          Alert.alert('Cannot Apply', 'You cannot apply to this stall at the moment.');
        }
        return;
      }

      // Check if already applied (redundant check, but good for safety)
      if (stall.status === 'applied') {
        Alert.alert('Already Applied', 'You have already applied to this stall.');
        return;
      }

      // Confirm application
      const stallTypeText = stall.priceType === 'Raffle' ? 'join the raffle for' : 
                           stall.priceType === 'Auction' ? 'bid in the auction for' : 'apply for';
      
      Alert.alert(
        'Confirm Application',
        `Do you want to ${stallTypeText} Stall #${stall.stallNumber} at ${stall.location}?\n\nPrice: ₱${stall.price}\nLocation: ${stall.floor}\nSize: ${stall.size}\nType: ${stall.priceType}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm', 
            onPress: () => submitApplication(stall)
          }
        ]
      );

    } catch (error) {
      console.error('Error applying to stall:', error);
      Alert.alert('Error', 'Failed to apply to stall. Please try again.');
    }
  };

  // Submit application to backend using the new API
  const submitApplication = async (stall) => {
    try {
      setApplying(stall.id);
      
      const response = await ApiService.submitApplication(userData.user.applicant_id, stall.id);
      
      if (response.success) {
        // Update local data with the new application
        const newApplication = {
          application_id: response.data.application_id,
          stall_id: stall.id,
          applicant_id: userData.user.applicant_id,
          application_date: new Date().toISOString().split('T')[0],
          application_status: 'Pending',
          branch_id: stall.branchId,
          stall_no: stall.stallNumber,
          branch_name: stall.location,
          stall_location: stall.stallLocation,
          size: stall.size,
          rental_price: stall.priceValue,
          price_type: stall.priceType,
          description: stall.description,
          floor_name: stall.floor.split(' / ')[0],
          section_name: stall.floor.split(' / ')[1],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Update applications in storage
        await UserStorageService.addApplication(newApplication);
        
        // Update local state
        const updatedApplications = [...userApplications, newApplication];
        setUserApplications(updatedApplications);
        
        // Update stall status and metadata
        setStallsData(prevStalls => 
          prevStalls.map(s => 
            s.id === stall.id ? { 
              ...s, 
              status: 'applied',
              canApply: false,
              applicationsInBranch: s.applicationsInBranch + 1
            } : s
          )
        );
        
        const successMessage = stall.priceType === 'Raffle' ? 'You have successfully joined the raffle!' :
                              stall.priceType === 'Auction' ? 'You can now participate in the auction!' :
                              'Your application has been submitted successfully!';
        
        Alert.alert('Success', successMessage);
      } else {
        Alert.alert('Error', response.message || 'Failed to submit application.');
      }
      
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const getFilteredAndSortedStalls = () => {
    let filtered = stallsData;
    
    // Apply category filter
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(stall => stall.location === selectedFilter);
    }
    
    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(stall => 
        stall.stallNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        stall.floor.toLowerCase().includes(searchText.toLowerCase()) ||
        stall.location.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Apply price sorting
    if (selectedSort === 'price_asc') {
      filtered = [...filtered].sort((a, b) => a.priceValue - b.priceValue);
    } else if (selectedSort === 'price_desc') {
      filtered = [...filtered].sort((a, b) => b.priceValue - a.priceValue);
    }
    // For 'default', keep original order
    
    return filtered;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Combined Search and Filter Bar */}
        <SearchFilterBar 
          searchText={searchText}
          onSearchChange={setSearchText}
          selectedFilter={selectedFilter}
          onFilterSelect={setSelectedFilter}
          selectedSort={selectedSort}
          onSortSelect={setSelectedSort}
          filters={availableFilters}
        />

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#002181" />
            <Text style={styles.loadingText}>Loading stalls...</Text>
          </View>
        ) : (
          /* Stall Cards */
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {getFilteredAndSortedStalls().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No stalls available</Text>
                <Text style={styles.emptySubText}>
                  Stalls are restricted to areas where you have applications. 
                  Contact your branch manager to submit your first application.
                </Text>
              </View>
            ) : (
              getFilteredAndSortedStalls().map((stall) => (
                <StallCard 
                  key={stall.id} 
                  stall={stall} 
                  onApply={handleApplyToStall}
                  applying={applying === stall.id}
                />
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: width * 0.04,
  },
});

export default StallScreen;