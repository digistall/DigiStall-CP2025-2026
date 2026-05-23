import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  Animated,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ApiService from "../../../../../../services/ApiService";
import { styles } from "./MonthlyPaymentIndicatorStyles";

const getStatusConfigForStall = (stall, isDark) => {
  if (!stall) return {};

  if (stall.isPaid) {
    return {
      icon: "checkmark-circle",
      iconColor: "#10B981",
      gradientColors: isDark 
        ? ['#064E3B', '#065F46', '#047857'] 
        : ['#ECFDF5', '#D1FAE5', '#A7F3D0'],
      textColor: isDark ? '#10B981' : '#065F46',
      badgeColor: '#10B981',
      badgeTextColor: '#FFFFFF',
      statusLabel: 'PAID',
      borderColor: isDark ? '#065F46' : '#A7F3D0'
    };
  } else if (stall.isPending) {
    return {
      icon: "time",
      iconColor: "#F59E0B",
      gradientColors: isDark 
        ? ['#78350F', '#92400E', '#B45309'] 
        : ['#FFFBEB', '#FEF3C7', '#FDE68A'],
      textColor: isDark ? '#FBBF24' : '#92400E',
      badgeColor: '#F59E0B',
      badgeTextColor: '#FFFFFF',
      statusLabel: 'PENDING',
      borderColor: isDark ? '#B45309' : '#FDE68A'
    };
  } else {
    return {
      icon: "alert-circle",
      iconColor: "#EF4444",
      gradientColors: isDark 
        ? ['#7F1D1D', '#991B1B', '#B91C1C'] 
        : ['#FEF2F2', '#FEE2E2', '#FECACA'],
      textColor: isDark ? '#F87171' : '#991B1B',
      badgeColor: '#EF4444',
      badgeTextColor: '#FFFFFF',
      statusLabel: 'UNPAID',
      borderColor: isDark ? '#B91C1C' : '#FECACA'
    };
  }
};

const StallPaymentCard = ({ stall, monthName, isDark, isLast }) => {
  const config = getStatusConfigForStall(stall, isDark);

  return (
    <View style={isLast ? {} : { marginBottom: 12 }}>
      <LinearGradient
        colors={config.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientContainer, { borderColor: config.borderColor }]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.monthContainer}>
            <Ionicons name="calendar-outline" size={16} color={config.textColor} />
            <Text style={[styles.monthLabel, { color: config.textColor }]}>
              {monthName}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.badgeColor }]}>
            <Ionicons name={config.icon} size={14} color={config.badgeTextColor} />
            <Text style={[styles.statusBadgeText, { color: config.badgeTextColor }]}>
              {config.statusLabel}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.iconContainer}>
            <Ionicons name={config.icon} size={40} color={config.iconColor} />
          </View>
          
          <View style={styles.detailsContainer}>
            <Text style={[styles.statusMessage, { color: config.textColor }]}>
              {stall.statusMessage}
            </Text>
            
            {/* Amount Display */}
            {stall.isUnpaid || stall.isPending ? (
              <View style={styles.amountRow}>
                <Text style={[styles.amountLabel, { color: config.textColor, opacity: 0.8 }]}>
                  Amount Due:
                </Text>
                <Text style={[styles.amountValue, { color: config.textColor }]}>
                  {stall.amountDue}
                </Text>
              </View>
            ) : (
              <View style={styles.amountRow}>
                <Text style={[styles.amountLabel, { color: config.textColor, opacity: 0.8 }]}>
                  Paid on:
                </Text>
                <Text style={[styles.amountValue, { color: config.textColor }]}>
                  {stall.paymentDate}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <Ionicons name="business-outline" size={12} color={config.textColor} style={{ opacity: 0.7 }} />
            <Text style={[styles.footerText, { color: config.textColor, opacity: 0.7 }]}>
              Stall: {stall.stallNumber}
            </Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
            <Ionicons name="cash-outline" size={12} color={config.textColor} style={{ opacity: 0.7 }} />
            <Text style={[styles.footerText, { color: config.textColor, opacity: 0.7 }]}>
              Rent: {stall.monthlyRent}
            </Text>
          </View>
          {(stall.isUnpaid || stall.isPending) && (
            <>
              <View style={styles.footerDivider} />
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={12} color={config.textColor} style={{ opacity: 0.7 }} />
                <Text style={[styles.footerText, { color: config.textColor, opacity: 0.7 }]}>
                  Due: {stall.dueDate}
                </Text>
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const MonthlyPaymentIndicator = ({ theme, isDark, onRefresh, onViewAllMonths }) => {
  const [monthlyStatus, setMonthlyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  const fetchMonthlyStatus = useCallback(async () => {
    try {
      setError(null);
      console.log('📅 Fetching monthly payment status...');
      
      const response = await ApiService.getMonthlyPaymentStatus();
      
      if (response.success) {
        setMonthlyStatus(response.data);
        console.log('✅ Monthly status loaded:', response.data);
      } else {
        setError(response.message || 'Failed to load payment status');
        console.error('❌ Failed to fetch monthly status:', response.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('❌ Error fetching monthly status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthlyStatus();
    
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [fetchMonthlyStatus]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMonthlyStatus();
    if (onRefresh) onRefresh();
  }, [fetchMonthlyStatus, onRefresh]);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.colors?.card || '#FFFFFF' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#305CDE" />
          <Text style={[styles.loadingText, { color: theme?.colors?.textSecondary }]}>
            Loading payment status...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.colors?.card || '#FFFFFF' }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <Text style={[styles.errorText, { color: theme?.colors?.text }]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!monthlyStatus) return null;

  // Determine which stalls to render
  const stalls = monthlyStatus.stalls && monthlyStatus.stalls.length > 0 
    ? monthlyStatus.stalls 
    : [monthlyStatus]; // Backward-compatible: wrap single object in array

  // Check if any stall has unpaid violations
  const hasViolation = stalls.some(s => s.hasViolation);
  const violationCount = stalls[0]?.unpaidViolationsCount || 0;

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {/* Violation Warning Banner - shown when ANY stall has unpaid violations */}
      {hasViolation && (
        <View style={{
          backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
          borderWidth: 1.5,
          borderColor: isDark ? '#DC2626' : '#FECACA',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}>
            <Ionicons name="warning" size={24} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '700',
              color: isDark ? '#FCA5A5' : '#991B1B',
              marginBottom: 2,
            }}>
              Unpaid Violation{violationCount > 1 ? 's' : ''} ({violationCount})
            </Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '500',
              color: isDark ? '#FCA5A5' : '#B91C1C',
              opacity: 0.85,
              lineHeight: 16,
            }}>
              You have unpaid violation{violationCount > 1 ? 's' : ''}. Rental payments cannot be processed until {violationCount > 1 ? 'these are' : 'this is'} settled.
            </Text>
          </View>
        </View>
      )}

      {stalls.map((stall, index) => (
        <StallPaymentCard
          key={stall.stallholderId || stall.stallId || index}
          stall={stall}
          monthName={monthlyStatus.currentMonthName}
          isDark={isDark}
          isLast={index === stalls.length - 1}
        />
      ))}

      {/* View All Months Button (once, below all cards) */}
      <TouchableOpacity 
        style={[styles.viewAllMonthsButton, { borderColor: isDark ? '#6B7280' : '#D1D5DB' }]}
        onPress={onViewAllMonths}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar" size={16} color={isDark ? '#9CA3AF' : '#4B5563'} />
        <Text style={[styles.viewAllMonthsText, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
          View Monthly Payment History
        </Text>
        <Ionicons name="chevron-forward" size={16} color={isDark ? '#9CA3AF' : '#4B5563'} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default MonthlyPaymentIndicator;
