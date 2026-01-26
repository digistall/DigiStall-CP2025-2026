import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LogoutLoadingScreen = ({ 
  visible = false, 
  message = 'Logging out...', 
  subMessage = 'Please wait while we securely log you out',
  userName = '',
}) => {
  // Animation values
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const iconSlide = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      startAnimations();
    } else {
      // Reset animations when hidden
      fadeAnim.setValue(0);
      cardScaleAnim.setValue(0.9);
      progressAnim.setValue(0);
    }
  }, [visible]);

  const startAnimations = () => {
    // Card scale and fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 2000,
      useNativeDriver: false,
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
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Icon slide animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconSlide, {
          toValue: 5,
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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <LinearGradient
        colors={['#1a365d', '#2c5282', '#3182ce']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Subtle pattern overlay */}
        <View style={styles.patternOverlay} />
        
        <Animated.View 
          style={[
            styles.container, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: cardScaleAnim }]
            }
          ]}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Image
                  source={require('../../assets/DigiStall-Logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          </View>

          {/* Main Message */}
          <Text style={styles.title}>{message}</Text>
          
          {/* User name if available */}
          {userName ? (
            <Text style={styles.userNameText}>Goodbye, {userName}!</Text>
          ) : null}

          {/* Sub Message */}
          <Text style={styles.subMessageText}>{subMessage}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  { width: progressWidth }
                ]}
              />
            </View>
          </View>

          {/* Logout Icon with Animation */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackgroundCircle}>
              <Animated.View 
                style={[
                  styles.iconWrapper,
                  { 
                    transform: [
                      { translateX: iconSlide }
                    ]
                  }
                ]}
              >
                <Ionicons name="log-out-outline" size={32} color="white" />
              </Animated.View>
            </View>
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

          {/* Animated dots */}
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <MaterialIcons name="verified-user" size={16} color="#48bb78" />
            <Text style={styles.securityNoteText}>Securely ending your session</Text>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Naga City Stall Management System</Text>
          <Text style={styles.poweredBy}>Powered by DigiStall</Text>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBackground: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userNameText: {
    fontSize: 18,
    color: '#90cdf4',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#48bb78',
    borderRadius: 4,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackgroundCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    marginBottom: 20,
  },
  spinner: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderTopColor: 'white',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    marginHorizontal: 5,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: 300,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#48bb78',
    marginLeft: 8,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
  },
  poweredBy: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default LogoutLoadingScreen;
