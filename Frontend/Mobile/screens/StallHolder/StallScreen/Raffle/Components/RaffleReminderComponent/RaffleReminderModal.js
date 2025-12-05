import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const RaffleReminderModal = ({ visible, onClose }) => {
  const [checkboxes, setCheckboxes] = useState({
    reminders: false,
    terms: false,
  });

  // Reset checkboxes when modal becomes visible
  useEffect(() => {
    if (visible) {
      setCheckboxes({
        reminders: false,
        terms: false,
      });
    }
  }, [visible]);

  const toggleCheckbox = (key) => {
    setCheckboxes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checkboxes).every(Boolean);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Raffle Reminders</Text>

          <Text style={styles.subtitle}>
            Please make sure you have read and understood the following:
          </Text>

          {/* ScrollView to handle smaller screens */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.reminderList}>
              <Text style={styles.text}>
                1. The raffle draw will be held at the MEPO office. Please make
                sure you arrive on time.
              </Text>
              <Text style={styles.text}>
                2. Please make sure you have prepared all required physical
                documents before participating in the raffle.
              </Text>
              <Text style={styles.text}>
                3. Once you pre-register for a stall raffle, you cannot undo the
                action. Your information and participation will be recorded.
              </Text>
              <Text style={styles.text}>
                4. Follow the marketplace rules and guidelines during the raffle
                draw.
              </Text>
              <Text style={styles.text}>
                5. If you win the raffle, you must pay for the stall awarded to
                you by the MEPO.
              </Text>
            </View>

            {/* Two Checkboxes */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => toggleCheckbox("reminders")}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  checkboxes.reminders ? "checkbox-outline" : "square-outline"
                }
                size={24}
                color={checkboxes.reminders ? "#2563EB" : "#6B7280"}
              />
              <Text style={styles.checkboxText}>
                I have read and understood the raffle reminders.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => toggleCheckbox("terms")}
              activeOpacity={0.7}
            >
              <Ionicons
                name={checkboxes.terms ? "checkbox-outline" : "square-outline"}
                size={24}
                color={checkboxes.terms ? "#2563EB" : "#6B7280"}
              />
              <Text style={styles.checkboxText}>
                I agree to the Terms & Conditions.
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.closeButton, !allChecked && styles.disabledButton]}
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

import { RaffleReminderStyles as styles } from "./RaffleReminderStyles";

export default RaffleReminderModal;
