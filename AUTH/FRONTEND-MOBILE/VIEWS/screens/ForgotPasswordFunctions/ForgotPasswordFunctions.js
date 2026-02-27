// ===== FORGOT PASSWORD FUNCTIONS =====
// Handles the 3-step forgot password flow for mobile stallholders:
//   Step 1 – Enter email → verify email exists → generate OTP → send via EmailJS (like web)
//   Step 2 – Enter OTP  → verify code on backend
//   Step 3 – Enter new password → reset password on backend

import ApiService from '@auth-mobile/services/ApiService';

// EmailJS Configuration (same as web app)
const EMAILJS_SERVICE_ID = 'service_am6pozg';
const EMAILJS_TEMPLATE_ID = 'template_3wccajf';
const EMAILJS_PUBLIC_KEY = 'F2fUGiyhf-FjatviG';

let isEmailJSInitialized = false;

// Initialize EmailJS
const initializeEmailJS = async () => {
  if (!isEmailJSInitialized) {
    try {
      const { default: emailjs } = await import('@emailjs/react-native');
      emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY,
      });
      isEmailJSInitialized = true;
      console.log('✅ EmailJS initialized for mobile password reset');
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error);
      const { default: emailjs } = await import('@emailjs/react-native');
      emailjs.init(EMAILJS_PUBLIC_KEY);
      isEmailJSInitialized = true;
    }
  }
};

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code via EmailJS
const sendCodeViaEmailJS = async (email, userName, code) => {
  try {
    await initializeEmailJS();
    const { default: emailjs } = await import('@emailjs/react-native');

    const templateParams = {
      from_name: 'Naga Stall Management',
      from_email: 'noreply@nagastallmanagement.com',
      to_email: email,
      to_name: userName || 'User',
      subject: 'Password Reset Code',
      message: `Hello ${userName || 'User'},

You have requested to reset your password for DigiStall - Naga City Stall Management.

🔐 YOUR VERIFICATION CODE: ${code}

⏱️ This code will expire in 10 minutes.

If you did not request this password reset, please ignore this email.

Best regards,
Stall Management Admin Team`
    };

    console.log('📧 Sending password reset code via EmailJS...');
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ EmailJS response:', response);
    return response;
  } catch (error) {
    console.error('❌ EmailJS error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
//  STEP 1  ·  Verify email & send OTP
// ─────────────────────────────────────────────────────────────
/**
 * handleSendOtp
 * 1. Validates the email field.
 * 2. Verifies the email exists in the system.
 * 3. Generates a 6-digit OTP and sends via EmailJS (client-side)
 * 4. Stores code on backend for verification
 *
 * @param {string}   email
 * @param {Function} setLoading
 * @param {Function} setError
 * @param {Function} setSuccess
 * @param {Function} onSuccess  – called with { userName } when OTP sent
 */
export const handleSendOtp = async (email, setLoading, setError, setSuccess, onSuccess) => {
  setError('');
  setSuccess('');

  if (!email || !email.trim()) {
    setError('Please enter your email address.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    setError('Please enter a valid email address.');
    return;
  }

  setLoading(true);

  try {
    // Step 1a: Check the email exists in the system
    console.log('🔍 Verifying email exists:', email.trim());
    const verifyResult = await ApiService.forgotPasswordVerifyEmail(email.trim().toLowerCase());

    if (!verifyResult.success) {
      setError(verifyResult.message || 'No account found with this email address.');
      setLoading(false);
      return;
    }

    const userName = verifyResult.userName || 'User';
    console.log('✅ Email verified. User:', userName);

    // Step 1b: Generate OTP locally
    const generatedOtp = generateVerificationCode();
    console.log('🔐 Generated OTP:', generatedOtp);

    // Step 1c: Send OTP via EmailJS (client-side, like web does)
    console.log('📧 Sending OTP via EmailJS to:', email.trim());
    await sendCodeViaEmailJS(email.trim(), userName, generatedOtp);

    // Step 1d: Store code on backend for verification
    console.log('💾 Storing OTP code on backend:', email.trim());
    const storeResult = await ApiService.forgotPasswordStoreCode(email.trim().toLowerCase(), generatedOtp);

    if (!storeResult.success) {
      setError('Generated code, but failed to store on backend. Try again.');
      setLoading(false);
      return;
    }

    console.log('✅ OTP sent and stored successfully');
    setSuccess('A 6-digit verification code has been sent to your email.');
    onSuccess({ userName });

  } catch (error) {
    console.error('❌ handleSendOtp error:', error);
    setError('Failed to send verification code. Check your internet and try again.');
  } finally {
    setLoading(false);
  }
};

// ─────────────────────────────────────────────────────────────
//  STEP 1 (Resend)  ·  Resend OTP
// ─────────────────────────────────────────────────────────────
export const handleResendOtp = async (email, setLoading, setError, setSuccess, setOtpInput, startCooldown) => {
  setError('');
  setSuccess('');
  setOtpInput('');
  setLoading(true);

  try {
    console.log('🔄 Resending OTP to:', email);

    // Step 1: Get user info (for name in email)
    const verifyResult = await ApiService.forgotPasswordVerifyEmail(email.trim().toLowerCase());
    if (!verifyResult.success) {
      setError(verifyResult.message || 'Could not fetch user information.');
      setLoading(false);
      return;
    }
    const userName = verifyResult.userName || 'User';

    // Step 2: Generate new OTP
    const newOtp = generateVerificationCode();
    console.log('🔐 Generated new OTP:', newOtp);

    // Step 3: Send via EmailJS
    console.log('📧 Resending OTP via EmailJS to:', email.trim());
    await sendCodeViaEmailJS(email.trim(), userName, newOtp);

    // Step 4: Update code on backend
    console.log('💾 Updating OTP code on backend:', email.trim());
    const storeResult = await ApiService.forgotPasswordStoreCode(email.trim().toLowerCase(), newOtp);

    if (!storeResult.success) {
      setError('Code sent but failed to update backend. Try again.');
      setLoading(false);
      return;
    }

    console.log('✅ OTP resent successfully');
    setSuccess('A new verification code has been sent to your email.');
    startCooldown();
  } catch (error) {
    console.error('❌ handleResendOtp error:', error);
    setError('Failed to resend code. Check your internet and try again.');
  } finally {
    setLoading(false);
  }
};

    if (!result.success) {
      setError(result.message || 'Failed to resend code. Please try again.');
      setLoading(false);
      return;
    }

    console.log('✅ OTP resent successfully');
    setSuccess('A new verification code has been sent to your email.');
    startCooldown();
  } catch (error) {
    console.error('❌ handleResendOtp error:', error);
    setError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
};

// ─────────────────────────────────────────────────────────────
//  STEP 2  ·  Verify OTP
// ─────────────────────────────────────────────────────────────
/**
 * handleVerifyOtp
 * Sends the entered OTP to the backend for verification.
 *
 * @param {string}   email
 * @param {string}   otp          – 6-digit string
 * @param {Function} setLoading
 * @param {Function} setError
 * @param {Function} setSuccess
 * @param {Function} onSuccess    – called when code is verified
 */
export const handleVerifyOtp = async (email, otp, setLoading, setError, setSuccess, onSuccess) => {
  setError('');
  setSuccess('');

  if (!otp || otp.trim().length !== 6) {
    setError('Please enter the complete 6-digit verification code.');
    return;
  }

  if (!/^\d{6}$/.test(otp.trim())) {
    setError('Verification code must contain only digits.');
    return;
  }

  setLoading(true);

  try {
    console.log('🔐 Verifying OTP for:', email);
    const result = await ApiService.forgotPasswordVerifyCode(email.trim().toLowerCase(), otp.trim());

    if (!result.success) {
      setError(result.message || 'Invalid or expired verification code.');
      setLoading(false);
      return;
    }

    console.log('✅ OTP verified successfully');
    setSuccess('Code verified! Please set your new password.');
    onSuccess();
  } catch (error) {
    console.error('❌ handleVerifyOtp error:', error);
    setError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
};

// ─────────────────────────────────────────────────────────────
//  STEP 3  ·  Reset Password
// ─────────────────────────────────────────────────────────────
/**
 * handleResetPassword
 * Validates the new password and sends the reset request to the backend.
 *
 * @param {string}   email
 * @param {string}   otp
 * @param {string}   newPassword
 * @param {string}   confirmPassword
 * @param {Function} setLoading
 * @param {Function} setError
 * @param {Function} setSuccess
 * @param {Function} onSuccess    – called on successful reset
 */
export const handleResetPassword = async (
  email,
  otp,
  newPassword,
  confirmPassword,
  setLoading,
  setError,
  setSuccess,
  onSuccess
) => {
  setError('');
  setSuccess('');

  // Validate password
  if (!newPassword || newPassword.length < 8) {
    setError('Password must be at least 8 characters long.');
    return;
  }

  if (!/[A-Z]/.test(newPassword)) {
    setError('Password must contain at least one uppercase letter.');
    return;
  }

  if (!/[a-z]/.test(newPassword)) {
    setError('Password must contain at least one lowercase letter.');
    return;
  }

  if (!/[0-9]/.test(newPassword)) {
    setError('Password must contain at least one number.');
    return;
  }

  if (newPassword !== confirmPassword) {
    setError('Passwords do not match.');
    return;
  }

  setLoading(true);

  try {
    console.log('🔐 Resetting password for:', email);
    const result = await ApiService.forgotPasswordReset(
      email.trim().toLowerCase(),
      otp.trim(),
      newPassword
    );

    if (!result.success) {
      setError(result.message || 'Failed to reset password. Please try again.');
      setLoading(false);
      return;
    }

    console.log('✅ Password reset successfully');
    setSuccess('Your password has been reset successfully!');
    onSuccess();
  } catch (error) {
    console.error('❌ handleResetPassword error:', error);
    setError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * maskEmail  – returns a masked version like "j***n@gmail.com"
 */
export const maskEmail = (email) => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName =
    name.charAt(0) +
    '*'.repeat(Math.max(name.length - 2, 1)) +
    name.charAt(name.length - 1);
  return `${maskedName}@${domain}`;
};

/**
 * getPasswordStrength  – returns { score: 0-100, label, color }
 */
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '#ccc' };

  let score = 0;
  if (password.length >= 8)  score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[a-z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;

  score = Math.min(score, 100);

  let label = 'Weak';
  let color = '#e74c3c';
  if (score >= 70) { label = 'Strong';  color = '#27ae60'; }
  else if (score >= 40) { label = 'Medium'; color = '#f39c12'; }

  return { score, label, color };
};
