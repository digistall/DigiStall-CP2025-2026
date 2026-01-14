import React, { useState } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Dimensions,
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

  const handleLogout = async () => {
    // Prevent multiple clicks
    if (isLoggingOut) {
      console.log("⏳ Logout already in progress, ignoring...");
      return;
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
        console.log("✅ Staff logout API called - last_logout updated");
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
