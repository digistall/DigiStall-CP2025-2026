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
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import UserStorageService from "../../../../services/UserStorageService";

const { width, height } = Dimensions.get("window");

const DashboardScreen = () => {
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
    return userData.stallholder?.stall_no || userData.application?.stall_no || 'N/A';
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
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#4472C4" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4472C4']} />
        }
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#4472C4', '#2c5aa0']}
          style={styles.headerGradient}
        >
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

        <View style={styles.contentContainer}>
          {/* Status Cards Row */}
          <View style={styles.statusCardsRow}>
            <View style={[styles.statusCard, { borderLeftColor: getPaymentStatusColor() }]}>
              <View style={styles.statusCardIcon}>
                <FontAwesome5 name="money-bill-wave" size={18} color={getPaymentStatusColor()} />
              </View>
              <Text style={styles.statusCardTitle}>Payment</Text>
              <Text style={[styles.statusCardValue, { color: getPaymentStatusColor() }]}>
                {getPaymentStatus()}
              </Text>
            </View>
            
            <View style={[styles.statusCard, { borderLeftColor: getComplianceStatusColor() }]}>
              <View style={styles.statusCardIcon}>
                <MaterialCommunityIcons name="file-document-check" size={20} color={getComplianceStatusColor()} />
              </View>
              <Text style={styles.statusCardTitle}>Compliance</Text>
              <Text style={[styles.statusCardValue, { color: getComplianceStatusColor() }]}>
                {getComplianceStatus()}
              </Text>
            </View>
          </View>

          {/* Stall Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="storefront-outline" size={22} color="#4472C4" />
              <Text style={styles.infoCardTitle}>My Stall</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Stall Number</Text>
                  <Text style={styles.infoValue}>{getStallNumber()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Size</Text>
                  <Text style={styles.infoValue}>{getStallSize()}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Branch</Text>
                  <Text style={styles.infoValue}>{getBranchName()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{getStallLocation()}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Business Type</Text>
                  <Text style={styles.infoValue}>{getBusinessType()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Contract</Text>
                  <Text style={[styles.infoValue, { color: getContractStatus() === 'Active' ? '#10b981' : '#f59e0b' }]}>
                    {getContractStatus()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Summary Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="wallet-outline" size={22} color="#4472C4" />
              <Text style={styles.infoCardTitle}>Payment Summary</Text>
            </View>
            
            <View style={styles.paymentSummary}>
              <View style={styles.paymentMainAmount}>
                <Text style={styles.paymentLabel}>Monthly Rent Due</Text>
                <Text style={styles.paymentAmount}>{formatCurrency(getMonthlyRent())}</Text>
              </View>
              
              <View style={styles.paymentDetails}>
                <View style={styles.paymentDetailItem}>
                  <Text style={styles.paymentDetailLabel}>Due Date</Text>
                  <Text style={styles.paymentDetailValue}>Every 5th of the month</Text>
                </View>
                <View style={styles.paymentDetailItem}>
                  <Text style={styles.paymentDetailLabel}>Status</Text>
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
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="document-text-outline" size={22} color="#4472C4" />
                <Text style={styles.infoCardTitle}>Contract Details</Text>
              </View>
              
              <View style={styles.contractDetails}>
                <View style={styles.contractRow}>
                  <Text style={styles.contractLabel}>Start Date</Text>
                  <Text style={styles.contractValue}>
                    {formatDate(userData.stallholder.contract_start_date)}
                  </Text>
                </View>
                <View style={styles.contractRow}>
                  <Text style={styles.contractLabel}>End Date</Text>
                  <Text style={styles.contractValue}>
                    {formatDate(userData.stallholder.contract_end_date)}
                  </Text>
                </View>
                <View style={styles.contractRow}>
                  <Text style={styles.contractLabel}>Lease Amount</Text>
                  <Text style={styles.contractValue}>
                    {formatCurrency(userData.stallholder.lease_amount || 0)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsCard}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="receipt-outline" size={22} color="#3b82f6" />
                </View>
                <Text style={styles.quickActionLabel}>Pay Rent</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="document-attach-outline" size={22} color="#22c55e" />
                </View>
                <Text style={styles.quickActionLabel}>Documents</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="warning-outline" size={22} color="#f59e0b" />
                </View>
                <Text style={styles.quickActionLabel}>Report Issue</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="help-circle-outline" size={22} color="#a855f7" />
                </View>
                <Text style={styles.quickActionLabel}>Support</Text>
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
    fontSize: width * 0.042,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: width * 0.04,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width * 0.03,
  },
  quickActionButton: {
    width: (width - width * 0.17) / 4,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: width * 0.028,
    color: '#4b5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  bottomSpacing: {
    height: width * 0.1,
  },
});

export default DashboardScreen;