import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { styles } from "./ViewAllTableStyles";

const { height: screenHeight } = Dimensions.get("window");

const ViewAllTable = ({
  visible,
  onClose,
  paymentRecords,
  selectedPaymentMethod,
  theme,
}) => {
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
    <TouchableOpacity key={record.id} style={[styles.recordCard, theme && { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.recordHeader}>
        <Text style={[styles.recordDescription, theme && { color: theme.colors.text }]}>{record.description}</Text>
        <Text style={styles.recordAmount}>{record.amount}</Text>
      </View>

      <View style={styles.recordDetails}>
        <Text style={[styles.recordDate, theme && { color: theme.colors.textSecondary }]}>{record.date}</Text>
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

      <View style={[styles.recordFooter, theme && { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.referenceText, theme && { color: theme.colors.textSecondary }]}>Ref: {record.reference}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, theme && { backgroundColor: theme.colors.surface }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, theme && { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, theme && { color: theme.colors.text }]}>
              {selectedPaymentMethod
                ? `All ${selectedPaymentMethod.name} Transactions`
                : "All Payment Records"}
            </Text>
            <TouchableOpacity style={[styles.closeButton, theme && { backgroundColor: theme.colors.background }]} onPress={onClose}>
              <Text style={[styles.closeButtonText, theme && { color: theme.colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Records Count */}
          <View style={[styles.recordsCount, theme && { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.recordsCountText, theme && { color: theme.colors.textSecondary }]}>
              Total Records: {paymentRecords.length}
            </Text>
          </View>

          {/* Records List */}
          <ScrollView
            style={styles.recordsList}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {paymentRecords.map(renderPaymentRecord)}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.closeFooterButton}
              onPress={onClose}
            >
              <Text style={styles.closeFooterButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ViewAllTable;
