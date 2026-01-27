import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  StatusBar,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import styles from './LogInCSS/LoginCSS';
import {
  handleLogin,
  handleForgotPassword,
} from './LoginFunction/LoginFunctions';

const LoginScreen = ({ navigation }) => {
  // State management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Authenticating...');
  const [loadingSubtext, setLoadingSubtext] = useState('Please wait while we verify your credentials');
  const [loadingState, setLoadingState] = useState({ step: 'idle', message: '', progress: 0 });  const [loadingSteps, setLoadingSteps] = useState([
    { label: 'Server Connection', completed: false, active: false },
    { label: 'Authentication', completed: false, active: false },
    { label: 'Profile Data', completed: false, active: false },
    { label: 'Dashboard Setup', completed: false, active: false },
    { label: 'Finalizing', completed: false, active: false },
  ]);  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error' // 'error', 'info', 'success'
  });

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for logo
  useEffect(() => {
    if (isLoading) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Dot animation
      const dotAnimation = Animated.loop(
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
      );
      dotAnimation.start();

      return () => {
        pulse.stop();
        dotAnimation.stop();
      };
    } else {
      fadeAnim.setValue(0);
    }
  }, [isLoading]);

  // Update loading steps based on loadingState
  useEffect(() => {
    if (loadingState.step >= 0) {
      setLoadingMessage(loadingState.message || 'Processing...');
      
      // Update steps array
      const updatedSteps = loadingSteps.map((step, index) => ({
        ...step,
        completed: index < loadingState.step,
        active: index === loadingState.step
      }));
      setLoadingSteps(updatedSteps);
    }
  }, [loadingState]);

  // Enhanced login handler with loading states
  const handleLoginPress = () => {
    // Reset loading state
    setLoadingState({ step: 0, message: 'Connecting to server...', progress: 0 });
    setLoadingMessage('Connecting to server...');
    setLoadingSubtext('Establishing secure connection');

    // Unified login - automatically detects staff or user
    // Progress updates will come from LoginFunctions via setLoadingState callback
    handleLogin(username, password, setIsLoading, navigation, setErrorModal, setLoadingState);
  };

  const handleForgotPasswordPress = () => {
    handleForgotPassword(setErrorModal);
  };

  const closeErrorModal = () => {
    setErrorModal({ ...errorModal, visible: false });
  };

  const getModalIcon = () => {
    switch (errorModal.type) {
      case 'error':
        return 'alert-circle';
      case 'info':
        return 'information-circle';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'alert-circle';
    }
  };

  const getModalColor = () => {
    switch (errorModal.type) {
      case 'error':
        return '#e74c3c';
      case 'info':
        return '#3498db';
      case 'success':
        return '#27ae60';
      default:
        return '#e74c3c';
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.3)" translucent />
        <ImageBackground
          source={require('@shared-assets/Login-Image/background-mobile.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          
          <SafeAreaView style={styles.content} edges={['bottom', 'left', 'right']}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@shared-assets/Login-Image/DigiStall-Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>Naga City Stall Management</Text>
              <Text style={styles.subtitle}>Mobile App</Text>
              <Text style={styles.poweredBy}>Powered by: DigiStall</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Sign In</Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="person" size={20} color="#4472C4" style={styles.inputIcon} />
                </View>
                <TextInput
                  style={[styles.textInput, styles.textInputWithIcon]}
                  placeholder="Username"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="lock-closed" size={20} color="#4472C4" style={styles.inputIcon} />
                </View>
                <TextInput
                  style={[styles.textInput, styles.textInputWithIcon]}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
                onPress={handleLoginPress}
                disabled={isLoading}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="log-in" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>Login</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPasswordPress} style={styles.forgotPasswordContainer}>
                <Ionicons name="help-circle-outline" size={16} color="#3498db" style={{ marginRight: 4 }} />
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ImageBackground>

        {/* Professional Loading Overlay */}
        <Modal
          visible={isLoading}
          transparent={true}
          animationType="none"
        >
          <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
            <View style={styles.loadingCard}>
              {/* Animated Logo */}
              <Animated.View style={[styles.loadingLogoContainer, { transform: [{ scale: pulseAnim }] }]}>
                <Image
                  source={require('@shared-assets/Login-Image/DigiStall-Logo.png')}
                  style={styles.loadingLogo}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Loading Text */}
              <Text style={styles.loadingTitle}>{loadingMessage}</Text>
              <Text style={styles.loadingSubtext}>
                {loadingState.progress > 0 ? `${Math.round(loadingState.progress)}%` : 'Starting...'}
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${loadingState.progress}%` }
                    ]} 
                  />
                </View>
              </View>

              {/* Loading Steps */}
              <View style={styles.loadingStepsContainer}>
                {loadingSteps.map((step, index) => (
                  <View key={index} style={styles.loadingStepItem}>
                    <View style={[
                      styles.stepIndicator,
                      step.completed && styles.stepCompleted,
                      step.active && styles.stepActive
                    ]}>
                      {step.completed ? (
                        <Ionicons name="checkmark" size={12} color="white" />
                      ) : step.active ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <View style={styles.stepDot} />
                      )}
                    </View>
                    <Text style={[
                      styles.stepLabel,
                      step.completed && styles.stepLabelCompleted,
                      step.active && styles.stepLabelActive
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Animated Dots */}
              <View style={styles.loadingDotsContainer}>
                <Animated.View style={[
                  styles.loadingDot,
                  { 
                    opacity: dotAnim1,
                    transform: [{ 
                      translateY: dotAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10]
                      })
                    }]
                  }
                ]} />
                <Animated.View style={[
                  styles.loadingDot,
                  { 
                    opacity: dotAnim2,
                    transform: [{ 
                      translateY: dotAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10]
                      })
                    }]
                  }
                ]} />
                <Animated.View style={[
                  styles.loadingDot,
                  { 
                    opacity: dotAnim3,
                    transform: [{ 
                      translateY: dotAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10]
                      })
                    }]
                  }
                ]} />
              </View>

              {/* Security Note */}
              <View style={styles.securityNote}>
                <Ionicons name="shield-checkmark" size={14} color="#27ae60" />
                <Text style={styles.securityNoteText}>Secure Connection</Text>
              </View>
            </View>
          </Animated.View>
        </Modal>

        {/* Professional Enhanced Modal */}
        <Modal
          visible={errorModal.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeErrorModal}
        >
          <View style={styles.errorModalOverlay}>
            <View style={styles.errorModalContainer}>
              {/* Header with gradient effect */}
              <View style={[styles.errorModalHeader, { backgroundColor: getModalColor() }]}>
                <View style={styles.modalIconCircle}>
                  <Ionicons name={getModalIcon()} size={32} color={getModalColor()} />
                </View>
              </View>
              
              {/* Title Section */}
              <View style={styles.errorModalTitleSection}>
                <Text style={[styles.errorModalTitle, { color: getModalColor() }]}>{errorModal.title}</Text>
              </View>
              
              {/* Message Body */}
              <View style={styles.errorModalBody}>
                <Text style={styles.errorModalMessage}>{errorModal.message}</Text>
              </View>
              
              {/* Action Footer */}
              <View style={styles.errorModalFooter}>
                <TouchableOpacity
                  style={[styles.errorModalButton, { backgroundColor: getModalColor() }]}
                  onPress={closeErrorModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.errorModalButtonText}>
                    {errorModal.type === 'success' ? 'Continue' : 'Understood'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default LoginScreen;