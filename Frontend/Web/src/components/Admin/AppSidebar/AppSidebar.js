import { eventBus, EVENTS } from '../../../eventBus.js'

export default {
  name: 'AppSidebar',
  props: {
    items: {
      type: Array,
      default: () => [
        { id: 1, icon: 'mdi-view-dashboard', name: 'Dashboard', route: '/app/dashboard' },
        { id: 2, icon: 'mdi-credit-card', name: 'Payments', route: '/app/payment' },
        { id: 3, icon: 'mdi-account-plus', name: 'Applicants', route: '/app/applicants' },
        { id: 4, icon: 'mdi-chart-line', name: 'Complaints', route: '/app/complaints' },
        {
          id: 5,
          icon: 'mdi-clipboard-check',
          name: 'Compliances',
          route: '/app/compliances',
        },
      ],
    },
  },
  data() {
    return {
      menuItems: [...this.items],
      isExpanded: false,
      showMoreItems: false,
      showStallsSubMenu: false,
      // Track available stall types in current branch
      availableStallTypes: {
        hasRaffles: false,
        hasAuctions: false,
      },
      // API configuration
      apiBaseUrl: (() => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      })(),
      moreItems: [
        {
          id: 6,
          icon: 'mdi-account-tie',
          name: 'Employees',
          route: '/app/employees',
          description: 'Manage employee accounts and permissions',
        },
        { id: 7, icon: 'mdi-account-group', name: 'Vendors', route: '/app/vendors' },
        {
          id: 8,
          icon: 'mdi-account-multiple',
          name: 'Stallholders',
          route: '/app/stallholders',
        },
        {
          id: 9,
          icon: 'mdi-store',
          name: 'Stalls',
          route: '/app/stalls',
          hasSubMenu: true,
          subItems: [
            {
              id: 91,
              icon: 'mdi-ticket-percent',
              name: 'Raffles',
              route: '/app/stalls/raffles',
              type: 'raffle',
            },
            {
              id: 92,
              icon: 'mdi-gavel',
              name: 'Auctions',
              route: '/app/stalls/auctions',
              type: 'auction',
            },
          ],
        },
        { id: 10, icon: 'mdi-account-cash', name: 'Collectors', route: '/app/collectors' },
      ],
    }
  },
  computed: {
    // Check if current user is admin
    isAdmin() {
      const userType = sessionStorage.getItem('userType')
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      return userType === 'admin' || currentUser.userType === 'admin'
    },

    // Check if current user is employee
    isEmployee() {
      const userType = sessionStorage.getItem('userType')
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      return userType === 'employee' || currentUser.userType === 'employee'
    },

    // Get current user permissions - Return as object { permission: true/false }
    userPermissions() {
      const userType = sessionStorage.getItem('userType')

      if (userType === 'employee') {
        // Try to get permissions from currentUser first (most reliable)
        const currentUser = sessionStorage.getItem('currentUser')
        if (currentUser) {
          try {
            const user = JSON.parse(currentUser)
            if (user.permissions) {
              console.log('🆕 Using permissions from currentUser:', user.permissions)
              return user.permissions
            }
          } catch (error) {
            console.error('Error parsing currentUser:', error)
          }
        }

        // Fallback: Try permissions key
        const permissions = sessionStorage.getItem('permissions')
        if (permissions) {
          try {
            const permObj = JSON.parse(permissions)
            console.log('🔄 Using permissions from storage:', permObj)
            return permObj
          } catch (error) {
            console.error('Error parsing permissions:', error)
          }
        }

        // Fallback: Try employeePermissions key
        const employeePermissions = sessionStorage.getItem('employeePermissions')
        if (employeePermissions) {
          try {
            const empPerms = JSON.parse(employeePermissions)
            console.log('🔄 Using employeePermissions:', empPerms)
            return empPerms
          } catch (error) {
            console.error('Error parsing employeePermissions:', error)
          }
        }

        return {}
      } else {
        // For other users, get from currentUser
        const currentUser = sessionStorage.getItem('currentUser')
        try {
          const user = currentUser ? JSON.parse(currentUser) : {}
          return user.permissions || {}
        } catch (error) {
          console.error('Error parsing current user:', error)
          return {}
        }
      }
    },

    // Check if user is branch manager (has access to everything)
    isBranchManager() {
      const userType = sessionStorage.getItem('userType')
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      return (
        userType === 'branch_manager' ||
        currentUser.userType === 'branch_manager' ||
        userType === 'branch-manager' ||
        currentUser.userType === 'branch-manager' ||
        this.isAdmin
      )
    },

    // Check if user has any stalls-related permission
    hasStallsPermission() {
      if (this.isBranchManager || this.isAdmin) return true
      
      const perms = this.userPermissions
      
      // Handle both array and object formats
      if (Array.isArray(perms)) {
        return perms.includes('read_stalls') || perms.includes('write_stalls') || perms.includes('stalls')
      } else {
        // Object format
        return perms.read_stalls === true || perms.write_stalls === true || perms.stalls === true
      }
    },

    // Filter sidebar items based on user permissions
    filteredMoreItems() {
      console.log('🔍 Filtering sidebar items...')
      console.log('User type:', sessionStorage.getItem('userType'))
      console.log('Employee permissions raw:', sessionStorage.getItem('employeePermissions'))
      console.log('Permissions raw:', sessionStorage.getItem('permissions'))
      console.log('Is branch manager:', this.isBranchManager)
      console.log('User permissions computed:', this.userPermissions)

      if (this.isBranchManager) {
        console.log('✅ Branch manager - showing all items')
        return this.moreItems // Branch managers see everything
      }

      const filteredItems = this.moreItems.filter((item) => {
        // Map sidebar items to their required permissions
        const permissionMap = {
          6: 'employees', // Employees (only branch managers should see this)
          7: 'vendors', // Vendors
          8: 'stallholders', // Stallholders
          9: 'stalls', // Stalls (check read_stalls or write_stalls)
          10: 'collectors', // Collectors
        }

        const requiredPermission = permissionMap[item.id]

        // If no permission mapping, show to everyone (fallback)
        if (!requiredPermission) return true

        // Hide employees section from non-managers (employees section is only for branch managers)
        if (item.id === 6) return this.isBranchManager

        // Special handling for stalls - check for read_stalls or write_stalls
        if (item.id === 9) {
          const hasStalls = this.hasStallsPermission
          console.log(`🏪 Stalls permission check: ${hasStalls}`)
          return hasStalls
        }

        // Check if user has the required permission (handle both array and object formats)
        let hasPermission = false
        if (Array.isArray(this.userPermissions)) {
          hasPermission = this.userPermissions.includes(requiredPermission)
        } else {
          hasPermission = this.userPermissions[requiredPermission] === true
        }
        
        console.log(
          `Item ${item.name} (ID: ${item.id}) - Required: ${requiredPermission}, Has permission: ${hasPermission}`,
        )
        return hasPermission
      })

      console.log(
        '✅ Filtered items:',
        filteredItems.map((item) => item.name),
      )
      return filteredItems
    },

    // Get filtered submenu items based on available stall types
    filteredStallSubItems() {
      const stallsItem = this.moreItems.find((item) => item.id === 9)
      if (!stallsItem || !stallsItem.subItems) return []

      return stallsItem.subItems.filter((subItem) => {
        if (subItem.type === 'raffle') {
          return this.availableStallTypes.hasRaffles
        }
        if (subItem.type === 'auction') {
          return this.availableStallTypes.hasAuctions
        }
        return true // Show other items by default
      })
    },
  },
  watch: {
    items: {
      handler(newItems) {
        this.menuItems = [...newItems]
      },
      deep: true,
    },
    // Watch for route changes to update active state
    $route: {
      handler() {
        this.updateActiveStates()
        // Refresh stall types when navigating to/from stalls pages
        if (this.$route.path.includes('/stalls')) {
          // Only check if user has permission
          if (this.hasStallsPermission) {
            this.checkAvailableStallTypes()
          }
        }
      },
      immediate: true,
    },
  },

  // Lifecycle hook to check stall types when component mounts
  async mounted() {
    // Add a delay and proper authentication check before making API calls
    setTimeout(async () => {
      // Only proceed if user is authenticated and has necessary permissions
      const token = sessionStorage.getItem('authToken')
      const userType = sessionStorage.getItem('userType')

      if (!token || !userType) {
        console.log('⏭️ Skipping stall types check - no authentication data')
        return
      }

      // Additional validation for JWT token format
      if (!token.includes('.') || token.split('.').length !== 3) {
        console.log('⏭️ Skipping stall types check - invalid token format')
        return
      }

      console.log('✅ Authentication validated, proceeding with stall types check')
      await this.checkAvailableStallTypes()
    }, 500) // Increased delay to ensure login process completes

    // Listen for stall events to update sidebar in real-time
    eventBus.on(EVENTS.STALL_ADDED, this.handleStallEvent)
    eventBus.on(EVENTS.STALL_DELETED, this.handleStallEvent)
    eventBus.on(EVENTS.STALL_UPDATED, this.handleStallEvent)
    
    // Listen for storage changes (cross-tab logout sync)
    window.addEventListener('storage', this.handleStorageChange)
  },

  // Cleanup event listeners when component is destroyed
  beforeUnmount() {
    eventBus.off(EVENTS.STALL_ADDED, this.handleStallEvent)
    eventBus.off(EVENTS.STALL_DELETED, this.handleStallEvent)
    eventBus.off(EVENTS.STALL_UPDATED, this.handleStallEvent)
    window.removeEventListener('storage', this.handleStorageChange)
  },

  methods: {
    // Check what stall types are available in the current branch
    async checkAvailableStallTypes() {
      try {
        console.log('🔍 Checking stall types permissions...')

        // Wait a bit to ensure sessionStorage is populated
        const userType = sessionStorage.getItem('userType')
        const employeePermissions = sessionStorage.getItem('employeePermissions')
        const authToken = sessionStorage.getItem('authToken')

        console.log('🔍 Debug sessionStorage:')
        console.log('  - userType:', userType)
        console.log('  - employeePermissions:', employeePermissions)
        console.log('  - authToken exists:', !!authToken)
        console.log(
          '  - authToken preview:',
          authToken ? authToken.substring(0, 20) + '...' : 'null',
        )

        // Early exit if no authentication data
        if (!userType || !authToken) {
          console.log('❌ No authentication data found, skipping stall type check')
          console.log('   - userType:', userType)
          console.log('   - authToken exists:', !!authToken)
          this.logAuthState()
          return
        }

        // Validate JWT token format
        if (!authToken.includes('.') || authToken.split('.').length !== 3) {
          console.log('❌ Invalid JWT token format, skipping stall type check')
          console.log('   - Token:', authToken)
          this.logAuthState()
          return
        }

        console.log('User permissions:', this.userPermissions)
        console.log('Is branch manager:', this.isBranchManager)
        console.log('Has stalls permission:', this.hasStallsPermission)

        // EXTRA DEFENSIVE CHECK: If this is an employee, double-check permissions
        if (userType === 'employee') {
          // Check new format first
          const permissions = sessionStorage.getItem('permissions')
          if (permissions) {
            try {
              const permObj = JSON.parse(permissions)
              if (permObj.stalls !== true) {
                console.log(
                  '❌ EMPLOYEE BLOCK: Employee does not have stalls permission (new format)',
                )
                this.availableStallTypes.hasRaffles = false
                this.availableStallTypes.hasAuctions = false
                return
              }
            } catch (error) {
              console.error('Error parsing new permissions:', error)
            }
          } else {
            // Fallback to old format
            const empPerms = JSON.parse(employeePermissions || '[]')
            console.log('🛡️ EMPLOYEE DEFENSIVE CHECK - Parsed permissions:', empPerms)
            const hasStallsPermission = Array.isArray(empPerms)
              ? empPerms.includes('stalls')
              : empPerms.stalls === true
            if (!hasStallsPermission) {
              console.log(
                '❌ EMPLOYEE BLOCK: Employee does not have stalls permission (old format)',
              )
              this.availableStallTypes.hasRaffles = false
              this.availableStallTypes.hasAuctions = false
              return
            }
          }
        }

        // Only check stall types if user has stalls permission or is a manager
        if (!this.isBranchManager && !this.hasStallsPermission) {
          console.log('❌ User does not have stalls permission, skipping stall type check')
          // Make sure we don't proceed with any API calls
          this.availableStallTypes.hasRaffles = false
          this.availableStallTypes.hasAuctions = false
          return
        }

        const token = sessionStorage.getItem('authToken')
        if (!token) {
          console.log('No auth token, skipping stall type check')
          return
        }

        console.log('✅ User has stalls permission, fetching stall types...')
        console.log('🔑 About to make API call with token:', token.substring(0, 30) + '...')

        const response = await fetch(`${this.apiBaseUrl}/stalls`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          console.log('Failed to fetch stalls for type check:', response.status)
          return
        }

        const result = await response.json()
        if (result.success && result.data) {
          const stalls = result.data

          // Check if there are any raffle or auction stalls
          this.availableStallTypes.hasRaffles = stalls.some(
            (stall) => stall.price_type === 'Raffle' || stall.priceType === 'Raffle',
          )

          this.availableStallTypes.hasAuctions = stalls.some(
            (stall) => stall.price_type === 'Auction' || stall.priceType === 'Auction',
          )

          console.log('Available stall types:', this.availableStallTypes)
        }
      } catch (error) {
        console.error('Error checking stall types:', error)
        // Fallback: show both options if we can't determine
        this.availableStallTypes.hasRaffles = true
        this.availableStallTypes.hasAuctions = true
      }
    },

    toggleSidebar() {
      this.isExpanded = !this.isExpanded
      if (!this.isExpanded) {
        this.showMoreItems = false
      }
    },

    toggleMoreItems() {
      this.showMoreItems = !this.showMoreItems
      // Close stalls submenu when more items is collapsed
      if (!this.showMoreItems) {
        this.showStallsSubMenu = false
      }
    },

    // Toggle stalls submenu
    toggleStallsSubMenu() {
      this.showStallsSubMenu = !this.showStallsSubMenu
    },

    setActiveItem(itemId, route, hasSubMenu = false) {
      console.log('🔧 Sidebar setActiveItem called:', { itemId, route, hasSubMenu })

      // Handle stalls menu item with submenu
      if (itemId === 9 && hasSubMenu) {
        console.log('🔧 Handling stalls submenu for ID 9')
        // Only toggle submenu if there are raffle/auction stalls available
        if (this.availableStallTypes.hasRaffles || this.availableStallTypes.hasAuctions) {
          this.toggleStallsSubMenu()
        }
        // Always navigate to main stalls page
        if (route && this.$route.path !== route) {
          console.log('🔧 Navigating to stalls route:', route)
          this.$router.push(route).catch((err) => {
            console.log('Navigation handled:', err.message)
          })
        }
        return
      }

      // Navigate to the route for regular items
      if (route && this.$route.path !== route) {
        console.log('🔧 Navigating to route:', route, 'for item ID:', itemId)
        this.$router.push(route).catch((err) => {
          console.log('Navigation handled:', err.message)
        })
      } else {
        console.log('🔧 Already on route:', route)
      }

      // Close more items if a main item is selected
      const isMainItem = this.menuItems.find((item) => item.id === itemId)
      if (isMainItem) {
        this.showMoreItems = false
        this.showStallsSubMenu = false
      }

      // Emit the navigation event to parent
      console.log('🔧 Emitting menu-item-click:', itemId, route)
      this.$emit('menu-item-click', itemId, route)
    },

    // Check if the current route matches the item route
    isActiveRoute(route) {
      return this.$route.path === route
    },

    // Update active states based on current route
    updateActiveStates() {
      // This method is called when route changes
      // The active state is now determined by isActiveRoute method
      // which compares current route with item route
    },

    // Method to refresh stall types (can be called from parent components)
    async refreshStallTypes() {
      await this.checkAvailableStallTypes()
    },

        // Handle stall events from event bus for real-time updates
    async handleStallEvent(eventData) {
      console.log('Sidebar received stall event:', eventData)
      // Refresh stall types when any stall is added, deleted, or updated
      await this.checkAvailableStallTypes()
    },

    // Handle storage changes from other tabs (cross-tab sync)
    handleStorageChange(event) {
      console.log('🔄 Storage change detected:', event.key)
      
      // Check if authToken was removed (logout in another tab)
      if (event.key === 'authToken' && !event.newValue) {
        console.log('🚪 Logout detected from another tab - redirecting to login...')
        
        // Clear all session data
        sessionStorage.clear()
        localStorage.clear()
        
        // Redirect to login
        window.location.href = '/login'
      }
      
      // Check if new login detected in another tab
      if (event.key === 'authToken' && event.newValue) {
        console.log('🔐 Login detected from another tab - reloading page...')
        
        // Reload the page to update the UI with new session
        window.location.reload()
      }
    },

    // Debug helper to log current authentication state
    logAuthState() {
      console.log('🔍 Current Authentication State:')
      console.log('   - userType:', sessionStorage.getItem('userType'))
      console.log('   - authToken exists:', !!sessionStorage.getItem('authToken'))
      console.log(
        '   - authToken preview:',
        sessionStorage.getItem('authToken')?.substring(0, 30) + '...',
      )
      console.log('   - permissions (new):', sessionStorage.getItem('permissions'))
      console.log('   - employeePermissions (old):', sessionStorage.getItem('employeePermissions'))
      console.log('   - currentUser exists:', !!sessionStorage.getItem('currentUser'))
    },
  },
}
