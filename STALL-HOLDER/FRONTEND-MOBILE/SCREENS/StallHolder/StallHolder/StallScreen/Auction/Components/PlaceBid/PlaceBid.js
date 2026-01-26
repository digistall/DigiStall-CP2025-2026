import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTheme } from "../../../Settings/components/ThemeComponents/ThemeContext";
import SubmitBid from "./SuccessModal/SuccessBidModal";
import HighestBidder from "./HighestBidder/HighestBidder";
import QuickBid from "./QuickBid/QuickBid";
import LiveUpdates from "./LiveUpdates/LiveUpdates";
import CountdownTimer from "./CountdownTimer/CountdownTimer";
import useAutoRefresh from "./LiveUpdates/useAutoRefresh";
import {
  isAuctionActive,
  getMinimumBid,
  validateBid,
  hasAuctionStarted,
} from "./AuctionUtils";
import { AuctionTimings } from "../shared/constants";

const PlaceBid = ({
  visible,
  onClose,
  stallNumber,
  auctionDate,
  startTime,
  location,
  startingPrice,
  currentBid,
  minimumIncrement = 100,
  onSubmitBid,
  currentBidder = null,
  onRefreshData = null,
  onBidHistory = null,
}) => {
  const { theme } = useTheme();
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidError, setBidError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [auctionStarted, setAuctionStarted] = useState(false);

  // Monitor auction start status
  useEffect(() => {
    const checkAuctionStart = () => {
      const started = hasAuctionStarted(auctionDate, startTime);
      setAuctionStarted(started);
    };

    // Check immediately
    checkAuctionStart();

    // Check every second
    const statusInterval = setInterval(checkAuctionStart, 1000);

    return () => clearInterval(statusInterval);
  }, [auctionDate, startTime]);

  // Auto-refresh functionality
  const { isRefreshing, lastUpdated, refresh } = useAutoRefresh({
    refreshFunction: onRefreshData,
    interval: AuctionTimings.AUTO_REFRESH_INTERVAL,
    enabled: visible && isAuctionActive(auctionDate, startTime),
    dependencies: [visible, stallNumber],
  });

  // Handle auction end
  const handleAuctionEnd = () => {
    if (onRefreshData) {
      onRefreshData();
    }
    // TODO: Show auction ended notification to user
  };

  const handleSubmitBid = async () => {
    // Check if auction has started before validating bid
    if (!auctionStarted) {
      setBidError("Auction has not started yet");
      return;
    }

    const error = validateBid(
      bidAmount,
      currentBid,
      startingPrice,
      minimumIncrement
    );
    if (error) {
      setBidError(error);
      return;
    }

    // Check if auction is still active before submitting
    if (!isAuctionActive(auctionDate, startTime)) {
      setBidError("Auction is not currently active");
      return;
    }

    setIsSubmitting(true);
    setBidError("");

    try {
      const bidData = {
        stallNumber,
        bidAmount: parseFloat(bidAmount),
        timestamp: new Date().toISOString(),
        previousBid: currentBid,
        minimumIncrement,
      };

      await onSubmitBid(bidData);
      setIsSuccess(true);
    } catch (error) {
      console.error("Bid submission error:", error);
      setBidError(error.message || "Failed to submit bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bid amount change with improved formatting
  const handleBidChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = cleanedText.split(".");
    let formattedText = parts[0];
    if (parts.length > 1) {
      // Keep only first decimal point and limit to 2 decimal places
      formattedText += "." + parts[1].substring(0, 2);
    }

    setBidAmount(formattedText);

    // Clear errors when user starts typing
    if (bidError) {
      setBidError("");
    }
  };

  // Reset modal state when closed
  const handleClose = () => {
    setBidAmount("");
    setBidError("");
    setIsSuccess(false);
    setIsFocused(false);
    setAuctionStarted(false);
    onClose();
  };

  // Return to PlaceBid instead of closing completely
  const handleSuccessClose = () => {
    setIsSuccess(false);
    setBidAmount("");
    setBidError("");
    setIsFocused(false);
    // Don't reset auctionStarted here as auction should still be active
  };

  // Success view use SubmitBid component
  if (isSuccess) {
    return <SubmitBid visible={true} onClose={handleSuccessClose} />;
  }

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View
        style={[
          styles.fullScreenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Text
              style={[styles.backButtonText, { color: theme.colors.primary }]}
            >
              Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Place Your Bid
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {/* Countdown Timer Component */}
            <CountdownTimer
              auctionDurationMinutes={20}
              onAuctionEnd={handleAuctionEnd}
              urgentThreshold={300}
              warningThreshold={600}
              auctionDate={auctionDate}
              startTime={startTime}
            />

            {/* Live Updates Component */}
            {auctionStarted && (
              <LiveUpdates
                onRefresh={refresh}
                isRefreshing={isRefreshing}
                lastUpdated={lastUpdated}
                stallNumber={stallNumber}
                onBidUpdate={onBidHistory}
              />
            )}

            {/* Stall Information Card */}
            <View
              style={[
                styles.stallInfoCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.stallHeader}>
                <View style={styles.stallNumberBadge}>
                  <Text style={styles.stallNumberText}>
                    STALL #{stallNumber}
                  </Text>
                </View>
                <View style={styles.auctionBadge}>
                  <Text style={styles.auctionBadgeText}>AUCTION</Text>
                </View>
              </View>

              <View style={styles.stallDetails}>
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Location
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: theme.colors.text }]}
                  >
                    {location}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Starting Price
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: theme.colors.text }]}
                  >
                    ₱{startingPrice?.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Auction Date
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: theme.colors.text }]}
                  >
                    {auctionDate} at {startTime}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Status
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color: auctionStarted ? "#10B981" : "#F59E0B",
                      },
                    ]}
                  >
                    {auctionStarted ? "Live Auction" : "Auction Starts Soon"}
                  </Text>
                </View>
              </View>
            </View>

            {/* HighestBidder Component */}
            <HighestBidder
              currentBid={currentBid}
              currentBidder={currentBidder}
              showLiveBadge={true}
            />

            {/* Bid Input Section */}
            <View
              style={[
                styles.bidSection,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.bidSectionTitle, { color: theme.colors.text }]}
              >
                Your Bid Amount
              </Text>

              {auctionStarted ? (
                <>
                  <View
                    style={[
                      styles.bidInputWrapper,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencySymbol,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      ₱
                    </Text>
                    <TextInput
                      style={[
                        styles.bidInput,
                        { color: theme.colors.text },
                        isFocused && { borderColor: theme.colors.primary },
                        bidError && { borderColor: theme.colors.error },
                      ]}
                      value={bidAmount}
                      onChangeText={handleBidChange}
                      placeholder={getMinimumBid(
                        currentBid,
                        startingPrice,
                        minimumIncrement
                      ).toLocaleString()}
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="numeric"
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      editable={!isSubmitting}
                    />
                  </View>

                  <Text
                    style={[
                      styles.minimumBidNote,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Minimum bid: ₱
                    {getMinimumBid(
                      currentBid,
                      startingPrice,
                      minimumIncrement
                    ).toLocaleString()}
                  </Text>

                  {/* QuickBid Component */}
                  <QuickBid
                    bidAmount={bidAmount}
                    setBidAmount={setBidAmount}
                    minimumBid={getMinimumBid(
                      currentBid,
                      startingPrice,
                      minimumIncrement
                    )}
                    minimumIncrement={minimumIncrement}
                    isSubmitting={isSubmitting}
                    bidError={bidError}
                    setBidError={setBidError}
                  />

                  {bidError && (
                    <Text
                      style={[styles.errorText, { color: theme.colors.error }]}
                    >
                      {bidError}
                    </Text>
                  )}
                </>
              ) : (
                <View
                  style={[
                    styles.auctionNotActiveCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={styles.auctionNotActiveIcon}>⏰</Text>
                  <Text
                    style={[
                      styles.auctionNotActiveTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    Auction Not Started
                  </Text>
                  <Text
                    style={[
                      styles.auctionNotActiveMessage,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    The auction for this stall has not started yet. Bidding will
                    be enabled when the auction begins on {auctionDate} at{" "}
                    {startTime}.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Action Buttons */}
          {auctionStarted && (
            <View
              style={[
                styles.bottomActions,
                {
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: theme.colors.borderLight },
                ]}
                onPress={handleClose}
                disabled={Boolean(isSubmitting)}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor:
                      !bidAmount || bidError || isSubmitting
                        ? theme.colors.borderLight
                        : theme.colors.primary,
                  },
                  (!bidAmount || bidError || isSubmitting) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitBid}
                disabled={Boolean(!bidAmount || bidError || isSubmitting)}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    {
                      color:
                        !bidAmount || bidError || isSubmitting
                          ? theme.colors.textTertiary
                          : "#FFFFFF",
                    },
                    (!bidAmount || bidError || isSubmitting) &&
                      styles.submitButtonTextDisabled,
                  ]}
                >
                  {isSubmitting ? "Submitting..." : "Place Bid"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

import { PlaceBidStyles as styles } from "./PlaceBidStyles";

export default PlaceBid;
