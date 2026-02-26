// ===== FORGOT PASSWORD FUNCTIONS =====
// Handles the 3-step forgot password flow for mobile stallholders:
//   Step 1 – Enter email → verify email exists → send OTP via backend Nodemailer
//   Step 2 – Enter OTP  → verify code on backend
//   Step 3 – Enter new password → reset password on backend

import ApiService from '../../../services/ApiService';

// ─────────────────────────────────────────────────────────────
//  STEP 1  ·  Verify email & send OTP
// ─────────────────────────────────────────────────────────────
/**
 * handleSendOtp
 * 1. Validates the email field.
 * 2. Verifies the email exists in the system.
 * 3. Sends a 6-digit OTP to the email via backend Nodemailer.
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

    // Step 1b: Send OTP via backend Nodemailer (resend-reset-code endpoint)
    console.log('📧 Sending OTP to:', email.trim());
    const sendResult = await ApiService.forgotPasswordSendCode(email.trim().toLowerCase());

    if (!sendResult.success) {
      setError(sendResult.message || 'Failed to send verification code. Please try again.');
      setLoading(false);
      return;
    }

    console.log('✅ OTP sent successfully');
    setSuccess('A 6-digit verification code has been sent to your email.');
    onSuccess({ userName });

  } catch (error) {
    console.error('❌ handleSendOtp error:', error);
    setError('Something went wrong. Please check your connection and try again.');
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
    const result = await ApiService.forgotPasswordSendCode(email.trim().toLowerCase());

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

/** maskEmail – returns a masked version like "j***n@gmail.com" */
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

/** getPasswordStrength – returns { score: 0-100, label, color } */
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '#ccc' };

  let score = 0;
  if (password.length >= 8)        score += 25;
  if (/[A-Z]/.test(password))       score += 25;
  if (/[a-z]/.test(password))       score += 25;
  if (/[0-9]/.test(password))       score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  score = Math.min(score, 100);

  let label = 'Weak';
  let color = '#e74c3c';
  if (score >= 70)      { label = 'Strong'; color = '#27ae60'; }
  else if (score >= 40) { label = 'Medium'; color = '#f39c12'; }

  return { score, label, color };
};
