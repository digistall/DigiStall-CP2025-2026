import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useEffect, useRef } from "react";
import PaymentTable from "./Components/PaymentTable/PaymentTable";
import { useTheme } from '../../../../components/ThemeComponents/ThemeContext';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const PaymentScreen = ({ navigation, onBack }) => {
  const { theme, isDark } = useTheme();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulse animation for the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const gradientColors = isDark 
    ? ['#001050', '#002181', '#001a66']
    : ['#002181', '#003399', '#305CDE'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Header Section with Gradient */}
        <Animated.View 
          style={[
            styles.headerWrapper,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            }
          ]}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Decorative circles */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />
            
            <Animated.View 
              style={[
                styles.headerIcon,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View style={styles.iconInner}>
                <Ionicons name="wallet-outline" size={36} color="#fff" />
              </View>
            </Animated.View>
            
            <Text style={styles.headerTitle}>
              Payment Records
            </Text>
            <Text style={styles.headerSubtitle}>
              View your stall payment history and transaction records
            </Text>

            {/* Quick Stats Row - Enhanced Visibility */}
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStatItem}>
                <View style={[styles.quickStatIcon, styles.quickStatIconCompleted]}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                </View>
                <Text style={styles.quickStatLabel}>Completed</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <View style={[styles.quickStatIcon, styles.quickStatIconPending]}>
                  <Ionicons name="time" size={18} color="#fff" />
                </View>
                <Text style={styles.quickStatLabel}>Pending</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Payment Records Table */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <PaymentTable 
            selectedPaymentMethod={null}
            theme={theme}
            isDark={isDark}
          />
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  headerWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 24,
    overflow: 'hidden',
    // Enhanced shadow
    shadowColor: "#002181",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },

  headerGradient: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    position: 'relative',
    overflow: 'hidden',
  },

  // Decorative background circles
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

  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  quickStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    // Shadow for icon
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  quickStatIconCompleted: {
    backgroundColor: '#1E9C00',
  },

  quickStatIconPending: {
    backgroundColor: '#F59E0B',
  },

  quickStatLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },

  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginHorizontal: 10,
  },

  bottomSpacer: {
    height: 24,
  },
});

export default PaymentScreen;
