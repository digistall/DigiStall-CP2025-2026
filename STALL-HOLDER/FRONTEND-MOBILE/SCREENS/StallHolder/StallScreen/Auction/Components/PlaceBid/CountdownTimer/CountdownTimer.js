import { useEffect, useState, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { useTheme } from "../../../../Settings/components/ThemeComponents/ThemeContext";
import { hasAuctionStarted, getTimeUntilAuctionStart } from "../AuctionUtils";
import { CountdownTimerStyles as styles } from "./CountdownTimerStyles";
import { AuctionTimings } from "../../shared/constants";

const CountdownTimer = ({
  auctionDurationMinutes = 20,
  onAuctionEnd = null,
  urgentThreshold = AuctionTimings.URGENT_THRESHOLD,
  warningThreshold = AuctionTimings.WARNING_THRESHOLD,
  auctionDate = null,
  startTime = null,
}) => {
  const { theme } = useTheme();

  // Initialize with the countdown duration
  const [timeLeft, setTimeLeft] = useState(() => {
    const totalSeconds = auctionDurationMinutes * 60;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
      milliseconds: 0,
      total: totalSeconds,
    };
  });
  const [isUrgent, setIsUrgent] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(0);

  const urgentPulse = useRef(new Animated.Value(1)).current;
  const warningPulse = useRef(new Animated.Value(1)).current;

  // Simple countdown logic - decrements by 1 second each time
  const decrementTimer = (currentTime) => {
    if (currentTime.total <= 0) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
        total: 0,
      };
    }

    const newTotal = currentTime.total - 1;
    const hours = Math.floor(newTotal / 3600);
    const minutes = Math.floor((newTotal % 3600) / 60);
    const seconds = newTotal % 60;

    return {
      hours,
      minutes,
      seconds,
      milliseconds: 0,
      total: newTotal,
    };
  };

  // Check if auction has started and update frozen state
  useEffect(() => {
    const checkAuctionStatus = () => {
      const auctionStarted = hasAuctionStarted(auctionDate, startTime);
      setIsFrozen(!auctionStarted);

      if (!auctionStarted) {
        const timeUntil = getTimeUntilAuctionStart(auctionDate, startTime);
        setTimeUntilStart(timeUntil);
      }
    };

    checkAuctionStatus();

    // Check every second if auction hasn't started
    const statusTimer = setInterval(checkAuctionStatus, 1000);

    return () => clearInterval(statusTimer);
  }, [auctionDate, startTime]);

  // Reset timer when auction starts (unfreezes)
  useEffect(() => {
    if (!isFrozen && timeLeft.total === 0) {
      // Reset timer to full duration when auction starts
      const totalSeconds = auctionDurationMinutes * 60;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        milliseconds: 0,
        total: totalSeconds,
      });
    }
  }, [isFrozen, auctionDurationMinutes]);

  // Update timer every second
  useEffect(() => {
    if (isFrozen) {
      return; // Don't start countdown timer if auction hasn't started
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTimeLeft = decrementTimer(prevTime);

        // Check if auction has ended
        if (newTimeLeft.total <= 0) {
          if (!hasEnded) {
            setHasEnded(true);
            if (onAuctionEnd) {
              onAuctionEnd();
            }
          }
        }

        // Update urgency states
        setIsUrgent(newTimeLeft.total <= urgentThreshold);
        setIsWarning(
          newTimeLeft.total <= warningThreshold &&
            newTimeLeft.total > urgentThreshold
        );

        return newTimeLeft;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [urgentThreshold, warningThreshold, onAuctionEnd, hasEnded, isFrozen]);

  // Set initial urgency states
  useEffect(() => {
    const initialTotal = auctionDurationMinutes * 60;
    setIsUrgent(initialTotal <= urgentThreshold);
    setIsWarning(
      initialTotal <= warningThreshold && initialTotal > urgentThreshold
    );
  }, [auctionDurationMinutes, urgentThreshold, warningThreshold]);

  // Urgent animation
  useEffect(() => {
    if (isUrgent && !hasEnded) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(urgentPulse, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(urgentPulse, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isUrgent, hasEnded]);

  // Warning animation
  useEffect(() => {
    if (isWarning && !hasEnded) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(warningPulse, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(warningPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isWarning, hasEnded]);

  const formatNumber = (num) => {
    if (typeof num !== "number" || isNaN(num)) {
      return "00";
    }
    return num.toString().padStart(2, "0");
  };

  // Safety check for timeLeft
  const safeTimeLeft = timeLeft || {
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    total: 0,
  };

  const getTimerColor = () => {
    if (hasEnded) return "#6B7280";
    if (isFrozen) return "#F59E0B";
    if (isUrgent) return "#EF4444";
    if (isWarning) return "#F59E0B";
    return theme.colors.primary;
  };

  const getBackgroundColor = () => {
    if (hasEnded) return theme.colors.borderLight;
    if (isFrozen) return "#FEF3C7";
    if (isUrgent) return "#FEE2E2";
    if (isWarning) return "#FEF3C7";
    return theme.colors.primaryLight;
  };

  const getStatusText = () => {
    if (hasEnded) return "AUCTION ENDED";
    if (isFrozen) return "WAITING FOR AUCTION START";
    if (isUrgent) return "CLOSING SOON!";
    if (isWarning) return "ENDING SOON";
    return "TIME REMAINING";
  };

  const formatTimeUntilStart = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const AnimatedContainer = isUrgent
    ? Animated.View
    : isWarning
    ? Animated.View
    : View;
  const animationStyle = isUrgent
    ? { transform: [{ scale: urgentPulse }] }
    : isWarning
    ? { transform: [{ scale: warningPulse }] }
    : {};

  return (
    <AnimatedContainer
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getTimerColor(),
        },
        animationStyle,
      ]}
    >
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <Text style={[styles.statusText, { color: getTimerColor() }]}>
          {getStatusText()}
        </Text>

        {(isUrgent || isWarning) && !hasEnded && (
          <View
            style={[styles.alertBadge, { backgroundColor: getTimerColor() }]}
          >
            <Text style={styles.alertBadgeText}>{isUrgent ? "🔥" : "⚠️"}</Text>
          </View>
        )}
      </View>

      {/* Timer Display */}
      <View style={styles.timerRow}>
        <View style={styles.timeUnit}>
          <Text style={[styles.timeNumber, { color: getTimerColor() }]}>
            {formatNumber(safeTimeLeft.hours)}
          </Text>
          <Text
            style={[styles.timeLabel, { color: theme.colors.textSecondary }]}
          >
            HRS
          </Text>
        </View>

        <Text style={[styles.separator, { color: getTimerColor() }]}>:</Text>

        <View style={styles.timeUnit}>
          <Text style={[styles.timeNumber, { color: getTimerColor() }]}>
            {formatNumber(safeTimeLeft.minutes)}
          </Text>
          <Text
            style={[styles.timeLabel, { color: theme.colors.textSecondary }]}
          >
            MIN
          </Text>
        </View>

        <Text style={[styles.separator, { color: getTimerColor() }]}>:</Text>

        <View style={styles.timeUnit}>
          <Text style={[styles.timeNumber, { color: getTimerColor() }]}>
            {formatNumber(safeTimeLeft.seconds)}
          </Text>
          <Text
            style={[styles.timeLabel, { color: theme.colors.textSecondary }]}
          >
            SEC
          </Text>
        </View>
      </View>

      {/* End Time Info */}
      <Text style={[styles.endTimeText, { color: theme.colors.textTertiary }]}>
        {hasEnded
          ? "Auction has ended"
          : isFrozen
          ? `Auction starts in: ${formatTimeUntilStart(timeUntilStart)}`
          : `Auction Duration: ${auctionDurationMinutes} minutes`}
      </Text>
    </AnimatedContainer>
  );
};

export default CountdownTimer;
