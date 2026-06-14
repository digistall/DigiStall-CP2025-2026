import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../components/ThemeComponents/ThemeContext';
import UserStorageService from '../../../services/UserStorageService';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ onNavigate }) => {
  const { theme, isDark } = useTheme();
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await UserStorageService.getUserData();
      setUserData(data);
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setRefreshing(false);
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
      id: 'business',
      title: 'Business Info',
      subtitle: 'Manage your business',
      icon: 'briefcase',
      color: ['#10b981', '#059669'],
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences',
      icon: 'settings',
      color: ['#8b5cf6', '#7c3aed'],
    },
  ];

  const vendor = userData?.vendor;
  const business = userData?.business;

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

      {/* Business Summary Card */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Business Summary</Text>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="briefcase" size={24} color="#1d4ed8" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Business Name
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {business?.business_name || 'Not set'}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="pricetag" size={24} color="#059669" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Business Type
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {business?.business_type || 'Not set'}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="cube" size={24} color="#d97706" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Products
              </Text>
              <Text
                style={[styles.summaryValue, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {business?.products || 'Not set'}
              </Text>
            </View>
          </View>
        </View>
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
