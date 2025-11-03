import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import ProfileDisplay from "./components/ProfileComponents//ProfileComponents/ProfileDisplay";
import { mockUser } from "./components/ProfileComponents/mockUser";
import ThemeModal from "../Settings/components/ThemeComponents/ThemeModal";
import { useTheme } from "../Settings/components/ThemeComponents/ThemeContext";
import AboutApp from "../Settings/components/AboutComponents/AboutApp";
import PrivacyModal from "../Settings/components/PrivacyComponents/PrivacyModal";
import UserStorageService from "../../../../services/UserStorageService";

const { width } = Dimensions.get("window");

const SettingsScreen = ({ user }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const { theme, themeMode, changeTheme } = useTheme();

  // Load user data from storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await UserStorageService.getUserData();
        if (storedUserData) {
          setUserData(storedUserData);
          console.log("Settings - Loaded user data:", storedUserData);
        }
      } catch (error) {
        console.error('Settings - Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // fallback if no user is passed - use real data if available, otherwise mock
  const testUser = userData || user || mockUser;

  // logging (optional for debugging)
  useEffect(() => {
    console.log("User received:", user);
    console.log("User data from storage:", userData);
    console.log("Using user:", testUser);
  }, [user, userData]);

  // Helper function to get user initials
  const getUserInitials = (name) => {
    if (!name) return "GU";
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Get real user name from stored data
  const getUserDisplayName = () => {
    if (userData && userData.user && userData.user.full_name) {
      return userData.user.full_name;
    }
    return testUser?.fullName || "Guest";
  };

  // Get user email/username for subtitle
  const getUserSubtitle = () => {
    if (userData && userData.user) {
      const user = userData.user;
      return user.email || user.username || "View and edit profile";
    }
    return testUser?.stallNumber
      ? `Stall: ${testUser.stallNumber}`
      : "View and edit profile";
  };

  // Profile handlers
  const handleViewProfile = () => {
    console.log("View Profile pressed");
    setShowProfile(true);
  };
  const handleGoBack = () => setShowProfile(false);

  // Theme handlers
  const handleThemePress = () => setShowThemeModal(true);
  const handleThemeChange = (newTheme) => {
    console.log("Theme changed to:", newTheme);
    changeTheme(newTheme);
  };
  const handleCloseThemeModal = () => setShowThemeModal(false);

  // About handlers
  const handleAboutPress = () => setShowAbout(true);
  const handleAboutGoBack = () => setShowAbout(false);

  // Privacy handlers
  const handlePrivacyPress = () => setShowPrivacyModal(true);
  const handleClosePrivacyModal = () => setShowPrivacyModal(false);

  // get theme name for display
  const getThemeDisplayName = () => {
    switch (themeMode) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return "Light";
    }
  };

  const themedStyles = createThemedStyles(theme);

  // Conditional rendering
  if (showProfile) {
    return <ProfileDisplay user={testUser} onGoBack={handleGoBack} />;
  }
  if (showAbout) {
    return <AboutApp onGoBack={handleAboutGoBack} />;
  }

  return (
    <>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.colors.surface}
      />
      <ScrollView style={themedStyles.container}>
        {/* Profile Section */}
        <View style={themedStyles.profileCard}>
          <TouchableOpacity
            onPress={handleViewProfile}
            style={themedStyles.profileRow}
          >
            <View style={themedStyles.avatarContainer}>
              <Text style={themedStyles.avatarText}>
                {getUserInitials(getUserDisplayName())}
              </Text>
            </View>
            <View style={themedStyles.profileInfo}>
              <Text style={themedStyles.profileName}>
                {getUserDisplayName()}
              </Text>
              <Text style={themedStyles.profileSubtitle}>
                {getUserSubtitle()}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Preferences</Text>

          {/* Theme */}
          <TouchableOpacity
            style={themedStyles.settingsRow}
            onPress={handleThemePress}
          >
            <MaterialIcons
              name="brush"
              size={24}
              color={theme.colors.primary}
            />
            <View style={themedStyles.settingsTextContainer}>
              <Text style={themedStyles.settingsText}>Theme</Text>
              <Text style={themedStyles.settingsSubtext}>
                {getThemeDisplayName()}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity
            style={themedStyles.settingsRow}
            onPress={handlePrivacyPress}
          >
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={themedStyles.settingsText}>Privacy</Text>
          </TouchableOpacity>
        </View>

        {/* Stallholder Section */}
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Stallholder</Text>

          <TouchableOpacity style={themedStyles.settingsRow}>
            <MaterialIcons
              name="history"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={themedStyles.settingsText}>Rental History</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>App Information</Text>

          <TouchableOpacity
            style={themedStyles.settingsRow}
            onPress={handleAboutPress}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={themedStyles.settingsText}>About</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={themedStyles.settingsRow}
            onPress={handlePrivacyPress}
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={themedStyles.settingsText}>
              Terms & Conditions / Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <ThemeModal
        visible={showThemeModal}
        onClose={handleCloseThemeModal}
        currentTheme={themeMode}
        onThemeChange={handleThemeChange}
      />
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={handleClosePrivacyModal}
      />
    </>
  );
};

// function to create themed styles
const createThemedStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    profileCard: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      margin: 16,
      borderRadius: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    profileInfo: {
      flex: 1,
      marginLeft: 12,
    },
    profileName: {
      fontSize: width * 0.05,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    profileSubtitle: {
      fontSize: width * 0.038,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: width * 0.045,
      fontWeight: "bold",
      color: "#fff",
    },
    section: {
      marginTop: 10,
      marginHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingVertical: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: width * 0.04,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      marginLeft: 16,
      marginVertical: 8,
    },
    settingsRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      paddingLeft: 18,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    settingsText: {
      fontSize: width * 0.043,
      marginLeft: 12,
      color: theme.colors.text,
      flex: 1,
    },
    settingsTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    settingsSubtext: {
      fontSize: width * 0.035,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });

export default SettingsScreen;
