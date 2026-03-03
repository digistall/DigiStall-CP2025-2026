import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Dimensions,
  AppState,
  PanResponder,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ApiService from "../../services/ApiService";
import UserStorageService from "../../services/UserStorageService";
import LogoutLoadingScreen from "../../components/Common/LogoutLoadingScreen";

// nav bar and sidebar components
import Header from "./CollectorComponents/header";
import Navbar from "./CollectorComponents/navbar";
import Sidebar from "./CollectorComponents/Sidebar";

// screen components
import DashboardScreen from "./CollectorScreen/Dashboard/DashboardScreen";
import PaymentScreen from "./CollectorScreen/Payment/PaymentScreen";
import VendorScreen from "./CollectorScreen/Vendor/VendorScreen";
import NotificationsScreen from "./CollectorScreen/Notifications/NotificationsScreen";
import SettingsScreen from "./CollectorScreen/Settings/SettingsScreen";

const { width, height } = Dimensions.get("window");
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute

// Default theme (can be replaced with theme context later)
const defaultTheme = {
  colors: {
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#1f2937",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    primary: "#3b82f6",
  },
};

const CollectorHome = ({ navigation }) => {
  // Theme (can be connected to theme context later)
  const theme = defaultTheme;
  const isDarkMode = false;

  // Single source of truth for current screen
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Activity tracking for auto-logout and heartbeat
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Record user activity
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // PanResponder to track touch activity
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        recordActivity();
        return false; // Don't capture the gesture
      },
      onMoveShouldSetPanResponder: () => {
        recordActivity();
        return false;
      },
    })
  ).current;

  // Send heartbeat to server
  const sendHeartbeat = useCallback(async () => {
    try {
      const userData = await UserStorageService.getUserData();
      const token = await UserStorageService.getAuthToken();
      const staffId = userData?.staff?.collector_id || userData?.staff?.staffId;

      if (token && staffId) {
        await ApiService.staffHeartbeat(token, staffId, 'collector');
      }
    } catch (error) {
      // Silent fail for heartbeat
    }
  }, []);

  // Auto-logout due to inactivity
  const performAutoLogout = useCallback(async () => {
    if (isLoggingOut) return;

    console.log('Collector auto-logout triggered due to inactivity');
    setIsLoggingOut(true);

    try {
      const userData = await UserStorageService.getUserData();
      const token = await UserStorageService.getAuthToken();
      const staffId = userData?.staff?.collector_id || userData?.staff?.staffId;

      if (token && staffId) {
        await ApiService.staffAutoLogout(token, staffId, 'collector');
      }

      await UserStorageService.clearUserData();
    } catch (error) {
      console.error('Collector auto-logout error:', error);
      await UserStorageService.clearUserData();
    } finally {
      setIsLoggingOut(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen', params: { reason: 'inactivity' } }],
      });
    }
  }, [isLoggingOut, navigation]);

  // Check activity and manage heartbeat/auto-logout
  useEffect(() => {
    // Send initial heartbeat
    sendHeartbeat();

    // Helper to start heartbeat interval
    const startHeartbeatInterval = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(() => {
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity < INACTIVITY_TIMEOUT) {
          sendHeartbeat();
        } else {
          console.log('Collector inactivity detected:', Math.round(timeSinceActivity / 1000), 'seconds');
          performAutoLogout();
        }
      }, HEARTBEAT_INTERVAL);
    };

    // Handle app state changes
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - check if should auto-logout
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
          performAutoLogout();
        } else {
          recordActivity();
          sendHeartbeat();
          // Restart heartbeat interval
          startHeartbeatInterval();
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // CRITICAL: Stop heartbeat IMMEDIATELY to prevent it re-setting online status
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        // Fire-and-forget auto-logout API (don't await - OS may suspend JS thread)
        try {
          const userData = await UserStorageService.getUserData();
          const token = await UserStorageService.getAuthToken();
          const staffId = userData?.staff?.collector_id || userData?.staff?.staffId;
          if (token && staffId) {
            ApiService.staffAutoLogout(token, staffId, 'collector').catch(() => {});
          }
        } catch (e) {
          // Silent fail - app is going to background
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      appStateSubscription.remove();
    };
  }, [sendHeartbeat, performAutoLogout, recordActivity]);

  const handleLogout = async () => {
    // Prevent multiple clicks
    if (isLoggingOut) {
      console.log("Logout already in progress, ignoring...");
      return;
    }

    // CRITICAL: Clear heartbeat interval FIRST to prevent last_login updates after logout
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Close sidebar first
    setSidebarVisible(false);

    // Show logout loading screen
    setIsLoggingOut(true);

    try {
      // Get user data before clearing
      const userData = await UserStorageService.getUserData();
      const token = userData?.token;
      const staffId = userData?.staff?.collector_id || userData?.staff?.staffId;
      const staffType = "collector";

      // Call staff logout API to update last_logout in database
      if (token && staffId) {
        await ApiService.staffLogout(token, staffId, staffType);
        console.log("Γ£à Staff logout API called - last_logout updated");
      }

      // Add small delay to show the animation (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Clear local storage
      await UserStorageService.clearUserData();
    } catch (error) {
      console.error("Error during logout:", error);
      await UserStorageService.clearUserData();
    } finally {
      setIsLoggingOut(false);
    }

    navigation.navigate("LoginScreen");
  };

  const handleMenuPress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarClose = () => {
    setSidebarVisible(false);
  };

  const handleProfilePress = () => {
    console.log("Profile pressed - show account options");
  };

  // Handle navigation from sidebar
  const handleMenuItemPress = (itemId) => {
    console.log(`Navigating to: ${itemId}`);

    if (itemId === "logout") {
      handleLogout();
      return;
    }

    setCurrentScreen(itemId);
    setSidebarVisible(false);
  };

  // Handle navigation from bottom navbar
  const handleNavigation = (screen) => {
    console.log(`Bottom nav - Navigating to: ${screen}`);
    setCurrentScreen(screen);
  };

  // Get page title for header
  const getPageTitle = () => {
    const titles = {
      dashboard: "Dashboard",
      payment: "Payment",
      vendor: "Vendor Management",
      notifications: "Notifications",
      settings: "Settings",
    };
    return titles[currentScreen] || "Dashboard";
  };

  // Determine which tab should be active in navbar
  const getActiveNavTab = () => {
    // Only show active state for screens that are actually in the navbar
    if (currentScreen === "dashboard") {
      return "Dashboard";
    }
    if (currentScreen === "payment") {
      return "Payment";
    }
    if (currentScreen === "vendor") {
      return "Vendor";
    }
    return null;
  };

  // Screens that have their own scrollable components
  const screensWithOwnScrolling = [
    "dashboard",
    "payment",
    "vendor",
    "notifications",
  ];

  // Determine if need to wrap in ScrollView
  const needsScrollView = !screensWithOwnScrolling.includes(currentScreen);

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <DashboardScreen />;
      case "payment":
        return <PaymentScreen />;
      case "vendor":
        return <VendorScreen />;
      case "notifications":
        return <NotificationsScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={["top", "left", "right"]}
        {...panResponder.panHandlers}
      >
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.surface}
          translucent={false}
        />

        <Header
          onMenuPress={handleMenuPress}
          title={getPageTitle()}
          theme={theme}
          isDarkMode={isDarkMode}
        />

        {/* Main Content */}
        {needsScrollView ? (
          <ScrollView
            style={[
              styles.scrollView,
              { backgroundColor: theme.colors.background },
            ]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderCurrentScreen()}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.contentView,
              { backgroundColor: theme.colors.background },
            ]}
          >
            {renderCurrentScreen()}
          </View>
        )}

        {/* Bottom Navigation Component */}
        <Navbar
          activeTab={getActiveNavTab()}
          onDashboardPress={() => handleNavigation("dashboard")}
          onPaymentPress={() => handleNavigation("payment")}
          onVendorPress={() => handleNavigation("vendor")}
          theme={theme}
          isDarkMode={isDarkMode}
        />

        {/* Sidebar Component */}
        <Sidebar
          isVisible={sidebarVisible}
          onClose={handleSidebarClose}
          onProfilePress={handleProfilePress}
          onMenuItemPress={handleMenuItemPress}
          activeMenuItem={currentScreen}
          theme={theme}
          isDarkMode={isDarkMode}
        />

        {/* Logout Loading Screen */}
        <LogoutLoadingScreen
          visible={isLoggingOut}
          message="Logging out..."
          subMessage="Please wait while we securely log you out"
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  contentView: {
    flex: 1,
  },
});

export default CollectorHome;
