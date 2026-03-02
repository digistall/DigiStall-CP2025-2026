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
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../../../components/ThemeComponents/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ApiService from '../../../../../services/ApiService';

const { width } = Dimensions.get('window');

const OwnedStallsScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const colors = theme.colors;

  const [stalls, setStalls] = useState([]);
  const [groupedByBranch, setGroupedByBranch] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [totalMonthlyRent, setTotalMonthlyRent] = useState(0);
  const [totalStalls, setTotalStalls] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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

  const fetchOwnedStalls = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);

      const response = await ApiService.getOwnedStalls();

      if (response.success) {
        const data = response.data;
        setStalls(data.stalls || []);
        setGroupedByBranch(data.grouped_by_branch || []);
        setBranches(data.branches || []);
        setTotalMonthlyRent(data.total_monthly_rent || 0);
        setTotalStalls(data.total_stalls || 0);
        animateIn();
      } else {
        setError(response.message || 'Failed to load stalls');
      }
    } catch (err) {
      console.error('Error fetching owned stalls:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOwnedStalls();
  }, [fetchOwnedStalls]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOwnedStalls(true);
  };

  // Filter stalls by selected branch
  const filteredStalls = selectedBranch === 'all'
    ? stalls
    : stalls.filter(s => String(s.branch_id) === String(selectedBranch));

  // Calculate filtered totals
  const filteredTotalRent = filteredStalls.reduce((sum, s) => sum + (s.monthly_rent || 0), 0);

  const formatCurrency = (amount) => {
    return `\u20B1${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return colors.success;
      case 'overdue': return colors.error;
      case 'unpaid': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getPaymentStatusBg = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return isDarkMode ? 'rgba(30, 156, 0, 0.15)' : 'rgba(30, 156, 0, 0.1)';
      case 'overdue': return isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
      case 'unpaid': return isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)';
      default: return isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    }
  };

  const getContractStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return colors.success;
      case 'inactive': case 'terminated': return colors.error;
      case 'suspended': return colors.warning;
      default: return colors.textSecondary;
    }
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
      {/* Background decorative elements */}
      <View style={styles.summaryDecor1} />
      <View style={styles.summaryDecor2} />

      <View style={styles.summaryContent}>
        <View style={styles.summaryTitleRow}>
          <View style={styles.summaryIconWrap}>
            <Ionicons name="storefront" size={28} color="#fff" />
          </View>
          <View style={styles.summaryTitleGroup}>
            <Text style={styles.summaryTitle}>My Stalls</Text>
            <Text style={styles.summarySubtitle}>
              {totalStalls} stall{totalStalls !== 1 ? 's' : ''} across {branches.length} branch{branches.length !== 1 ? 'es' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{filteredStalls.length}</Text>
            <Text style={styles.summaryStatLabel}>
              {selectedBranch === 'all' ? 'Total Stalls' : 'Stalls in Branch'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{formatCurrency(filteredTotalRent)}</Text>
            <Text style={styles.summaryStatLabel}>Monthly Rent</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderBranchFilter = () => (
    <Animated.View style={[
      styles.filterContainer,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }
    ]}>
      <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filter by Branch</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedBranch === 'all'
                ? colors.primary
                : isDarkMode ? colors.card : '#f1f5f9',
              borderColor: selectedBranch === 'all' ? colors.primary : colors.border,
            }
          ]}
          onPress={() => setSelectedBranch('all')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterChipText,
            {
              color: selectedBranch === 'all' ? '#ffffff' : colors.textSecondary,
              fontWeight: selectedBranch === 'all' ? '700' : '500',
            }
          ]}>
            All Branches ({totalStalls})
          </Text>
        </TouchableOpacity>

        {branches.map(branch => {
          const isSelected = String(selectedBranch) === String(branch.branch_id);
          const branchStallCount = stalls.filter(s => String(s.branch_id) === String(branch.branch_id)).length;
          return (
            <TouchableOpacity
              key={branch.branch_id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : isDarkMode ? colors.card : '#f1f5f9',
                  borderColor: isSelected ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedBranch(branch.branch_id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterChipText,
                {
                  color: isSelected ? '#ffffff' : colors.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                }
              ]}>
                {branch.branch_name} ({branchStallCount})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
        {/* Card Header with Stall Number & Status */}
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
            { backgroundColor: getPaymentStatusBg(item.payment_status) }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: getPaymentStatusColor(item.payment_status) }
            ]} />
            <Text style={[
              styles.statusText,
              { color: getPaymentStatusColor(item.payment_status) }
            ]}>
              {(item.payment_status || 'unpaid').charAt(0).toUpperCase() + (item.payment_status || 'unpaid').slice(1)}
            </Text>
          </View>
        </View>

        {/* Stall Image (if available) */}
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
              {item.stall_location}
            </Text>
          </View>
          <View style={[styles.detailItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Size</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {item.stall_size}
            </Text>
          </View>
          <View style={[styles.detailItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Contract</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[
                styles.miniDot,
                { backgroundColor: getContractStatusColor(item.contract_status) }
              ]} />
              <Text style={[styles.detailValue, { color: getContractStatusColor(item.contract_status) }]}>
                {(item.contract_status || 'active').charAt(0).toUpperCase() + (item.contract_status || 'active').slice(1)}
              </Text>
            </View>
          </View>
          <View style={[styles.detailItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Since</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDate(item.contract_start_date)}
            </Text>
          </View>
        </View>

        {/* Monthly Rent Highlight */}
        <View style={[styles.rentSection, { 
          backgroundColor: isDarkMode ? 'rgba(48, 92, 222, 0.12)' : 'rgba(0, 33, 129, 0.04)',
          borderColor: isDarkMode ? 'rgba(48, 92, 222, 0.25)' : 'rgba(0, 33, 129, 0.1)',
        }]}>
          <View style={styles.rentLeft}>
            <Text style={[styles.rentLabel, { color: colors.textSecondary }]}>Monthly Rent</Text>
            <Text style={[styles.rentAmount, { color: colors.primary }]}>
              {formatCurrency(item.monthly_rent)}
            </Text>
          </View>
          <View style={styles.rentRight}>
            {item.next_payment_due && (
              <View style={styles.nextPaymentInfo}>
                {item.next_payment_due.is_current_month_paid ? (
                  <View style={[styles.paidBadge, { backgroundColor: isDarkMode ? 'rgba(30,156,0,0.15)' : 'rgba(30,156,0,0.1)' }]}>
                    <Text style={[styles.paidBadgeText, { color: colors.success }]}><Ionicons name="checkmark-circle" size={14} color={colors.success} /> Paid this month</Text>
                  </View>
                ) : (
                  <View style={[styles.dueBadge, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)' }]}>
                    <Text style={[styles.dueBadgeText, { color: colors.warning }]}>Due: {item.next_payment_due.month}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Last Payment Info */}
        {item.last_payment && (
          <View style={[styles.lastPaymentRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.lastPaymentLabel, { color: colors.textTertiary || colors.textSecondary }]}>
              Last payment:
            </Text>
            <Text style={[styles.lastPaymentValue, { color: colors.textSecondary }]}>
              {formatCurrency(item.last_payment.amount)} on {formatDate(item.last_payment.date)}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
        <Ionicons name="storefront-outline" size={48} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Stalls Found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {selectedBranch === 'all'
          ? "You don't have any rented stalls yet. Once your application is approved, your stalls will appear here."
          : "No stalls found in this branch. Try selecting a different branch."}
      </Text>
    </View>
  );

  // ============= LOADING STATE =============
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your stalls...</Text>
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
          onPress={() => fetchOwnedStalls()}
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
        keyExtractor={(item, index) => `stall-${item.stall_id || index}`}
        renderItem={renderStallCard}
        ListHeaderComponent={
          <>
            {renderSummaryHeader()}
            {branches.length > 0 && renderBranchFilter()}
            {filteredStalls.length > 0 && (
              <Animated.View style={[styles.resultCountRow, { opacity: fadeAnim }]}>
                <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                  Showing {filteredStalls.length} stall{filteredStalls.length !== 1 ? 's' : ''}
                  {selectedBranch !== 'all' ? ` in ${branches.find(b => String(b.branch_id) === String(selectedBranch))?.branch_name || 'branch'}` : ''}
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
  summaryIcon: {
    fontSize: 24,
  },
  summaryTitleGroup: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  summarySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 16,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },

  // ===== Branch Filter =====
  filterContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  filterScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // ===== Result Count =====
  resultCountRow: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ===== Stall Card =====
  stallCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
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
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  branchName: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ===== Stall Image =====
  stallImageContainer: {
    height: 140,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  stallImage: {
    width: '100%',
    height: '100%',
  },
  stallImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    minWidth: (width - 72) / 2,
    padding: 12,
    borderRadius: 10,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  // ===== Rent Section =====
  rentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rentLeft: {
    flex: 1,
  },
  rentLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rentAmount: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  rentRight: {
    alignItems: 'flex-end',
  },
  nextPaymentInfo: {
    alignItems: 'flex-end',
  },
  paidBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ===== Last Payment =====
  lastPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  lastPaymentLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 6,
  },
  lastPaymentValue: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ===== Empty State =====
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ===== Loading State =====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 28,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default OwnedStallsScreen;
