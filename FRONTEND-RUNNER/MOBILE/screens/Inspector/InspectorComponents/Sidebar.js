import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles as baseStyles } from "./css/styles";
import UserStorageService from "../../../services/UserStorageService";
import { getSafeStaffName, getSafeStaffContact, getUserInitials } from "../../../services/DataDisplayUtils";

const { width, height } = Dimensions.get("window");

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: '#ffffff',
    background: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    primary: '#f59e0b', // Inspector accent color (amber)
    card: '#ffffff',
  }
};

const Sidebar = ({
  isVisible,
  onClose,
  onProfilePress,
  onMenuItemPress,
  activeMenuItem = "dashboard",
  theme = defaultTheme,
  isDarkMode = false,
}) => {
  const colors = theme?.colors || defaultTheme.colors;
  const slideAnim = useRef(new Animated.Value(-width * 0.85)).current;
  const [userData, setUserData] = useState(null);

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await UserStorageService.getUserData();
        console.log('Inspector Sidebar - Retrieved user data:', JSON.stringify(storedUserData, null, 2));
        if (storedUserData) {
          setUserData(storedUserData);
          console.log('Inspector Sidebar - Set user data:', storedUserData);
        } else {
          console.log('Inspector Sidebar - No stored data found');
        }
      } catch (error) {
        console.error('Error loading user data for sidebar:', error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width * 0.85,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // Helper function to get inspector name using safe utilities
  const getInspectorName = () => {
    if (!userData) return null;
    return getSafeStaffName(userData, "Inspector");
  };

  // Helper function to get inspector email/contact using safe utilities
  const getInspectorContact = () => {
    if (!userData) return '';
    return getSafeStaffContact(userData, '');
  };

  // Helper function to get user initials using safe utilities
  const getDisplayInitials = (fullName) => {
    if (!fullName) return "I";
    return getUserInitials(fullName, "I");
  };

  const menuItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "grid",
    },
    {
      id: "stallholders",
      title: "View Stallholders",
      icon: "people",
    },
    {
      id: "stalls",
      title: "View Stalls", 
      icon: "storefront",
    },
    {
      id: "report",
      title: "Report Violation",
      icon: "warning",
    },
    {
      id: "settings",
      title: "Settings",
      icon: "settings",
    },
  ];

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={baseStyles.container}>
        <TouchableOpacity
          style={baseStyles.overlay}
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View
          style={[baseStyles.sidebar, { backgroundColor: colors.surface, transform: [{ translateX: slideAnim }] }]}
        >
          <ScrollView
            style={baseStyles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Header Gradient */}
            <View style={[baseStyles.headerGradient, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              {/* Profile Section */}
              <View style={baseStyles.profileSection}>
                <TouchableOpacity
                  style={baseStyles.profileContainer}
                  onPress={onProfilePress}
                >
                  <View style={baseStyles.profileImageContainer}>
                    <View style={[baseStyles.profileImage, { backgroundColor: '#f59e0b' }]}>
                      <Text style={baseStyles.profileInitials}>
                        {userData ? getDisplayInitials(getInspectorName() || "Inspector") : "I"}
                      </Text>
                    </View>
                    <View style={baseStyles.statusIndicator} />
                  </View>
                  <View style={baseStyles.profileInfo}>
                    <Text style={[baseStyles.profileName, { color: colors.text }]}>
                      {userData ? getInspectorName() || "Loading..." : "Loading..."}
                    </Text>
                    <Text style={[baseStyles.profileEmail, { color: colors.textSecondary }]}>
                      {userData ? getInspectorContact() : ""}
                    </Text>
                    <View style={localStyles.roleContainer}>
                      <Text style={baseStyles.profileStatus}>Online</Text>
                      <Text style={baseStyles.profileRole}>• Inspector</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Navigation Items */}
            <View style={baseStyles.navigationSection}>
              <Text style={[baseStyles.sectionTitle, { color: colors.textSecondary }]}>NAVIGATION</Text>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    baseStyles.menuItem,
                    activeMenuItem === item.id && [baseStyles.activeMenuItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#fef3c7', borderColor: '#f59e0b' }],
                  ]}
                  onPress={() => onMenuItemPress(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={baseStyles.menuIconContainer}>
                    <Ionicons
                      name={activeMenuItem === item.id ? item.icon : `${item.icon}-outline`}
                      size={24}
                      color={activeMenuItem === item.id ? '#f59e0b' : colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      baseStyles.menuItemText,
                      { color: colors.textSecondary },
                      activeMenuItem === item.id && [baseStyles.activeMenuItemText, { color: colors.text }],
                    ]}
                  >
                    {item.title}
                  </Text>
                  {activeMenuItem === item.id && (
                    <View style={[baseStyles.activeIndicator, { backgroundColor: '#f59e0b' }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Fixed Bottom Section */}
          <View style={[baseStyles.bottomSection, { backgroundColor: colors.surface }]}>
            <View style={[baseStyles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={baseStyles.logoutItem}
              onPress={() => onMenuItemPress("logout")}
              activeOpacity={0.7}
            >
              <View style={baseStyles.logoutIconContainer}>
                <Image
                  source={require('../../../assets/Home-Image/LogoutIcon.png')}
                  style={{ width: 24, height: 24, tintColor: '#ef4444' }}
                />
              </View>
              <Text style={baseStyles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            {/* App Version */}
            <View style={baseStyles.versionContainer}>
              <Text style={[baseStyles.versionText, { color: colors.textSecondary }]}>Version 1.2.0</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default Sidebar;
