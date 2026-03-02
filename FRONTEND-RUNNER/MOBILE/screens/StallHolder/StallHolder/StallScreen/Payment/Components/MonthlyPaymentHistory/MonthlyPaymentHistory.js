import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ApiService from "../../../../../../../services/ApiService";
import { styles } from "./MonthlyPaymentHistoryStyles";

const { height } = Dimensions.get("window");

const MonthlyPaymentHistory = ({ visible, onClose, theme, isDark }) => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [groupedPayments, setGroupedPayments] = useState({});

  const colors = theme?.colors || {
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1F2937',
    textSecondary: '#6b7280',
    border: '#F3F4F6',
    background: '#FAFBFC',
    primary: '#305CDE',
  };

  const fetchAllPayments = useCallback(async () => {
    try {
      setError(null);
      console.log('📋 Fetching all payment records for monthly history...');
      
      const response = await ApiService.getAllPaymentRecords();
      
      if (response.success) {
        setPaymentRecords(response.data || []);
        
        // Group payments by month
        const grouped = groupPaymentsByMonth(response.data || []);

        // Always inject the current month as UNPAID if it's not already present
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!grouped[currentMonthKey]) {
          // Prepend current month at the top (newest first)
          const injected = {};
          injected[currentMonthKey] = {
            month: currentMonthKey,
            monthName: formatMonthName(currentMonthKey),
            payments: [],
            totalPaid: 0,
            hasPaid: false,
            hasPending: false,
            isCurrentMonth: true,
          };
          Object.assign(injected, grouped);
          setGroupedPayments(injected);
        } else {
          grouped[currentMonthKey].isCurrentMonth = true;
          setGroupedPayments(grouped);
        }
        
        console.log('✅ All payment records loaded:', response.data?.length || 0);
      } else {
        setError(response.message || 'Failed to load payment records');
        console.error('❌ Failed to fetch payment records:', response.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('❌ Error fetching payment records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchAllPayments();
    }
  }, [visible, fetchAllPayments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllPayments();
  }, [fetchAllPayments]);

  // Group payments by month (YYYY-MM)
  const groupPaymentsByMonth = (payments) => {
    const grouped = {};
    
    payments.forEach(payment => {
      // Try to get month from paymentForMonth or parse from date
      let monthKey = payment.paymentForMonth;
      
      if (!monthKey && payment.date) {
        // Parse date like "2026-03-01" or "Mar 1, 2026"
        const dateObj = new Date(payment.date);
        if (!isNaN(dateObj.getTime())) {
          monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        }
      }
      
      if (!monthKey) {
        monthKey = 'Unknown';
      }
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: monthKey,
          monthName: formatMonthName(monthKey),
          payments: [],
          totalPaid: 0,
          hasPaid: false,
          hasPending: false,
        };
      }
      
      grouped[monthKey].payments.push(payment);
      
      // Calculate totals and status
      const status = payment.status?.toLowerCase();
      if (status === 'paid' || status === 'completed') {
        grouped[monthKey].totalPaid += payment.rawAmount || 0;
        grouped[monthKey].hasPaid = true;
      } else if (status === 'pending') {
        grouped[monthKey].hasPending = true;
      }
    });
    
    // Sort months in descending order (newest first)
    const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    const sortedGrouped = {};
    sortedKeys.forEach(key => {
      sortedGrouped[key] = grouped[key];
    });
    
    return sortedGrouped;
  };

  const formatMonthName = (monthKey) => {
    if (monthKey === 'Unknown') return 'Unknown Date';
    
    const [year, month] = monthKey.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[parseInt(month) - 1] || month;
    return `${monthName} ${year}`;
  };

  const getMonthStatus = (monthData) => {
    if (monthData.hasPaid) {
      return { status: 'paid', color: '#10B981', icon: 'checkmark-circle', label: 'PAID' };
    } else if (monthData.hasPending) {
      return { status: 'pending', color: '#F59E0B', icon: 'time', label: 'PENDING' };
    } else {
      return { status: 'unpaid', color: '#EF4444', icon: 'alert-circle', label: 'UNPAID' };
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return '₱' + num.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const renderMonthCard = (monthKey, monthData) => {
    const statusInfo = getMonthStatus(monthData);
    
    return (
      <View 
        key={monthKey} 
        style={[
          styles.monthCard,
          { 
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#F1F5F9',
          }
        ]}
      >
        {/* Month Header */}
        <View style={styles.monthHeader}>
          <View style={styles.monthTitleContainer}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {monthData.monthName}
            </Text>
            {monthData.isCurrentMonth && (
              <View style={styles.currentMonthBadge}>
                <Text style={styles.currentMonthBadgeText}>Current</Text>
              </View>
            )}
          </View>
          <View style={[styles.monthStatusBadge, { backgroundColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon} size={12} color="#FFFFFF" />
            <Text style={styles.monthStatusText}>{statusInfo.label}</Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.monthSummary}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Transactions
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {monthData.payments.length}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total Paid
            </Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {formatCurrency(monthData.totalPaid)}
            </Text>
          </View>
        </View>

        {/* Individual Payments */}
        {monthData.payments.map((payment, index) => (
          <View 
            key={payment.id || index} 
            style={[
              styles.paymentItem,
              { borderTopColor: colors.border }
            ]}
          >
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentDescription, { color: colors.text }]}>
                {payment.description || 'Payment'}
              </Text>
              <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                {payment.date} • {payment.method || 'N/A'}
              </Text>
            </View>
            <View style={styles.paymentAmountContainer}>
              <Text style={[styles.paymentAmount, { color: colors.text }]}>
                {payment.amount}
              </Text>
              <View style={[
                styles.paymentStatusDot,
                { backgroundColor: getPaymentStatusColor(payment.status) }
              ]} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      default:
        return '#EF4444';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#001050', '#002181'] : ['#002181', '#305CDE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Monthly Payment History</Text>
            <Text style={styles.headerSubtitle}>
              View your payment records by month
            </Text>
          </View>
        </LinearGradient>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading payment history...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : false ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No payment records found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Your monthly payment history will appear here
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {/* Summary Stats */}
            <View style={[styles.statsContainer, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {Object.keys(groupedPayments).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Months
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {paymentRecords.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Payments
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {formatCurrency(
                    paymentRecords.reduce((sum, p) => sum + (p.rawAmount || 0), 0)
                  )}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Total Paid
                </Text>
              </View>
            </View>

            {/* Month Cards */}
            {Object.entries(groupedPayments).map(([monthKey, monthData]) => 
              renderMonthCard(monthKey, monthData)
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

export default MonthlyPaymentHistory;
