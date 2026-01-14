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
import { useTheme } from "../StallHolder/StallScreen/Settings/components/ThemeComponents/ThemeContext";
import ApiService from "../../services/ApiService";
import UserStorageService from "../../services/UserStorageService";
import LogoutLoadingScreen from "../../components/Common/LogoutLoadingScreen";

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
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute

const InspectorHome = ({ navigation }) => {
  // Get theme from context
  const { theme, isDarkMode } = useTheme();
  
  // Single source of truth for current screen
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // For pre-selecting stallholder/stall when navigating to report
  const [reportContext, setReportContext] = useState(null);
  
  // Activity tracking for auto-logout
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
      const staffId = userData?.staff?.inspector_id || userData?.staff?.staffId;
      
      if (token && staffId) {
        await ApiService.staffHeartbeat(token, staffId, 'inspector');
      }
    } catch (error) {
      // Silent fail for heartbeat
    }
  }, []);
  
  // Auto-logout due to inactivity
  const performAutoLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    console.log('⏰ Auto-logout triggered due to inactivity');
    setIsLoggingOut(true);
    
    try {
      const userData = await UserStorageService.getUserData();
      const token = await UserStorageService.getAuthToken();
      const staffId = userData?.staff?.inspector_id || userData?.staff?.staffId;
      
      console.log('🔍 Auto-logout data - token:', token ? 'EXISTS' : 'MISSING', 'staffId:', staffId);
      
      // Call auto-logout API
      if (token && staffId) {
        const result = await ApiService.staffAutoLogout(token, staffId, 'inspector');
        console.log('✅ Auto-logout API result:', result);
      } else {
        console.log('⚠️ Missing token or staffId for auto-logout');
      }
      
      await UserStorageService.clearUserData();
    } catch (error) {
      console.error('Auto-logout error:', error);
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
    
    // Set up heartbeat interval (check every minute)
    heartbeatIntervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceActivity < INACTIVITY_TIMEOUT) {
        // User has been active, send heartbeat
        sendHeartbeat();
      } else {
        // User has been inactive for 5+ minutes, auto-logout
        console.log('⏰ Inactivity detected:', Math.round(timeSinceActivity / 1000), 'seconds');
        performAutoLogout();
      }
    }, HEARTBEAT_INTERVAL);
    
    // Handle app state changes
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - check if should auto-logout
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
          performAutoLogout();
        } else {
          recordActivity();
          sendHeartbeat();
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
      const staffId = userData?.staff?.inspector_id || userData?.staff?.staffId;
      const staffType = 'inspector';
      
      // Call staff logout API to update last_logout in database
      if (token && staffId) {
        await ApiService.staffLogout(token, staffId, staffType);
        console.log('✅ Staff logout API called - last_logout updated');
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

export default InspectorHome;