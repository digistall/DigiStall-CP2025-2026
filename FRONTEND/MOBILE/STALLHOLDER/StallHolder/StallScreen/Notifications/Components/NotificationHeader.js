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

const NotificationHeader = ({ unreadCount, onMarkAllRead, onClearAll, theme }) => {
  return (
    <View style={[styles.container, theme && { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, theme && { color: theme.colors.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={[styles.badge, theme && { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        {unreadCount > 0 && (
          <TouchableOpacity style={[styles.iconButton, theme && { backgroundColor: theme.colors.background }]} onPress={onMarkAllRead}>
            <Icon name="done-all" size={22} color={theme ? theme.colors.primary : "#002181"} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.iconButton, theme && { backgroundColor: theme.colors.background }]} onPress={onClearAll}>
          <Icon name="clear-all" size={22} color={theme ? theme.colors.textSecondary : "#6B7280"} />
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
