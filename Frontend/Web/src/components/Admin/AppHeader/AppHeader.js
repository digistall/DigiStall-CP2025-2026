import axios from 'axios'

// Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
// Ensure API_BASE_URL includes /api
const API_BASE_URL_WITH_API = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`

export default {
  name: 'AppHeader',
  props: {
    title: {
      type: String,
      default: 'Title',
    },
    username: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      branchManagerData: null,
      adminData: null,
      employeeData: null,
      loading: false,
      error: null,
      // Popup state
      showProfilePopup: false,
      popupPosition: {
        top: '0px',
        right: '0px',
      },
    }
  },
  computed: {
    userType() {
      return sessionStorage.getItem('userType') || 'branch-manager'
    },
    isAdmin() {
      return this.userType === 'admin'
    },
    isEmployee() {
      return this.userType === 'employee'
    },
    currentUserData() {
      if (this.isAdmin) return this.adminData
      if (this.isEmployee) return this.employeeData
      return this.branchManagerData
    },
    displayUsername() {
      // Show the actual username from database
      return this.currentUserData?.username || (this.isAdmin ? 'admin' : 'manager')
    },
    displayDesignation() {
      // Show the full name and area/location designation
      if (this.currentUserData) {
        const fullName =
          this.currentUserData.fullName || (this.isAdmin ? 'Administrator' : 'Branch Manager')
        const designation = this.currentUserData.designation || ''
        return designation ? `${fullName} - ${designation}` : fullName
      }
      return this.isAdmin ? 'System Administrator' : 'Branch Manager'
    },
    displayLocation() {
      // Show area and location
      if (this.isAdmin) {
        return 'System Administration'
      }
      if (this.currentUserData?.area && this.currentUserData?.location) {
        return `${this.currentUserData.area}`
      }
      return ''
    },
    displayLocationText() {
      // Show formatted location text for the new design
      if (this.isAdmin) {
        return 'System Administration'
      }
      
      // For employees, prioritize branch name
      if (this.isEmployee) {
        return this.currentUserData?.branchName || this.currentUserData?.branch_name || 'Branch Location'
      }
      
      // For branch managers, show area - location format
      if (this.currentUserData?.area && this.currentUserData?.location) {
        return `${this.currentUserData.area} - ${this.currentUserData.location}`
      }
      
      // Fallback to branch name if available
      if (this.currentUserData?.branchName) {
        return this.currentUserData.branchName
      }
      
      return 'Branch Location' // Final fallback
    },
    defaultEmail() {
      // Use actual user email if available, otherwise fall back to role-based defaults
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      if (currentUser.email) {
        return currentUser.email
      }
      
      // Default email based on user type
      if (this.isAdmin) {
        return 'admin@nagastall.com'
      } else if (this.isEmployee) {
        return 'employee@nagastall.com'
      } else {
        return 'manager@nagastall.com'
      }
    },
  },
  watch: {
    userType: {
      handler(newUserType, oldUserType) {
        if (newUserType !== oldUserType) {
          console.log('🔄 User type changed, refreshing user data:', { oldUserType, newUserType })
          this.fetchUserData()
        }
      },
      immediate: false
    }
  },
  methods: {
    // Method to fetch user data based on user type
    async fetchUserData() {
      // First try to get data from session storage (stored during login)
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      
      if (Object.keys(currentUser).length > 0) {
        console.log('✅ Using stored user data from session:', currentUser)
        console.log('🔍 Branch data in currentUser:', {
          branchId: currentUser.branchId,
          branchName: currentUser.branchName,
          branch_name: currentUser.branch_name,
          branch: currentUser.branch
        })
        
        // Use the stored user data directly
        if (this.isAdmin) {
          this.adminData = {
            username: currentUser.username || 'admin',
            fullName: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Administrator',
            email: currentUser.email || 'admin@nagastall.com',
            role: 'System Administrator'
          }
        } else if (this.isEmployee) {
          // Get branch name from various possible sources
          const branchName = currentUser.branchName || currentUser.branch_name || currentUser.branch?.branch_name || currentUser.branch?.name || null
          
          this.employeeData = {
            username: currentUser.username || currentUser.employee_username || 'employee',
            fullName: currentUser.fullName || `${currentUser.firstName || currentUser.first_name || ''} ${currentUser.lastName || currentUser.last_name || ''}`.trim() || 'Employee User',
            email: currentUser.email || 'employee@nagastall.com',
            designation: 'Employee',
            area: branchName || 'Branch Employee',
            location: branchName || '',
            branchName: branchName || 'Branch Location',
            permissions: currentUser.permissions || []
          }
          
          console.log('✅ Final Employee Data:', this.employeeData)
        } else {
          // Branch Manager
          // Get branch name from various possible sources
          const branchName = currentUser.branchName || currentUser.branch_name || currentUser.branch?.branch_name || currentUser.branch?.name || null
          
          this.branchManagerData = {
            username: currentUser.username || currentUser.manager_username || 'manager',
            fullName: currentUser.fullName || `${currentUser.firstName || currentUser.first_name || ''} ${currentUser.lastName || currentUser.last_name || ''}`.trim() || 'Branch Manager',
            email: currentUser.email || 'manager@nagastall.com',
            area: branchName || currentUser.area || null,
            location: currentUser.location || null,
            designation: branchName || (currentUser.area && currentUser.location ? `${currentUser.area} - ${currentUser.location}` : null),
            branchId: currentUser.branchId || currentUser.branch_id || currentUser.branch?.id,
            branchName: branchName
          }
        }
        
        return
      }
      
      // Fallback to API calls if no session data available
      if (this.isAdmin) {
        await this.fetchAdminData()
      } else if (this.isEmployee) {
        await this.fetchEmployeeData()
      } else {
        await this.fetchBranchManagerData()
      }
    },

    // Method to fetch admin data
    async fetchAdminData() {
      try {
        this.loading = true
        this.error = null

        console.log('🔍 Loading admin data...')

        // First try to get from session storage
        const storedAdminData = sessionStorage.getItem('adminData')
        if (storedAdminData) {
          try {
            this.adminData = JSON.parse(storedAdminData)
            console.log('✅ Admin data loaded from storage:', this.adminData)
            this.loading = false
            return
          } catch (parseError) {
            console.warn('Error parsing stored admin data:', parseError)
          }
        }

        // If no stored data, fetch from API
        const token = sessionStorage.getItem('authToken')
        if (!token) {
          console.warn('⚠️ No authentication token found')
          this.error = 'No authentication token found'
          return
        }

        console.log('📡 Fetching admin data from server...')

        const response = await axios.get(`${API_BASE_URL_WITH_API}/auth/admin-info`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        })

        if (response.data && response.data.success && response.data.admin) {
          this.adminData = response.data.admin
          console.log('✅ Admin data loaded from API:', this.adminData)

          // Store in sessionStorage for quick access
          sessionStorage.setItem('adminData', JSON.stringify(this.adminData))
        } else {
          console.warn('⚠️ No admin data found in response')
          this.error = 'Admin data not available'
        }
      } catch (error) {
        console.error('❌ Failed to fetch admin data:', error)

        if (error.response?.status === 401) {
          this.error = 'Authentication expired. Please login again.'
          // Clear invalid token
          sessionStorage.removeItem('authToken')
          localStorage.removeItem('authToken')
          // Redirect to login
          this.$router.push('/')
        } else if (error.response?.status === 403) {
          this.error = 'Access denied. Admin role required.'
        } else if (error.code === 'ECONNABORTED') {
          this.error = 'Request timeout. Please try again.'
        } else {
          this.error = 'Failed to load admin information'
        }

        // Try to use stored data as fallback
        const storedData = sessionStorage.getItem('adminData')
        if (storedData) {
          try {
            this.adminData = JSON.parse(storedData)
            console.log('📦 Using stored admin data as fallback')
            this.error = null
          } catch (parseError) {
            console.error('Error parsing stored admin data:', parseError)
          }
        }
      } finally {
        this.loading = false
      }
    },

    // Method to fetch employee data
    async fetchEmployeeData() {
      try {
        this.loading = true
        this.error = null

        console.log('🔍 Loading employee data...')

        // Get employee data from session storage (stored during login)
        const storedCurrentUser = sessionStorage.getItem('currentUser')
        if (storedCurrentUser) {
          try {
            const userData = JSON.parse(storedCurrentUser)
            if (userData.userType === 'employee') {
              // Get branch name from various possible sources
              const branchName = userData.branchName || userData.branch_name || userData.branch?.branch_name || userData.branch?.name || null
              
              this.employeeData = {
                username: userData.employee_username || userData.username,
                fullName:
                  `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim(),
                email: userData.email || 'employee@nagastall.com',
                designation: 'Employee',
                area: branchName || 'Branch Employee',
                location: branchName || '',
                branchName: branchName || 'Branch Location',
                permissions: userData.permissions || [],
              }
              console.log('✅ Employee data loaded from storage:', this.employeeData)
              this.loading = false
              return
            }
          } catch (parseError) {
            console.warn('Error parsing stored employee data:', parseError)
          }
        }

        // If no stored data, try fetching from API
        const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
        
        if (token) {
          try {
            console.log('📡 Fetching employee data from server...')
            const response = await axios.get(`${API_BASE_URL_WITH_API}/auth/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            })
            
            if (response.data && response.data.success && response.data.employee) {
              const empData = response.data.employee
              // Get branch name from various possible sources
              const branchName = empData.branchName || empData.branch_name || empData.branch?.branch_name || empData.branch?.name || null
              
              this.employeeData = {
                username: empData.employee_username || empData.username,
                fullName: `${empData.first_name || ''} ${empData.last_name || ''}`.trim(),
                email: empData.email || 'employee@nagastall.com',
                designation: 'Employee',
                area: branchName || 'Branch Employee',
                location: branchName || '',
                branchName: branchName || 'Branch Location',
                permissions: empData.permissions || [],
              }
              console.log('✅ Employee data loaded from API:', this.employeeData)
              this.loading = false
              return
            }
          } catch (apiError) {
            console.warn('Failed to fetch employee data from API:', apiError)
          }
        }

        // If no stored data or API fetch failed, create default employee data
        this.employeeData = {
          username: 'employee',
          fullName: 'Employee User',
          email: 'employee@nagastall.com',
          designation: 'Employee',
          area: 'System Employee',
          location: '',
          branchName: 'Branch Location',
          permissions: [],
        }
        console.log('📦 Using default employee data')
      } catch (error) {
        console.error('❌ Failed to fetch employee data:', error)
        this.error = 'Failed to load employee information'
      } finally {
        this.loading = false
      }
    },

    // Method to fetch branch manager data
    async fetchBranchManagerData() {
      try {
        this.loading = true
        this.error = null

        console.log('🔍 Fetching branch manager data...')

        // Get the token from storage
        const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')

        if (!token) {
          console.warn('⚠️ No authentication token found')
          this.error = 'No authentication token found'
          return
        }

        // Set up axios headers
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }

        // Make request to the new branch manager info endpoint
        const response = await axios.get(
          `${API_BASE_URL_WITH_API}/auth/branch-manager-info`,
          config,
        )

        if (response.data.success && response.data.branchManager) {
          this.branchManagerData = response.data.branchManager
          console.log('✅ Branch manager data loaded:', this.branchManagerData)

          // Store in sessionStorage for quick access
          sessionStorage.setItem('branchManagerData', JSON.stringify(this.branchManagerData))
        } else {
          console.warn('⚠️ No branch manager data found')
          this.error = 'Branch manager data not found'
        }
      } catch (error) {
        console.error('❌ Failed to fetch branch manager data:', error)

        if (error.response?.status === 401) {
          this.error = 'Authentication expired. Please login again.'
          // Clear invalid token
          sessionStorage.removeItem('authToken')
          localStorage.removeItem('authToken')
          // Redirect to login
          this.$router.push('/')
        } else if (error.response?.status === 403) {
          this.error = 'Access denied. Branch manager role required.'
        } else {
          this.error = 'Failed to load branch manager information'
        }

        // Try to use stored data as fallback
        const storedData = sessionStorage.getItem('branchManagerData')
        if (storedData) {
          try {
            this.branchManagerData = JSON.parse(storedData)
            console.log('📦 Using stored branch manager data as fallback')
            this.error = null
          } catch (parseError) {
            console.error('Error parsing stored branch manager data:', parseError)
          }
        }
      } finally {
        this.loading = false
      }
    },

    handleNotificationClick() {
      console.log('Notification clicked')
      this.$emit('notification-click')
    },

    handleProfileClick() {
      console.log('Profile clicked')
      this.closeProfilePopup()
      this.$emit('profile-click')
    },

    handleSettingsClick() {
      console.log('Settings clicked')
      this.closeProfilePopup()
      this.$emit('settings-click')
    },

    async handleLogoutClick() {
      console.log('Logout clicked')
      this.closeProfilePopup()

      // Clear any stored user data
      sessionStorage.removeItem('currentUser')
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('userType')
      sessionStorage.removeItem('branchManagerData')
      sessionStorage.removeItem('adminData')
      sessionStorage.removeItem('employeeData')
      sessionStorage.removeItem('branchManagerId')
      sessionStorage.removeItem('employeeId')
      sessionStorage.removeItem('adminId')
      sessionStorage.removeItem('branchId')
      sessionStorage.removeItem('userRole')
      sessionStorage.removeItem('fullName')
      sessionStorage.removeItem('permissions')
      sessionStorage.removeItem('employeePermissions')
      
      localStorage.removeItem('currentUser')
      localStorage.removeItem('authToken')
      localStorage.removeItem('userType')
      localStorage.removeItem('permissions')
      localStorage.removeItem('employeePermissions')
      
      // Clear all session storage completely
      sessionStorage.clear()
      
      // Clear data cache if available
      if (window.dataCacheService) {
        window.dataCacheService.clearAll()
      }

      // Clear axios header
      delete axios.defaults.headers.common['Authorization']

      // Clear component data
      this.branchManagerData = null
      this.adminData = null
      this.employeeData = null

      // Clear Vuex store if you're using it
      if (this.$store && this.$store.dispatch) {
        this.$store.dispatch('auth/logout')
      }

      // Navigate to login page
      this.$router.push('/')

      // Emit logout event
      this.$emit('logout-click')
    },

    toggleProfilePopup() {
      if (this.showProfilePopup) {
        this.closeProfilePopup()
      } else {
        this.openProfilePopup()
      }
    },

    openProfilePopup() {
      this.showProfilePopup = true
      this.$nextTick(() => {
        this.calculatePopupPosition()
      })
    },

    closeProfilePopup() {
      this.showProfilePopup = false
    },

    calculatePopupPosition() {
      const button = this.$refs.profileButton.$el
      const buttonRect = button.getBoundingClientRect()

      this.popupPosition = {
        position: 'fixed',
        top: `${buttonRect.bottom + 8}px`,
        right: `${window.innerWidth - buttonRect.right}px`,
        zIndex: '9999',
      }
    },

    handleClickOutside(event) {
      if (this.showProfilePopup && !this.$refs.profileContainer.contains(event.target)) {
        this.closeProfilePopup()
      }
    },

    // Refresh user data based on user type
    async refreshUserData() {
      console.log('🔄 Refreshing user data...')
      await this.fetchUserData()
    },

    // Force refresh from session storage
    refreshFromSessionStorage() {
      console.log('🔄 Force refreshing from session storage...')
      this.branchManagerData = null
      this.adminData = null
      this.employeeData = null
      this.fetchUserData()
    },

    // Refresh branch manager data (kept for backward compatibility)
    async refreshBranchManagerData() {
      await this.fetchBranchManagerData()
    },

    // Setup authentication for all axios requests
    setupAuthInterceptor() {
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    },
  },

  async mounted() {
    document.addEventListener('click', this.handleClickOutside)

    // Setup authentication
    this.setupAuthInterceptor()

    // Fetch user data based on user type when component mounts
    await this.fetchUserData()
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  },
}
