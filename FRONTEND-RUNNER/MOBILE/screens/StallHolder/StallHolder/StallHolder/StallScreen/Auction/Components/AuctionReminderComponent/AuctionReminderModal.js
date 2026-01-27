import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from '../../../../../../../components/ThemeComponents/ThemeContext';

const { width } = Dimensions.get("window");

const AuctionReminderModal = ({ visible, onClose }) => {
  const { theme, isDark } = useTheme();
  const [checkboxes, setCheckboxes] = useState({
    reminders: false,
    terms: false,
  });

  const toggleCheckbox = (key) => {
    setCheckboxes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checkboxes).every(Boolean);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Auction Reminders</Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Please make sure you have read and understood the following:
          </Text>

          {/* ScrollView to handle smaller screens */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.reminderList}>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                1. Please make sure you have prepared all required physical
                documents before attending the auction.
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                2. Once you pre-register for a stall, you cannot undo the
                action. Your information and participation will be recorded.
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                3. Follow the marketplace rules and guidelines during the
                auction.
              </Text>
              <Text style={[styles.text, { color: theme.colors.text }]}>
                4. If you win the auction, you must pay for the stall awarded to
                you by the MEPO.
              </Text>
            </View>

            {/* Two Checkboxes */}
            <TouchableOpacity
              style={[styles.checkboxContainer, { backgroundColor: isDark ? theme.colors.card : '#F3F4F6' }]}
              onPress={() => toggleCheckbox("reminders")}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  checkboxes.reminders ? "checkbox-outline" : "square-outline"
                }
                size={24}
                color={checkboxes.reminders ? theme.colors.primary : theme.colors.textTertiary}
              />
              <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                I have read and understood the auction reminders.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkboxContainer, { backgroundColor: isDark ? theme.colors.card : '#F3F4F6' }]}
              onPress={() => toggleCheckbox("terms")}
              activeOpacity={0.7}
            >
              <Ionicons
                name={checkboxes.terms ? "checkbox-outline" : "square-outline"}
                size={24}
                color={checkboxes.terms ? theme.colors.primary : theme.colors.textTertiary}
              />
              <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                I agree to the Terms & Conditions.
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.primary }, !allChecked && styles.disabledButton]}
            onPress={onClose}
            disabled={!allChecked}
          >
            <Text style={styles.closeButtonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

import { AuctionReminderStyles as styles } from "../AuctionReminderComponent/AuctionReminderStyles";

export default AuctionReminderModal;
