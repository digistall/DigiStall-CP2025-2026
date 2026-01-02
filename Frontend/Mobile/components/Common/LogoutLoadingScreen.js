import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LogoutLoadingScreen = ({ 
  visible = false, 
  message = 'Logging out...', 
  subMessage = 'Please wait while we securely log you out' 
}) => {
  // Animation values
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const iconSlide = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      startAnimations();
    }
  }, [visible]);

  const startAnimations = () => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Continuous spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Icon slide animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconSlide, {
          toValue: -5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(iconSlide, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dot animation
    const animateDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dot1Anim, 0);
    animateDot(dot2Anim, 200);
    animateDot(dot3Anim, 400);
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.contentContainer, 
            { opacity: fadeAnim }
          ]}
        >
          {/* Logout Icon with Animation */}
          <View style={styles.iconContainer}>
            <Animated.View 
              style={[
                styles.iconWrapper,
                { 
                  transform: [
                    { scale: pulseAnim },
                    { translateX: iconSlide }
                  ]
                }
              ]}
            >
              <View style={styles.iconBackground}>
                <Ionicons name="log-out-outline" size={48} color="#fff" />
              </View>
            </Animated.View>
          </View>

          {/* Spinner */}
          <View style={styles.spinnerContainer}>
            <Animated.View 
              style={[
                styles.spinner,
                { transform: [{ rotate: spin }] }
              ]}
            />
          </View>

          {/* Text */}
          <Text style={styles.messageText}>{message}</Text>
          <Text style={styles.subMessageText}>{subMessage}</Text>

          {/* Animated dots */}
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
          </View>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    marginHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    marginBottom: 24,
  },
  spinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#fff',
  },
  messageText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
});

export default LogoutLoadingScreen;
