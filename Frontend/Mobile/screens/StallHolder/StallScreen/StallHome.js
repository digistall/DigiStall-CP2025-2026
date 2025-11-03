import React, { useState } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// nav bar and sidebar components
import Header from "../StallComponents/header";
import Navbar from "../StallComponents/navbar";
import Sidebar from "../StallComponents/Sidebar";

// screen components
import DashboardScreen from "./Dashboard/DashboardScreen";
import ReportsScreen from "./Report/ReportsScreen";
import RaffleScreen from "./Raffle/RaffleScreen";
import AuctionScreen from "./Auction/AuctionScreen";
import SettingsScreen from "./Settings/SettingsScreen";
import NotificationsScreen from "./Notifications/NotificationsScreen";
import DocumentsScreen from "./Documents/DocumentsScreen";
import TabbedStallScreen from "./Stall/TabbedStallScreen";
import PaymentScreen from "./Payment/PaymentScreen";

const { width, height } = Dimensions.get("window");

const StallHome = ({ navigation }) => {
  // Single source of truth for current screen
  const [currentScreen, setCurrentScreen] = useState("stall");
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleLogout = () => {
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
      stall: "Stall Management",
      reports: "Reports",
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
  ];

  // Determine if need to wrap in ScrollView
  const needsScrollView = !screensWithOwnScrolling.includes(currentScreen);

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <DashboardScreen />;
      case "stall":
        return <TabbedStallScreen />;
      case "reports":
        return <ReportsScreen />;
      case "settings":
        return <SettingsScreen />;
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
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
        />

        <Header onMenuPress={handleMenuPress} title={getPageTitle()} />

        {/* Main Content */}
        {needsScrollView ? (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderCurrentScreen()}
          </ScrollView>
        ) : (
          <View style={styles.contentView}>{renderCurrentScreen()}</View>
        )}

        {/* Bottom Navigation Component */}
        <Navbar
          activeTab={getActiveNavTab()}
          onStallPress={() => handleNavigation("stall")}
          onDocumentsPress={() => handleNavigation("documents")}
          onPaymentPress={() => handleNavigation("payment")}
        />

        {/* Sidebar Component */}
        <Sidebar
          isVisible={sidebarVisible}
          onClose={handleSidebarClose}
          onProfilePress={handleProfilePress}
          onMenuItemPress={handleMenuItemPress}
          activeMenuItem={currentScreen}
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
