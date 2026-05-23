import { View, Text, StyleSheet, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width, height } = Dimensions.get("window");

const NotificationEmptyState = ({ theme }) => {
  return (
    <View style={[styles.container, theme && { backgroundColor: theme.colors.background }]}>
      <View style={styles.iconContainer}>
        <Icon name="notifications-none" size={80} color={theme ? theme.colors.border : "#E5E7EB"} />
      </View>

      <Text style={[styles.title, theme && { color: theme.colors.text }]}>No Notifications Yet</Text>

      <Text style={[styles.message, theme && { color: theme.colors.textSecondary }]}>
        When you have new notifications, they will appear here. Stay tuned for
        updates about auctions, raffles, payments, and important announcements.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.08,
    paddingVertical: height * 0.1,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default NotificationEmptyState;
