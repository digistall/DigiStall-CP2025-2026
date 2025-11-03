import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error' // 'error', 'info', 'success'
  });

  // Wrapper functions to pass state setters to imported functions
  const handleLoginPress = () => {
    handleLogin(username, password, setIsLoading, navigation, setErrorModal);
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
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '⚠️';
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
          source={require('../../assets/Login-Image/background-mobile.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          
          <SafeAreaView style={styles.content} edges={['bottom', 'left', 'right']}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/Login-Image/DigiStall-Logo.png')}
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
                <TextInput
                  style={styles.textInput}
                  placeholder="Username"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
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
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.loadingText}>Logging in...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPasswordPress}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ImageBackground>

        {/* Custom Error Modal */}
        <Modal
          visible={errorModal.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeErrorModal}
        >
          <View style={styles.errorModalOverlay}>
            <View style={styles.errorModalContainer}>
              <View style={[styles.errorModalHeader, { backgroundColor: getModalColor() }]}>
                <Text style={styles.errorModalIcon}>{getModalIcon()}</Text>
                <Text style={styles.errorModalTitle}>{errorModal.title}</Text>
              </View>
              
              <View style={styles.errorModalBody}>
                <Text style={styles.errorModalMessage}>{errorModal.message}</Text>
              </View>
              
              <View style={styles.errorModalFooter}>
                <TouchableOpacity
                  style={[styles.errorModalButton, { backgroundColor: getModalColor() }]}
                  onPress={closeErrorModal}
                >
                  <Text style={styles.errorModalButtonText}>OK</Text>
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