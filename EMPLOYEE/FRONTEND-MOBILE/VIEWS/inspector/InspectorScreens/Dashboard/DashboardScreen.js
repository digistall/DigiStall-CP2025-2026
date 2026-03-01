import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import UserStorageService from "@employee-mobile/SERVICES/UserStorageService";
import { useTheme } from "@shared-mobile/COMPONENTS/ThemeComponents/ThemeContext";

const { width, height } = Dimensions.get("window");

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
      console.log('📊 Inspector Dashboard loaded user data:', JSON.stringify(data, null, 2));
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, []);

  const getInspectorName = () => {
    if (!userData) return 'Inspector';
    return userData.user?.full_name || userData.inspector?.inspector_name || 'Inspector';
  };

  const getFirstName = () => {
    const fullName = getInspectorName();
    return fullName.split(' ')[0];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Quick action cards
  const quickActions = [
    {
      id: 'stallholders',
      title: 'View Stallholders',
      subtitle: 'Browse all stallholders',
      icon: 'people',
      color: ['#3b82f6', '#1d4ed8'],
    },
    {
      id: 'stalls',
      title: 'View Stalls',
      subtitle: 'Browse all stalls',
      icon: 'business',
      color: ['#10b981', '#059669'],
    },
    {
      id: 'report',
      title: 'Report Violation',
      subtitle: 'File a new report',
      icon: 'document-text',
      color: ['#f59e0b', '#d97706'],
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences',
      icon: 'settings',
      color: ['#8b5cf6', '#7c3aed'],
    },
  ];

  // Stats cards (mock data for frontend only)
  const statsData = [
    {
      id: 'total_inspections',
      title: 'Total Inspections',
      value: '0',
      icon: 'checkmark-circle',
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    {
      id: 'pending_reports',
      title: 'Pending Reports',
      value: '0',
      icon: 'time',
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      id: 'violations_filed',
      title: 'Violations Filed',
      value: '0',
      icon: 'warning',
      color: '#ef4444',
      bgColor: '#fee2e2',
    },
    {
      id: 'resolved',
      title: 'Resolved',
      value: '0',
      icon: 'checkmark-done',
      color: '#3b82f6',
      bgColor: '#dbeafe',
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
          colors={['#f59e0b']}
          tintColor="#f59e0b"
        />
      }
    >
      {/* Welcome Section */}
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeCard}
      >
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
          <Text style={styles.welcomeName}>{getFirstName()}! 👋</Text>
          <Text style={styles.welcomeSubtext}>
            Ready to inspect? Start by viewing stalls or filing a report.
          </Text>
        </View>
        <View style={styles.welcomeIconContainer}>
          <Ionicons name="shield-checkmark" size={80} color="rgba(255,255,255,0.3)" />
        </View>
      </LinearGradient>

      {/* Stats Section */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
        <View style={styles.statsGrid}>
          {statsData.map((stat) => (
            <View key={stat.id} style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{stat.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions Section */}
      <View style={styles.sectionContainer}>
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

      {/* Recent Activity Section */}
      <View style={[styles.sectionContainer, styles.lastSection]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
        <View style={[styles.emptyActivity, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="time-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyActivityText, { color: theme.colors.textSecondary }]}>
            No recent activity
          </Text>
          <Text style={[styles.emptyActivitySubtext, { color: theme.colors.textSecondary }]}>
            Your inspection history will appear here
          </Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - width * 0.12) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 12,
    marginTop: 4,
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
  emptyActivity: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DashboardScreen;
