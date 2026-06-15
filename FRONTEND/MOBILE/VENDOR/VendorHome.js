import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Dimensions,
  AppState,
  PanResponder,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../components/ThemeComponents/ThemeContext';
import UserStorageService from '../services/UserStorageService';
import LogoutLoadingScreen from '../components/Common/LogoutLoadingScreen';

// Vendor nav components
import Header from './VendorComponents/Header';
import Navbar from './VendorComponents/Navbar';
import Sidebar from './VendorComponents/Sidebar';

// Vendor screen components
import DashboardScreen from './VendorScreens/Dashboard/DashboardScreen';
import ProfileScreen from './VendorScreens/Profile/ProfileScreen';
import BusinessScreen from './VendorScreens/Business/BusinessScreen';
import SettingsScreen from './VendorScreens/Settings/SettingsScreen';
import MyQRCodeScreen from './VendorScreens/MyQRCode/MyQRCodeScreen';
import VendorDocumentsScreen from './VendorScreens/Documents/VendorDocumentsScreen';
import PaymentHistoryScreen from './VendorScreens/Payments/PaymentHistoryScreen';

const { width, height } = Dimensions.get('window');
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute

const VendorHome = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();

  // Single source of truth for current screen
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Activity tracking for auto-logout
  const lastActivityRef = useRef(Date.now());
  const inactivityTimerRef = useRef(null);
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
        return false;
      },
      onMoveShouldSetPanResponder: () => {
        recordActivity();
        return false;
      },
    })
  ).current;

  // Auto-logout due to inactivity
  const performAutoLogout = useCallback(async () => {
    if (isLoggingOut) return;

    console.log('Vendor auto-logout triggered due to inactivity');
    setIsLoggingOut(true);

    try {
      await UserStorageService.clearUserData();
    } catch (error) {
      console.error('Vendor auto-logout error:', error);
      await UserStorageService.clearUserData();
    } finally {
      setIsLoggingOut(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen', params: { reason: 'inactivity' } }],
      });
    }
  }, [isLoggingOut, navigation]);

  // Inactivity check loop
  useEffect(() => {
    const startInactivityCheck = () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setInterval(() => {
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
          performAutoLogout();
        }
      }, HEARTBEAT_INTERVAL);
    };

    startInactivityCheck();

    // Handle app state changes
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
          performAutoLogout();
        } else {
          recordActivity();
          startInactivityCheck();
        }
      } else if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        if (inactivityTimerRef.current) {
          clearInterval(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
      appStateSubscription.remove();
    };
  }, [performAutoLogout, recordActivity]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    setSidebarVisible(false);
    setIsLoggingOut(true);

    try {
      // Small delay to show the animation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await UserStorageService.clearUserData();
    } catch (error) {
      console.error('Error during vendor logout:', error);
      await UserStorageService.clearUserData();
    } finally {
      setIsLoggingOut(false);
    }

    navigation.navigate('LoginScreen');
  };

  const handleMenuPress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarClose = () => {
    setSidebarVisible(false);
  };

  const handleProfilePress = () => {
    setCurrentScreen('profile');
    setSidebarVisible(false);
  };

  // Handle navigation from sidebar
  const handleMenuItemPress = (itemId) => {
    if (itemId === 'logout') {
      handleLogout();
      return;
    }
    setCurrentScreen(itemId);
    setSidebarVisible(false);
  };

  // Handle navigation from bottom navbar
  const handleNavigation = (screen) => {
    setCurrentScreen(screen);
  };

  // Handle navigation from Dashboard quick actions
  const handleDashboardNavigate = (screen) => {
    setCurrentScreen(screen);
  };

  // Get page title for header
  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      profile: 'My Profile',
      business: 'Business Info',
      myqrcode: 'My QR Code',
      documents: 'My Documents',
      payments: 'My Payments',
      settings: 'Settings',
    };
    return titles[currentScreen] || 'Vendor Portal';
  };

  // Determine which tab should be active in navbar
  const getActiveNavTab = () => {
    const navTabs = {
      dashboard: 'Dashboard',
      profile: 'Profile',
      settings: 'Settings',
    };
    return navTabs[currentScreen] || null;
  };

  // Screens that have their own scrollable components
  const screensWithOwnScrolling = ['dashboard', 'profile', 'business', 'myqrcode', 'documents', 'payments'];
  const needsScrollView = !screensWithOwnScrolling.includes(currentScreen);

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigate={handleDashboardNavigate} />;
      case 'profile':
        return <ProfileScreen />;
      case 'business':
        return <BusinessScreen />;
      case 'myqrcode':
        return <MyQRCodeScreen />;
      case 'documents':
        return <VendorDocumentsScreen />;
      case 'payments':
        return <PaymentHistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen onNavigate={handleDashboardNavigate} />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top', 'left', 'right']}
        {...panResponder.panHandlers}
      >
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
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
            style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderCurrentScreen()}
          </ScrollView>
        ) : (
          <View style={[styles.contentView, { backgroundColor: theme.colors.background }]}>
            {renderCurrentScreen()}
          </View>
        )}

        {/* Bottom Navigation */}
        <Navbar
          activeTab={getActiveNavTab()}
          onDashboardPress={() => handleNavigation('dashboard')}
          onProfilePress={() => handleNavigation('profile')}
          onSettingsPress={() => handleNavigation('settings')}
          theme={theme}
          isDarkMode={isDarkMode}
        />

        {/* Sidebar */}
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
    backgroundColor: '#f8fafc',
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

export default VendorHome;
