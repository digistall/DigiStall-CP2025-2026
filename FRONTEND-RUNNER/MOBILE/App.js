import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider } from "./components/ThemeComponents/ThemeContext";

// Local screens
import LoginScreen from "./screens/LoginScreen/LoginScreen";
import LoadingScreen from "./screens/LoadingScreen/LoadingScreen";
import StallHome from "./screens/StallHolder/StallHolder/StallScreen/StallHome";

// Local services
import UserStorageService from './services/UserStorageService';
import ApiService from './services/ApiService';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('LoadingScreen');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // On app start, check for stored JWT and verify it
    const checkAuth = async () => {
      try {
        const token = await UserStorageService.getAuthToken();
        if (token) {
          const result = await ApiService.verifyToken(token);
          if (result.success) {
            setInitialRoute('StallHome');
          } else {
            setInitialRoute('LoginScreen');
          }
        } else {
          setInitialRoute('LoginScreen');
        }
      } catch (error) {
        console.error('Error verifying token on startup:', error);
        setInitialRoute('LoginScreen');
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, []);

  if (!isReady) {
    return (
      <ThemeProvider>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
          <Stack.Screen name="StallHome" component={StallHome} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
