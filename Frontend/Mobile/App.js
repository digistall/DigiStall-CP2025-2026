import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider } from "./screens/StallHolder/StallScreen/Settings/components/ThemeComponents/ThemeContext";
import LoginScreen from "./screens/LoginScreen/LoginScreen";
import StallHome from "./screens/StallHolder/StallScreen/StallHome";
import VendorHome from "./screens/Vendor/VendorHome";
import InspectorHome from "./screens/Inspector/InspectorHome";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="LoginScreen"
          screenOptions={{
            headerShown: false, // Hide the default header
          }}
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
