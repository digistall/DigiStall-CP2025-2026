import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useTheme } from "../../../../Settings/components/ThemeComponents/ThemeContext";
import { LiveUpdatesStyles as styles } from "./LiveUpdatesStyles";
import { AuctionTimings } from "../../shared/constants";

const LiveUpdates = ({
  onRefresh,
  isRefreshing = false,
  lastUpdated = null,
  autoRefreshInterval = AuctionTimings.AUTO_REFRESH_INTERVAL,
  enableAutoRefresh = true,
  stallNumber,
  onBidUpdate = null,
}) => {
  const { theme } = useTheme();
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState(5);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] =
    useState(enableAutoRefresh);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Auto refresh functionality
  useEffect(() => {
    if (isAutoRefreshEnabled && !isRefreshing) {
      // Start auto-refresh interval
      intervalRef.current = setInterval(() => {
        if (onRefresh) {
          onRefresh();
        }
      }, autoRefreshInterval);

      // Start countdown timer
      let countdown = autoRefreshInterval / 1000;
      setTimeUntilNextUpdate(countdown);

      countdownRef.current = setInterval(() => {
        countdown -= 1;
        setTimeUntilNextUpdate(countdown);

        if (countdown <= 0) {
          countdown = autoRefreshInterval / 1000;
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isAutoRefreshEnabled, isRefreshing, autoRefreshInterval, onRefresh]);

  // Pulse animation for live indicator
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handleManualRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
      // Reset countdown
      setTimeUntilNextUpdate(autoRefreshInterval / 1000);
    }
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(!isAutoRefreshEnabled);
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return "Never";

    const now = new Date();
    const updated = new Date(timestamp);
    const diffInSeconds = Math.floor((now - updated) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Live Status Indicator */}
      <View style={styles.statusRow}>
        <View style={styles.liveIndicator}>
          <Animated.View
            style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]}
          />
          <Text style={[styles.liveText, { color: theme.colors.text }]}>
            LIVE AUCTION
          </Text>
        </View>

        <Text
          style={[styles.stallNumber, { color: theme.colors.textSecondary }]}
        >
          Stall #{stallNumber}
        </Text>
      </View>

      {/* Auto-refresh Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.leftControls}>
          <TouchableOpacity
            style={[
              styles.autoRefreshToggle,
              {
                backgroundColor: isAutoRefreshEnabled
                  ? theme.colors.primary
                  : theme.colors.borderLight,
              },
            ]}
            onPress={toggleAutoRefresh}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.autoRefreshText,
                {
                  color: isAutoRefreshEnabled
                    ? "#FFFFFF"
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {isAutoRefreshEnabled ? "AUTO" : "MANUAL"}
            </Text>
          </TouchableOpacity>

          {isAutoRefreshEnabled && (
            <View style={styles.countdownContainer}>
              <Text
                style={[
                  styles.countdownText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Next update in {timeUntilNextUpdate}s
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.refreshButton,
            {
              backgroundColor: theme.colors.primaryLight,
              opacity: isRefreshing ? 0.6 : 1,
            },
          ]}
          onPress={handleManualRefresh}
          disabled={isRefreshing}
          activeOpacity={0.7}
        >
          <Text style={[styles.refreshText, { color: theme.colors.primary }]}>
            {isRefreshing ? "Updating..." : "Refresh"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Last Updated Info */}
      <View style={styles.infoRow}>
        <Text
          style={[styles.lastUpdatedText, { color: theme.colors.textTertiary }]}
        >
          Last updated: {formatLastUpdated(lastUpdated)}
        </Text>

        {onBidUpdate && (
          <TouchableOpacity
            style={styles.historyButton}
            onPress={onBidUpdate}
            activeOpacity={0.7}
          >
            <Text style={[styles.historyText, { color: theme.colors.primary }]}>
              View History
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={[styles.connectionDot, { backgroundColor: "#10B981" }]} />
        <Text
          style={[styles.connectionText, { color: theme.colors.textSecondary }]}
        >
          Connected. This is a Real-time updates.
        </Text>
      </View>
    </View>
  );
};

export default LiveUpdates;
