import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from '../../../../../../components/ThemeComponents/ThemeContext';

const { width } = Dimensions.get("window");

const ChangePassword = ({ onGoBack, onPasswordChanged }) => {
  const { theme } = useTheme();
  
  // Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: "", color: "#ccc" });

  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ level: 0, text: "", color: "#ccc" });
      return;
    }

    let strength = 0;
    const checks = {
      length: newPassword.length >= 8,
      lowercase: /[a-z]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };

    strength = Object.values(checks).filter(Boolean).length;

    const strengthMap = {
      0: { level: 0, text: "Very Weak", color: "#ff4444" },
      1: { level: 1, text: "Weak", color: "#ff8800" },
      2: { level: 2, text: "Fair", color: "#ffbb00" },
      3: { level: 3, text: "Good", color: "#99cc00" },
      4: { level: 4, text: "Strong", color: "#33cc33" },
      5: { level: 5, text: "Very Strong", color: "#00aa00" },
    };

    setPasswordStrength(strengthMap[strength] || strengthMap[0]);
  }, [newPassword]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain a lowercase letter";
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain an uppercase letter";
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain a number";
    } else if (currentPassword && newPassword === currentPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle password change submission
  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Import the API service dynamically to avoid circular dependencies
      const { changePassword } = await import("../../../../../../services/AuthService");
      
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        Alert.alert(
          "Success! 🎉",
          "Your password has been changed successfully.",
          [
            {
              text: "OK",
              onPress: () => {
                // Clear form
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                // Notify parent and go back
                if (onPasswordChanged) {
                  onPasswordChanged();
                }
                onGoBack();
              },
            },
          ]
        );
      } else {
        setErrors({ submit: result.message || "Failed to change password" });
      }
    } catch (error) {
      console.error("Change password error:", error);
      setErrors({ submit: error.message || "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const themedStyles = createThemedStyles(theme);

  // Render password input field with visibility toggle
  const renderPasswordInput = (
    label,
    value,
    setValue,
    showPassword,
    setShowPassword,
    error,
    placeholder
  ) => (
    <View style={themedStyles.inputContainer}>
      <Text style={themedStyles.inputLabel}>{label}</Text>
      <View style={[themedStyles.inputWrapper, error && themedStyles.inputError]}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={error ? "#ff4444" : theme.colors.textSecondary}
          style={themedStyles.inputIcon}
        />
        <TextInput
          style={themedStyles.textInput}
          value={value}
          onChangeText={setValue}
          secureTextEntry={!showPassword}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={themedStyles.visibilityButton}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={themedStyles.errorText}>{error}</Text>}
    </View>
  );

  // Render password strength indicator
  const renderPasswordStrength = () => {
    if (!newPassword) return null;

    return (
      <View style={themedStyles.strengthContainer}>
        <View style={themedStyles.strengthBars}>
          {[1, 2, 3, 4, 5].map((level) => (
            <View
              key={level}
              style={[
                themedStyles.strengthBar,
                {
                  backgroundColor:
                    level <= passwordStrength.level
                      ? passwordStrength.color
                      : theme.colors.borderLight,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[themedStyles.strengthText, { color: passwordStrength.color }]}>
          {passwordStrength.text}
        </Text>
      </View>
    );
  };

  // Render password requirements checklist
  const renderRequirements = () => {
    const requirements = [
      { text: "At least 8 characters", met: newPassword.length >= 8 },
      { text: "One lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
      { text: "One uppercase letter (A-Z)", met: /[A-Z]/.test(newPassword) },
      { text: "One number (0-9)", met: /[0-9]/.test(newPassword) },
      { text: "One special character (!@#$...)", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    ];

    return (
      <View style={themedStyles.requirementsContainer}>
        <Text style={themedStyles.requirementsTitle}>Password Requirements:</Text>
        {requirements.map((req, index) => (
          <View key={index} style={themedStyles.requirementRow}>
            <Ionicons
              name={req.met ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={req.met ? "#33cc33" : theme.colors.textTertiary}
            />
            <Text
              style={[
                themedStyles.requirementText,
                req.met && themedStyles.requirementMet,
              ]}
            >
              {req.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={themedStyles.container}>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.colors.surface}
      />
      
      {/* Header */}
      <View style={themedStyles.header}>
        <Text style={themedStyles.headerTitle}>Change Password</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={themedStyles.scrollView}
          contentContainerStyle={themedStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
        {/* Info Card */}
        <View style={themedStyles.infoCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={28}
            color={theme.colors.primary}
          />
          <Text style={themedStyles.infoText}>
            For your security, please enter your current password before setting a new one.
          </Text>
        </View>

        {/* Current Password */}
        {renderPasswordInput(
          "Current Password",
          currentPassword,
          setCurrentPassword,
          showCurrentPassword,
          setShowCurrentPassword,
          errors.currentPassword,
          "Enter your current password"
        )}

        {/* New Password */}
        {renderPasswordInput(
          "New Password",
          newPassword,
          setNewPassword,
          showNewPassword,
          setShowNewPassword,
          errors.newPassword,
          "Enter your new password"
        )}

        {/* Password Strength Indicator */}
        {renderPasswordStrength()}

        {/* Password Requirements */}
        {newPassword.length > 0 && renderRequirements()}

        {/* Confirm Password */}
        {renderPasswordInput(
          "Confirm New Password",
          confirmPassword,
          setConfirmPassword,
          showConfirmPassword,
          setShowConfirmPassword,
          errors.confirmPassword,
          "Re-enter your new password"
        )}

        {/* Match Indicator */}
        {confirmPassword.length > 0 && newPassword.length > 0 && (
          <View style={themedStyles.matchIndicator}>
            <Ionicons
              name={confirmPassword === newPassword ? "checkmark-circle" : "close-circle"}
              size={18}
              color={confirmPassword === newPassword ? "#33cc33" : "#ff4444"}
            />
            <Text
              style={[
                themedStyles.matchText,
                { color: confirmPassword === newPassword ? "#33cc33" : "#ff4444" },
              ]}
            >
              {confirmPassword === newPassword ? "Passwords match" : "Passwords do not match"}
            </Text>
          </View>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <View style={themedStyles.submitErrorContainer}>
            <Ionicons name="alert-circle" size={20} color="#ff4444" />
            <Text style={themedStyles.submitErrorText}>{errors.submit}</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            themedStyles.submitButton,
            isLoading && themedStyles.submitButtonDisabled,
          ]}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="key-outline" size={20} color="#fff" />
              <Text style={themedStyles.submitButtonText}>Change Password</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={[
            themedStyles.cancelButton,
            isLoading && themedStyles.cancelButtonDisabled,
          ]}
          onPress={onGoBack}
          disabled={isLoading}
        >
          <Text style={themedStyles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const createThemedStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    headerTitle: {
      fontSize: width * 0.05,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    infoText: {
      flex: 1,
      marginLeft: 12,
      fontSize: width * 0.038,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: width * 0.04,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
      paddingHorizontal: 12,
    },
    inputError: {
      borderColor: "#ff4444",
    },
    inputIcon: {
      marginRight: 10,
    },
    textInput: {
      flex: 1,
      paddingVertical: 14,
      fontSize: width * 0.04,
      color: theme.colors.text,
    },
    visibilityButton: {
      padding: 8,
    },
    errorText: {
      fontSize: width * 0.032,
      color: "#ff4444",
      marginTop: 6,
      marginLeft: 4,
    },
    strengthContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: -12,
      marginBottom: 16,
    },
    strengthBars: {
      flexDirection: "row",
      flex: 1,
      marginRight: 12,
    },
    strengthBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      marginHorizontal: 2,
    },
    strengthText: {
      fontSize: width * 0.032,
      fontWeight: "600",
      minWidth: 80,
      textAlign: "right",
    },
    requirementsContainer: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      minHeight: 60,
    },
    requirementsTitle: {
      fontSize: width * 0.035,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      marginBottom: 10,
    },
    requirementRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 4,
    },
    requirementText: {
      fontSize: width * 0.033,
      color: theme.colors.textTertiary,
      marginLeft: 8,
    },
    requirementMet: {
      color: theme.colors.text,
    },
    matchIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: -12,
      marginBottom: 20,
      marginLeft: 4,
    },
    matchText: {
      fontSize: width * 0.033,
      marginLeft: 6,
      fontWeight: "500",
    },
    submitErrorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff5f5",
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    submitErrorText: {
      flex: 1,
      fontSize: width * 0.035,
      color: "#ff4444",
      marginLeft: 8,
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 10,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      fontSize: width * 0.045,
      fontWeight: "bold",
      color: "#fff",
      marginLeft: 8,
    },
    cancelButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#DC2626",
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 12,
      shadowColor: "#DC2626",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    cancelButtonDisabled: {
      opacity: 0.7,
    },
    cancelButtonText: {
      fontSize: width * 0.045,
      fontWeight: "bold",
      color: "#fff",
    },
  });

export default ChangePassword;
