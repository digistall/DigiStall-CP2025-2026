import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../Settings/components/ThemeComponents/ThemeContext';

const { width } = Dimensions.get('window');

const RaffleCard = ({ 
  stall, 
  location, 
  image, 
  isLive = false, 
  endTime = null,
  onPress 
}) => {
  const { theme, isDark } = useTheme();
  const [timeLeft, setTimeLeft] = useState('');
  const [isActive, setIsActive] = useState(isLive);
  const [timeComponents, setTimeComponents] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endTime).getTime() - now;

      if (distance < 0) {
        setTimeLeft('EXPIRED');
        setIsActive(false);
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeComponents({ days, hours, minutes, seconds });

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.card }]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
        
        {/* Raffle Badge */}
        <View style={styles.raffleBadge}>
          <Text style={styles.raffleBadgeText}>RAFFLE</Text>
        </View>
        
        {isActive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        
        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.stallInfo}>
          <View style={[
            styles.stallNumberBadge, 
            { backgroundColor: isDark ? theme.colors.surface : '#f0f9ff' }
          ]}>
            <Text style={[styles.stallLabel, { color: theme.colors.textSecondary }]}>STALL#</Text>
            <Text style={[styles.stallNumber, { color: theme.colors.text }]}>{stall}</Text>
          </View>
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>{location}</Text>
          </View>
        </View>
        
        <View style={styles.actionContainer}>
          {isActive ? (
            <TouchableOpacity style={styles.raffleOngoingButton}>
              <Text style={styles.raffleButtonText}>RAFFLE ONGOING</Text>
              <Text style={styles.joinNowText}>Tap to Join!</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownWrapper}>
              <Text style={styles.countdownLabel}>STARTS IN</Text>
              <View style={styles.countdownContainer}>
                {timeComponents.days > 0 && (
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeValue}>{timeComponents.days}</Text>
                    <Text style={styles.timeUnit}>DAYS</Text>
                  </View>
                )}
                <View style={styles.timeBlock}>
                  <Text style={styles.timeValue}>{String(timeComponents.hours).padStart(2, '0')}</Text>
                  <Text style={styles.timeUnit}>HRS</Text>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeValue}>{String(timeComponents.minutes).padStart(2, '0')}</Text>
                  <Text style={styles.timeUnit}>MIN</Text>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeValue}>{String(timeComponents.seconds).padStart(2, '0')}</Text>
                  <Text style={styles.timeUnit}>SEC</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: width * 0.04,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: width * 0.45,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  raffleBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  raffleBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 6,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  content: {
    padding: 18,
  },
  stallInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stallNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stallLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 4,
    letterSpacing: 0.3,
  },
  stallNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  locationBadge: {
    backgroundColor: '#002181',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#002181',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionContainer: {
    alignItems: 'center',
  },
  raffleOngoingButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  raffleButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  joinNowText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  countdownWrapper: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  countdownLabel: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 48,
  },
  timeValue: {
    color: '#dc2626',
    fontSize: 26,
    fontWeight: 'bold',
  },
  timeUnit: {
    color: '#991b1b',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  timeSeparator: {
    color: '#dc2626',
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
});

export default RaffleCard;