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

const ProfileScreen = () => {
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
      console.error('Error loading vendor profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, []);

  const vendor = userData?.vendor;

  const getInitials = () => {
    if (!vendor?.full_name) return 'V';
    const names = vendor.full_name.trim().split(' ').filter((n) => n.length > 0);
    if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    if (names.length === 1) return names[0][0].toUpperCase();
    return 'V';
  };

  const profileFields = [
    { label: 'Full Name', value: vendor?.full_name, icon: 'person' },
    { label: 'Email', value: vendor?.email, icon: 'mail' },
    { label: 'Contact Number', value: vendor?.contact_number, icon: 'call' },
    { label: 'Address', value: vendor?.address, icon: 'location' },
    { label: 'Gender', value: vendor?.gender, icon: 'male-female' },
    { label: 'Civil Status', value: vendor?.civil_status, icon: 'heart' },
    {
      label: 'Birthdate',
      value: vendor?.birthdate
        ? new Date(vendor.birthdate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : null,
      icon: 'calendar',
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
      {/* Avatar Header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
        <Text style={[styles.nameText, { color: theme.colors.text }]}>
          {vendor?.full_name || 'Vendor'}
        </Text>
        <Text style={[styles.emailText, { color: theme.colors.textSecondary }]}>
          {vendor?.email || ''}
        </Text>
      </View>

      {/* Profile Details */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Personal Information
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          {profileFields.map((field, index) => (
            <View key={field.label}>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name={field.icon} size={18} color="#1d4ed8" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                    {field.label}
                  </Text>
                  <Text style={[styles.fieldValue, { color: theme.colors.text }]}>
                    {field.value || 'N/A'}
                  </Text>
                </View>
              </View>
              {index < profileFields.length - 1 && <View style={styles.fieldDivider} />}
            </View>
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
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
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  fieldIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 62,
  },
});

export default ProfileScreen;
