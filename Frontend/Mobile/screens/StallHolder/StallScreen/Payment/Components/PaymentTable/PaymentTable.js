import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { styles } from "./PaymentTableStyles";
import ViewAllTable from "./ViewAllTable";
import ApiService from "../../../../../../services/ApiService";
import UserStorageService from "../../../../../../services/UserStorageService";
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
    primary: '#007AFF',
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
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "failed":
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
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
        return "#8B5CF6";
      case "online":
        return "#06B6D4";
      case "check":
        return "#EC4899";
      default:
        return "#6B7280";
    }
  };

  const renderPaymentRecord = (record) => (
    <TouchableOpacity key={record.id} style={[styles.recordCard, { backgroundColor: isDark ? colors.surface : '#FAFBFC' }]}>
      <View style={styles.recordHeader}>
        <Text style={[styles.recordDescription, { color: colors.text }]}>{record.description}</Text>
        <Text style={styles.recordAmount}>{record.amount}</Text>
      </View>

      <View style={styles.recordDetails}>
        <Text style={[styles.recordDate, { color: colors.textSecondary }]}>{record.date}</Text>
        <View style={styles.recordMeta}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(record.status) },
            ]}
          >
            <Text style={styles.statusText}>{record.status}</Text>
          </View>
          <View
            style={[
              styles.methodBadge,
              { backgroundColor: getMethodColor(record.method) },
            ]}
          >
            <Text style={styles.methodText}>{record.method}</Text>
          </View>
        </View>
      </View>

      <View style={styles.recordFooter}>
        <Text style={styles.referenceText}>Ref: {record.reference}</Text>
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
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>
            Transaction History
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || "#007AFF"} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading payment records...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    const isAuthError = error.toLowerCase().includes('authentication') || error.toLowerCase().includes('token') || error.toLowerCase().includes('log in');
    
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>
            Transaction History
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons 
            name={isAuthError ? "log-in-outline" : "alert-circle-outline"} 
            size={48} 
            color={isAuthError ? "#F59E0B" : "#EF4444"} 
          />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {isAuthError ? "Session Expired" : "Error"}
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            {isAuthError 
              ? "Please log out and log in again to view your payment records." 
              : error}
          </Text>
          {!isAuthError && (
            <TouchableOpacity style={styles.retryButton} onPress={fetchPaymentRecords}>
              <Text style={styles.retryButtonText}>Retry</Text>
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
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>
            Transaction History
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No payment records found</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Your payment history will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.tableTitle, { color: colors.text }]}>
          Transaction History
        </Text>
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: isDark ? colors.surface : '#F8FAFC', borderColor: colors.border }]}
          onPress={handleViewAllPress}
        >
          <Text style={[styles.viewAllText, { color: colors.textSecondary }]}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.recordsList}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary || "#007AFF"]}
            tintColor={colors.primary || "#007AFF"}
          />
        }
      >
        {paymentRecords.map(renderPaymentRecord)}
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
