import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../components/ThemeComponents/ThemeContext';
import UserStorageService from '../../../services/UserStorageService';

const { width } = Dimensions.get('window');

const BusinessScreen = () => {
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
      console.error('Error loading business data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, []);

  const business = userData?.business;

  const businessFields = [
    { label: 'Business Name', value: business?.business_name, icon: 'storefront', color: '#1d4ed8', bgColor: '#dbeafe' },
    { label: 'Business Type', value: business?.business_type, icon: 'pricetag', color: '#059669', bgColor: '#d1fae5' },
    { label: 'Products', value: business?.products, icon: 'cube', color: '#d97706', bgColor: '#fef3c7' },
    { label: 'Description', value: business?.business_description, icon: 'document-text', color: '#7c3aed', bgColor: '#ede9fe' },
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
      {/* Business Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Ionicons name="briefcase" size={36} color="#1d4ed8" />
        </View>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {business?.business_name || 'Your Business'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {business?.business_type || 'Business details'}
        </Text>
      </View>

      {/* Business Details */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Business Details
        </Text>

        {businessFields.map((field, index) => (
          <View
            key={field.label}
            style={[styles.card, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: field.bgColor }]}>
                <Ionicons name={field.icon} size={20} color={field.color} />
              </View>
              <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>
                {field.label}
              </Text>
            </View>
            <Text style={[styles.cardValue, { color: theme.colors.text }]}>
              {field.value || 'Not specified'}
            </Text>
          </View>
        ))}
      </View>

      {/* Empty state if no business */}
      {!business && (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="briefcase-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
            No Business Information
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Business details will appear here once configured.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionContainer: {
    paddingHorizontal: width * 0.04,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 48,
    lineHeight: 22,
  },
  emptyState: {
    marginHorizontal: width * 0.04,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default BusinessScreen;
