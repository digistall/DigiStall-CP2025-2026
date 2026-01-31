import { useEffect } from "react";
import { View, Text, Modal } from "react-native";
import { SuccessModalStyles as styles } from "../../shared/ModalStyles";
import { AuctionTimings } from "../../shared/constants";

const SubmitBid = ({ visible, onClose }) => {
  useEffect(() => {
    if (visible === true) {
      const timer = setTimeout(() => {
        onClose();
      }, AuctionTimings.SUCCESS_MODAL_TIMEOUT);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={Boolean(visible)}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>

          {/* Success Title */}
          <Text style={styles.successTitle}>Bid Placed Successfully!</Text>

          {/* Success Message */}
          <Text style={styles.successMessage}>
            Your bid has been submitted successfully.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default SubmitBid;
