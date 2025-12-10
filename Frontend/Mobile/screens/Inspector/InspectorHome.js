import React, { useState } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../StallHolder/StallScreen/Settings/components/ThemeComponents/ThemeContext";

// Inspector nav bar and sidebar components
import Header from "./InspectorComponents/Header";
import Navbar from "./InspectorComponents/Navbar";
import Sidebar from "./InspectorComponents/Sidebar";

// Inspector screen components
import DashboardScreen from "./InspectorScreens/Dashboard/DashboardScreen";
import StallholdersScreen from "./InspectorScreens/Stallholders/StallholdersScreen";
import StallsScreen from "./InspectorScreens/Stalls/StallsScreen";
import ReportScreen from "./InspectorScreens/Report/ReportScreen";
import SettingsScreen from "./InspectorScreens/Settings/SettingsScreen";

const { width, height } = Dimensions.get("window");

const InspectorHome = ({ navigation }) => {
  // Get theme from context
  const { theme, isDarkMode } = useTheme();
  
  // Single source of truth for current screen
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // For pre-selecting stallholder/stall when navigating to report
  const [reportContext, setReportContext] = useState(null);

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
    console.log(`Inspector - Navigating to: ${itemId}`);

    if (itemId === "logout") {
      handleLogout();
      return;
    }

    setCurrentScreen(itemId);
    setReportContext(null); // Clear report context when navigating via menu
    setSidebarVisible(false);
  };

  // Handle navigation from bottom navbar
  const handleNavigation = (screen) => {
    console.log(`Inspector Bottom nav - Navigating to: ${screen}`);
    setCurrentScreen(screen);
    setReportContext(null); // Clear report context
  };

  // Handle navigation from Dashboard quick actions
  const handleDashboardNavigate = (screen) => {
    setCurrentScreen(screen);
    setReportContext(null);
  };

  // Handle stallholder selection (for reporting)
  const handleSelectStallholder = (stallholder, action) => {
    if (action === 'report') {
      setReportContext({ stallholder });
      setCurrentScreen('report');
    } else {
      // Just viewing details - could expand to show detail screen
      console.log('View stallholder details:', stallholder);
    }
  };

  // Handle stall selection (for reporting)
  const handleSelectStall = (stall, action) => {
    if (action === 'report') {
      setReportContext({ stall });
      setCurrentScreen('report');
    } else {
      // Just viewing details - could expand to show detail screen
      console.log('View stall details:', stall);
    }
  };

  // Handle report submission success
  const handleReportSuccess = () => {
    setReportContext(null);
    setCurrentScreen('dashboard');
  };

  // Handle report cancel
  const handleReportCancel = () => {
    setReportContext(null);
    // Go back to previous context screen
    if (reportContext?.stallholder) {
      setCurrentScreen('stallholders');
    } else if (reportContext?.stall) {
      setCurrentScreen('stalls');
    } else {
      setCurrentScreen('dashboard');
    }
  };

  // Get page title for header
  const getPageTitle = () => {
    const titles = {
      dashboard: "Dashboard",
      stallholders: "Stallholders",
      stalls: "Stalls",
      report: "Report Violation",
      settings: "Settings",
    };
    return titles[currentScreen] || "Inspector";
  };

  // Determine which tab should be active in navbar
  const getActiveNavTab = () => {
    const navTabs = {
      dashboard: "Dashboard",
      stallholders: "Stallholders",
      stalls: "Stalls",
      report: "Report",
    };
    return navTabs[currentScreen] || null;
  };

  // Screens that have their own scrollable components
  const screensWithOwnScrolling = [
    "dashboard",
    "stallholders",
    "stalls",
    "report",
  ];

  // Determine if need to wrap in ScrollView
  const needsScrollView = !screensWithOwnScrolling.includes(currentScreen);

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <DashboardScreen onNavigate={handleDashboardNavigate} />;
      case "stallholders":
        return <StallholdersScreen onSelectStallholder={handleSelectStallholder} />;
      case "stalls":
        return <StallsScreen onSelectStall={handleSelectStall} />;
      case "report":
        return (
          <ReportScreen 
            preselectedStall={reportContext?.stall}
            preselectedStallholder={reportContext?.stallholder}
            onSubmitSuccess={handleReportSuccess}
            onCancel={handleReportCancel}
          />
        );
      case "settings":
        return <SettingsScreen />;
      default:
        return <DashboardScreen onNavigate={handleDashboardNavigate} />;
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
          onDashboardPress={() => handleNavigation("dashboard")}
          onStallholdersPress={() => handleNavigation("stallholders")}
          onStallsPress={() => handleNavigation("stalls")}
          onReportPress={() => handleNavigation("report")}
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

export default InspectorHome;