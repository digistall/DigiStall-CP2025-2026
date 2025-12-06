import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: '#ffffff',
    border: '#e5e7eb',
    textSecondary: '#6b7280',
    primary: '#3b82f6',
  }
};

const Navbar = ({
  activeTab = null,
  onStallPress,
  onDocumentsPress,
  onPaymentPress,
  theme = defaultTheme,
  isDarkMode = false,
}) => {
  const colors = theme?.colors || defaultTheme.colors;
  
  const navItems = [
    {
      id: "Stall",
      icon: require("../../../assets/Home-Image/StallIcon.png"),
      label: "Stall",
      onPress: onStallPress,
    },
    {
      id: "Documents",
      icon: require("../../../assets/Home-Image/DocumentIcon.png"),
      label: "Documents",
      onPress: onDocumentsPress,
    },
    {
      id: "Payment",
      icon: require("../../../assets/payment-icon.png"),
      label: "Payment",
      onPress: onPaymentPress,
    },
  ];

  return (
    <View style={[styles.bottomNav, { 
      backgroundColor: colors.surface, 
      borderTopColor: colors.border 
    }]}>
      {navItems.map((item) => {
        // Only show active state if activeTab matches the item id
        const isActive = activeTab === item.id;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Image
              source={item.icon}
              style={[
                styles.navIcon, 
                { tintColor: isActive ? colors.primary : colors.textSecondary },
                isActive && styles.activeNavIcon
              ]}
              resizeMode="contain"
            />
            <Text style={[
              styles.navText, 
              { color: isActive ? colors.primary : colors.textSecondary },
              isActive && styles.activeNavText
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    minHeight: 70,
    // Add shadow for better visual separation
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: height * 0.005,
    minHeight: 50,
    position: "relative", // For positioning the active indicator
  },
  navIcon: {
    width: width * 0.07,
    height: width * 0.07,
    maxWidth: 30,
    maxHeight: 30,
    minWidth: 20,
    minHeight: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: width * 0.03,
    maxFontSize: 14,
    minFontSize: 10,
    textAlign: "center",
    fontWeight: "400",
  },
  activeNavIcon: {
    // Add slight scale effect for active state
    transform: [{ scale: 1.1 }],
  },
  activeNavText: {
    fontWeight: "600",
  },
});

export default Navbar;
