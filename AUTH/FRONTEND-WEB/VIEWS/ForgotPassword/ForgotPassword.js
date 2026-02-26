// ===== FORGOT PASSWORD PAGE =====
// Uses EmailJS to send verification codes (same as credential emails)
import axios from 'axios'
import emailjs from '@emailjs/browser'

// EmailJS Configuration - reusing the same service as credentials
const EMAILJS_SERVICE_ID = 'service_e2awvdk'
const EMAILJS_TEMPLATE_ID = 'template_r6kxcnh'
const EMAILJS_PUBLIC_KEY = 'sTpDE-Oq2-9XH_UZd'
const SENDER_EMAIL = 'requiem121701@gmail.com'
const SENDER_NAME = 'Naga-Stall'

let isEmailJSInitialized = false

// Initialize EmailJS
const initializeEmailJS = () => {
  if (!isEmailJSInitialized) {
    try {
      emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY,
        blockHeadless: false,
      })
      isEmailJSInitialized = true
      console.log('✅ EmailJS initialized for password reset')
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error)
      emailjs.init(EMAILJS_PUBLIC_KEY)
      isEmailJSInitialized = true
    }
  }
}

export default {
  name: 'ForgotPassword',
  components: {},
  data() {
    return {
      // Step tracking
      currentStep: 1,
      
      // Form validity states
      emailFormValid: false,
      codeFormValid: false,
      passwordFormValid: false,
      
      // Loading state
      loading: false,
      
      // Form data
      email: '',
      verificationCode: '',
      newPassword: '',
      confirmPassword: '',
      
      // Password visibility toggles
      showNewPassword: false,
      showConfirmPassword: false,
      
      // Code verification
      resendCooldown: 0,
      resendTimer: null,
      generatedCode: '', // Store code for verification
      
      // Messages
      errorMessage: '',
      successMessage: '',
      
      // Snackbar state
      showSnackbar: false,
      snackbarMessage: '',
      snackbarType: 'success',
      
      // User data from verification
      verifiedUserType: '',
      verifiedUserName: '',
      
      // Validation rules
      emailRules: [
        (v) => !!v || 'Email is required',
        (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
      ],
      newPasswordRules: [
        (v) => !!v || 'Password is required',
        (v) => (v && v.length >= 8) || 'Password must be at least 8 characters',
        (v) => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
        (v) => /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
        (v) => /[0-9]/.test(v) || 'Password must contain at least one number',
      ],
    }
  },
  computed: {
    confirmPasswordRules() {
      return [
        (v) => !!v || 'Please confirm your password',
        (v) => v === this.newPassword || 'Passwords do not match',
      ]
    },
    passwordStrength() {
      const password = this.newPassword
      if (!password) return 0
      
      let strength = 0
      if (password.length >= 8) strength += 25
      if (/[A-Z]/.test(password)) strength += 25
      if (/[a-z]/.test(password)) strength += 25
      if (/[0-9]/.test(password)) strength += 15
      if (/[^A-Za-z0-9]/.test(password)) strength += 10
      
      return Math.min(strength, 100)
    },
    passwordStrengthColor() {
      if (this.passwordStrength < 40) return '#f44336'
      if (this.passwordStrength < 70) return '#ff9800'
      return '#4caf50'
    },
    passwordStrengthText() {
      if (!this.newPassword) return ''
      if (this.passwordStrength < 40) return 'Weak'
      if (this.passwordStrength < 70) return 'Medium'
      return 'Strong'
    },
  },
  beforeUnmount() {
    // Clear any timers
    if (this.resendTimer) {
      clearInterval(this.resendTimer)
    }
  },
  methods: {
    clearError() {
      this.errorMessage = ''
    },
    
    clearSuccess() {
      this.successMessage = ''
    },
    
    clearMessages() {
      this.errorMessage = ''
      this.successMessage = ''
    },
    
    showErrorPopup(message) {
      this.errorMessage = message
      this.snackbarMessage = message
      this.snackbarType = 'error'
      this.showSnackbar = true
    },
    
    showSuccessPopupMessage(message) {
      this.successMessage = message
      this.snackbarMessage = message
      this.snackbarType = 'success'
      this.showSnackbar = true
    },
    
    maskEmail(email) {
      if (!email) return ''
      const [name, domain] = email.split('@')
      if (!domain) return email
      const maskedName = name.charAt(0) + '*'.repeat(Math.max(name.length - 2, 1)) + name.charAt(name.length - 1)
      return `${maskedName}@${domain}`
    },
    
    // Generate 6-digit verification code
    generateVerificationCode() {
      return Math.floor(100000 + Math.random() * 900000).toString()
    },
    
    // Send verification code via EmailJS
    async sendCodeViaEmailJS(email, userName, code) {
      initializeEmailJS()
      
      const templateParams = {
        from_name: SENDER_NAME,
        from_email: SENDER_EMAIL,
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
      }
      
      console.log('📧 Sending password reset code via EmailJS...')
      
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      )
      
      console.log('✅ EmailJS response:', response)
      return response
    },
    
    async handleSendCode() {
      this.clearMessages()
      
      // Validate form
      const { valid } = await this.$refs.emailForm.validate()
      if (!valid) {
        this.showErrorPopup('Please enter a valid email address.')
        return
      }
      
      this.loading = true
      
      try {
        // First verify email exists in the system
        const response = await axios.post('/api/auth/verify-email-exists', {
          email: this.email.trim()
        })
        
        if (response.data.success) {
          // Store user info
          this.verifiedUserType = response.data.userType
          this.verifiedUserName = response.data.userName
          
          // Generate verification code
          this.generatedCode = this.generateVerificationCode()
          
          // Send code via EmailJS
          await this.sendCodeViaEmailJS(
            this.email.trim(),
            this.verifiedUserName,
            this.generatedCode
          )
          
          // Store code on backend for verification
          await axios.post('/api/auth/store-reset-code', {
            email: this.email.trim(),
            code: this.generatedCode
          })
          
          this.successMessage = 'Verification code sent to your email!'
          this.currentStep = 2
          this.startResendCooldown()
        } else {
          this.showErrorPopup(response.data.message || 'Email not found in our records.')
        }
        
      } catch (error) {
        console.error('Error sending verification code:', error)
        
        if (error.response?.data?.message) {
          this.showErrorPopup(error.response.data.message)
        } else {
          this.showErrorPopup('Failed to send verification code. Please try again.')
        }
      } finally {
        this.loading = false
      }
    },
    
    startResendCooldown() {
      this.resendCooldown = 60 // 60 seconds cooldown
      
      if (this.resendTimer) {
        clearInterval(this.resendTimer)
      }
      
      this.resendTimer = setInterval(() => {
        this.resendCooldown--
        if (this.resendCooldown <= 0) {
          clearInterval(this.resendTimer)
          this.resendTimer = null
        }
      }, 1000)
    },
    
    async handleResendCode() {
      if (this.resendCooldown > 0) return
      
      this.clearMessages()
      this.verificationCode = ''
      this.loading = true
      
      try {
        // Generate new code
        this.generatedCode = this.generateVerificationCode()
        
        // Send new code via EmailJS
        await this.sendCodeViaEmailJS(
          this.email.trim(),
          this.verifiedUserName,
          this.generatedCode
        )
        
        // Store new code on backend
        await axios.post('/api/auth/store-reset-code', {
          email: this.email.trim(),
          code: this.generatedCode
        })
        
        this.successMessage = 'New verification code sent to your email!'
        this.startResendCooldown()
      } catch (error) {
        console.error('Error resending code:', error)
        this.showErrorPopup('Failed to resend code. Please try again.')
      } finally {
        this.loading = false
      }
    },
    
    async handleVerifyCode() {
      this.clearMessages()
      
      if (this.verificationCode.length !== 6) {
        this.showErrorPopup('Please enter the complete 6-digit code.')
        return
      }
      
      this.loading = true
      
      try {
        // Verify the code with backend
        const response = await axios.post('/api/auth/verify-reset-code', {
          email: this.email.trim(),
          code: this.verificationCode
        })
        
        if (response.data.success) {
          this.successMessage = 'Code verified successfully!'
          this.currentStep = 3
        } else {
          this.showErrorPopup(response.data.message || 'Invalid or expired verification code.')
        }
      } catch (error) {
        console.error('Error verifying code:', error)
        
        if (error.response?.data?.message) {
          this.showErrorPopup(error.response.data.message)
        } else {
          this.showErrorPopup('Failed to verify code. Please try again.')
        }
      } finally {
        this.loading = false
      }
    },
    
    async handleResetPassword() {
      this.clearMessages()
      
      // Validate form
      const { valid } = await this.$refs.passwordForm.validate()
      if (!valid) {
        this.showErrorPopup('Please fill in all required fields correctly.')
        return
      }
      
      if (this.newPassword !== this.confirmPassword) {
        this.showErrorPopup('Passwords do not match.')
        return
      }
      
      this.loading = true
      
      try {
        // Send password reset request to backend
        const response = await axios.post('/api/auth/reset-password', {
          email: this.email.trim(),
          code: this.verificationCode,
          newPassword: this.newPassword
        })
        
        if (response.data.success) {
          this.currentStep = 4
          this.showSuccessPopupMessage('Password reset successful!')
        } else {
          this.showErrorPopup(response.data.message || 'Failed to reset password.')
        }
      } catch (error) {
        console.error('Error resetting password:', error)
        
        if (error.response?.data?.message) {
          this.showErrorPopup(error.response.data.message)
        } else {
          this.showErrorPopup('Failed to reset password. Please try again.')
        }
      } finally {
        this.loading = false
      }
    },
    
    goBackToEmail() {
      this.currentStep = 1
      this.verificationCode = ''
      this.clearMessages()
    },
    
    goToLogin() {
      this.$router.push('/login')
    },
  },
}
