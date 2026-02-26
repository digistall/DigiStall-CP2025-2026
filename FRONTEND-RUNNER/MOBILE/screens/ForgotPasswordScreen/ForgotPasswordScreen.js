// ===== FORGOT PASSWORD SCREEN =====
// 3-step self-service password reset for Stallholders:
//   Step 1  – Enter registered email  → OTP sent via backend Nodemailer
//   Step 2  – Enter 6-digit OTP       → verified on backend
//   Step 3  – Set new password        → encrypted & saved on backend
//   Step 4  – Success screen          → navigate back to Login

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import styles from './ForgotPasswordCSS/ForgotPasswordCSS';
import {
  handleSendOtp,
  handleResendOtp,
  handleVerifyOtp,
  handleResetPassword,
  maskEmail,
  getPasswordStrength,
} from './ForgotPasswordFunctions/ForgotPasswordFunctions';

// ─────────────────────────────────────────────────────────────
//  Sub-component: Step Progress Indicator
// ─────────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [1, 2, 3];
  return (
    <View style={styles.stepIndicatorRow}>
      {steps.map((step, i) => {
        const isCompleted = currentStep > step;
        const isActive    = currentStep === step;
        return (
          <React.Fragment key={step}>
            <View style={[
              styles.stepDot,
              isCompleted ? styles.stepDotCompleted :
              isActive    ? styles.stepDotActive    : styles.stepDotInactive,
            ]}>
              {isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepDotText,
                  isActive ? styles.stepDotTextActive : styles.stepDotTextInactive,
                ]}>
                  {step}
                </Text>
              )}
            </View>
            {i < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                isCompleted  ? styles.stepLineCompleted :
                isActive     ? styles.stepLineActive    : null,
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
//  Main Screen Component
// ─────────────────────────────────────────────────────────────
const ForgotPasswordScreen = ({ navigation }) => {
  // ── Step state ─────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);

  // ── Form data ──────────────────────────────────────────────
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifiedUserName, setVerifiedUserName] = useState('');

  // ── UI state ───────────────────────────────────────────────
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Refs for OTP individual boxes ─────────────────────────
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // ── Resend cooldown timer ─────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const startCooldown = () => setResendCooldown(60);

  // ── Derive full OTP string from digit boxes ───────────────
  const otpString = otpDigits.join('');

  // ── OTP box handlers ──────────────────────────────────────
  const handleOtpChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < 5) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-verify when all 6 digits are filled
    if (updated.every(d => d !== '') && digit) {
      Keyboard.dismiss();
    }
  };

  const handleOtpKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // ── Clear messages when user types ───────────────────────
  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // ── Step handlers ─────────────────────────────────────────
  const onSendOtp = () => {
    Keyboard.dismiss();
    handleSendOtp(
      email,
      setLoading,
      setErrorMsg,
      setSuccessMsg,
      ({ userName }) => {
        setVerifiedUserName(userName);
        startCooldown();
        setCurrentStep(2);
      }
    );
  };

  const onResendOtp = () => {
    if (resendCooldown > 0) return;
    handleResendOtp(
      email,
      setLoading,
      setErrorMsg,
      setSuccessMsg,
      () => setOtpDigits(['', '', '', '', '', '']),
      startCooldown
    );
  };

  const onVerifyOtp = () => {
    Keyboard.dismiss();
    handleVerifyOtp(
      email,
      otpString,
      setLoading,
      setErrorMsg,
      setSuccessMsg,
      () => setCurrentStep(3)
    );
  };

  const onResetPassword = () => {
    Keyboard.dismiss();
    handleResetPassword(
      email,
      otpString,
      newPassword,
      confirmPassword,
      setLoading,
      setErrorMsg,
      setSuccessMsg,
      () => setCurrentStep(4)
    );
  };

  const onGoBack = () => {
    if (currentStep > 1 && currentStep < 4) {
      clearMessages();
      setCurrentStep(s => s - 1);
    } else {
      navigation.goBack();
    }
  };

  const onGoToLogin = () => {
    navigation.navigate('LoginScreen');
  };

  // ── Password strength ─────────────────────────────────────
  const strength = getPasswordStrength(newPassword);

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <ImageBackground
          source={require('../../assets/Login-Image/background-mobile.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay} />

          <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
              {currentStep < 4 && (
                <TouchableOpacity style={styles.backButton} onPress={onGoBack} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={20} color="#1a237e" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>Forgot Password</Text>
            </View>

            {/* Step Progress */}
            {currentStep < 4 && <StepIndicator currentStep={currentStep} />}

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.card}>

                  {/* ══════════════════════════════
                       STEP 1 – Enter Email
                  ══════════════════════════════ */}
                  {currentStep === 1 && (
                    <>
                      <Ionicons
                        name="mail-outline"
                        size={48}
                        color="#4472C4"
                        style={styles.stepIcon}
                      />
                      <Text style={styles.stepTitle}>Reset Password</Text>
                      <Text style={styles.stepSubtitle}>
                        Enter the email address linked to your stallholder account and we'll send you a verification code.
                      </Text>

                      {/* Error / Success messages */}
                      {!!errorMsg && (
                        <View style={styles.errorBox}>
                          <Ionicons name="alert-circle" size={18} color="#c62828" />
                          <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                      )}
                      {!!successMsg && (
                        <View style={styles.successBox}>
                          <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
                          <Text style={styles.successText}>{successMsg}</Text>
                        </View>
                      )}

                      {/* Email input */}
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="mail" size={18} color="#4472C4" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your registered email"
                          placeholderTextColor="#9e9e9e"
                          value={email}
                          onChangeText={(v) => { setEmail(v); clearMessages(); }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={onSendOtp}
                          editable={!loading}
                        />
                      </View>

                      {/* Send OTP button */}
                      <TouchableOpacity
                        style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                        onPress={onSendOtp}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="send" size={18} color="#fff" />
                        )}
                        <Text style={styles.actionButtonText}>
                          {loading ? 'Sending Code...' : 'Send Verification Code'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* ══════════════════════════════
                       STEP 2 – Enter OTP
                  ══════════════════════════════ */}
                  {currentStep === 2 && (
                    <>
                      <Ionicons
                        name="keypad-outline"
                        size={48}
                        color="#4472C4"
                        style={styles.stepIcon}
                      />
                      <Text style={styles.stepTitle}>Verify Your Email</Text>
                      <Text style={styles.stepSubtitle}>
                        We've sent a 6-digit code to{'\n'}
                        <Text style={styles.boldText}>{maskEmail(email)}</Text>
                        {'\n'}Enter the code below.
                      </Text>

                      {/* Error / Success messages */}
                      {!!errorMsg && (
                        <View style={styles.errorBox}>
                          <Ionicons name="alert-circle" size={18} color="#c62828" />
                          <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                      )}
                      {!!successMsg && (
                        <View style={styles.successBox}>
                          <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
                          <Text style={styles.successText}>{successMsg}</Text>
                        </View>
                      )}

                      {/* 6-digit OTP boxes */}
                      <View style={styles.otpContainer}>
                        {otpDigits.map((digit, i) => (
                          <TextInput
                            key={i}
                            ref={otpRefs[i]}
                            style={[
                              styles.otpBox,
                              digit ? styles.otpBoxFilled : null,
                            ]}
                            value={digit}
                            onChangeText={(t) => { handleOtpChange(t, i); clearMessages(); }}
                            onKeyPress={(e) => handleOtpKeyPress(e, i)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                            editable={!loading}
                            textAlign="center"
                          />
                        ))}
                      </View>

                      {/* Verify button */}
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          (loading || otpString.length !== 6) && styles.actionButtonDisabled,
                        ]}
                        onPress={onVerifyOtp}
                        disabled={loading || otpString.length !== 6}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="shield-checkmark" size={18} color="#fff" />
                        )}
                        <Text style={styles.actionButtonText}>
                          {loading ? 'Verifying...' : 'Verify Code'}
                        </Text>
                      </TouchableOpacity>

                      {/* Resend code */}
                      <View style={styles.resendRow}>
                        <Text style={styles.resendText}>Didn't receive the code?</Text>
                        <TouchableOpacity onPress={onResendOtp} disabled={resendCooldown > 0 || loading}>
                          <Text style={[
                            styles.resendLink,
                            (resendCooldown > 0 || loading) && styles.resendLinkDisabled,
                          ]}>
                            {resendCooldown > 0 ? ` Resend in ${resendCooldown}s` : ' Resend'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* ══════════════════════════════
                       STEP 3 – New Password
                  ══════════════════════════════ */}
                  {currentStep === 3 && (
                    <>
                      <Ionicons
                        name="lock-closed-outline"
                        size={48}
                        color="#4472C4"
                        style={styles.stepIcon}
                      />
                      <Text style={styles.stepTitle}>Create New Password</Text>
                      <Text style={styles.stepSubtitle}>
                        {verifiedUserName ? `Hi ${verifiedUserName}, ` : ''}
                        Choose a strong new password for your account.
                      </Text>

                      {/* Error / Success messages */}
                      {!!errorMsg && (
                        <View style={styles.errorBox}>
                          <Ionicons name="alert-circle" size={18} color="#c62828" />
                          <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                      )}
                      {!!successMsg && (
                        <View style={styles.successBox}>
                          <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
                          <Text style={styles.successText}>{successMsg}</Text>
                        </View>
                      )}

                      {/* New password input */}
                      <Text style={styles.inputLabel}>New Password</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed" size={18} color="#4472C4" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="At least 8 characters"
                          placeholderTextColor="#9e9e9e"
                          value={newPassword}
                          onChangeText={(v) => { setNewPassword(v); clearMessages(); }}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          editable={!loading}
                        />
                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() => setShowPassword(s => !s)}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color="#9e9e9e"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Password strength bar */}
                      {!!newPassword && (
                        <View style={styles.strengthRow}>
                          <View style={styles.strengthBarBg}>
                            <View style={[
                              styles.strengthBarFill,
                              { width: `${strength.score}%`, backgroundColor: strength.color },
                            ]} />
                          </View>
                          <Text style={[styles.strengthLabel, { color: strength.color }]}>
                            {strength.label}
                          </Text>
                        </View>
                      )}

                      {/* Confirm password input */}
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed" size={18} color="#4472C4" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Re-enter your new password"
                          placeholderTextColor="#9e9e9e"
                          value={confirmPassword}
                          onChangeText={(v) => { setConfirmPassword(v); clearMessages(); }}
                          secureTextEntry={!showConfirm}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={onResetPassword}
                          editable={!loading}
                        />
                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() => setShowConfirm(s => !s)}
                        >
                          <Ionicons
                            name={showConfirm ? 'eye-off' : 'eye'}
                            size={20}
                            color="#9e9e9e"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Reset password button */}
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          (loading || !newPassword || !confirmPassword) && styles.actionButtonDisabled,
                        ]}
                        onPress={onResetPassword}
                        disabled={loading || !newPassword || !confirmPassword}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="checkmark-done" size={18} color="#fff" />
                        )}
                        <Text style={styles.actionButtonText}>
                          {loading ? 'Resetting Password...' : 'Reset Password'}
                        </Text>
                      </TouchableOpacity>

                      {/* Password requirements hint */}
                      <Text style={{ fontSize: 12, color: '#9e9e9e', textAlign: 'center', marginTop: 10, lineHeight: 18 }}>
                        Password must be 8+ characters with uppercase, lowercase, and a number.
                      </Text>
                    </>
                  )}

                  {/* ══════════════════════════════
                       STEP 4 – Success
                  ══════════════════════════════ */}
                  {currentStep === 4 && (
                    <View style={styles.successContainer}>
                      <View style={styles.successIconCircle}>
                        <Ionicons name="checkmark-circle" size={52} color="#27ae60" />
                      </View>
                      <Text style={styles.successTitle}>Password Reset!</Text>
                      <Text style={styles.successMessage}>
                        Your password has been successfully updated.{'\n'}
                        You can now log in with your new password.
                      </Text>
                      <TouchableOpacity
                        style={styles.goToLoginButton}
                        onPress={onGoToLogin}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="log-in-outline" size={20} color="#fff" />
                        <Text style={styles.goToLoginText}>Back to Login</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </ImageBackground>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ForgotPasswordScreen;
