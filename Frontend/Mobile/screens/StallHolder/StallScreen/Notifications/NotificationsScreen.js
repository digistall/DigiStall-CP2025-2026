import { useState, useEffect } from "react";
import {
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import NotificationHeader from "./Components/NotificationHeader";
import SearchFilterBar from "./Components/SearchFilter/SearchFilterBar";
import NotificationCard from "./Components/NotificationCard";
import NotificationEmptyState from "./Components/NotificationEmptyState";
import { generateSampleNotifications } from "./utils/notificationHelpers";

const NotificationsScreen = () => {
  // Sample data
  const [allNotifications, setAllNotifications] = useState(
    generateSampleNotifications()
  );

  const [filteredNotifications, setFilteredNotifications] =
    useState(allNotifications);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedSort, setSelectedSort] = useState("default");
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...allNotifications];

    // Apply search filter
    if (searchText.trim()) {
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchText.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter !== "ALL") {
      filtered = filtered.filter(
        (notification) => notification.type.toUpperCase() === selectedFilter
      );
    }

    // Apply sorting
    switch (selectedSort) {
      case "newest":
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case "unread":
        filtered.sort((a, b) => {
          if (a.isRead === b.isRead) {
            return new Date(b.timestamp) - new Date(a.timestamp);
          }
          return a.isRead ? 1 : -1;
        });
        break;
      case "priority":
        filtered.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          if (aPriority === bPriority) {
            return new Date(b.timestamp) - new Date(a.timestamp);
          }
          return bPriority - aPriority;
        });
        break;
      default:
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    setFilteredNotifications(filtered);
  }, [allNotifications, searchText, selectedFilter, selectedSort]);

  // Get unread count
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  // Handlers
  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Handle different action types
    switch (notification.actionType) {
      case "bid_required":
      case "upcoming_auction":
        console.log(
          "Navigate to auction screen for stall:",
          notification.stallId
        );
        // navigation.navigate('Auction', { stallId: notification.stallId });
        break;

      case "entry_confirmed":
      case "raffle_result":
      case "limited_raffle":
        console.log(
          "Navigate to raffle screen for stall:",
          notification.stallId
        );
        // navigation.navigate('Raffle', { stallId: notification.stallId });
        break;

      case "payment_due":
      case "payment_confirmed":
        console.log("Navigate to payment screen");
        // navigation.navigate('Payment');
        break;

      case "auction_won":
        console.log(
          "Show auction win details for stall:",
          notification.stallId
        );
        // Show success modal or navigate to contract/payment
        break;

      case "new_auction":
        console.log("Navigate to auction list");
        // navigation.navigate('Auction');
        break;

      case "maintenance_notice":
        console.log("Show maintenance details");
        // Show maintenance info modal
        break;

      default:
        console.log("Notification pressed:", notification.title);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    setAllNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllRead = () => {
    setAllNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  const handleDelete = (notificationId) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setAllNotifications((prev) =>
              prev.filter((notification) => notification.id !== notificationId)
            );
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => setAllNotifications([]),
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      // You can add logic to fetch fresh notifications here
    }, 1000);
  };

  const renderHeader = () => (
    <>
      <NotificationHeader
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
      />
      <SearchFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedFilter={selectedFilter}
        onFilterSelect={setSelectedFilter}
        selectedSort={selectedSort}
        onSortSelect={setSelectedSort}
        searchPlaceholder="Search notifications..."
        filters={[
          "ALL",
          "AUCTION",
          "RAFFLE",
          "PAYMENT",
          "SYSTEM",
          "ANNOUNCEMENT",
        ]}
        sortOptions={[
          { label: "Newest First", value: "newest" },
          { label: "Oldest First", value: "oldest" },
          { label: "Unread First", value: "unread" },
          { label: "Priority", value: "priority" },
          { label: "Default", value: "default" },
        ]}
      />
    </>
  );

  const renderNotificationItem = ({ item }) => (
    <NotificationCard
      notification={item}
      onPress={handleNotificationPress}
      onMarkAsRead={handleMarkAsRead}
      onDelete={handleDelete}
    />
  );

  const renderEmptyState = () => <NotificationEmptyState />;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#002181"]}
              tintColor="#002181"
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={
            filteredNotifications.length === 0
              ? styles.emptyContainer
              : styles.contentContainer
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={() => Keyboard.dismiss()}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

export default NotificationsScreen;
