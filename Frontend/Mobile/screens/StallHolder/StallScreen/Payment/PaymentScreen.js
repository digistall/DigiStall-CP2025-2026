import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import PaymentTable from "./Components/PaymentTable/PaymentTable";
import { useTheme } from "../Settings/components/ThemeComponents/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const PaymentScreen = ({ navigation, onBack }) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: theme.colors.card }]}>
          <View style={styles.headerIcon}>
            <Ionicons name="receipt-outline" size={32} color={theme.colors.primary || "#007AFF"} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Payment Records
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            View your stall payment history and transaction records
          </Text>
        </View>

        {/* Payment Records Table */}
        <PaymentTable 
          selectedPaymentMethod={null}
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

  headerSection: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    alignItems: "center",
  },

  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },

  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default PaymentScreen;
