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

  // Removed pulse animation for cleaner look

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMonthlyStatus();
    if (onRefresh) onRefresh();
  }, [fetchMonthlyStatus, onRefresh]);

  const getStatusConfig = () => {
    if (!monthlyStatus) return {};
    
    if (monthlyStatus.isPaid) {
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
    } else if (monthlyStatus.isPending) {
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

  const config = getStatusConfig();

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
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
              {monthlyStatus.currentMonthName}
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
              {monthlyStatus.statusMessage}
            </Text>
            
            {/* Amount Display */}
            {monthlyStatus.isUnpaid || monthlyStatus.isPending ? (
              <View style={styles.amountRow}>
                <Text style={[styles.amountLabel, { color: config.textColor, opacity: 0.8 }]}>
                  Amount Due:
                </Text>
                <Text style={[styles.amountValue, { color: config.textColor }]}>
                  {monthlyStatus.amountDue}
                </Text>
              </View>
            ) : (
              <View style={styles.amountRow}>
                <Text style={[styles.amountLabel, { color: config.textColor, opacity: 0.8 }]}>
                  Paid on:
                </Text>
                <Text style={[styles.amountValue, { color: config.textColor }]}>
                  {monthlyStatus.paymentDate}
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
              Stall: {monthlyStatus.stallNumber}
            </Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
            <Ionicons name="cash-outline" size={12} color={config.textColor} style={{ opacity: 0.7 }} />
            <Text style={[styles.footerText, { color: config.textColor, opacity: 0.7 }]}>
              Rent: {monthlyStatus.monthlyRent}
            </Text>
          </View>
          {(monthlyStatus.isUnpaid || monthlyStatus.isPending) && (
            <>
              <View style={styles.footerDivider} />
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={12} color={config.textColor} style={{ opacity: 0.7 }} />
                <Text style={[styles.footerText, { color: config.textColor, opacity: 0.7 }]}>
                  Due: {monthlyStatus.dueDate}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* View All Months Button */}
        <TouchableOpacity 
          style={[styles.viewAllMonthsButton, { borderColor: config.textColor }]}
          onPress={onViewAllMonths}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar" size={16} color={config.textColor} />
          <Text style={[styles.viewAllMonthsText, { color: config.textColor }]}>
            View Monthly Payment History
          </Text>
          <Ionicons name="chevron-forward" size={16} color={config.textColor} />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

export default MonthlyPaymentIndicator;
