import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

const DashboardScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>

        {/* summary cards */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payments Collected</Text>
            <Text style={styles.cardValue}>$0.00</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Missing Payments</Text>
            <Text style={styles.cardValue}>$0.00</Text>
          </View>
        </View>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vendors Paid</Text>
            <Text style={styles.cardValue}>0</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Unpaid Vendors</Text>
            <Text style={styles.cardValue}>0</Text>
          </View>
        </View>
        {/* quick tools */}
        <View style={styles.quickTools}>
          <Text style={styles.sectionTitle}>Quick Tools</Text>
          <TouchableOpacity style={styles.button} onPress={() => { /* TODO: handle navigation */ }}>
            <Text style={styles.buttonText}>Add Daily Payment</Text>
          </TouchableOpacity>
        </View>
        {/* recent transactions */}
        <View style={styles.recent}
>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.transactionHeader}>
            <Text style={styles.txText}>Ref #</Text>
            <Text style={styles.txText}>Collector</Text>
            <Text style={styles.txText}>Vendor</Text>
            <Text style={styles.txText}>Status</Text>
            <Text style={styles.txText}>Time/Date</Text>
          </View>
          {/* placeholder rows */}
          <View style={styles.transactionRow}>
            <Text style={styles.txText}>--</Text>
            <Text style={styles.txText}>--</Text>
            <Text style={styles.txText}>--</Text>
            <Text style={styles.txText}>--</Text>
            <Text style={styles.txText}>--</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    margin: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "500",
    color: "#111827",
  },
  quickTools: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  recent: {
    marginTop: 24,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  txText: {
    fontSize: 12,
    color: "#4b5563",
  },
});

export default DashboardScreen;
