import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Text,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import RaffleCard from './Components/RaffleCard';
import SearchFilterBar from './Components/SearchFilter/SearchFilterBar';
import UserStorageService from '@stall-holder-mobile/SERVICES/UserStorageService';
import ApiService from '@stall-holder-mobile/SERVICES/ApiService';
import { useTheme } from "@shared-mobile/COMPONENTS/ThemeComponents/ThemeContext";

const { width } = Dimensions.get('window');

const RaffleScreen = () => {
  const { theme, isDark } = useTheme();
  const [raffles, setRaffles] = useState([]);
  const [filteredRaffles, setFilteredRaffles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRaffles();
  }, []);

  useEffect(() => {
    filterRaffles();
  }, [raffles, searchQuery, selectedFilters]);

  const loadRaffles = async () => {
    try {
      setLoading(true);
      
      // Get user data from storage
      const userData = await UserStorageService.getUserData();
      if (!userData || !userData.user) {
        Alert.alert('Error', 'User not logged in. Please login again.');
        setRaffles([]);
        return;
      }
      
      const applicantId = userData.user.applicant_id;
      
      // Fetch raffle stalls from backend API
      const response = await ApiService.getStallsByType('Raffle', applicantId);
      
      if (response.success && response.data.stalls && response.data.stalls.length > 0) {
        const raffleStalls = response.data.stalls.map(stall => ({
          id: stall.id,
          stall: stall.stallNumber,
          location: `${stall.floorSection}\n${stall.size}`,
          image: stall.image,
          isLive: true, // You can add logic here based on raffle start/end dates
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Default to 2 hours from now
          category: stall.section?.toLowerCase() || 'general',
          floor: stall.floor?.toLowerCase() || 'floor1',
          price: stall.priceValue,
          branchName: stall.branch.name,
          description: stall.description,
          canApply: stall.canApply,
          isApplied: stall.isApplied
        }));
        
        setRaffles(raffleStalls);
        
        // Show info message about area restriction
        if (response.data.restriction_info) {
          const areas = response.data.restriction_info.areas_with_access?.join(', ') || 'your applied areas';
          console.log(`ℹ️ Showing raffle stalls from: ${areas}`);
        }
      } else {
        console.log('No raffle stalls available:', response.message);
        setRaffles([]);
        
        // Show informative message if no applications exist
        if (response.data?.restriction_message) {
          Alert.alert(
            'No Raffle Stalls Available',
            'You need to apply to a stall first to see raffle stalls in that area. Please go to the Stall tab to submit your first application.',
            [{ text: 'OK' }]
          );
        }
      }
      
    } catch (error) {
      console.error('Error loading raffles:', error);
      Alert.alert('Error', 'Failed to load raffle stalls. Please try again.');
      setRaffles([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRaffles();
    setRefreshing(false);
  };

  const filterRaffles = () => {
    let filtered = [...raffles];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(raffle => 
        raffle.stall.toLowerCase().includes(query) ||
        raffle.location.toLowerCase().includes(query)
      );
    }

    // Apply status filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(raffle => {
        const now = new Date().getTime();
        const endTime = new Date(raffle.endTime).getTime();
        
        return selectedFilters.some(filter => {
          switch (filter) {
            case 'ongoing':
              // Raffle is live and hasn't ended yet
              return raffle.isLive && endTime > now;
            case 'countdown':
              // Raffle is not live yet but will start (upcoming raffles)
              return !raffle.isLive && endTime > now;
            case 'expired':
              // Raffle has ended
              return endTime < now;
            default:
              return false;
          }
        });
      });
    }

    setFilteredRaffles(filtered);
  };

  const handleRafflePress = (raffle) => {
    console.log('Pressed raffle:', raffle.stall);
    // Navigate to raffle details screen
    // navigation.navigate('RaffleDetails', { raffleId: raffle.id });
  };

  const renderRaffleCard = ({ item }) => (
    <RaffleCard
      stall={item.stall}
      location={item.location}
      image={item.image}
      isLive={item.isLive}
      endTime={item.endTime}
      onPress={() => handleRafflePress(item)}
    />
  );

  const renderEmptyState = () => {
    const hasFilters = searchQuery || selectedFilters.length > 0;
    
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
          {hasFilters ? 'No Raffles Found' : 'No Raffle Stalls Available'}
        </Text>
        <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
          {hasFilters 
            ? 'Try adjusting your search or filters to find more raffle opportunities'
            : 'Raffle stalls are only visible in areas where you have submitted applications. Submit your first application to see raffle stalls in that area.'
          }
        </Text>
        {hasFilters && (
          <TouchableOpacity 
            style={[styles.clearFiltersButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              setSearchQuery('');
              setSelectedFilters([]);
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Fixed: Create header component to avoid virtualized list nesting
  const renderHeader = () => (
    <View>
      <SearchFilterBar
        onSearch={setSearchQuery}
        onFilter={setSelectedFilters}
        searchValue={searchQuery}
        selectedFilters={selectedFilters}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading raffles...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredRaffles}
        renderItem={renderRaffleCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={styles.headerStyle}
        stickyHeaderIndices={[0]} // Make the search bar sticky
        removeClippedSubviews={false} // Fix for virtualized list issues
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  headerStyle: {
    marginBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.1,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#1e40af',
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

export default RaffleScreen;