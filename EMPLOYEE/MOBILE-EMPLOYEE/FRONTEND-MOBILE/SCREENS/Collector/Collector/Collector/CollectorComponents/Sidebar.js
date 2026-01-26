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
import UserStorageService from "../../../services/UserStorageService";

const { width, height } = Dimensions.get("window");

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: "#ffffff",
    background: "#f8fafc",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    primary: "#3b82f6",
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
  const [userData, setUserData] = useState(null);

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await UserStorageService.getUserData();
        console.log(
          "🔍 Collector Sidebar - Retrieved user data:",
          JSON.stringify(storedUserData, null, 2)
        );
        if (storedUserData && (storedUserData.staff || storedUserData.user)) {
          const userData = storedUserData.staff || storedUserData.user;
          setUserData(userData);
          console.log("👤 Collector Sidebar - Set user data:", userData);
        } else {
          console.log("❌ Collector Sidebar - No user data found");
        }
      } catch (error) {
        console.error("Error loading user data for collector sidebar:", error);
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

  // Helper function to get user initials
  const getUserInitials = (fullName) => {
    if (!fullName) return "C";
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return fullName[0].toUpperCase();
  };

  const menuItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: require("../../../assets/dashboard-icon.png"),
      isImage: true,
    },
    {
      id: "payment",
      title: "Payment",
      icon: require("../../../assets/payment-icon.png"),
      isImage: true,
    },
    {
      id: "vendor",
      title: "Vendor",
      icon: require("../../../assets/Home-Image/StallIcon.png"),
      isImage: true,
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: require("../../../assets/Notifications-icon.png"),
      isImage: true,
    },
    {
      id: "settings",
      title: "Settings",
      icon: require("../../../assets/Settings-icon.png"),
      isImage: true,
    },
  ];

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
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
          {/* User Profile Section */}
          <View
            style={[
              styles.profileSection,
              { borderBottomColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.avatarText}>
                {getUserInitials(userData?.fullname || userData?.name)}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text
                style={[styles.userName, { color: colors.text }]}
                numberOfLines={1}
              >
                {userData?.fullname || userData?.name || "Collector"}
              </Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                Collector
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item) => {
              const isActive = activeMenuItem === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    isActive && { backgroundColor: colors.background },
                  ]}
                  onPress={() => onMenuItemPress(item.id)}
                  activeOpacity={0.7}
                >
                  {item.isImage && (
                    <Image
                      source={item.icon}
                      style={[
                        styles.menuIcon,
                        {
                          tintColor: isActive
                            ? colors.primary
                            : colors.textSecondary,
                        },
                      ]}
                      resizeMode="contain"
                    />
                  )}
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: isActive ? colors.primary : colors.text },
                      isActive && styles.activeMenuText,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutButton]}
              onPress={() => onMenuItemPress("logout")}
              activeOpacity={0.7}
            >
              <View style={styles.logoutIconContainer}>
                <Text style={styles.logoutIconText}>⎋</Text>
              </View>
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Logout
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.85,
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
  },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeMenuText: {
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  logoutIconContainer: {
    width: 24,
    height: 24,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIconText: {
    fontSize: 20,
    color: "#ef4444",
    fontWeight: "600",
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "600",
  },
});

export default Sidebar;
