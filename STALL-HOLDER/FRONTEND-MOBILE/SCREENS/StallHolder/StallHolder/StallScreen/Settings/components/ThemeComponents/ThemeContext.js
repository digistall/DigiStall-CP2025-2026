import React, { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define your theme colors
const lightTheme = {
  id: "light",
  name: "Light",
  colors: {
    background: "#f9fafb",
    surface: "#ffffff",
    card: "#ffffff",
    text: "#111827",
    textSecondary: "#6b7280",
    textTertiary: "#9ca3af",
    primary: "#002181",
    primaryLight: "#eff6ff",
    accent: "#305CDE",
    border: "#e5e7eb",
    borderLight: "#f3f4f6",
    error: "#ef4444",
    success: "#1E9C00",
    warning: "#f59e0b",
    shadow: "#000000",
  },
  statusBar: "dark-content",
};

const darkTheme = {
  id: "dark",
  name: "Dark",
  colors: {
    background: "#111827",
    surface: "#1f2937",
    card: "#374151",
    text: "#f9fafb",
    textSecondary: "#d1d5db",
    textTertiary: "#9ca3af",
    primary: "#305CDE", // Secondary blue (lighter for dark mode)
    primaryLight: "#1e3a8a",
    accent: "#305CDE", // Secondary blue
    border: "#4b5563",
    borderLight: "#374151",
    error: "#f87171",
    success: "#1E9C00", // Green (same for both themes)
    warning: "#fbbf24",
    shadow: "#000000",
  },
  statusBar: "light-content",
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState("light"); // 'light', 'dark', 'system'
  const [actualTheme, setActualTheme] = useState(lightTheme);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Handle system theme changes
  useEffect(() => {
    if (themeMode === "system") {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setActualTheme(colorScheme === "dark" ? darkTheme : lightTheme);
      });

      // Set initial system theme
      const systemTheme = Appearance.getColorScheme();
      setActualTheme(systemTheme === "dark" ? darkTheme : lightTheme);

      return () => subscription?.remove();
    }
  }, [themeMode]);

  // Update theme when mode changes
  useEffect(() => {
    switch (themeMode) {
      case "light":
        setActualTheme(lightTheme);
        break;
      case "dark":
        setActualTheme(darkTheme);
        break;
      case "system":
        const systemTheme = Appearance.getColorScheme();
        setActualTheme(systemTheme === "dark" ? darkTheme : lightTheme);
        break;
      default:
        setActualTheme(lightTheme);
    }
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme_preference");
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    }
  };

  const changeTheme = async (newThemeMode) => {
    try {
      setThemeMode(newThemeMode);
      await AsyncStorage.setItem("theme_preference", newThemeMode);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const value = {
    theme: actualTheme,
    themeMode,
    changeTheme,
    isDark: actualTheme.id === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export { lightTheme, darkTheme };
