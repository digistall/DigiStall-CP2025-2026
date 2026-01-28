import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Theme Provider
import { ThemeProvider } from './components/ThemeComponents/ThemeContext';

// Screens
import LoginScreen from './screens/LoginScreen/LoginScreen';
import LoadingScreen from './screens/LoadingScreen/LoadingScreen';
import StallHome from './screens/StallHolder/StallHolder/StallScreen/StallHome';

// Services
import UserStorageService from './services/UserStorageService';

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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking authentication status...');
      const storedUserData = await UserStorageService.getUserData();
      
      if (storedUserData && storedUserData.token) {
        console.log('User is authenticated, navigating to StallHome');
        setUserData(storedUserData);
        setInitialRoute('StallHome');
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
            </Stack.Navigator>
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
});
