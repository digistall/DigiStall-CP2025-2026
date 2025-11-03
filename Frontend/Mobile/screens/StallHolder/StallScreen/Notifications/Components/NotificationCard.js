import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { formatNotificationTime } from "../utils/notificationHelpers";

const { width } = Dimensions.get("window");

const NotificationCard = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "auction":
        return "gavel";
      case "raffle":
        return "casino";
      case "payment":
        return "payment";
      case "system":
        return "info";
      case "announcement":
        return "campaign";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === "high") return "#DC2626"; // Red for high priority

    switch (type) {
      case "auction":
        return "#D97706"; // Amber for auctions
      case "raffle":
        return "#7C3AED"; // Purple for raffles
      case "payment":
        return "#059669"; // Green for payments
      case "system":
        return "#0284C7"; // Blue for system
      case "announcement":
        return "#002181"; // Navy for announcements
      default:
        return "#6B7280"; // Gray default
    }
  };

  const getPriorityIndicator = (priority) => {
    switch (priority) {
      case "high":
        return "priority_high";
      case "medium":
        return "remove";
      case "low":
        return "keyboard_arrow_down";
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, !notification.isRead && styles.unreadContainer]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor:
              getNotificationColor(notification.type, notification.priority) +
              "15",
          },
        ]}
      >
        <Icon
          name={getNotificationIcon(notification.type)}
          size={24}
          color={
            notification.isRead
              ? "#9CA3AF"
              : getNotificationColor(notification.type, notification.priority)
          }
        />
        {notification.priority && notification.priority !== "low" && (
          <View style={styles.priorityBadge}>
            <Icon
              name={getPriorityIndicator(notification.priority)}
              size={12}
              color="#FFFFFF"
            />
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.title, !notification.isRead && styles.unreadTitle]}
          >
            {notification.title}
          </Text>
          <Text style={styles.timeText}>
            {formatNotificationTime(notification.timestamp)}
          </Text>
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>

        {!notification.isRead && <View style={styles.unreadIndicator} />}
      </View>

      <View style={styles.actionsContainer}>
        {!notification.isRead && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onMarkAsRead(notification.id)}
          >
            <Icon name="done" size={18} color="#002181" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(notification.id)}
        >
          <Icon name="delete-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: width * 0.04,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  unreadContainer: {
    backgroundColor: "#F8FAFC",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  priorityBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    position: "relative",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: "600",
    color: "#1F2937",
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadIndicator: {
    position: "absolute",
    top: 0,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#002181",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default NotificationCard;
