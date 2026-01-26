import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../../../Settings/components/ThemeComponents/ThemeContext";
import { QuickBidStyles as styles } from "./QuickBidStyles";

const QuickBid = ({
  bidAmount,
  setBidAmount,
  minimumBid,
  minimumIncrement,
  isSubmitting,
  bidError,
  setBidError,
}) => {
  const { theme } = useTheme();
  const quickBidIncrements = [100, 500, 1000];

  // Clear errors helper
  const clearErrors = () => {
    if (bidError && setBidError) {
      setBidError("");
    }
  };

  // Quick bid functions
  const handleQuickBid = (increment) => {
    const currentAmount = parseFloat(bidAmount) || 0;
    const newAmount = currentAmount + increment;
    setBidAmount(newAmount.toString());
    clearErrors();
  };

  const handleOutbid = () => {
    setBidAmount(minimumBid.toString());
    clearErrors();
  };

  const handleSetMinimum = () => {
    setBidAmount(minimumBid.toString());
    clearErrors();
  };

  return (
    <View style={styles.quickBidSection}>
      <Text style={styles.quickBidTitle}>Quick Bid</Text>

      {/* Outbid Button */}
      <TouchableOpacity
        style={[styles.outbidButton, isSubmitting && styles.disabledButton]}
        onPress={handleOutbid}
        disabled={isSubmitting}
      >
        <Text
          style={[
            styles.outbidButtonText,
            isSubmitting && styles.disabledButtonText,
          ]}
        >
          Outbid by ₱{minimumIncrement.toLocaleString()}
        </Text>
        <Text
          style={[
            styles.outbidButtonSubtext,
            isSubmitting && styles.disabledButtonSubtext,
          ]}
        >
          ₱{minimumBid.toLocaleString()}
        </Text>
      </TouchableOpacity>

      {/* Quick Increment Buttons */}
      <View style={styles.quickIncrementContainer}>
        {quickBidIncrements.map((increment) => (
          <TouchableOpacity
            key={increment}
            style={[
              styles.quickIncrementButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={() => handleQuickBid(increment)}
            disabled={isSubmitting}
          >
            <Text
              style={[
                styles.quickIncrementText,
                isSubmitting && styles.disabledButtonText,
              ]}
            >
              +₱{increment.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Set Minimum Button */}
      <TouchableOpacity
        style={[styles.setMinimumButton, isSubmitting && styles.disabledButton]}
        onPress={handleSetMinimum}
        disabled={isSubmitting}
      >
        <Text
          style={[
            styles.setMinimumButtonText,
            isSubmitting && styles.disabledButtonText,
          ]}
        >
          Set Minimum Bid
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default QuickBid;
