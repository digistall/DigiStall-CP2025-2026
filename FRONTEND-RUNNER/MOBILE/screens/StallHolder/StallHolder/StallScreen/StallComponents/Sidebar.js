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
import { styles as baseStyles } from "./css/styles";
import UserStorageService from "../../../services/UserStorageService";
import { getSafeUserName, getSafeContactInfo, getUserInitials } from "../../../services/DataDisplayUtils";

const { width, height } = Dimensions.get("window");

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: '#ffffff',
    background: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    primary: '#3b82f6',
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
        console.log('🔍 Sidebar - Retrieved user data:', JSON.stringify(storedUserData, null, 2));
        if (storedUserData && storedUserData.user) {
          setUserData(storedUserData.user);
          console.log('👤 Sidebar - Set user data:', storedUserData.user);
        } else {
          console.log('❌ Sidebar - No user data found');
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

  // Get display name using safe utilities
  const getDisplayName = () => {
    if (!userData) return "Loading...";
    return getSafeUserName(userData, "User");
  };

  // Get display contact using safe utilities
  const getDisplayContact = () => {
    if (!userData) return "";
    return getSafeContactInfo(userData, "");
  };

  // Get safe initials using safe utilities
  const getDisplayInitials = () => {
    if (!userData) return "U";
    const name = getSafeUserName(userData, "");
    return getUserInitials(name, "U");
  };

  // Professional icon components using SVG-like paths rendered as text
  const SettingsIcon = () => (
    <View style={styles.iconContainer}>
      <View style={styles.settingsIcon}>
        <View style={styles.settingsCenter} />
        <View style={[styles.settingsTooth, { top: -3, left: 6 }]} />
        <View
          style={[
            styles.settingsTooth,
            { top: 6, right: -3, transform: [{ rotate: "90deg" }] },
          ]}
        />
        <View
          style={[
            styles.settingsTooth,
            { bottom: -3, left: 6, transform: [{ rotate: "180deg" }] },
          ]}
        />
        <View
          style={[
            styles.settingsTooth,
            { top: 6, left: -3, transform: [{ rotate: "270deg" }] },
          ]}
        />
      </View>
    </View>
  );

  const menuItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: require('../../../../../assets/dashboard-icon.png'),
      isImage: true,
    },
    {
      id: "reports",
      title: "Complaints", 
      icon: require('../../../../../assets/report-icon.png'),
      isImage: true,
    },
    {
      id: "payment",
      title: "Payment",
      icon: require('../../assets/payment-icon.png'),
      isImage: true,
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: require('../../assets/Notifications-icon.png'),
      isImage: true,
    },
    {
      id: "settings",
      title: "Settings",
      icon: require('../../assets/Settings-icon.png'),
      isImage: true,
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
                    <View style={[baseStyles.profileImage, { backgroundColor: colors.primary }]}>
                      <Text style={baseStyles.profileInitials}>
                        {getDisplayInitials()}
                      </Text>
                    </View>
                    <View style={baseStyles.statusIndicator} />
                  </View>
                  <View style={baseStyles.profileInfo}>
                    <Text style={[baseStyles.profileName, { color: colors.text }]}>
                      {getDisplayName()}
                    </Text>
                    <Text style={[baseStyles.profileEmail, { color: colors.textSecondary }]}>
                      {getDisplayContact()}
                    </Text>
                    <Text style={baseStyles.profileStatus}>Online</Text>
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
                    activeMenuItem === item.id && [baseStyles.activeMenuItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f1f5f9', borderColor: colors.border }],
                  ]}
                  onPress={() => onMenuItemPress(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={baseStyles.menuIconContainer}>
                    {item.isImage ? (
                      <Image
                        source={item.icon}
                        style={[baseStyles.menuItemIconImage, { tintColor: activeMenuItem === item.id ? colors.primary : colors.textSecondary }]}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={[baseStyles.menuItemIcon, { color: colors.textSecondary }]}>{item.icon}</Text>
                    )}
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
                    <View style={[baseStyles.activeIndicator, { backgroundColor: colors.primary }]} />
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
                <View style={baseStyles.logoutIcon}>
                  <View style={baseStyles.logoutArrow} />
                  <View style={baseStyles.logoutDoor} />
                </View>
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

export default Sidebar;
