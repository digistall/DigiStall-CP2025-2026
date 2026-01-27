import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Vibration,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import UserStorageService from "@stall-holder-mobile/SERVICES/UserStorageService";
import { useTheme } from "@shared-mobile/COMPONENTS/ThemeComponents/ThemeContext";

const { width, height } = Dimensions.get("window");

const DashboardScreen = ({ onNavigate }) => {
  const { theme, isDark } = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await UserStorageService.getUserData();
      console.log('📊 Dashboard loaded user data:', JSON.stringify(data, null, 2));
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, []);

  // Quick Action Handlers
  const handleQuickAction = (action) => {
    // Haptic feedback for better UX
    Vibration.vibrate(50);
    
    switch(action) {
      case 'payment':
        console.log('📱 Quick Action: Navigate to Payment');
        if (onNavigate) {
          onNavigate('payment');
        }
        break;
      
      case 'documents':
        console.log('📱 Quick Action: Navigate to Documents');
        if (onNavigate) {
          onNavigate('documents');
        }
        break;
      
      case 'report':
        console.log('📱 Quick Action: Navigate to Report Issue');
        if (onNavigate) {
          onNavigate('reports');
        }
        break;
      
      case 'support':
        console.log('📱 Quick Action: Show Support Info');
        // Show support information
        Alert.alert(
          '🆘 Support & Help',
          'Need assistance?\n\n' +
          '📞 Contact: (123) 456-7890\n' +
          '📧 Email: support@digistall.com\n' +
          '🕐 Hours: Mon-Fri, 8AM-5PM\n\n' +
          'You can also visit the Settings page for more help options.',
          [
            {
              text: 'Go to Settings',
              onPress: () => onNavigate && onNavigate('settings')
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
        break;
      
      default:
        console.log('Unknown quick action:', action);
    }
  };

  // Extract display data from userData
  const getUserName = () => {
    if (!userData) return 'Stallholder';
    return userData.user?.full_name || userData.user?.fullName || userData.stallholder?.stallholder_name || 'Stallholder';
  };

  const getFirstName = () => {
    const fullName = getUserName();
    return fullName.split(' ')[0];
  };

  const getStallNumber = () => {
    if (!userData) return 'N/A';
    // Check stallholder data first (approved stallholders), then application data
    // Database uses 'stall_number' in stall table
    const stallNo = userData.stallholder?.stall_number ||
                    userData.stallholder?.stall_no || 
                    userData.stallholder?.stallNo ||
                    userData.application?.stall_number ||
                    userData.application?.stall_no || 
                    userData.application?.stallNo ||
                    userData.stall?.stall_number ||
                    userData.stall?.stall_no;
    console.log('📍 Getting stall number:', stallNo, 'from userData:', {
      stallholder_stall_number: userData.stallholder?.stall_number,
      stallholder_stall_no: userData.stallholder?.stall_no,
      application_stall_number: userData.application?.stall_number
    });
    return stallNo || 'N/A';
  };

  const getStallLocation = () => {
    if (!userData) return 'N/A';
    return userData.stallholder?.stall_location || userData.application?.stall_location || 'N/A';
  };

  const getBranchName = () => {
    if (!userData) return 'N/A';
    return userData.stallholder?.branch_name || userData.application?.branch_name || 'N/A';
  };

  const getBusinessType = () => {
    if (!userData) return 'N/A';
    return userData.stallholder?.business_type || userData.business?.nature_of_business || 'N/A';
  };

  const getMonthlyRent = () => {
    if (!userData) return 0;
    return userData.stallholder?.monthly_rent || userData.application?.rental_price || 0;
  };

  const getPaymentStatus = () => {
    if (!userData) return 'Unknown';
    return userData.stallholder?.payment_status || 'Pending';
  };

  const getContractStatus = () => {
    if (!userData) return 'Unknown';
    return userData.stallholder?.contract_status || 'N/A';
  };

  const getContractEndDate = () => {
    if (!userData) return null;
    // contract_end_date is calculated from move_in_date (1 year contract)
    return userData.stallholder?.contract_end_date || 
           userData.stallholder?.contractEndDate ||
           userData.application?.contract_end_date;
  };

  const getContractStartDate = () => {
    if (!userData) return null;
    // move_in_date is the contract start date
    return userData.stallholder?.contract_start_date || 
           userData.stallholder?.move_in_date ||
           userData.stallholder?.contractStartDate ||
           userData.application?.contract_start_date;
  };

  const getComplianceStatus = () => {
    if (!userData) return 'Unknown';
    return userData.stallholder?.compliance_status || 'Pending';
  };

  const isStallholder = () => {
    return userData?.isStallholder || userData?.stallholder != null;
  };

  const getApplicationStatus = () => {
    return userData?.applicationStatus || userData?.application?.status || 'No Application';
  };

  const getStallSize = () => {
    if (!userData) return 'N/A';
    return userData.stallholder?.size || userData.application?.size || 'N/A';
  };

  const formatCurrency = (amount) => {
    return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-PH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPaymentStatusColor = () => {
    const status = getPaymentStatus().toLowerCase();
    if (status === 'paid' || status === 'completed') return '#10b981';
    if (status === 'pending') return '#f59e0b';
    if (status === 'overdue') return '#ef4444';
    return '#6b7280';
  };

  const getComplianceStatusColor = () => {
    const status = getComplianceStatus().toLowerCase();
    if (status === 'compliant' || status === 'complete') return '#10b981';
    if (status === 'pending') return '#f59e0b';
    if (status === 'non-compliant') return '#ef4444';
    return '#6b7280';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Header with Gradient - Matching Payment Page Colors */}
        <LinearGradient
          colors={isDark ? ['#001050', '#002181', '#001a66'] : ['#002181', '#003399', '#305CDE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative circles - matching Payment Page */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />
          
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userName}>{getFirstName()}! 👋</Text>
            </View>
            <View style={styles.headerBadge}>
              <Ionicons name="storefront" size={20} color="white" />
              <Text style={styles.headerBadgeText}>Stallholder</Text>
            </View>
          </View>
          
          {/* Quick Stats Row */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{getStallNumber()}</Text>
              <Text style={styles.quickStatLabel}>Stall No.</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{formatCurrency(getMonthlyRent())}</Text>
              <Text style={styles.quickStatLabel}>Monthly Rent</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <View style={[styles.statusDot, { backgroundColor: getPaymentStatusColor() }]} />
              <Text style={styles.quickStatLabel}>{getPaymentStatus()}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.contentContainer, { backgroundColor: theme.colors.background }]}>
          {/* Status Cards Row */}
          <View style={styles.statusCardsRow}>
            <View style={[styles.statusCard, { backgroundColor: theme.colors.card, borderLeftColor: getPaymentStatusColor() }]}>
              <View style={styles.statusCardIcon}>
                <FontAwesome5 name="money-bill-wave" size={18} color={getPaymentStatusColor()} />
              </View>
              <Text style={[styles.statusCardTitle, { color: theme.colors.textSecondary }]}>Payment</Text>
              <Text style={[styles.statusCardValue, { color: getPaymentStatusColor() }]}>
                {getPaymentStatus()}
              </Text>
            </View>
            
            <View style={[styles.statusCard, { backgroundColor: theme.colors.card, borderLeftColor: getComplianceStatusColor() }]}>
              <View style={styles.statusCardIcon}>
                <MaterialCommunityIcons name="file-document-check" size={20} color={getComplianceStatusColor()} />
              </View>
              <Text style={[styles.statusCardTitle, { color: theme.colors.textSecondary }]}>Compliance</Text>
              <Text style={[styles.statusCardValue, { color: getComplianceStatusColor() }]}>
                {getComplianceStatus()}
              </Text>
            </View>
          </View>

          {/* Stall Information Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.infoCardHeader, { borderBottomColor: theme.colors.border }]}>
              <Ionicons name="storefront-outline" size={22} color="#002181" />
              <Text style={[styles.infoCardTitle, { color: theme.colors.text }]}>My Stall</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Stall Number</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{getStallNumber()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Size</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{getStallSize()}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Branch</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{getBranchName()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Location</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{getStallLocation()}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Business Type</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{getBusinessType()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Contract</Text>
                  <Text style={[styles.infoValue, { color: getContractStatus() === 'Active' ? '#10b981' : '#f59e0b' }]}>
                    {getContractStatus()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Summary Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.infoCardHeader, { borderBottomColor: theme.colors.border }]}>
              <Ionicons name="wallet-outline" size={22} color="#003399" />
              <Text style={[styles.infoCardTitle, { color: theme.colors.text }]}>Payment Summary</Text>
            </View>
            
            <View style={styles.paymentSummary}>
              <View style={[styles.paymentMainAmount, { backgroundColor: isDark ? theme.colors.surface : '#f8fafc' }]}>
                <Text style={[styles.paymentLabel, { color: theme.colors.textSecondary }]}>Monthly Rent Due</Text>
                <Text style={[styles.paymentAmount, { color: theme.colors.text }]}>{formatCurrency(getMonthlyRent())}</Text>
              </View>
              
              <View style={styles.paymentDetails}>
                <View style={styles.paymentDetailItem}>
                  <Text style={[styles.paymentDetailLabel, { color: theme.colors.textSecondary }]}>Due Date</Text>
                  <Text style={[styles.paymentDetailValue, { color: theme.colors.text }]}>Every 5th of the month</Text>
                </View>
                <View style={styles.paymentDetailItem}>
                  <Text style={[styles.paymentDetailLabel, { color: theme.colors.textSecondary }]}>Status</Text>
                  <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor() + '20' }]}>
                    <Text style={[styles.paymentStatusText, { color: getPaymentStatusColor() }]}>
                      {getPaymentStatus()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Contract Details Card */}
          {isStallholder() && userData?.stallholder && (
            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.infoCardHeader, { borderBottomColor: theme.colors.border }]}>
                <Ionicons name="document-text-outline" size={22} color="#305CDE" />
                <Text style={[styles.infoCardTitle, { color: theme.colors.text }]}>Contract Details</Text>
              </View>
              
              <View style={styles.contractDetails}>
                <View style={[styles.contractRow, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.contractLabel, { color: theme.colors.textSecondary }]}>Stall Number</Text>
                  <Text style={[styles.contractValue, { color: '#002181', fontWeight: 'bold' }]}>
                    {getStallNumber()}
                  </Text>
                </View>
                <View style={[styles.contractRow, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.contractLabel, { color: theme.colors.textSecondary }]}>Start Date</Text>
                  <Text style={[styles.contractValue, { color: theme.colors.text }]}>
                    {formatDate(getContractStartDate())}
                  </Text>
                </View>
                <View style={[styles.contractRow, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.contractLabel, { color: theme.colors.textSecondary }]}>End Date</Text>
                  <Text style={[styles.contractValue, { color: getContractEndDate() ? theme.colors.text : '#f59e0b', fontWeight: getContractEndDate() ? '600' : 'bold' }]}>
                    {formatDate(getContractEndDate())}
                  </Text>
                </View>
                <View style={[styles.contractRow, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.contractLabel, { color: theme.colors.textSecondary }]}>Monthly Rent Due</Text>
                  <Text style={[styles.contractValue, { color: '#002181', fontWeight: 'bold' }]}>
                    {formatCurrency(getMonthlyRent())}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={[styles.quickActionsCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.quickActionsTitle, { color: theme.colors.text }]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('payment')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? '#001050' : '#e8eeff' }]}>
                  <Ionicons name="receipt-outline" size={24} color="#002181" />
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.colors.textSecondary }]}>Pay Rent</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('documents')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? '#001050' : '#e8eeff' }]}>
                  <Ionicons name="document-attach-outline" size={24} color="#003399" />
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.colors.textSecondary }]}>Documents</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('report')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? '#422006' : '#fef3c7' }]}>
                  <Ionicons name="warning-outline" size={24} color="#f59e0b" />
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.colors.textSecondary }]}>Report Issue</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('support')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? '#001050' : '#e8eeff' }]}>
                  <Ionicons name="help-circle-outline" size={24} color="#305CDE" />
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.colors.textSecondary }]}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  
  // Header Gradient
  headerGradient: {
    paddingTop: width * 0.12,
    paddingBottom: width * 0.06,
    paddingHorizontal: width * 0.05,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Decorative circles - matching Payment Page style
  decorativeCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -50,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -30,
    left: -20,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 20,
    left: 40,
  },
  
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: width * 0.05,
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: width * 0.04,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  userName: {
    fontSize: width * 0.065,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: width * 0.04,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: width * 0.04,
    color: 'white',
    fontWeight: 'bold',
  },
  quickStatLabel: {
    fontSize: width * 0.028,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  
  // Content
  contentContainer: {
    padding: width * 0.04,
    marginTop: -width * 0.02,
  },
  
  // Status Cards
  statusCardsRow: {
    flexDirection: 'row',
    gap: width * 0.03,
    marginBottom: width * 0.04,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: width * 0.04,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statusCardIcon: {
    marginBottom: 8,
  },
  statusCardTitle: {
    fontSize: width * 0.032,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusCardValue: {
    fontSize: width * 0.038,
    fontWeight: 'bold',
  },
  
  // Info Cards
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: width * 0.045,
    marginBottom: width * 0.04,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: width * 0.04,
    paddingBottom: width * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoCardTitle: {
    fontSize: width * 0.042,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 10,
  },
  
  // Info Grid
  infoGrid: {
    gap: width * 0.03,
  },
  infoRow: {
    flexDirection: 'row',
    gap: width * 0.03,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: width * 0.03,
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: width * 0.036,
    color: '#1f2937',
    fontWeight: '600',
  },
  
  // Payment Summary
  paymentSummary: {
    
  },
  paymentMainAmount: {
    alignItems: 'center',
    paddingVertical: width * 0.04,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: width * 0.03,
  },
  paymentLabel: {
    fontSize: width * 0.032,
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  paymentDetails: {
    gap: width * 0.025,
  },
  paymentDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDetailLabel: {
    fontSize: width * 0.034,
    color: '#6b7280',
  },
  paymentDetailValue: {
    fontSize: width * 0.034,
    color: '#1f2937',
    fontWeight: '500',
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: width * 0.032,
    fontWeight: '600',
  },
  
  // Contract Details
  contractDetails: {
    gap: width * 0.025,
  },
  contractRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: width * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contractLabel: {
    fontSize: width * 0.034,
    color: '#6b7280',
  },
  contractValue: {
    fontSize: width * 0.034,
    color: '#1f2937',
    fontWeight: '600',
  },
  
  // Quick Actions
  quickActionsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: width * 0.045,
    marginBottom: width * 0.04,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quickActionsTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: width * 0.04,
    letterSpacing: 0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: width * 0.025,
  },
  quickActionButton: {
    width: (width - width * 0.17) / 4,
    alignItems: 'center',
    paddingVertical: width * 0.02,
  },
  quickActionIcon: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.07,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    // Add subtle shadow for depth
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  quickActionLabel: {
    fontSize: width * 0.03,
    color: '#4b5563',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: width * 0.035,
  },
  
  bottomSpacing: {
    height: width * 0.1,
  },
});

export default DashboardScreen;