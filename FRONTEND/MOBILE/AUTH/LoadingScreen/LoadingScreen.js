import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getSafeDisplayValue } from '../../services/DataDisplayUtils';
import ApiService from '../../services/ApiService';
import UserStorageService from '../../services/UserStorageService';

const { width, height } = Dimensions.get('window');

const LoadingScreen = ({ 
  navigation, 
  route,
  onLoadComplete 
}) => {
  const params = route?.params || {};
  const { 
    userName = 'User', 
    isStallholder = false, 
    stallNo = null,
    nextScreen = 'StallHome',
    loadingDuration = 3000
  } = params;

  // Use safe display value to prevent showing encrypted data
  const displayName = getSafeDisplayValue(userName, 'User');

  const [faceVerified, setFaceVerified] = useState(null);
  const [validIdUploaded, setValidIdUploaded] = useState(null);
  const [resolvedNextScreen, setResolvedNextScreen] = useState(nextScreen);
  const [resolvedParams, setResolvedParams] = useState(params);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  
  const [loadingText, setLoadingText] = useState('Connecting to server...');
  const [loadingStep, setLoadingStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const loadingSteps = [
    { text: 'Connecting to server...', icon: 'server-outline' },
    { text: 'Verifying credentials...', icon: 'shield-checkmark-outline' },
    { text: 'Loading your profile...', icon: 'person-outline' },
    { text: 'Preparing dashboard...', icon: 'grid-outline' },
    { text: 'Almost ready...', icon: 'checkmark-circle-outline' },
  ];

  useEffect(() => {
    // Start animations
    startAnimations();
    
    // Progress through loading steps
    const stepInterval = loadingDuration / loadingSteps.length;
    
    loadingSteps.forEach((step, index) => {
      setTimeout(() => {
        setLoadingText(step.text);
        setLoadingStep(index);
      }, stepInterval * index);
    });

    const performChecks = async () => {
      const { stallholderId, applicantId } = params;
      
      // Load stored user data
      let storedUserData = null;
      try {
        storedUserData = await UserStorageService.getUserData();
      } catch (err) {
        console.log('⚠️ LoadingScreen could not load stored user data', err);
      }

      if (isStallholder && stallholderId) {
        try {
          console.log('🔄 LoadingScreen checking face verification for ID:', stallholderId);
          const faceResult = await ApiService.checkFaceVerification(stallholderId);
          const hasFace = faceResult && faceResult.hasVerifiedFace;
          setFaceVerified(hasFace);

          console.log('🔄 LoadingScreen checking Valid ID status for applicant:', applicantId);
          let hasId = false;
          if (applicantId) {
            const docsResult = await ApiService.getStallholderStallsWithDocuments(applicantId);
            
            // Check profile valid_id field as primary verification
            const otherInfo = storedUserData?.other_info || storedUserData?.profile?.other_info || {};
            hasId = otherInfo.valid_id != null && otherInfo.valid_id !== '';
            
            // Or check if they have uploaded it as a branch document
            if (!hasId && docsResult.success && docsResult.data) {
              hasId = docsResult.data.grouped_by_branch.some(branch => 
                branch.document_requirements.some(doc => 
                  doc.document_type_id === 3 && doc.status !== 'not_uploaded'
                )
              );
            }
          } else {
            hasId = true;
          }
          setValidIdUploaded(hasId);

          // Determine next destination dynamically
          let next = 'StallHome';
          let nextParams = { ...params };

          if (!hasFace) {
            next = 'FaceScannerScreen';
            nextParams.forceValidIdUpload = false;
            nextParams.screen = undefined;
          } else if (!hasId) {
            next = 'IdScannerScreen';
            nextParams.forceValidIdUpload = false;
            nextParams.screen = undefined;
          } else {
            next = 'StallHome';
            nextParams.forceValidIdUpload = false;
            nextParams.screen = 'dashboard';
          }

          setResolvedNextScreen(next);
          setResolvedParams(nextParams);
          console.log('✅ LoadingScreen dynamic checks resolved. Destination:', next, 'Params:', nextParams);
        } catch (err) {
          console.error('❌ Error during LoadingScreen dynamic checks:', err);
          setFaceVerified(true);
          setValidIdUploaded(true);
          setResolvedNextScreen('StallHome');
          setResolvedParams({ ...params, screen: 'dashboard' });
        }
      } else {
        setFaceVerified(true);
        setValidIdUploaded(true);
        setResolvedNextScreen(nextScreen);
        setResolvedParams(params);
      }
    };

    performChecks();

    // Show welcome screen after loading
    setTimeout(() => {
      setShowWelcome(true);
    }, loadingDuration);
  }, []);

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        showWelcomeAnimation();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  // Separate navigation effect when welcome finishes
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        if (navigation && resolvedNextScreen) {
          console.log('🚀 LoadingScreen replacing route with:', resolvedNextScreen, resolvedParams);
          navigation.replace(resolvedNextScreen, resolvedParams);
        }
        if (onLoadComplete) {
          onLoadComplete();
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, resolvedNextScreen, resolvedParams]);

  const startAnimations = () => {
    // Logo entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Text fade in
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // Progress bar animation
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: loadingDuration,
      useNativeDriver: false,
    }).start();

    // Dot animation loop
    const animateDots = () => {
      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dotAnim1, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim1, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnim2, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim2, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnim3, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim3, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };
    animateDots();
  };

  const showWelcomeAnimation = () => {
    Animated.parallel([
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const progressBarWidth = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (showWelcome) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
        <LinearGradient
          colors={['#1a365d', '#2c5282', '#3182ce']}
          style={styles.gradient}
        >
          <Animated.View style={[styles.welcomeContainer, { opacity: welcomeOpacity }]}>
            {/* Success Checkmark */}
            <Animated.View 
              style={[
                styles.checkmarkContainer,
                { transform: [{ scale: checkmarkScale }] }
              ]}
            >
              <LinearGradient
                colors={['#48bb78', '#38a169']}
                style={styles.checkmarkGradient}
              >
                <Ionicons name="checkmark" size={50} color="white" />
              </LinearGradient>
            </Animated.View>

            {/* Welcome Text */}
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeName}>{displayName}</Text>
            
            {/* User Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark" size={20} color="#48bb78" />
                <Text style={styles.infoText}>Authentication Verified</Text>
              </View>
              
              {isStallholder && (
                <>
                  <View style={styles.infoRow}>
                    {faceVerified === null ? (
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                    ) : faceVerified ? (
                      <Ionicons name="scan-circle" size={20} color="#48bb78" />
                    ) : (
                      <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                    )}
                    <Text style={styles.infoText}>
                      Face Scanner: {faceVerified === null ? 'Checking...' : faceVerified ? 'Verified' : 'Pending Upload'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    {validIdUploaded === null ? (
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                    ) : validIdUploaded ? (
                      <Ionicons name="document-text" size={20} color="#48bb78" />
                    ) : (
                      <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    )}
                    <Text style={styles.infoText}>
                      Valid ID: {validIdUploaded === null ? 'Checking...' : validIdUploaded ? 'Uploaded' : 'Missing / Required'}
                    </Text>
                  </View>
                </>
              )}
              
              {isStallholder && stallNo && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="store" size={20} color="#4299e1" />
                  <Text style={styles.infoText}>Stall: {stallNo}</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color="#ed8936" />
                <Text style={styles.infoText}>
                  {new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </Text>
              </View>
            </View>

            {/* Redirecting text */}
            <View style={styles.redirectContainer}>
              <Text style={styles.redirectText}>
                {resolvedNextScreen === 'FaceScannerScreen' 
                  ? 'Redirecting to Face Scanner...' 
                  : resolvedNextScreen === 'StallHome' && resolvedParams.forceValidIdUpload 
                    ? 'Redirecting to Valid ID Upload...' 
                    : 'Redirecting to dashboard...'}
              </Text>
              <View style={styles.loadingDotsSmall}>
                <Animated.View 
                  style={[
                    styles.dotSmall,
                    { opacity: dotAnim1, transform: [{ translateY: dotAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5]
                    })}] }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.dotSmall,
                    { opacity: dotAnim2, transform: [{ translateY: dotAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5]
                    })}] }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.dotSmall,
                    { opacity: dotAnim3, transform: [{ translateY: dotAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5]
                    })}] }
                  ]} 
                />
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <LinearGradient
        colors={['#1a365d', '#2c5282', '#3182ce']}
        style={styles.gradient}
      >
        {/* Logo Section */}
        <Animated.View 
          style={[
            styles.logoContainer,
            { 
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <View style={styles.logoBackground}>
            <Image
              source={require('../../assets/Login-Image/DigiStall-Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.appName}>DigiStall</Text>
          <Text style={styles.appSubtitle}>Naga City Stall Management</Text>
        </Animated.View>

        {/* Loading Section */}
        <Animated.View style={[styles.loadingSection, { opacity: textOpacity }]}>
          {/* Current Step Icon */}
          <View style={styles.stepIconContainer}>
            <Ionicons 
              name={loadingSteps[loadingStep]?.icon || 'hourglass-outline'} 
              size={24} 
              color="white" 
            />
          </View>

          {/* Loading Text */}
          <Text style={styles.loadingText}>{loadingText}</Text>

          {/* Animated Dots */}
          <View style={styles.loadingDots}>
            <Animated.View 
              style={[
                styles.dot,
                { 
                  opacity: dotAnim1,
                  transform: [{ translateY: dotAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8]
                  })}]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot,
                { 
                  opacity: dotAnim2,
                  transform: [{ translateY: dotAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8]
                  })}]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot,
                { 
                  opacity: dotAnim3,
                  transform: [{ translateY: dotAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8]
                  })}]
                }
              ]} 
            />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { width: progressBarWidth }
              ]} 
            />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {loadingSteps.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.stepDot,
                  index <= loadingStep && styles.stepDotActive
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.securityText}>Secure Connection</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
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
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    letterSpacing: 1,
  },
  loadingSection: {
    alignItems: 'center',
    width: '100%',
  },
  stepIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
    fontWeight: '500',
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    marginHorizontal: 5,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#48bb78',
    borderRadius: 3,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: '#48bb78',
  },
  securityBadge: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  // Welcome screen styles
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  checkmarkContainer: {
    marginBottom: 25,
  },
  checkmarkGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: 'white',
    marginBottom: 5,
  },
  welcomeName: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: 'white',
    marginLeft: 12,
    fontWeight: '500',
  },
  redirectContainer: {
    alignItems: 'center',
  },
  redirectText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
  },
  loadingDotsSmall: {
    flexDirection: 'row',
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 3,
  },
});

export default LoadingScreen;
