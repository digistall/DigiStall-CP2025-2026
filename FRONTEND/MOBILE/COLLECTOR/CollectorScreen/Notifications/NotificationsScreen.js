import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const NotificationsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications-outline" size={48} color="#10b981" />
          </View>
        </View>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          No new notifications at the moment.
        </Text>
        <Text style={styles.hint}>
          Payment alerts and system updates will appear here.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.06,
  },
  content: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default NotificationsScreen;
