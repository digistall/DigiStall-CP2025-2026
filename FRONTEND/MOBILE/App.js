import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, AppState, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';

// Theme Provider
import { ThemeProvider } from './components/ThemeComponents/ThemeContext';

// Auth Screens
import LoginScreen from './AUTH/LoginScreen/LoginScreen';
import LoadingScreen from './AUTH/LoadingScreen/LoadingScreen';
import ForgotPasswordScreen from './AUTH/ForgotPasswordScreen/ForgotPasswordScreen';

// Role Screens
import StallHome from './STALLHOLDER/StallHolder/StallScreen/StallHome';
import InspectorHome from './INSPECTOR/InspectorHome';
import CollectorHome from './COLLECTOR/CollectorHome';

// Services
import UserStorageService from './services/UserStorageService';
import PickerActiveFlag from './services/PickerActiveFlag';

const Stack = createNativeStackNavigator();

// Initial loading screen component
const AppLoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <StatusBar style="light" />
    <Text style={styles.title}>DigiStall</Text>
    <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('LoginScreen');
  const [userData, setUserData] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkAuthStatus();
    
    let wasOffline = false;

    // Network listener
    const unsubscribeNet = NetInfo.addEventListener(state => {
      // isInternetReachable can be null on first mount - only mark offline if explicitly false
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);

      if (wasOffline && !offline) {
        setShowOnline(true);
        setTimeout(() => setShowOnline(false), 3000); // Hide after 3 seconds
      }
      wasOffline = offline;
    });
    
    // Auto-logout when app goes to background
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('App has gone to the background - initiating auto-logout');

        // Skip auto-logout if a file picker is currently open (camera/gallery/document picker).
        // Opening any native picker temporarily backgrounds the app; we must not log out in that case.
        if (PickerActiveFlag.isActive()) {
          console.log('⏭️ Skipping auto-logout — file picker is active');
          appState.current = nextAppState;
          return;
        }
        
        try {
          const user = await UserStorageService.getUserData();
          if (user && user.token) {
            // Need to handle both staff roles and standard users
            const isStaff = user.staffType === 'inspector' || user.staffType === 'collector';
            const apiUrl = 'https://digistall.up.railway.app/api'; // Using default or env
            
            // Perform synchronous-like beacon logout with fetch using keepalive
            try {
              if (isStaff) {
                fetch(`${apiUrl}/auth/staff/logout`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                  },
                  body: JSON.stringify({
                    staffId: user.staffId,
                    staffType: user.staffType
                  }),
                  keepalive: true
                }).catch(() => {});
              } else {
                fetch(`${apiUrl}/auth/mobile/logout`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                  },
                  body: JSON.stringify({ userId: user.id || user.userId }),
                  keepalive: true
                }).catch(() => {});
              }
            } catch (apiError) {
              console.warn('API logout failed during app close:', apiError);
            }
            
            // Clear local user data
            await UserStorageService.clearUserData();
            
            // Navigate back to login screen if possible
            setInitialRoute('LoginScreen');
            setUserData(null);
          }
        } catch (error) {
          console.error('Error during auto-logout:', error);
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      unsubscribeNet();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking authentication status...');
      const storedUserData = await UserStorageService.getUserData();
      
      if (storedUserData && storedUserData.token) {
        // Check if it's a staff user (inspector/collector)
        if (storedUserData.staffType === 'inspector') {
          console.log('User is authenticated as Inspector, navigating to InspectorHome');
          setUserData(storedUserData);
          setInitialRoute('InspectorHome');
        } else if (storedUserData.staffType === 'collector') {
          console.log('User is authenticated as Collector, navigating to CollectorHome');
          setUserData(storedUserData);
          setInitialRoute('CollectorHome');
        } else {
          console.log('User is authenticated as Stallholder, navigating to StallHome');
          setUserData(storedUserData);
          setInitialRoute('StallHome');
        }
      } else {
        console.log('User is not authenticated, navigating to LoginScreen');
        setInitialRoute('LoginScreen');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setInitialRoute('LoginScreen');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator 
              initialRouteName={initialRoute}
              screenOptions={{
                headerShown: false,
                animation: 'fade',
              }}
            >
              <Stack.Screen 
                name="LoginScreen" 
                component={LoginScreen}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen 
                name="ForgotPasswordScreen" 
                component={ForgotPasswordScreen}
                options={{ gestureEnabled: true }}
              />
              <Stack.Screen 
                name="LoadingScreen" 
                component={LoadingScreen}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen 
                name="StallHome" 
                component={StallHome}
                options={{ gestureEnabled: false }}
                initialParams={userData ? { userData } : undefined}
              />
              <Stack.Screen 
                name="InspectorHome" 
                component={InspectorHome}
                options={{ gestureEnabled: false }}
                initialParams={userData ? { userData } : undefined}
              />
              <Stack.Screen 
                name="CollectorHome" 
                component={CollectorHome}
                options={{ gestureEnabled: false }}
                initialParams={userData ? { userData } : undefined}
              />
            </Stack.Navigator>
            
            {/* Global Offline Indicator */}
            {isOffline && (
              <View style={styles.offlineBanner}>
                <Text style={styles.offlineText}>No Internet Connection</Text>
              </View>
            )}

            {/* Global Online Indicator */}
            {showOnline && !isOffline && (
              <View style={[styles.offlineBanner, styles.onlineBanner]}>
                <Text style={styles.offlineText}>Connection Restored</Text>
              </View>
            )}
            
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#002181',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 10,
  },
  offlineBanner: {
    position: 'absolute',
    top: 50,
    left: '5%',
    width: '90%',
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  onlineBanner: {
    backgroundColor: '#4CAF50',
  },
  offlineText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
