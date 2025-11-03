import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import PaymentCard from "./Components/PaymentCard/PaymentCard";
import PaymentTable from "./Components/PaymentTable/PaymentTable";

const PaymentScreen = ({ navigation, onBack }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleProceedPayment = () => {
    if (!selectedPaymentMethod) {
      Alert.alert("Error", "Please select a payment method first");
      return;
    }

    Alert.alert(
      "Payment Confirmation",
      `You selected ${selectedPaymentMethod.name} as your payment method.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Proceed",
          onPress: () => {
            // Navigate to payment details or process payment
            console.log("Processing payment with:", selectedPaymentMethod);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Method Selection */}
        <PaymentCard onPaymentMethodSelect={handlePaymentMethodSelect} />

        {/* Proceed with Payment Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.proceedButton,
              !selectedPaymentMethod && styles.disabledButton,
            ]}
            onPress={handleProceedPayment}
            disabled={!selectedPaymentMethod}
          >
            <Text
              style={[
                styles.proceedButtonText,
                !selectedPaymentMethod && styles.disabledButtonText,
              ]}
            >
              Proceed with Payment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Records Table */}
        <PaymentTable selectedPaymentMethod={selectedPaymentMethod} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  content: {
    flex: 1,
  },

  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    backgroundColor: "#F8F9FA",
  },

  proceedButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  disabledButton: {
    backgroundColor: "#E5E7EB",
    elevation: 0,
    shadowOpacity: 0,
  },

  proceedButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  disabledButtonText: {
    color: "#9CA3AF",
  },
});

export default PaymentScreen;
