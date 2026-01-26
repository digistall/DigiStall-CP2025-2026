import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useTheme } from "../../../Settings/components/ThemeComponents/ThemeContext";
import PreRegisterModal from "../PreRegisterComponent/PreRegisterModal";
import PlaceBid from "../PlaceBid/PlaceBid";
import {
  isAuctionActive,
  calculateAuctionCountdown,
} from "../PlaceBid/AuctionUtils";
import { AuctionTimings } from "../shared/constants";

const AuctionCard = ({
  stall,
  onPreRegister,
  isPreRegistered,
  onSubmitBid,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [showPlaceBid, setShowPlaceBid] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const newCountdown = calculateAuctionCountdown(
        stall.auctionDate,
        stall.startTime
      );
      setCountdown(newCountdown);
    };

    updateCountdown();
    const interval = setInterval(
      updateCountdown,
      AuctionTimings.COUNTDOWN_UPDATE_INTERVAL
    );

    return () => clearInterval(interval);
  }, [stall.auctionDate, stall.startTime]);

  const handlePreRegisterPress = () => {
    onPreRegister(stall.id);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handlePlaceBidPress = () => {
    setShowPlaceBid(true);
  };

  const handlePlaceBidClose = () => {
    setShowPlaceBid(false);
  };

  const handleSubmitBid = async (bidData) => {
    try {
      if (onSubmitBid) {
        await onSubmitBid(stall.id, bidData);
      }
    } catch (error) {
      console.error("Error submitting bid:", error);
      throw error;
    }
  };

  return (
    <View
      style={[
        styles.auctionCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Stall Image + Badge */}
      <View style={styles.cardHeader}>
        <Image source={{ uri: stall.image }} style={styles.stallImage} />
        <View style={styles.auctionBadge}>
          <Text style={styles.auctionBadgeText}>AUCTION</Text>
        </View>
      </View>

      {/* Stall Info */}
      <View style={styles.cardContent}>
        <View style={styles.stallInfo}>
          <View
            style={[
              styles.stallNumberContainer,
              { backgroundColor: theme.colors.accent },
            ]}
          >
            <Text style={[styles.stallLabel, { color: "#FFFFFF" }]}>
              STALL#
            </Text>
            <Text style={[styles.stallNumber, { color: "#FFFFFF" }]}>
              {stall.stallNumber}
            </Text>
          </View>

          <View style={[styles.locationContainer]}>
            <Text style={[styles.locationText, { color: "#FFFFFF" }]}>
              {stall.location}
            </Text>
          </View>
        </View>

        {/* Starting Price */}
        <View
          style={[
            styles.startingPriceContainer,
            {
              backgroundColor: theme.colors.primaryLight,
              borderLeftColor: theme.colors.success,
            },
          ]}
        >
          <Text
            style={[styles.startingPriceLabel, { color: theme.colors.success }]}
          >
            Starting Price:
          </Text>
          <Text
            style={[styles.startingPriceText, { color: theme.colors.success }]}
          >
            {stall.price} Php
          </Text>
        </View>

        {/* Floor + Size */}
        <View style={styles.detailsContainer}>
          <Text
            style={[styles.floorText, { color: theme.colors.textSecondary }]}
          >
            {stall.floor}
          </Text>
          <Text
            style={[styles.sizeText, { color: theme.colors.textSecondary }]}
          >
            {stall.size}
          </Text>
        </View>

        {/* Stall Description */}
        <View
          style={[
            styles.stallDescriptionContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              styles.stallDescriptionLabel,
              { color: theme.colors.primary },
            ]}
          >
            Stall Description:
          </Text>
          <Text style={[styles.descriptionText, { color: theme.colors.text }]}>
            {stall.stallDescription}
          </Text>
        </View>

        {/* Auction Date & Time */}
        <View
          style={[
            styles.auctionDateContainer,
            {
              backgroundColor: theme.colors.surface,
              borderLeftColor: theme.colors.success,
            },
          ]}
        >
          <Text
            style={[styles.auctionDateLabel, { color: theme.colors.success }]}
          >
            Auction Date & Time:
          </Text>
          <Text
            style={[styles.auctionDateText, { color: theme.colors.success }]}
          >
            {stall.auctionDate} at {stall.startTime}
          </Text>
        </View>

        {/* Pre-Register Button */}
        <TouchableOpacity
          style={[
            styles.statusButton,
            styles.preRegisterButton,
            {
              backgroundColor: isPreRegistered
                ? theme.colors.borderLight
                : theme.colors.primary,
            },
            isPreRegistered ? styles.disabledButton : null,
          ]}
          onPress={handlePreRegisterPress}
          disabled={isPreRegistered}
        >
          <Text
            style={[
              styles.statusButtonText,
              styles.preRegisterButtonText,
              {
                color: isPreRegistered ? theme.colors.textTertiary : "#FFFFFF",
              },
            ]}
          >
            {isPreRegistered
              ? "Already pre-registered"
              : "Pre-register for Auction"}
          </Text>
        </TouchableOpacity>

        {/* Place Bid Button - Only show if pre-registered */}
        {isPreRegistered && (
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.placeBidButton,
              {
                backgroundColor: isAuctionActive(
                  stall.auctionDate,
                  stall.startTime
                )
                  ? theme.colors.success
                  : theme.colors.borderLight,
              },
              !isAuctionActive(stall.auctionDate, stall.startTime) &&
                styles.placeBidButtonDisabled,
            ]}
            onPress={handlePlaceBidPress}
            disabled={!isAuctionActive(stall.auctionDate, stall.startTime)}
          >
            <View style={styles.buttonContent}>
              <Text
                style={[
                  styles.statusButtonText,
                  styles.placeBidButtonText,
                  {
                    color: isAuctionActive(stall.auctionDate, stall.startTime)
                      ? "#FFFFFF"
                      : theme.colors.textTertiary,
                  },
                  !isAuctionActive(stall.auctionDate, stall.startTime) &&
                    styles.placeBidButtonTextDisabled,
                ]}
              >
                {isAuctionActive(stall.auctionDate, stall.startTime)
                  ? "Place Bid"
                  : "Auction Starts"}
              </Text>
              {!isAuctionActive(stall.auctionDate, stall.startTime) &&
                countdown && (
                  <Text
                    style={[
                      styles.countdownText,
                      { color: theme.colors.textTertiary },
                      !isAuctionActive(stall.auctionDate, stall.startTime) &&
                        styles.countdownTextDisabled,
                    ]}
                  >
                    {countdown}
                  </Text>
                )}
              {!isAuctionActive(stall.auctionDate, stall.startTime) &&
                !countdown && (
                  <Text
                    style={[
                      styles.countdownText,
                      !isAuctionActive(stall.auctionDate, stall.startTime) &&
                        styles.countdownTextDisabled,
                    ]}
                  >
                    {stall.auctionDate} at {stall.startTime}
                  </Text>
                )}
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Pre-Register Modal */}
      <PreRegisterModal
        visible={modalVisible}
        onClose={handleModalClose}
        stallNumber={stall.stallNumber}
        auctionDate={stall.auctionDate}
        startTime={stall.startTime}
        location={stall.location}
      />

      {/* Place Bid Modal */}
      <PlaceBid
        visible={showPlaceBid}
        onClose={handlePlaceBidClose}
        stallNumber={stall.stallNumber}
        auctionDate={stall.auctionDate}
        startTime={stall.startTime}
        location={stall.location}
        startingPrice={
          stall.priceValue || parseInt(stall.price.replace(/,/g, ""))
        }
        currentBid={stall.currentBid}
        currentBidder={stall.currentBidder}
        onSubmitBid={handleSubmitBid}
      />
    </View>
  );
};

import { AuctionCardStyles as styles } from "../AuctionCardComponents/AuctionCardStyle";

export default AuctionCard;
