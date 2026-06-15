import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../components/ThemeComponents/ThemeContext';
import UserStorageService from '../../../services/UserStorageService';
import ApiService from '../../../services/ApiService';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ onNavigate }) => {
  const { theme, isDark } = useTheme();
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await UserStorageService.getUserData();
      setUserData(data);
      if (data?.vendor?.vendor_id) {
        await loadPaymentSummary(data.vendor.vendor_id);
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setRefreshing(false);
      setSummaryLoading(false);
    }
  };

  const loadPaymentSummary = async (vendorId) => {
    try {
      const response = await ApiService.getVendorPaymentSummary(vendorId);
      if (response.success) {
        setPaymentSummary(response.data);
      }
    } catch (error) {
      console.error('Error loading payment summary:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, []);

  const getVendorName = () => {
    if (!userData) return 'Vendor';
    return userData.vendor?.full_name || userData.vendor?.first_name || 'Vendor';
  };

  const getFirstName = () => {
    const fullName = getVendorName();
    return fullName.split(' ')[0];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    {
      id: 'payments',
      title: 'My Payments',
      subtitle: 'View payment history',
      icon: 'receipt',
      color: ['#10b981', '#059669'],
    },
    {
      id: 'myqrcode',
      title: 'My QR Code',
      subtitle: 'Show for payment',
      icon: 'qr-code',
      color: ['#f59e0b', '#d97706'],
    },
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'View your details',
      icon: 'person',
      color: ['#3b82f6', '#1d4ed8'],
    },
    {
      id: 'documents',
      title: 'Documents',
      subtitle: 'Upload & manage',
      icon: 'document-text',
      color: ['#8b5cf6', '#7c3aed'],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1d4ed8']}
          tintColor="#1d4ed8"
        />
      }
    >
      {/* Welcome Section */}
      <LinearGradient
        colors={['#1d4ed8', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeCard}
      >
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
          <Text style={styles.welcomeName}>{getFirstName()}! 🏪</Text>
          <Text style={styles.welcomeSubtext}>
            Welcome to your vendor portal. Manage your profile and business information.
          </Text>
        </View>
        <View style={styles.welcomeIconContainer}>
          <Ionicons name="storefront" size={80} color="rgba(255,255,255,0.3)" />
        </View>
      </LinearGradient>

      {/* Payment Status Card */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payment Status</Text>
        <TouchableOpacity
          style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}
          onPress={() => onNavigate && onNavigate('payments')}
          activeOpacity={0.8}
        >
          {summaryLoading ? (
            <View style={styles.summaryLoading}>
              <ActivityIndicator size="small" color="#1d4ed8" />
              <Text style={[styles.summaryLoadingText, { color: theme.colors.textSecondary }]}>
                Loading payment data...
              </Text>
            </View>
          ) : (
            <>
              {/* Today's status */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIconContainer, {
                  backgroundColor: paymentSummary?.today?.hasPaid ? '#d1fae5' : '#fef3c7'
                }]}>
                  <Ionicons
                    name={paymentSummary?.today?.hasPaid ? 'checkmark-circle' : 'time'}
                    size={24}
                    color={paymentSummary?.today?.hasPaid ? '#059669' : '#d97706'}
                  />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    Today
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                    {paymentSummary?.today?.hasPaid
                      ? `₱${paymentSummary.today.amount.toFixed(2)} — Paid`
                      : paymentSummary?.today?.status === 'missing'
                        ? 'Marked Missing'
                        : 'Not yet collected'}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              {/* This month */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="calendar" size={24} color="#1d4ed8" />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    This Month
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                    {paymentSummary?.thisMonth?.completedCount || 0} payments • ₱{(paymentSummary?.thisMonth?.totalAmount || 0).toFixed(0)}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              {/* All time */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIconContainer, { backgroundColor: '#ede9fe' }]}>
                  <Ionicons name="stats-chart" size={24} color="#7c3aed" />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    Total Collected
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                    ₱{(paymentSummary?.allTime?.totalAmount || 0).toFixed(0)} ({paymentSummary?.allTime?.completedCount || 0} payments)
                  </Text>
                </View>
              </View>
              {/* Tap hint */}
              <View style={styles.tapHintRow}>
                <Text style={[styles.tapHint, { color: theme.colors.textSecondary }]}>
                  Tap to view full history
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={[styles.sectionContainer, styles.lastSection]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => onNavigate && onNavigate(action.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={action.color}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Ionicons name={action.icon} size={32} color="#ffffff" />
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeCard: {
    margin: width * 0.04,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  welcomeContent: {
    flex: 1,
    paddingRight: 16,
  },
  welcomeGreeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  welcomeName: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    lineHeight: 20,
  },
  welcomeIconContainer: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.3,
  },
  sectionContainer: {
    paddingHorizontal: width * 0.04,
    marginBottom: 16,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 60,
  },
  summaryLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  summaryLoadingText: {
    fontSize: 13,
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    gap: 4,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - width * 0.12) / 2,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    padding: 20,
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});

export default DashboardScreen;
