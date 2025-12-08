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
        {/* Payment Method Selection with Proceed Button */}
        <PaymentCard
          onPaymentMethodSelect={handlePaymentMethodSelect}
          onProceedPayment={handleProceedPayment}
        />

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
});

export default PaymentScreen;
