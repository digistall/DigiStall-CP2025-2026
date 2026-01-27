import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Animated } from "react-native";
import { styles } from "./PaymentTableStyles";
import ViewAllTable from "./ViewAllTable";
import ApiService from "@stall-holder-mobile/SERVICES/ApiService";
import UserStorageService from "@stall-holder-mobile/SERVICES/UserStorageService";
import { Ionicons } from "@expo/vector-icons";

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1F2937',
    textSecondary: '#6b7280',
    border: '#F3F4F6',
    background: '#FAFBFC',
    primary: '#305CDE',
  }
};

const PaymentTable = ({ selectedPaymentMethod, theme = defaultTheme, isDark = false }) => {
  const colors = theme?.colors || defaultTheme.colors;
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [allPaymentRecords, setAllPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status first
  const checkAuth = useCallback(async () => {
    try {
      const token = await UserStorageService.getAuthToken();
      const userData = await UserStorageService.getUserData();
      
      console.log('🔐 Payment - Token available:', !!token);
      console.log('🔐 Payment - User data available:', !!userData);
      
      if (token && userData) {
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        setError('Please log in to view payment records');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('❌ Error checking auth:', err);
      setIsAuthenticated(false);
      setError('Authentication error');
      setLoading(false);
      return false;
    }
  }, []);

  // Fetch payment records on component mount
  const fetchPaymentRecords = useCallback(async () => {
    try {
      setError(null);
      
      // Check auth first
      const isAuth = await checkAuth();
      if (!isAuth) {
        return;
      }
      
      console.log('📋 Fetching payment records...');
      
      // Fetch paginated records for main view (first 8)
      const response = await ApiService.getPaymentRecords(1, 8);
      
      if (response.success) {
        setPaymentRecords(response.data);
        console.log('✅ Payment records loaded:', response.data.length);
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
  }, [checkAuth]);

  // Fetch all records for the modal
  const fetchAllPaymentRecords = async () => {
    try {
      console.log('📋 Fetching all payment records for modal...');
      const response = await ApiService.getAllPaymentRecords();
      
      if (response.success) {
        setAllPaymentRecords(response.data);
        console.log('✅ All payment records loaded:', response.data.length);
      } else {
        console.error('❌ Failed to fetch all payment records:', response.message);
      }
    } catch (err) {
      console.error('❌ Error fetching all payment records:', err);
    }
  };

  useEffect(() => {
    fetchPaymentRecords();
  }, [fetchPaymentRecords]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPaymentRecords();
  }, [fetchPaymentRecords]);


  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return "#1E9C00";
      case "pending":
        return "#F59E0B";
      case "failed":
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "failed":
      case "cancelled":
        return "close-circle";
      default:
        return "ellipse";
    }
  };

  const getMethodColor = (method) => {
    switch (method?.toLowerCase()) {
      case "gcash":
        return "#007DFE";
      case "paymaya":
      case "maya":
        return "#00D632";
      case "bank transfer":
      case "bank_transfer":
        return "#FF6B35";
      case "onsite":
        return "#305CDE";
      case "online":
        return "#06B6D4";
      case "check":
        return "#EC4899";
      default:
        return "#6B7280";
    }
  };

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case "gcash":
      case "paymaya":
      case "maya":
        return "phone-portrait";
      case "bank transfer":
      case "bank_transfer":
        return "business";
      case "onsite":
        return "storefront";
      case "online":
        return "globe";
      case "check":
        return "document-text";
      default:
        return "card";
    }
  };

  const getRecordIconBg = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return "#ECFDF5";
      case "pending":
        return "#FEF3C7";
      case "failed":
      case "cancelled":
        return "#FEF2F2";
      default:
        return "#F3F4F6";
    }
  };

  const renderPaymentRecord = (record, index) => (
    <TouchableOpacity 
      key={record.id} 
      style={[
        styles.recordCard, 
        { 
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#F1F5F9',
        }
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.recordHeader}>
        {/* Record Icon */}
        <View style={[styles.recordIconContainer, { backgroundColor: getRecordIconBg(record.status) }]}>
          <Ionicons 
            name={getStatusIcon(record.status)} 
            size={22} 
            color={getStatusColor(record.status)} 
          />
        </View>
        
        {/* Main Info */}
        <View style={styles.recordMainInfo}>
          <Text style={[styles.recordDescription, { color: colors.text }]}>{record.description}</Text>
          <Text style={[styles.recordDateInline, { color: colors.textSecondary }]}>{record.date}</Text>
        </View>
        
        {/* Amount */}
        <View style={styles.recordAmountContainer}>
          <Text style={styles.recordAmountLabel}>Amount</Text>
          <Text style={styles.recordAmount}>{record.amount}</Text>
        </View>
      </View>

      <View style={[styles.recordDetails, { borderTopColor: isDark ? colors.border : '#F3F4F6' }]}>
        <View style={styles.recordFooter}>
          <Ionicons name="receipt-outline" size={12} color="#9CA3AF" style={styles.referenceIcon} />
          <Text style={styles.referenceText}>{record.reference}</Text>
        </View>
        <View style={styles.recordMeta}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(record.status) },
            ]}
          >
            <Ionicons name={getStatusIcon(record.status)} size={12} color="#fff" style={styles.statusIcon} />
            <Text style={styles.statusText}>{record.status}</Text>
          </View>
          <View
            style={[
              styles.methodBadge,
              { backgroundColor: getMethodColor(record.method) },
            ]}
          >
            <Ionicons name={getMethodIcon(record.method)} size={12} color="#fff" style={styles.methodIcon} />
            <Text style={styles.methodText}>{record.method}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleViewAllPress = async () => {
    // Fetch all records when opening the modal
    await fetchAllPaymentRecords();
    setShowViewAllModal(true);
  };

  const handleCloseModal = () => {
    setShowViewAllModal(false);
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? 'rgba(0, 33, 129, 0.05)' : 'rgba(0, 33, 129, 0.03)' }]}>
          <View style={styles.tableTitleContainer}>
            <View style={[styles.tableTitleIcon, { backgroundColor: isDark ? 'rgba(48, 92, 222, 0.2)' : '#E8EEF9' }]}>
              <Ionicons name="time-outline" size={18} color="#305CDE" />
            </View>
            <Text style={[styles.tableTitle, { color: colors.text }]}>
              Transaction History
            </Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingIconContainer, { backgroundColor: isDark ? 'rgba(48, 92, 222, 0.2)' : '#E8EEF9' }]}>
            <ActivityIndicator size="large" color="#305CDE" />
          </View>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading payment records...</Text>
          <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>Please wait a moment</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    const isAuthError = error.toLowerCase().includes('authentication') || error.toLowerCase().includes('token') || error.toLowerCase().includes('log in');
    
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? 'rgba(0, 33, 129, 0.05)' : 'rgba(0, 33, 129, 0.03)' }]}>
          <View style={styles.tableTitleContainer}>
            <View style={[styles.tableTitleIcon, { backgroundColor: isDark ? 'rgba(48, 92, 222, 0.2)' : '#E8EEF9' }]}>
              <Ionicons name="time-outline" size={18} color="#305CDE" />
            </View>
            <Text style={[styles.tableTitle, { color: colors.text }]}>
              Transaction History
            </Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconContainer, { backgroundColor: isAuthError ? '#FEF3C7' : '#FEF2F2' }]}>
            <Ionicons 
              name={isAuthError ? "log-in-outline" : "alert-circle-outline"} 
              size={36} 
              color={isAuthError ? "#F59E0B" : "#EF4444"} 
            />
          </View>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {isAuthError ? "Session Expired" : "Something went wrong"}
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            {isAuthError 
              ? "Please log out and log in again to view your payment records." 
              : error}
          </Text>
          {!isAuthError && (
            <TouchableOpacity style={styles.retryButton} onPress={fetchPaymentRecords}>
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Empty state
  if (paymentRecords.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? 'rgba(0, 33, 129, 0.05)' : 'rgba(0, 33, 129, 0.03)' }]}>
          <View style={styles.tableTitleContainer}>
            <View style={[styles.tableTitleIcon, { backgroundColor: isDark ? 'rgba(48, 92, 222, 0.2)' : '#E8EEF9' }]}>
              <Ionicons name="time-outline" size={18} color="#305CDE" />
            </View>
            <Text style={[styles.tableTitle, { color: colors.text }]}>
              Transaction History
            </Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.surface : '#F3F4F6' }]}>
            <Ionicons name="receipt-outline" size={40} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>No payment records yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Your transaction history will appear here once you make a payment
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? 'rgba(0, 33, 129, 0.05)' : 'rgba(0, 33, 129, 0.03)' }]}>
        <View style={styles.tableTitleContainer}>
          <View style={[styles.tableTitleIcon, { backgroundColor: isDark ? 'rgba(48, 92, 222, 0.2)' : '#E8EEF9' }]}>
            <Ionicons name="time-outline" size={18} color="#305CDE" />
          </View>
          <Text style={[styles.tableTitle, { color: colors.text }]}>
            Transaction History
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: isDark ? colors.surface : '#F8FAFC', borderColor: colors.border }]}
          onPress={handleViewAllPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewAllText, { color: colors.textSecondary }]}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.recordsList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#305CDE"]}
            tintColor="#305CDE"
          />
        }
      >
        {paymentRecords.map((record, index) => renderPaymentRecord(record, index))}
        
        {/* Records count */}
        <View style={[styles.recordsCountContainer, { borderTopColor: colors.border }]}>
          <Text style={styles.recordsCountText}>
            Showing {paymentRecords.length} recent transaction{paymentRecords.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </ScrollView>

      {/* View All Modal */}
      <ViewAllTable
        visible={showViewAllModal}
        onClose={handleCloseModal}
        paymentRecords={allPaymentRecords}
        selectedPaymentMethod={selectedPaymentMethod}
        theme={theme}
      />
    </View>
  );
};

export default PaymentTable;
