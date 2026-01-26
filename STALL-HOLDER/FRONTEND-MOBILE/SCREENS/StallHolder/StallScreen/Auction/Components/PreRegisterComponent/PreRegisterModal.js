import { View, Text, TouchableOpacity, Modal } from "react-native";
import { PreRegisterModalStyles as styles } from "../shared/ModalStyles";

const PreRegisterModal = ({
  visible,
  onClose,
  stallNumber,
  auctionDate,
  startTime,
  location,
  auctionType = "Online Auction",
}) => {
  return (
    <Modal
      visible={visible}
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

          {/* Success Message */}
          <Text style={styles.successTitle}>Pre-Registration Successful!</Text>

          <Text style={styles.successMessage}>
            You have successfully pre-registered for the auction of Stall #
            {stallNumber}.
          </Text>

          {/* Auction Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stall Number:</Text>
              <Text style={styles.detailValue}>#{stallNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{location}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Auction Date:</Text>
              <Text style={styles.detailValue}>{auctionDate}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Time:</Text>
              <Text style={styles.detailValue}>{startTime}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Auction Type:</Text>
              <Text style={styles.detailValue}>{auctionType}</Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Important Notes:</Text>
            <Text style={styles.instructionsText}>
              1. Ensure you have a stable internet connection during the auction
            </Text>
            <Text style={styles.instructionsText}>
              2. Have your valid ID ready for verification if required
            </Text>
            <Text style={styles.instructionsText}>
              3. Prepare all necessary documents digitally for upload
            </Text>
            <Text style={styles.instructionsText}>
              4. Join the auction 10-15 minutes before the scheduled time
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PreRegisterModal;
