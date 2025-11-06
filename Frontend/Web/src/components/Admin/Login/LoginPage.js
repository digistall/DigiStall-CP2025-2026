// ===== ENHANCED LOGIN PAGE WITH JWT AUTH =====
import { useAuthStore } from '../../../stores/authStore'
import UniversalPopup from '../../Common/UniversalPopup/UniversalPopup.vue'

export default {
  name: 'LoginPage',
  components: {
    UniversalPopup,
  },
  data() {
    return {
      valid: false,
      loading: false,
      username: '',
      password: '',
      showPassword: false,
      showSuccessPopup: false,
      showSuccessMessage: false,
      successMessage: '',
      errorMessage: '',
      loadingText: 'Authenticating',
      loadingSubtext: 'Verifying your credentials',
      // Universal popup for errors
      errorPopup: {
        show: false,
        message: '',
        type: 'error',
        operation: 'login',
        operationType: 'user',
      },
      usernameRules: [
        (v) => !!v || 'Username is required',
        (v) => (v && v.length >= 3) || 'Username must be at least 3 characters',
      ],
      passwordRules: [
        (v) => !!v || 'Password is required',
        (v) => (v && v.length >= 6) || 'Password must be at least 6 characters',
      ],
    }
  },
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  computed: {
    userType() {
      // Determine user type from username pattern
      const username = this.username.toLowerCase()
      
      if (username.includes('admin')) {
        return 'admin'
      } else if (username.includes('manager')) {
        return 'branch_manager'
      } else {
        return 'employee'
      }
    },
  },
  async mounted() {
    // Check if already authenticated
    if (this.authStore.isAuthenticated) {
      this.$router.push('/app/dashboard')
    }
  },
  methods: {
    clearError() {
      this.errorMessage = ''
      this.errorPopup.show = false
    },

    clearSuccess() {
      this.successMessage = ''
      this.showSuccessMessage = false
      this.showSuccessPopup = false
    },

    showErrorMessage(message) {
      this.errorMessage = message
      this.errorPopup.message = message
      this.errorPopup.show = true
    },

    async handleLogin() {
      this.clearError()
      this.clearSuccess()

      // Validate form first
      const { valid } = await this.$refs.loginForm.validate()

      if (!valid) {
        this.showErrorMessage('Please fill in all required fields correctly.')
        return
      }

      this.loading = true
      this.loadingText = 'Authenticating'
      this.loadingSubtext = 'Verifying your credentials'

      try {
        this.loadingText = 'Connecting'
        this.loadingSubtext = 'Establishing secure connection'

        console.log('🔐 Attempting login with username:', this.username.trim())

        this.loadingText = 'Validating'
        this.loadingSubtext = 'Checking permissions'

        // Use the new auth store login method
        const result = await this.authStore.login(
          this.username.trim(),
          this.password,
          this.userType
        )

        this.loading = false

        if (result.success) {
          // Login successful
          this.loadingText = 'Success'
          this.loadingSubtext = 'Redirecting to dashboard'

          this.successMessage = 'Login successful! Redirecting...'
          this.showSuccessMessage = true
          this.showSuccessPopup = true

          console.log('✅ Login successful, redirecting to dashboard')

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            this.$router.push('/app/dashboard')
          }, 1500)
        } else {
          // Login failed - show error message
          this.showErrorMessage(result.message || 'Login failed. Please try again.')
        }
      } catch (error) {
        this.loading = false
        this.handleLoginError(error)
      }
    },

    handleLoginError(error) {
      // FIXED: Ensure loading is always turned off
      this.loading = false

      let errorMessage = 'An unexpected error occurred. Please try again.'

      if (error.response) {
        const { status, data } = error.response
        console.error('❌ Server Error:', status, data)

        switch (status) {
          case 400:
            errorMessage = data.message || 'Invalid request. Please check your input and try again.'
            break
          case 401:
            if (data.message && data.message.toLowerCase().includes('credentials')) {
              errorMessage =
                'Invalid username or password. Please check your credentials and try again.'
            } else {
              errorMessage =
                data.message || 'Authentication failed. Please verify your username and password.'
            }
            break
          case 403:
            errorMessage =
              'Access denied. Your account may be inactive or you may not have the required permissions.'
            break
          case 404:
            errorMessage =
              'User account not found. Please verify your username or contact your administrator.'
            break
          case 429:
            errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.'
            break
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Server is temporarily unavailable. Please try again in a few moments.'
            break
          default:
            errorMessage =
              data.message || `Server error (${status}). Please contact support if this continues.`
        }
      } else if (error.request) {
        console.error('❌ Network Error:', error.request)
        errorMessage =
          'Unable to connect to the server. Please check your internet connection and try again.'
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Login request timed out. Please check your connection and try again.'
      } else {
        console.error('❌ Unexpected Error:', error.message)
        errorMessage = error.message || 'An unexpected error occurred. Please try again.'
      }

      this.showErrorMessage(errorMessage)
    },

    async handleForgotPassword() {
      this.clearError()
      this.clearSuccess()
      console.log('Forgot password clicked')

      try {
        this.$router.push('/forgot-password')
        this.$emit('forgot-password')
      } catch (error) {
        console.error('Navigation error:', error)
        this.showErrorMessage('Unable to navigate to forgot password page.')
      }
    },

    resetForm() {
      this.username = ''
      this.password = ''
      this.showPassword = false
      this.clearError()
      this.clearSuccess()
      if (this.$refs.loginForm) {
        this.$refs.loginForm.resetValidation()
      }
    },

    togglePasswordVisibility() {
      this.showPassword = !this.showPassword
    },

    showSuccessNotification(message) {
      this.successMessage = message
      this.showSuccessPopup = true
      this.showSuccessMessage = true
      this.clearError()
    },

    onAdminRegistered(adminData) {
      this.showSuccessNotification(`Admin ${adminData.username} registered successfully!`)
    },

    // FIXED: Add retry mechanism for failed requests
    async retryLogin() {
      if (this.loading) return

      console.log('🔄 Retrying login...')
      await this.handleLogin()
    },

    // Navigate to landing page
    goToLandingPage() {
      this.$router.push('/')
    },
  },

  watch: {
    // Clear error messages when user starts typing
    username() {
      if (this.errorMessage) this.clearError()
      if (this.showSuccessMessage) this.clearSuccess()
    },
    password() {
      if (this.errorMessage) this.clearError()
      if (this.showSuccessMessage) this.clearSuccess()
    },
  },

  beforeUnmount() {
    // Clear any pending timeouts
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout)
    }
  },
}
