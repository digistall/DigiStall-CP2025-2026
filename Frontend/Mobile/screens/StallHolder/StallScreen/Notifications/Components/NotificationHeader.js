import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

const NotificationHeader = ({ unreadCount, onMarkAllRead, onClearAll }) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.iconButton} onPress={onMarkAllRead}>
            <Icon name="done-all" size={22} color="#002181" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.iconButton} onPress={onClearAll}>
          <Icon name="clear-all" size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.04,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginRight: 8,
  },
  badge: {
    backgroundColor: "#002181",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    minWidth: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NotificationHeader;
