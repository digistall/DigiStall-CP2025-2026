import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { styles } from "./ViewAllTableStyles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { height: screenHeight } = Dimensions.get("window");

const ViewAllTable = ({
  visible,
  onClose,
  paymentRecords,
  selectedPaymentMethod,
  theme,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

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
      default:
        return "card";
    }
  };

  const getStatusBgColor = (status) => {
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

  // Calculate summary stats
  const completedCount = paymentRecords.filter(r => 
    r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'paid'
  ).length;
  const pendingCount = paymentRecords.filter(r => 
    r.status?.toLowerCase() === 'pending'
  ).length;

  const renderPaymentRecord = (record, index) => (
    <Animated.View
      key={record.id}
      style={[
        styles.recordCard,
        theme && { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }]
        }
      ]}
    >
      <View style={styles.recordHeader}>
        {/* Status Icon */}
        <View style={[styles.recordIconContainer, { backgroundColor: getStatusBgColor(record.status) }]}>
          <Ionicons 
            name={getStatusIcon(record.status)} 
            size={24} 
            color={getStatusColor(record.status)} 
          />
        </View>
        
        {/* Main Info */}
        <View style={styles.recordMainInfo}>
          <Text style={[styles.recordDescription, theme && { color: theme.colors.text }]}>
            {record.description}
          </Text>
          <Text style={[styles.recordDate, theme && { color: theme.colors.textSecondary }]}>
            {record.date}
          </Text>
        </View>
        
        {/* Amount */}
        <View style={styles.recordAmountContainer}>
          <Text style={styles.recordAmountLabel}>AMOUNT</Text>
          <Text style={styles.recordAmount}>{record.amount}</Text>
        </View>
      </View>

      <View style={[styles.recordFooter, theme && { borderTopColor: theme.colors.border }]}>
        <View style={styles.referenceContainer}>
          <Ionicons name="receipt-outline" size={12} color="#9CA3AF" />
          <Text style={[styles.referenceText, theme && { color: theme.colors.textSecondary }]}>
            {record.reference}
          </Text>
        </View>
        <View style={styles.recordMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
            <Ionicons name={getStatusIcon(record.status)} size={12} color="#fff" />
            <Text style={styles.statusText}>{record.status}</Text>
          </View>
          <View style={[styles.methodBadge, { backgroundColor: getMethodColor(record.method) }]}>
            <Ionicons name={getMethodIcon(record.method)} size={12} color="#fff" />
            <Text style={styles.methodText}>{record.method}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const gradientColors = theme?.colors?.isDark 
    ? ['#001050', '#002181']
    : ['#002181', '#305CDE'];

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.modalContainer, 
            theme && { backgroundColor: theme.colors.surface },
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Modal Header with Gradient */}
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTitleSection}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="receipt" size={24} color="#fff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>All Transactions</Text>
                  <Text style={styles.modalSubtitle}>Complete payment history</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Summary Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{paymentRecords.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#6EE7B7' }]}>{completedCount}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#FCD34D' }]}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Records List */}
          <ScrollView
            style={styles.recordsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recordsListContent}
          >
            {paymentRecords.length > 0 ? (
              paymentRecords.map((record, index) => renderPaymentRecord(record, index))
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                </View>
                <Text style={[styles.emptyText, theme && { color: theme.colors.text }]}>
                  No transactions found
                </Text>
                <Text style={[styles.emptySubtext, theme && { color: theme.colors.textSecondary }]}>
                  Your payment history will appear here
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, theme && { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={styles.closeFooterButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-down" size={20} color="#fff" />
              <Text style={styles.closeFooterButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default ViewAllTable;
