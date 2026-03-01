import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import UserStorageService from "../../../../services/UserStorageService";
import ApiService from "../../../../services/ApiService";
import { useTheme } from "../../../../components/ThemeComponents/ThemeContext";

const { width, height } = Dimensions.get("window");

const DashboardScreen = ({ onNavigate }) => {
  const { theme, isDark } = useTheme();
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalStallholders: 0,
    totalReportsSent: 0,
    recentReports: []
  });

  useEffect(() => {
    loadUserData();
    loadDashboardData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await UserStorageService.getUserData();
      console.log('Inspector Dashboard loaded user data:', JSON.stringify(data, null, 2));
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching dashboard data...');

      // Fetch stallholders and sent reports in parallel
      const [stallholdersResult, reportsResult] = await Promise.all([
        ApiService.getInspectorStallholders(),
        ApiService.getInspectorSentReports()
      ]);

      console.log('✅ Stallholders result:', stallholdersResult);
      console.log('✅ Reports result:', reportsResult);

      // Update dashboard stats
      setDashboardStats({
        totalStallholders: stallholdersResult.count || 0,
        totalReportsSent: reportsResult.count || 0,
        recentReports: (reportsResult.data || []).slice(0, 5) // Get last 5 reports
      });

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
    loadDashboardData();
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

  // Stats cards with real data
  const statsData = [
    {
      id: 'total_stallholders',
      title: 'Total Stallholders',
      value: loading ? '...' : dashboardStats.totalStallholders.toString(),
      icon: 'people',
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    {
      id: 'reports_sent',
      title: 'Reports Sent',
      value: loading ? '...' : dashboardStats.totalReportsSent.toString(),
      icon: 'document-text',
      color: '#3b82f6',
      bgColor: '#dbeafe',
    },
    {
      id: 'pending_reviews',
      title: 'Pending Reviews',
      value: loading ? '...' : '0',
      icon: 'time',
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      id: 'this_month',
      title: 'This Month',
      value: loading ? '...' : dashboardStats.recentReports.filter(r => {
        const reportDate = new Date(r.report_date || r.created_at);
        const now = new Date();
        return reportDate.getMonth() === now.getMonth() && 
               reportDate.getFullYear() === now.getFullYear();
      }).length.toString(),
      icon: 'calendar',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
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
          <Text style={styles.welcomeName}>{getFirstName()}! 👮</Text>
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
        {loading ? (
          <View style={[styles.loadingContainer, { backgroundColor: theme.colors.card }]}>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading recent reports...
            </Text>
          </View>
        ) : dashboardStats.recentReports.length > 0 ? (
          <View style={styles.recentReportsContainer}>
            {dashboardStats.recentReports.map((report, index) => (
              <View 
                key={report.report_id || index} 
                style={[styles.reportCard, { backgroundColor: theme.colors.card }]}
              >
                <View style={styles.reportHeader}>
                  <View style={[styles.reportIconContainer, { 
                    backgroundColor: report.status === 'resolved' ? '#d1fae5' : '#fef3c7' 
                  }]}>
                    <Ionicons 
                      name={report.status === 'resolved' ? 'checkmark-circle' : 'alert-circle'} 
                      size={20} 
                      color={report.status === 'resolved' ? '#10b981' : '#f59e0b'} 
                    />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={[styles.reportTitle, { color: theme.colors.text }]} numberOfLines={1}>
                      {report.violation_type || 'Violation Report'}
                    </Text>
                    <Text style={[styles.reportSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {report.stallholder_name || `Stallholder #${report.stallholder_id}`}
                    </Text>
                  </View>
                  <View style={styles.reportDate}>
                    <Text style={[styles.reportDateText, { color: theme.colors.textSecondary }]}>
                      {new Date(report.report_date || report.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyActivity, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="time-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyActivityText, { color: theme.colors.textSecondary }]}>
              No recent activity
            </Text>
            <Text style={[styles.emptyActivitySubtext, { color: theme.colors.textSecondary }]}>
              Your inspection history will appear here
            </Text>
          </View>
        )}
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
  loadingContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  recentReportsContainer: {
    gap: 12,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 12,
  },
  reportDate: {
    marginLeft: 8,
  },
  reportDateText: {
    fontSize: 11,
  },
});

export default DashboardScreen;
