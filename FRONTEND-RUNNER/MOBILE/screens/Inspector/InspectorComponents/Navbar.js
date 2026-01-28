import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: '#ffffff',
    border: '#e5e7eb',
    textSecondary: '#6b7280',
    primary: '#f59e0b', // Inspector accent color (amber)
  }
};

const Navbar = ({
  activeTab = null,
  onDashboardPress,
  onStallholdersPress,
  onStallsPress,
  onReportPress,
  theme = defaultTheme,
  isDarkMode = false,
}) => {
  const colors = theme?.colors || defaultTheme.colors;
  
  const navItems = [
    {
      id: "Dashboard",
      icon: "home",
      label: "Dashboard",
      onPress: onDashboardPress,
    },
    {
      id: "Stallholders",
      icon: "people",
      label: "Stallholders",
      onPress: onStallholdersPress,
    },
    {
      id: "Stalls",
      icon: "business",
      label: "Stalls",
      onPress: onStallsPress,
    },
    {
      id: "Report",
      icon: "document-text",
      label: "Report",
      onPress: onReportPress,
    },
  ];

  return (
    <View style={[styles.bottomNav, { 
      backgroundColor: colors.surface, 
      borderTopColor: colors.border 
    }]}>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? item.icon : `${item.icon}-outline`}
              size={24}
              color={isActive ? colors.primary : colors.textSecondary}
              style={isActive && styles.activeNavIcon}
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
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.02,
    minHeight: 70,
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
    position: "relative",
  },
  navText: {
    fontSize: width * 0.028,
    textAlign: "center",
    fontWeight: "400",
    marginTop: 4,
  },
  activeNavIcon: {
    transform: [{ scale: 1.1 }],
  },
  activeNavText: {
    fontWeight: "600",
  },
});

export default Navbar;
