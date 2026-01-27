import React, { useState } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@shared-mobile/COMPONENTS/ThemeComponents/ThemeContext";
import ApiService from "@stall-holder-mobile/SERVICES/ApiService";
import UserStorageService from "@stall-holder-mobile/SERVICES/UserStorageService";
import LogoutLoadingScreen from "@stall-holder-mobile/COMPONENTS/Common/LogoutLoadingScreen";

// nav bar and sidebar components
import Header from "@stall-holder-mobile/SCREENS/StallHolder/StallComponents/header";
import Navbar from "@stall-holder-mobile/SCREENS/StallHolder/StallComponents/navbar";
import Sidebar from "@stall-holder-mobile/SCREENS/StallHolder/StallComponents/Sidebar";

// screen components
import DashboardScreen from "./Dashboard/DashboardScreen";
import ComplaintScreen from "./Report/ComplaintScreen";
import RaffleScreen from "./Raffle/RaffleScreen";
import AuctionScreen from "./Auction/AuctionScreen";
import SettingsScreen from "./Settings/SettingsScreen";
import NotificationsScreen from "./Notifications/NotificationsScreen";
import DocumentsScreen from "./Documents/DocumentsScreen";
import TabbedStallScreen from "./Stall/TabbedStallScreen";
import PaymentScreen from "./Payment/PaymentScreen";

const { width, height } = Dimensions.get("window");

const StallHome = ({ navigation }) => {
  // Get theme from context
  const { theme, isDarkMode } = useTheme();
  
  // Single source of truth for current screen
  const [currentScreen, setCurrentScreen] = useState("stall");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileDirectly, setShowProfileDirectly] = useState(false);

  const handleLogout = async () => {
    // Prevent multiple clicks
    if (isLoggingOut) {
      console.log('⏳ Logout already in progress, ignoring...');
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
      const userId = userData?.user?.applicant_id || userData?.user?.id;
      
      // Call logout API to update last_logout in database
      if (token) {
        await ApiService.mobileLogout(token, userId);
        console.log('✅ Logout API called - last_logout updated');
      }
      
      // Add small delay to show the animation (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear local storage
      await UserStorageService.clearUserData();
    } catch (error) {
      console.error('Error during logout:', error);
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
    console.log("Profile pressed - navigating to settings/profile");
    setShowProfileDirectly(true);
    setCurrentScreen("settings");
    setSidebarVisible(false);
  };

  // Handle navigation from sidebar
  const handleMenuItemPress = (itemId) => {
    console.log(`Navigating to: ${itemId}`);

    if (itemId === "logout") {
      handleLogout();
      return;
    }

    // Reset profile flag when navigating to settings via menu (not profile)
    if (itemId === "settings") {
      setShowProfileDirectly(false);
    }

    setCurrentScreen(itemId);
    setSidebarVisible(false);
  };

  // Handle navigation from bottom navbar
  const handleNavigation = (screen) => {
    console.log(`Bottom nav - Navigating to: ${screen}`);
    // Reset profile flag when navigating via bottom navbar
    if (screen === "settings") {
      setShowProfileDirectly(false);
    }
    setCurrentScreen(screen);
  };

  // Get page title for header
  const getPageTitle = () => {
    const titles = {
      dashboard: "Dashboard",
      stall: "Stall Management",
      reports: "Complaints",
      settings: "Settings",
      notifications: "Notifications",
      documents: "Documents",
      payment: "Payment",
    };
    return titles[currentScreen] || "Stall Management";
  };

  // Determine which tab should be active in navbar
  const getActiveNavTab = () => {
    // Only show active state for screens that are actually in the navbar
    if (currentScreen === "documents") {
      return "Documents";
    }
    if (currentScreen === "stall") {
      return "Stall";
    }
    if (currentScreen === "payment") {
      return "Payment";
    }
    return null;
  };

  // Screens that have their own scrollable components
  const screensWithOwnScrolling = [
    "notifications",
    "stall",
    "documents",
    "reports",
  ];

  // Determine if need to wrap in ScrollView
  const needsScrollView = !screensWithOwnScrolling.includes(currentScreen);

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <DashboardScreen onNavigate={handleNavigation} />;
      case "stall":
        return <TabbedStallScreen />;
      case "reports":
        return <ComplaintScreen />;
      case "settings":
        return <SettingsScreen initialShowProfile={showProfileDirectly} />;
      case "notifications":
        return <NotificationsScreen />;
      case "documents":
        return <DocumentsScreen />;
      case "payment":
        return <PaymentScreen />;
      default:
        return <TabbedStallScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.surface}
          translucent={false}
        />

        <Header onMenuPress={handleMenuPress} title={getPageTitle()} theme={theme} isDarkMode={isDarkMode} />

        {/* Main Content */}
        {needsScrollView ? (
          <ScrollView
            style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderCurrentScreen()}
          </ScrollView>
        ) : (
          <View style={[styles.contentView, { backgroundColor: theme.colors.background }]}>{renderCurrentScreen()}</View>
        )}

        {/* Bottom Navigation Component */}
        <Navbar
          activeTab={getActiveNavTab()}
          onStallPress={() => handleNavigation("stall")}
          onDocumentsPress={() => handleNavigation("documents")}
          onPaymentPress={() => handleNavigation("payment")}
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

export default StallHome;
