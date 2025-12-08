import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider } from "./screens/StallHolder/StallScreen/Settings/components/ThemeComponents/ThemeContext";
import LoginScreen from "./screens/LoginScreen/LoginScreen";
import StallHome from "./screens/StallHolder/StallScreen/StallHome";
import VendorHome from "./screens/Vendor/VendorHome";
import InspectorHome from "./screens/Inspector/InspectorHome";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('LoginScreen');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // On app start, check for stored JWT and verify it
    const checkAuth = async () => {
      try {
        const UserStorageService = (await import('./services/UserStorageService')).default;
        const ApiService = (await import('./services/ApiService')).default;
        const token = await UserStorageService.getAuthToken();
        if (token) {
          const result = await ApiService.verifyToken(token);
          if (result.success) {
            setInitialRoute('StallHome');
          } else {
            setInitialRoute('LoginScreen');
          }
        }
      } catch (error) {
        console.error('Error verifying token on startup:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // While checking auth, render nothing (or a splash/loading screen)
  if (checkingAuth) {
    return (
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
          </Stack.Navigator>
        </NavigationContainer>
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
          <Stack.Screen name="StallHome" component={StallHome} />
          <Stack.Screen name="VendorHome" component={VendorHome} />
          <Stack.Screen name="InspectorHome" component={InspectorHome} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
