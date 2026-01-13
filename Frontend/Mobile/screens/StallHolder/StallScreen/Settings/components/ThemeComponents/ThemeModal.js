import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../ThemeComponents/ThemeContext";

const { width, height } = Dimensions.get("window");

const ThemeModal = ({ visible, onClose, currentTheme, onThemeChange }) => {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || "light");
  const { theme } = useTheme();

  const themes = [
    {
      id: "light",
      name: "Light Theme",
      icon: "sunny-outline",
      description: "Clean and bright interface",
      preview: {
        background: "#ffffff",
        surface: "#f9fafb",
        text: "#111827",
        accent: "#3b82f6",
      },
    },
    {
      id: "dark",
      name: "Dark Theme",
      icon: "moon-outline",
      description: "Easy on the eyes in low light",
      preview: {
        background: "#1f2937",
        surface: "#374151",
        text: "#f9fafb",
        accent: "#60a5fa",
      },
    },
    {
      id: "system",
      name: "System Default",
      icon: "phone-portrait-outline",
      description: "Follow your device settings",
      preview: {
        background: "#6b7280",
        surface: "#9ca3af",
        text: "#ffffff",
        accent: "#8b5cf6",
      },
    },
  ];

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
  };

  const handleApply = () => {
    onThemeChange(selectedTheme);
    onClose();
  };

  // Get gradient colors based on current theme
  const getGradientColors = () => {
    if (theme.isDark) {
      return ['#1a237e', '#0d47a1', '#1565c0'];
    }
    return ['#1a237e', '#283593', '#3949ab'];
  };

  const renderThemeOption = (themeOption) => {
    const isSelected = selectedTheme === themeOption.id;

    return (
      <TouchableOpacity
        key={themeOption.id}
        style={[
          styles.themeOption,
          { backgroundColor: theme.colors.card },
          isSelected && { borderWidth: 2, borderColor: theme.colors.primary },
        ]}
        onPress={() => handleThemeSelect(themeOption.id)}
        activeOpacity={0.7}
      >
        <View style={styles.themeHeader}>
          <View
            style={[
              styles.themeIconContainer,
              { backgroundColor: theme.colors.border },
            ]}
          >
            <Ionicons
              name={themeOption.icon}
              size={24}
              color={
                isSelected ? theme.colors.primary : theme.colors.textSecondary
              }
            />
          </View>
          <View style={styles.themeInfo}>
            <Text
              style={[
                styles.themeName,
                { color: theme.colors.text },
                isSelected && { color: theme.colors.primary },
              ]}
            >
              {themeOption.name}
            </Text>
            <Text
              style={[
                styles.themeDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {themeOption.description}
            </Text>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={theme.colors.primary}
            />
          )}
        </View>

        <View style={styles.themePreview}>
          <View
            style={[
              styles.previewContainer,
              { backgroundColor: themeOption.preview.background },
            ]}
          >
            <View
              style={[
                styles.previewHeader,
                { backgroundColor: themeOption.preview.surface },
              ]}
            >
              <View
                style={[
                  styles.previewHeaderItem,
                  { backgroundColor: themeOption.preview.accent },
                ]}
              />
              <View
                style={[
                  styles.previewHeaderItem,
                  { backgroundColor: themeOption.preview.text, opacity: 0.3 },
                ]}
              />
            </View>
            <View style={styles.previewBody}>
              <View
                style={[
                  styles.previewLine,
                  { backgroundColor: themeOption.preview.text },
                ]}
              />
              <View
                style={[
                  styles.previewLine,
                  styles.previewLineShort,
                  { backgroundColor: themeOption.preview.text, opacity: 0.6 },
                ]}
              />
              <View
                style={[
                  styles.previewLine,
                  styles.previewLineMedium,
                  { backgroundColor: themeOption.preview.text, opacity: 0.4 },
                ]}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Choose Theme</Text>
            <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {/* Icon and Description */}
          <View style={styles.introSection}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="palette" size={36} color="#1a237e" />
            </View>
            <Text style={styles.introTitle}>Personalize Your Experience</Text>
            <Text style={styles.introDescription}>
              Choose a theme that suits your preference and lighting conditions.
            </Text>
          </View>
        </LinearGradient>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.themesContainer}>
            {themes.map(renderThemeOption)}
          </View>
          
          {/* Bottom Spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: height * 0.02,
    paddingBottom: height * 0.03,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: height * 0.02,
  },
  closeButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    minWidth: 40,
    alignItems: "center",
  },
  applyButton: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  applyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  introSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  introDescription: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: height * 0.025,
  },
  themesContainer: {
    paddingHorizontal: 20,
  },
  themeOption: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  themeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  themePreview: {
    alignItems: "center",
  },
  previewContainer: {
    width: width * 0.75,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  previewHeader: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  previewHeaderItem: {
    width: 24,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  previewBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  previewLine: {
    height: 5,
    borderRadius: 2.5,
    marginBottom: 10,
  },
  previewLineShort: {
    width: "60%",
  },
  previewLineMedium: {
    width: "80%",
  },
});

export default ThemeModal;
