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
    <TouchableOpacity key={record.id} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDescription}>{record.description}</Text>
        <Text style={styles.recordAmount}>{record.amount}</Text>
      </View>

      <View style={styles.recordDetails}>
        <Text style={styles.recordDate}>{record.date}</Text>
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedPaymentMethod
                ? `All ${selectedPaymentMethod.name} Transactions`
                : "All Payment Records"}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Records Count */}
          <View style={styles.recordsCount}>
            <Text style={styles.recordsCountText}>
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
