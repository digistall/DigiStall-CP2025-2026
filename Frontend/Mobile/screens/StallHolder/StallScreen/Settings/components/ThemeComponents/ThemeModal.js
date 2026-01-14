import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../ThemeComponents/ThemeContext";

const { width } = Dimensions.get("window");

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
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons
              name="close"
              size={24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Choose Theme
          </Text>
          <TouchableOpacity onPress={handleApply} style={styles.headerButton}>
            <Text style={[styles.applyText, { color: theme.colors.primary }]}>
              Apply
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.introSection}>
            <MaterialIcons
              name="palette"
              size={32}
              color={theme.colors.primary}
            />
            <Text style={[styles.introTitle, { color: theme.colors.text }]}>
              Personalize Your Experience
            </Text>
            <Text
              style={[
                styles.introDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              Choose a theme that suits your preference and lighting conditions.
            </Text>
          </View>

          <View style={styles.themesContainer}>
            {themes.map(renderThemeOption)}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  applyText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  introDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  themesContainer: {
    flex: 1,
  },
  themeOption: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  themeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 14,
  },
  themePreview: {
    alignItems: "center",
  },
  previewContainer: {
    width: width * 0.7,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeader: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  previewHeaderItem: {
    width: 20,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  previewBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  previewLine: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  previewLineShort: {
    width: "60%",
  },
  previewLineMedium: {
    width: "80%",
  },
});

export default ThemeModal;
