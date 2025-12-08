import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { styles } from "./PaymentTableStyles";
import ViewAllTable from "./ViewAllTable";

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1F2937',
    textSecondary: '#6b7280',
    border: '#F3F4F6',
    background: '#FAFBFC',
  }
};

const PaymentTable = ({ selectedPaymentMethod, theme = defaultTheme, isDark = false }) => {
  const colors = theme?.colors || defaultTheme.colors;
  const [showViewAllModal, setShowViewAllModal] = useState(false);

  // All payment records data
  const allPaymentRecords = [
    // GCash transactions
    {
      id: 1,
      date: "2024-03-15",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "GCash",
      reference: "GC240315001",
    },
    {
      id: 2,
      date: "2024-02-15",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "GCash",
      reference: "GC240215002",
    },
    {
      id: 3,
      date: "2024-01-15",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "GCash",
      reference: "GC240115003",
    },
    {
      id: 4,
      date: "2023-12-15",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "GCash",
      reference: "GC231215004",
    },
    {
      id: 5,
      date: "2023-11-15",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "GCash",
      reference: "GC231115005",
    },

    // PayMaya transactions
    {
      id: 6,
      date: "2024-03-20",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "PayMaya",
      reference: "PM240320006",
    },
    {
      id: 7,
      date: "2024-02-20",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "PayMaya",
      reference: "PM240220007",
    },
    {
      id: 8,
      date: "2024-01-20",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "PayMaya",
      reference: "PM240120008",
    },
    {
      id: 9,
      date: "2023-12-20",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Pending",
      method: "PayMaya",
      reference: "PM231220009",
    },
    {
      id: 10,
      date: "2023-11-20",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "PayMaya",
      reference: "PM231120010",
    },

    // Bank Transfer transactions
    {
      id: 11,
      date: "2024-03-25",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "Bank Transfer",
      reference: "BT240325011",
    },
    {
      id: 12,
      date: "2024-02-25",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "Bank Transfer",
      reference: "BT240225012",
    },
    {
      id: 13,
      date: "2024-01-25",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Pending",
      method: "Bank Transfer",
      reference: "BT240125013",
    },
    {
      id: 14,
      date: "2023-12-25",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "Bank Transfer",
      reference: "BT231225014",
    },
    {
      id: 15,
      date: "2023-11-25",
      description: "Monthly Stall Rent",
      amount: "₱5,000.00",
      status: "Paid",
      method: "Bank Transfer",
      reference: "BT231125015",
    },
  ];

  // Filter transactions based on selected payment method
  const getFilteredRecords = () => {
    if (!selectedPaymentMethod) return allPaymentRecords;

    return allPaymentRecords.filter(
      (record) =>
        record.method.toLowerCase() === selectedPaymentMethod.name.toLowerCase()
    );
  };

  // Get records for main table (limited view)
  const getMainTableRecords = () => {
    const filteredRecords = getFilteredRecords();
    return filteredRecords.slice(0, 8); // Show only first 8 records
  };

  const paymentRecords = getMainTableRecords();
  const allFilteredRecords = getFilteredRecords(); // For modal

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "failed":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getMethodColor = (method) => {
    switch (method.toLowerCase()) {
      case "gcash":
        return "#007DFE";
      case "paymaya":
        return "#00D632";
      case "bank transfer":
        return "#FF6B35";
      default:
        return "#6B7280";
    }
  };

  const renderPaymentRecord = (record) => (
    <TouchableOpacity key={record.id} style={[styles.recordCard, { backgroundColor: isDark ? colors.surface : '#FAFBFC' }]}>
      <View style={styles.recordHeader}>
        <Text style={[styles.recordDescription, { color: colors.text }]}>{record.description}</Text>
        <Text style={styles.recordAmount}>{record.amount}</Text>
      </View>

      <View style={styles.recordDetails}>
        <Text style={[styles.recordDate, { color: colors.textSecondary }]}>{record.date}</Text>
        <View style={styles.recordMeta}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(record.status) },
            ]}
          >
            <Text style={styles.statusText}>{record.status}</Text>
          </View>
          <View
            style={[
              styles.methodBadge,
              { backgroundColor: getMethodColor(record.method) },
            ]}
          >
            <Text style={styles.methodText}>{record.method}</Text>
          </View>
        </View>
      </View>

      <View style={styles.recordFooter}>
        <Text style={styles.referenceText}>Ref: {record.reference}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleViewAllPress = () => {
    setShowViewAllModal(true);
  };

  const handleCloseModal = () => {
    setShowViewAllModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.tableTitle, { color: colors.text }]}>
          {selectedPaymentMethod
            ? `${selectedPaymentMethod.name} Record Transactions`
            : "Payment Records"}
        </Text>
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: isDark ? colors.surface : '#F8FAFC', borderColor: colors.border }]}
          onPress={handleViewAllPress}
        >
          <Text style={[styles.viewAllText, { color: colors.textSecondary }]}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.recordsList}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {paymentRecords.map(renderPaymentRecord)}
      </ScrollView>

      {/* View All Modal */}
      <ViewAllTable
        visible={showViewAllModal}
        onClose={handleCloseModal}
        paymentRecords={allFilteredRecords}
        selectedPaymentMethod={selectedPaymentMethod}
        theme={theme}
      />
    </View>
  );
};

export default PaymentTable;
