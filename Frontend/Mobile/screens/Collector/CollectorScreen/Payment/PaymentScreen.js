import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

const samplePayments = [
  {
    id: "1",
    reference: "REF-20260228-001",
    collector: "Alice Johnson",
    vendor: "Sunrise Fruits",
    status: "Paid",
    date: "2026-02-28 09:34",
  },
  {
    id: "2",
    reference: "REF-20260228-002",
    collector: "Bob Smith",
    vendor: "GreenGrocer Ltd",
    status: "Pending",
    date: "2026-02-28 10:12",
  },
  {
    id: "3",
    reference: "REF-20260227-123",
    collector: "Clara Lee",
    vendor: "Baker's Corner",
    status: "Failed",
    date: "2026-02-27 16:45",
  },
];

const PaymentScreen = () => {
  const renderPayment = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.ref}>{item.reference}</Text>
      <Text style={styles.meta}>{item.collector} • {item.vendor}</Text>
      <View style={styles.row}>
        <Text style={[styles.status, item.status === 'Paid' ? styles.paid : item.status === 'Pending' ? styles.pending : styles.failed]}>
          {item.status}
        </Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </View>
  );

  const Header = () => (
    <View style={styles.headerRow}>
      <Text style={styles.title}>Payments</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.filterButton} onPress={() => {}}>
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => {}}>
          <Text style={styles.addButtonText}>Add payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={samplePayments}
        keyExtractor={(i) => i.id}
        renderItem={renderPayment}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <Text style={[styles.subtitle, styles.empty]}>No payments found.</Text>
        )}
        contentContainerStyle={styles.content}
        ListHeaderComponent={Header}
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  filterButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 8,
  },
  separator: {
    height: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  ref: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
    color: "#fff",
  },
  paid: { backgroundColor: "#16a34a" },
  pending: { backgroundColor: "#f59e0b" },
  failed: { backgroundColor: "#ef4444" },
  date: {
    fontSize: 12,
    color: "#6b7280",
  },
});

export default PaymentScreen;
