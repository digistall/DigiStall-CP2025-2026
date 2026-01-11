// ===== ENHANCED LOGIN PAGE WITH JWT AUTH =====
import { useAuthStore } from '../../../stores/authStore'
import UniversalPopup from '../../Common/UniversalPopup/UniversalPopup.vue'
import LoadingScreen from '../../Common/LoadingScreen/LoadingScreen.vue'

export default {
  name: 'LoginPage',
  components: {
    UniversalPopup,
    LoadingScreen,
  },
  data() {
    return {
      valid: false,
      loading: false,
      showLoadingScreen: false,
      username: '',
      password: '',
      showPassword: false,
      showSuccessPopup: false,
      showSuccessMessage: false,
      successMessage: '',
      errorMessage: '',
      loadingText: 'Authenticating',
      loadingSubtext: 'Verifying your credentials',
      redirectTimeout: null,
      // Logged in user info for loading screen
      loggedInUserName: '',
      loggedInUserRole: '',
      loggedInBranchName: '',
      // Real-time loading progress
      currentLoadingStep: 0,
      currentProgress: 0,
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
      
      if (username.includes('sysadmin') || username.includes('system')) {
        return 'system_administrator'
      } else if (username.includes('admin') || username.includes('owner')) {
        return 'stall_business_owner'
      } else if (username.includes('manager')) {
        return 'business_manager'
      } else {
        return 'business_employee'
      }
    },
  },
  async mounted() {
    // Check if already authenticated
    if (this.authStore.isAuthenticated) {
      this.$router.push(this.getSmartRedirectPath())
    }

    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', this.handleStorageChange)
  },
  beforeUnmount() {
    // Clean up event listeners
    window.removeEventListener('storage', this.handleStorageChange)
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout)
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

      // Show loading screen immediately BEFORE starting authentication
      this.currentLoadingStep = 0
      this.currentProgress = 0
      this.loggedInUserName = this.username.trim()
      this.showLoadingScreen = true

      try {
        // Step 1: Server connection
        this.loadingText = 'Connecting'
        this.loadingSubtext = 'Establishing secure connection'
        await new Promise(resolve => setTimeout(resolve, 300))
        this.currentLoadingStep = 1
        this.currentProgress = 20

        console.log('🔐 Attempting login with username:', this.username.trim())

        // Step 2: Authentication - verifying credentials
        this.currentLoadingStep = 1
        this.currentProgress = 25
        await new Promise(resolve => setTimeout(resolve, 200))
        this.currentProgress = 35

        // Use the new auth store login method
        const result = await this.authStore.login(
          this.username.trim(),
          this.password,
          this.userType
        )
        
        if (result.success) {
          // Step 3: Profile loading
          this.currentLoadingStep = 2
          this.currentProgress = 55
          
          // Get user info for loading screen
          const userData = sessionStorage.getItem('currentUser')
          if (userData) {
            try {
              const user = JSON.parse(userData)
              this.loggedInUserName = user.fullName || user.full_name || user.username || 'User'
              this.loggedInUserRole = user.userType || ''
              this.loggedInBranchName = user.branchName || user.branch_name || ''
            } catch (e) {
              console.error('Error parsing user data for loading screen:', e)
              this.loggedInUserName = 'User'
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 300))
          this.currentProgress = 70
          
          // Step 4: Dashboard setup
          this.currentLoadingStep = 3
          this.currentProgress = 75
          await new Promise(resolve => setTimeout(resolve, 300))
          this.currentProgress = 90
          
          // Step 5: Finalizing
          this.currentLoadingStep = 4
          this.currentProgress = 95
          await new Promise(resolve => setTimeout(resolve, 200))
          this.currentProgress = 100
          
          this.loading = false
          console.log('✅ Login successful, authentication complete')
        } else {
          // Login failed - hide loading screen and show error
          this.loading = false
          this.showLoadingScreen = false
          this.currentLoadingStep = 0
          this.currentProgress = 0
          
          const errorMessage = result.message || 'Login failed. Please check your credentials and try again.'
          this.showErrorMessage(errorMessage)
          console.error('❌ Login failed:', errorMessage)
        }
      } catch (error) {
        this.loading = false
        this.showLoadingScreen = false
        this.currentLoadingStep = 0
        this.currentProgress = 0
        console.error('❌ Login error:', error)

        // Handle different error scenarios
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
                errorMessage = 'Invalid username or password. Please check your credentials and try again.'
              } else {
                errorMessage = data.message || 'Authentication failed. Please verify your username and password.'
              }
              break
            case 403:
              errorMessage = 'Access denied. Your account may be inactive or you may not have the required permissions.'
              break
            case 404:
              errorMessage = 'User account not found. Please verify your username or contact your administrator.'
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
              errorMessage = data.message || `Server error (${status}). Please contact support if this continues.`
          }
        } else if (error.request) {
          console.error('❌ Network Error:', error.request)
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Login request timed out. Please check your connection and try again.'
        } else {
          console.error('❌ Unexpected Error:', error.message)
          errorMessage = error.message || 'An unexpected error occurred. Please try again.'
        }

        this.showErrorMessage(errorMessage)
      }
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

    async retryLogin() {
      if (this.loading) return
      console.log('🔄 Retrying login...')
      await this.handleLogin()
    },

    goToLandingPage() {
      this.$router.push('/')
    },

    // Loading screen event handlers
    onLoadingComplete() {
      console.log('📋 Loading animation complete')
    },

    onReadyToNavigate() {
      const redirectPath = this.getSmartRedirectPath()
      console.log('🚀 Ready to navigate to:', redirectPath)
      this.showLoadingScreen = false
      this.$router.push(redirectPath)
    },

    /**
     * Get smart redirect path based on user permissions
     */
    getSmartRedirectPath() {
      const userData = sessionStorage.getItem('currentUser')
      if (!userData) return '/app/dashboard'

      try {
        const user = JSON.parse(userData)
        
        // System administrator goes to system admin dashboard
        if (user.userType === 'system_administrator') {
          return '/system-admin/dashboard'
        }
        
        // Business owner and manager always have dashboard
        if (user.userType === 'stall_business_owner' || user.userType === 'business_manager') {
          return '/app/dashboard'
        }
        
        // For business employees, check their permissions
        if (user.userType === 'business_employee' && user.permissions) {
          const permissions = user.permissions
          
          const hasPermission = (perm) => {
            if (Array.isArray(permissions)) {
              return permissions.includes(perm)
            }
            return permissions[perm] === true
          }
          
          // If has dashboard permission, go to dashboard
          if (hasPermission('dashboard')) {
            return '/app/dashboard'
          }
          
          // Find first available page based on permissions
          const permissionRoutes = [
            { perm: 'payments', route: '/app/payment' },
            { perm: 'applicants', route: '/app/applicants' },
            { perm: 'complaints', route: '/app/complaints' },
            { perm: 'compliances', route: '/app/compliance' },
            { perm: 'vendors', route: '/app/vendor' },
            { perm: 'stallholders', route: '/app/stallholder' },
            { perm: 'collectors', route: '/app/collectors' },
            { perm: 'stalls', route: '/app/stalls' }
          ]
          
          for (const { perm, route } of permissionRoutes) {
            if (hasPermission(perm)) {
              console.log(`🔄 User doesn't have dashboard permission, redirecting to ${route}`)
              return route
            }
          }
        }
        
        return '/app/dashboard'
      } catch {
        return '/app/dashboard'
      }
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

    handleStorageChange(event) {
      // Listen for login in other tabs
      if (event.key === 'authToken' && event.newValue) {
        // User logged in on another tab, redirect to appropriate page
        console.log('🔄 Login detected in another tab, redirecting...')
        this.$router.push(this.getSmartRedirectPath())
      }
    },
  },
}
