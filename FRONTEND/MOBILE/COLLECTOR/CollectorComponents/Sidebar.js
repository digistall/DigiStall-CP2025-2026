import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import UserStorageService from "../../services/UserStorageService";

const { width } = Dimensions.get("window");

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: "#ffffff",
    background: "#f8fafc",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    primary: "#10b981",
    card: "#ffffff",
  },
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
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [userData, setUserData] = useState(null);

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await UserStorageService.getUserData();
        if (storedUserData && (storedUserData.staff || storedUserData.user)) {
          const data = storedUserData.staff || storedUserData.user;
          setUserData(data);
        }
      } catch (error) {
        console.error("Error loading user data for collector sidebar:", error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.85,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  // Helper function to get user initials
  const getUserInitials = (fullName) => {
    if (!fullName) return "C";
    const names = fullName.trim().split(" ").filter((n) => n.length > 0);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const getCollectorName = () => {
    if (!userData) return "Collector";
    if (userData.fullname) return userData.fullname;
    if (userData.name) return userData.name;
    if (userData.first_name && userData.last_name) {
      return `${userData.first_name} ${userData.last_name}`.trim();
    }
    return "Collector";
  };

  const getCollectorContact = () => {
    if (!userData) return "";
    return userData.email || userData.contact_number || "";
  };

  const menuItems = [
    { id: "dashboard", title: "Dashboard", icon: "grid" },
    { id: "payment", title: "Payment", icon: "wallet" },
    { id: "vendor", title: "Vendors", icon: "storefront" },
    { id: "notifications", title: "Notifications", icon: "notifications" },
    { id: "settings", title: "Settings", icon: "settings" },
  ];

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[styles.overlayBg, { opacity: overlayAnim }]}
          />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.sidebar,
            {
              backgroundColor: colors.surface,
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Header / Profile Section */}
            <View
              style={[
                styles.headerGradient,
                {
                  backgroundColor: colors.background,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.profileSection}>
                <TouchableOpacity
                  style={styles.profileContainer}
                  onPress={onProfilePress}
                  activeOpacity={0.8}
                >
                  <View style={styles.profileImageContainer}>
                    <View style={styles.profileImage}>
                      <Text style={styles.profileInitials}>
                        {getUserInitials(getCollectorName())}
                      </Text>
                    </View>
                    <View style={styles.statusIndicator} />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text
                      style={[styles.profileName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {getCollectorName()}
                    </Text>
                    <Text
                      style={[
                        styles.profileEmail,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {getCollectorContact()}
                    </Text>
                    <View style={styles.roleContainer}>
                      <Text style={styles.profileStatus}>Online</Text>
                      <Text style={styles.profileRole}>• Collector</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Navigation Items */}
            <View style={styles.navigationSection}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                NAVIGATION
              </Text>
              {menuItems.map((item) => {
                const isActive = activeMenuItem === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      isActive && [
                        styles.activeMenuItem,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.1)"
                            : "#d1fae5",
                          borderColor: "#10b981",
                        },
                      ],
                    ]}
                    onPress={() => onMenuItemPress(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name={isActive ? item.icon : `${item.icon}-outline`}
                        size={22}
                        color={
                          isActive ? "#10b981" : colors.textSecondary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuItemText,
                        { color: colors.textSecondary },
                        isActive && [
                          styles.activeMenuItemText,
                          { color: colors.text },
                        ],
                      ]}
                    >
                      {item.title}
                    </Text>
                    {isActive && (
                      <View
                        style={[
                          styles.activeIndicator,
                          { backgroundColor: "#10b981" },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Fixed Bottom Section */}
          <View
            style={[styles.bottomSection, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
            <TouchableOpacity
              style={styles.logoutItem}
              onPress={() => onMenuItemPress("logout")}
              activeOpacity={0.7}
            >
              <View style={styles.logoutIconContainer}>
                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              </View>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.versionContainer}>
              <Text
                style={[styles.versionText, { color: colors.textSecondary }]}
              >
                Version 1.0.0
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  overlay: {
    flex: 1,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.85,
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: {
      width: 4,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: "column",
  },
  content: {
    flex: 1,
    flexDirection: "column",
  },
  headerGradient: {
    borderBottomWidth: 1,
  },
  profileSection: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInitials: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10b981",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  profileEmail: {
    fontSize: 13,
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileStatus: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  profileRole: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  navigationSection: {
    paddingTop: 32,
    paddingHorizontal: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 12,
    position: "relative",
    marginBottom: 4,
  },
  activeMenuItem: {
    borderWidth: 1,
  },
  activeIndicator: {
    position: "absolute",
    right: 8,
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  menuIconContainer: {
    width: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
    flex: 1,
  },
  activeMenuItemText: {
    fontWeight: "600",
  },
  bottomSection: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  logoutIconContainer: {
    width: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  logoutText: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  versionContainer: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "400",
  },
});

export default Sidebar;
