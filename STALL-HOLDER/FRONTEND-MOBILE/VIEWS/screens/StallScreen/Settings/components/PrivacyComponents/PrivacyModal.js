import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeComponents/ThemeContext";
import { PrivacyStyles } from "../PrivacyComponents/PrivacyStyles";

const PrivacyModal = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const themedStyles = PrivacyStyles(theme);

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={themedStyles.overlay}>
        <View style={themedStyles.modalBox}>
          {/* Header */}
          <View style={themedStyles.header}>
            <Text style={themedStyles.title}>Privacy Policy</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={themedStyles.sectionTitle}>1. Data Collection</Text>
            <Text style={themedStyles.text}>
              We collect personal details such as your name, address, contact
              number, and uploaded documents during your stall application.
            </Text>

            <Text style={themedStyles.sectionTitle}>2. Data Usage</Text>
            <Text style={themedStyles.text}>
              Your information is used only for stallholder application,
              verification, payments, and communication with the City
              Government.
            </Text>

            <Text style={themedStyles.sectionTitle}>3. Data Sharing</Text>
            <Text style={themedStyles.text}>
              We do not share your information with third parties unless
              required by law or government auditing.
            </Text>

            <Text style={themedStyles.sectionTitle}>4. User Rights</Text>
            <Text style={themedStyles.text}>
              You may request correction or deletion of your information by
              contacting the Market Enterprise and Promotions Office
              Administrator.
            </Text>
          </ScrollView>

          {/* Button */}
          <TouchableOpacity style={themedStyles.closeButton} onPress={onClose}>
            <Text style={themedStyles.closeButtonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PrivacyModal;
