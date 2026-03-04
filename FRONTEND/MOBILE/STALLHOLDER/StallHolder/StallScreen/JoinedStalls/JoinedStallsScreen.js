import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useTheme } from '../../../../components/ThemeComponents/ThemeContext';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import ApiService from '../../../../services/ApiService';

const { width } = Dimensions.get('window');

const JoinedStallsScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const colors = theme.colors;

  const [stalls, setStalls] = useState([]);
  const [totalJoined, setTotalJoined] = useState(0);
  const [raffleCount, setRaffleCount] = useState(0);
  const [auctionCount, setAuctionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.95)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchJoinedStalls = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);

      const response = await ApiService.getJoinedStalls();

      if (response.success) {
        const data = response.data;
        setStalls(data.stalls || []);
        setTotalJoined(data.total_joined || 0);
        setRaffleCount(data.raffle_count || 0);
        setAuctionCount(data.auction_count || 0);
        animateIn();
      } else {
        setError(response.message || 'Failed to load joined stalls');
      }
    } catch (err) {
      console.error('Error fetching joined stalls:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJoinedStalls();
  }, [fetchJoinedStalls]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJoinedStalls(true);
  };

  // Filter stalls
  const filteredStalls = selectedFilter === 'all'
    ? stalls
    : stalls.filter(s => s.join_type === selectedFilter);

  const formatCurrency = (amount) => {
    return `\u20B1${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'winner': return colors.success;
      case 'registered': return colors.primary;
      case 'not selected': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusBg = (status) => {
    switch (status?.toLowerCase()) {
      case 'winner': return isDarkMode ? 'rgba(30, 156, 0, 0.15)' : 'rgba(30, 156, 0, 0.1)';
      case 'registered': return isDarkMode ? 'rgba(0, 33, 129, 0.15)' : 'rgba(0, 33, 129, 0.1)';
      case 'not selected': return isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)';
      default: return isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    }
  };

  const getJoinTypeIcon = (type) => {
    return type === 'Raffle' ? 'ticket-outline' : 'hammer-outline';
  };

  const getJoinTypeColor = (type) => {
    return type === 'Raffle' ? '#7c3aed' : '#ea580c';
  };

  const getJoinTypeBg = (type) => {
    return type === 'Raffle'
      ? (isDarkMode ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.1)')
      : (isDarkMode ? 'rgba(234, 88, 12, 0.15)' : 'rgba(234, 88, 12, 0.1)');
  };

  // ============= RENDER FUNCTIONS =============

  const renderSummaryHeader = () => (
    <Animated.View style={[
      styles.summaryContainer,
      {
        backgroundColor: colors.primary,
        transform: [{ scale: headerScale }],
        opacity: fadeAnim,
      }
    ]}>
      <View style={styles.summaryDecor1} />
      <View style={styles.summaryDecor2} />

      <View style={styles.summaryContent}>
        <View style={styles.summaryTitleRow}>
          <View style={styles.summaryIconWrap}>
            <Ionicons name="ticket" size={28} color="#fff" />
          </View>
          <View style={styles.summaryTitleGroup}>
            <Text style={styles.summaryTitle}>Joined Stalls</Text>
            <Text style={styles.summarySubtitle}>
              {totalJoined} participation{totalJoined !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{raffleCount}</Text>
            <Text style={styles.summaryStatLabel}>Raffles</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{auctionCount}</Text>
            <Text style={styles.summaryStatLabel}>Auctions</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{totalJoined}</Text>
            <Text style={styles.summaryStatLabel}>Total</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderFilter = () => (
    <Animated.View style={[
      styles.filterContainer,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }
    ]}>
      <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filter by Type</Text>
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: `All (${totalJoined})` },
          { key: 'Raffle', label: `Raffle (${raffleCount})` },
          { key: 'Auction', label: `Auction (${auctionCount})` },
        ].map(filter => {
          const isSelected = selectedFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : isDarkMode ? colors.card : '#f1f5f9',
                  borderColor: isSelected ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterChipText,
                {
                  color: isSelected ? '#ffffff' : colors.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderStallCard = ({ item, index }) => {
    const cardAnim = new Animated.Value(0);
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();

    const joinColor = getJoinTypeColor(item.join_type);

    return (
      <Animated.View style={[
        styles.stallCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: cardAnim,
          transform: [{
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }],
        }
      ]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.stallNumberBadge, { backgroundColor: isDarkMode ? colors.primaryLight : '#eff6ff' }]}>
              <Text style={[styles.stallNumberText, { color: colors.primary }]}>
                {item.stall_number}
              </Text>
            </View>
            <View style={styles.stallHeaderInfo}>
              <Text style={[styles.stallType, { color: colors.textSecondary }]}>
                {item.stall_type}
              </Text>
              <Text style={[styles.branchName, { color: colors.accent }]}>
                <MaterialIcons name="location-on" size={14} color={colors.accent} /> {item.branch_name}
              </Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusBg(item.participation_status) }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.participation_status) }
            ]} />
            <Text style={[
              styles.statusText,
              { color: getStatusColor(item.participation_status) }
            ]}>
              {item.participation_status || 'Registered'}
            </Text>
          </View>
        </View>

        {/* Join Type Badge */}
        <View style={[styles.joinTypeBadge, { backgroundColor: getJoinTypeBg(item.join_type) }]}>
          <Ionicons name={getJoinTypeIcon(item.join_type)} size={16} color={joinColor} />
          <Text style={[styles.joinTypeText, { color: joinColor }]}>
            {item.join_type}
          </Text>
          {item.ticket_number && (
            <Text style={[styles.ticketText, { color: joinColor }]}>
              • Ticket #{item.ticket_number}
            </Text>
          )}
          {item.bid_amount && (
            <Text style={[styles.ticketText, { color: joinColor }]}>
              • Bid: {formatCurrency(item.bid_amount)}
            </Text>
          )}
        </View>

        {/* Stall Image */}
        {item.stall_image && (
          <View style={styles.stallImageContainer}>
            <Image
              source={{ uri: item.stall_image }}
              style={styles.stallImage}
              resizeMode="cover"
            />
            <View style={[styles.stallImageOverlay, { backgroundColor: 'rgba(0,33,129,0.08)' }]} />
          </View>
        )}

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={[styles.detailItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Location</Text>
            <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
              {item.stall_location || 'N/A'}
            </Text>
          </View>
          <View style={[styles.detailItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Size</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {item.stall_size || 'N/A'}
            </Text>
          </View>
          <View style={[styles.detailItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Monthly Rent</Text>
            <Text style={[styles.detailValue, { color: colors.primary }]}>
              {formatCurrency(item.monthly_rent)}
            </Text>
          </View>
          <View style={[styles.detailItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Joined</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDate(item.registration_date)}
            </Text>
          </View>
        </View>

        {/* Event Info */}
        {item.event_date && (
          <View style={[styles.eventSection, { 
            backgroundColor: isDarkMode ? 'rgba(48, 92, 222, 0.12)' : 'rgba(0, 33, 129, 0.04)',
            borderColor: isDarkMode ? 'rgba(48, 92, 222, 0.25)' : 'rgba(0, 33, 129, 0.1)',
          }]}>
            <View style={styles.eventLeft}>
              <Text style={[styles.eventLabel, { color: colors.textSecondary }]}>
                {item.join_type} Date
              </Text>
              <Text style={[styles.eventDate, { color: colors.primary }]}>
                {formatDate(item.event_date)}
              </Text>
            </View>
            <View style={[
              styles.eventStatusBadge,
              { backgroundColor: getStatusBg(item.raffle_status || item.auction_status) }
            ]}>
              <Text style={[styles.eventStatusText, { color: getStatusColor(item.raffle_status || item.auction_status) }]}>
                {item.raffle_status || item.auction_status || 'Pending'}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
        <Ionicons name="ticket-outline" size={48} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Joined Stalls</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {selectedFilter === 'all'
          ? "You haven't joined any raffle or auction stalls yet. Join one from the Stall Management page!"
          : `No ${selectedFilter.toLowerCase()} participations found. Try selecting a different filter.`}
      </Text>
    </View>
  );

  // ============= LOADING STATE =============
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading joined stalls...</Text>
      </View>
    );
  }

  // ============= ERROR STATE =============
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.errorIconWrap, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2' }]}>
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
        </View>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Oops!</Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => fetchJoinedStalls()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============= MAIN RENDER =============
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredStalls}
        keyExtractor={(item, index) => `joined-${item.join_type}-${item.participant_id || index}`}
        renderItem={renderStallCard}
        ListHeaderComponent={
          <>
            {renderSummaryHeader()}
            {renderFilter()}
            {filteredStalls.length > 0 && (
              <Animated.View style={[styles.resultCountRow, { opacity: fadeAnim }]}>
                <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                  Showing {filteredStalls.length} stall{filteredStalls.length !== 1 ? 's' : ''}
                  {selectedFilter !== 'all' ? ` (${selectedFilter})` : ''}
                </Text>
              </Animated.View>
            )}
          </>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
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
    paddingBottom: 24,
  },

  // ===== Summary Header =====
  summaryContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#002181',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  summaryDecor1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  summaryDecor2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  summaryContent: {
    padding: 24,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  summaryTitleGroup: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  summarySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  summaryStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // ===== Filter =====
  filterContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },

  // ===== Result Count =====
  resultCountRow: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ===== Stall Card =====
  stallCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stallNumberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  stallNumberText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stallHeaderInfo: {
    flex: 1,
  },
  stallType: {
    fontSize: 14,
    fontWeight: '600',
  },
  branchName: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ===== Join Type Badge =====
  joinTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  joinTypeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ticketText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ===== Stall Image =====
  stallImageContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    height: 140,
  },
  stallImage: {
    width: '100%',
    height: '100%',
  },
  stallImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },

  // ===== Details Grid =====
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: (width - 64) / 2 - 4,
    padding: 10,
    borderRadius: 10,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ===== Event Section =====
  eventSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventLeft: {
    flex: 1,
  },
  eventLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  eventStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  eventStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ===== Empty State =====
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ===== Loading State =====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
  },

  // ===== Error State =====
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default JoinedStallsScreen;
