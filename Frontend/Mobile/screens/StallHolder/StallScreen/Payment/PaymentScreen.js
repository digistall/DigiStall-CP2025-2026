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
import { useTheme } from "../Settings/components/ThemeComponents/ThemeContext";

const PaymentScreen = ({ navigation, onBack }) => {
  const { theme, isDark } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Method Selection with Proceed Button */}
        <PaymentCard
          onPaymentMethodSelect={handlePaymentMethodSelect}
          onProceedPayment={handleProceedPayment}
          theme={theme}
          isDark={isDark}
        />

        {/* Payment Records Table */}
        <PaymentTable 
          selectedPaymentMethod={selectedPaymentMethod}
          theme={theme}
          isDark={isDark}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },
});

export default PaymentScreen;
