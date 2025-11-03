import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

const Navbar = ({
  activeTab = null,
  onStallPress,
  onDocumentsPress,
  onPaymentPress,
}) => {
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
    <View style={styles.bottomNav}>
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
              style={[styles.navIcon, isActive && styles.activeNavIcon]}
              resizeMode="contain"
            />
            <Text style={[styles.navText, isActive && styles.activeNavText]}>
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
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
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
    // Default tint color for inactive state
    tintColor: "#6b7280",
  },
  navText: {
    fontSize: width * 0.03,
    maxFontSize: 14,
    minFontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "400",
  },
  activeNavIcon: {
    tintColor: "#3b82f6",
    // Add slight scale effect for active state
    transform: [{ scale: 1.1 }],
  },
  activeNavText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
});

export default Navbar;
