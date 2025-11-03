import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const RaffleCard = ({ 
  stall, 
  location, 
  image, 
  isLive = false, 
  endTime = null,
  onPress 
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isActive, setIsActive] = useState(isLive);

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
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
        {isActive && (
          <View style={styles.liveIndicator}>
            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.stallInfo}>
          <Text style={styles.stallNumber}>STALL# {stall}</Text>
          <Text style={styles.location}>{location}</Text>
        </View>
        
        <View style={styles.actionContainer}>
          {isActive ? (
            <TouchableOpacity style={styles.raffleButton}>
              <Text style={styles.raffleButtonText}>RAFFLE ONGOING</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>COUNTDOWN</Text>
              {timeLeft && (
                <Text style={styles.timeText}>{timeLeft}</Text>
              )}
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
    borderRadius: 12,
    marginHorizontal: width * 0.04,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: width * 0.4,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  stallInfo: {
    marginBottom: 12,
  },
  stallNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actionContainer: {
    alignItems: 'center',
  },
  raffleButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: width * 0.5,
  },
  raffleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  countdownContainer: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: width * 0.5,
    alignItems: 'center',
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 2,
  },
});

export default RaffleCard;