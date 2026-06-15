// MVC Role-Based Imports - Import from role folders
import AppHeader from '@/components/AppHeader/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar/AppSidebar.vue'
import LogoutLoadingScreen from '@common/LogoutLoadingScreen/LogoutLoadingScreen.vue'
import LogoutConfirmationDialog from '@common/LogoutConfirmationDialog/LogoutConfirmationDialog.vue'
import { useAuthStore } from '@/stores/authStore'
import { eventBus } from '@eventBus'

export default {
  name: 'MainLayout',
  components: { AppSidebar, AppHeader, LogoutLoadingScreen, LogoutConfirmationDialog },
  data() {
    return {
      pageTitle: 'Dashboard',
      isLoggingOut: false,
      showLogoutConfirm: false,
      currentUserName: '',
      isSidebarExpanded: false,
      // Base menu items - will be updated based on user type
      menuItems: [],
      // Define menu items for different user types
      systemAdministratorMenuItems: [
        { id: 1, icon: 'mdi-view-dashboard', name: 'Dashboard', route: '/system-admin/dashboard', group: 'Activity' },
        { id: 2, icon: 'mdi-account-multiple', name: 'Business Owners', route: '/system-admin/business-owners', group: 'Users' },
        { id: 3, icon: 'mdi-cash-multiple', name: 'Payments', route: '/system-admin/payments', group: 'Operations' },
        { id: 4, icon: 'mdi-chart-box', name: 'Reports', route: '/system-admin/reports', group: 'Operations' },
      ],
      businessOwnerMenuItems: [
        { id: 1, icon: 'mdi-view-dashboard', name: 'Dashboard', route: '/app/dashboard', group: 'Activity' },
        { id: 9, icon: 'mdi-store', name: 'Stalls', route: '/app/stalls', group: 'Stalls' },
        { id: 10, icon: 'mdi-store-search', name: 'Stall Tracker', route: '/app/stall-tracker', group: 'Stalls' },
        { id: 3, icon: 'mdi-account-group', name: 'Applicants', route: '/app/applicants', group: 'Users' },
        { id: 8, icon: 'mdi-account-multiple', name: 'Stallholders', route: '/app/stallholders', group: 'Users' },
        { id: 7, icon: 'mdi-account-group', name: 'Vendors', route: '/app/vendors', group: 'Users' },
        { id: 6, icon: 'mdi-account-tie', name: 'Employees', route: '/app/employees', group: 'Users' },
        { id: 4, icon: 'mdi-chart-line', name: 'Complaints', route: '/app/complaints', group: 'Operations' },
        { id: 5, icon: 'mdi-shield-check', name: 'Compliances', route: '/app/compliances', group: 'Operations' },
        { id: 2, icon: 'mdi-credit-card', name: 'Payment', route: '/app/payment', group: 'Operations' },
        { id: 13, icon: 'mdi-credit-card-outline', name: 'My Subscription', route: '/app/subscription', group: 'Operations' },
        { id: 14, icon: 'mdi-domain', name: 'Branch', route: '/app/branch', group: 'Operations' },
      ],
      businessManagerMenuItems: [
        { id: 1, icon: 'mdi-view-dashboard', name: 'Dashboard', route: '/app/dashboard', group: 'Activity' },
        { id: 9, icon: 'mdi-store', name: 'Stalls', route: '/app/stalls', group: 'Stalls' },
        { id: 10, icon: 'mdi-store-search', name: 'Stall Tracker', route: '/app/stall-tracker', group: 'Stalls' },
        { id: 3, icon: 'mdi-account-group', name: 'Applicants', route: '/app/applicants', group: 'Users' },
        { id: 8, icon: 'mdi-account-multiple', name: 'Stallholders', route: '/app/stallholders', group: 'Users' },
        { id: 7, icon: 'mdi-account-group', name: 'Vendors', route: '/app/vendors', group: 'Users' },
        { id: 6, icon: 'mdi-account-tie', name: 'Employees', route: '/app/employees', group: 'Users' },
        { id: 4, icon: 'mdi-chart-line', name: 'Complaints', route: '/app/complaints', group: 'Operations' },
        { id: 5, icon: 'mdi-shield-check', name: 'Compliances', route: '/app/compliances', group: 'Operations' },
        { id: 2, icon: 'mdi-credit-card', name: 'Payment', route: '/app/payment', group: 'Operations' },
      ],
      // Business Employee menu items based on permissions
      businessEmployeeMenuItems: {
        dashboard: { id: 1, icon: 'mdi-view-dashboard', name: 'Dashboard', route: '/app/dashboard', group: 'Activity' },
        stalls: { id: 9, icon: 'mdi-store', name: 'Stalls', route: '/app/stalls', group: 'Stalls' },
        stallTracker: { id: 10, icon: 'mdi-store-search', name: 'Stall Tracker', route: '/app/stall-tracker', group: 'Stalls' },
        applicants: { id: 3, icon: 'mdi-account-group', name: 'Applicants', route: '/app/applicants', group: 'Users' },
        stallholders: {
          id: 7,
          icon: 'mdi-account-group',
          name: 'Stallholders',
          route: '/app/stallholders',
          group: 'Users'
        },
        vendors: { id: 6, icon: 'mdi-account-multiple', name: 'Vendors', route: '/app/vendors', group: 'Users' },
        complaints: { id: 4, icon: 'mdi-chart-line', name: 'Complaints', route: '/app/complaints', group: 'Operations' },
        compliances: {
          id: 5,
          icon: 'mdi-shield-check',
          name: 'Compliances',
          route: '/app/compliances',
          group: 'Operations'
        },
        payments: { id: 2, icon: 'mdi-credit-card', name: 'Payment', route: '/app/payment', group: 'Operations' },
      },
      // Define all possible menu routes including "more items" (6-10)
      allMenuRoutes: {
        1: '/app/dashboard',
        2: '/app/payment',
        3: '/app/applicants', // For branch manager, will be /app/branch for admin
        4: '/app/complaints',
        5: '/app/compliances',
        6: '/app/employees', // Employee Management
        7: '/app/vendors', // Vendors
        8: '/app/stallholders', // Stallholders
        9: '/app/stalls', // Stalls
        10: '/app/stall-tracker', // Stall Tracker
        12: '/app/compliances', // Compliances (for Business Owner in More)
        13: '/app/subscription', // My Subscription (for Business Owner in More)
      },
    }
  },
  mounted() {
    // Add class to body to control scrollbar (hide body scrollbar when in MainLayout)
    document.body.classList.add('main-layout-active')
    document.documentElement.classList.add('main-layout-active')

    // Ensure any leftover page-level scroll locks are cleared on initial load
    this.resetPageScrollLock()

    this.setMenuItemsBasedOnUserType()
    this.loadCurrentUserName()
    // Listen for sidebar logout event (trigger-logout from eventBus)
    eventBus.on('trigger-logout', this.handleLogoutClick)
  },
  beforeUnmount() {
    // Remove class from body when leaving MainLayout
    document.body.classList.remove('main-layout-active')
    document.documentElement.classList.remove('main-layout-active')

    eventBus.off('trigger-logout', this.handleLogoutClick)
  },
  watch: {
    // update header title on route change
    $route: {
      immediate: true,
      handler(to, from) {
        if (!from || to.path !== from.path) {
          this.resetPageScrollLock()
          if (to.meta && to.meta.hasTable) {
            document.body.classList.add('no-page-scroll')
            document.documentElement.classList.add('no-page-scroll')
          }
        }
        this.pageTitle = to.meta?.title || to.name || 'Dashboard'
        // Also check if user type has changed and update menu items
        this.setMenuItemsBasedOnUserType()
      },
    },
  },
  methods: {
    resetPageScrollLock() {
      try {
        document.body.classList.remove('no-page-scroll')
        document.documentElement.classList.remove('no-page-scroll')
        try {
          const prevHtml = document.documentElement.dataset._prevOverflow || ''
          const prevBody = document.body.dataset._prevOverflow || ''
          document.documentElement.style.overflow = prevHtml
          document.body.style.overflow = prevBody
          delete document.documentElement.dataset._prevOverflow
          delete document.body.dataset._prevOverflow
        } catch { /* empty */ }
      } catch { /* empty */ }
    },
    setMenuItemsBasedOnUserType() {
      const userType = sessionStorage.getItem('userType')
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')

      console.log('🔧 Setting menu items for user type:', userType)

      if (userType === 'system_administrator' || currentUser.userType === 'system_administrator') {
        this.menuItems = [...this.systemAdministratorMenuItems]
        console.log('🔧 System Administrator menu items loaded')
      } else if (userType === 'stall_business_owner' || currentUser.userType === 'stall_business_owner') {
        this.menuItems = [...this.businessOwnerMenuItems]
        // Update routes for business owner - Branch is already at ID 3
        console.log('🔧 Business Owner menu items loaded with features matching Business Manager')
      } else if (userType === 'business_employee') {
        // Business Employee: Show only features based on permissions
        let employeePermissions = JSON.parse(
          sessionStorage.getItem('employeePermissions') || '{}',
        )
        console.log('🔧 Business Employee permissions:', employeePermissions)

        // Helper function to check permission (handles both array and object formats)
        const hasPermission = (perm) => {
          if (Array.isArray(employeePermissions)) {
            return employeePermissions.includes(perm)
          } else {
            return employeePermissions[perm] === true
          }
        }

        this.menuItems = []
        let menuId = 1

        // Always show dashboard for business employees
        if (hasPermission('dashboard')) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.dashboard, id: menuId++ })
        }

        // Add menu items based on permissions
        if (hasPermission('payments')) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.payments, id: menuId++ })
        }
        if (hasPermission('applicants')) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.applicants, id: menuId++ })
        }
        if (hasPermission('complaints')) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.complaints, id: menuId++ })
        }
        if (hasPermission('compliances')) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.compliances, id: menuId++ })
        }
        if (hasPermission('vendors')) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.vendors, id: menuId++ })
        }
        if (hasPermission('stallholders')) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.stallholders, id: menuId++ })
        }
        if (hasPermission('stalls')) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.stalls, id: menuId++ })
          this.menuItems.push({ ...this.businessEmployeeMenuItems.stallTracker, id: menuId++ })
        }
        // NOTE: Collectors and Inspectors are now managed through Employee Management page

        // If no permissions, show only dashboard
        if (this.menuItems.length === 0) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.dashboard, id: 1 })
        }
      } else {
        // Default to business manager menu
        this.menuItems = [...this.businessManagerMenuItems]
        this.allMenuRoutes[3] = '/app/applicants'
      }
    },
    handleMenuItemClick(payload) {
      // Handle both main menu items (1-5) and more items (6-10)
      const itemId = typeof payload === 'object' ? payload.id : payload
      console.log('🔧 MainLayout handleMenuItemClick:', { payload, itemId })

      // First check if it's a main menu item with route property
      const mainItem = this.menuItems.find((i) => i.id === itemId)
      console.log('🔧 Found main item:', mainItem)

      if (mainItem?.route) {
        console.log('🔧 Navigating to main item route:', mainItem.route)
        this.$router.push(mainItem.route)
        return
      }

      // If not found in main items, check the allMenuRoutes for items 6-10
      const route = this.allMenuRoutes[itemId]
      console.log('🔧 AllMenuRoutes lookup for ID', itemId, ':', route)
      console.log('🔧 All available routes:', this.allMenuRoutes)

      if (route) {
        console.log('🔧 MainLayout navigating to:', route)
        this.$router.push(route)
      } else {
        console.warn('No route found for menu item ID:', itemId)
      }
    },
    handleNotificationClick() {
      console.log('Notification clicked')
    },
    handleProfileClick() {
      console.log('Profile clicked')
      this.$router.push('/app/profile')
    },
    handleSettingsClick() {
      console.log('Settings clicked')
    },
    loadCurrentUserName() {
      try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
        this.currentUserName = currentUser.name || currentUser.username || currentUser.firstName || ''
      } catch (error) {
        console.error('Error loading user name:', error)
        this.currentUserName = ''
      }
    },
    handleLogoutClick() {
      console.log('Logout clicked - showing confirmation dialog')
      this.loadCurrentUserName()
      this.showLogoutConfirm = true
    },
    async handleLogoutConfirm() {
      console.log('Logout confirmed - starting logout process')
      
      // Start the logout process - show loading in dialog first
      this.isLoggingOut = true
      
      // Small delay to show loading state in the dialog button
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Close the confirmation dialog
      this.showLogoutConfirm = false
      
      try {
        // Call authStore.logout() which handles API call to update last_logout
        const authStore = useAuthStore()
        await authStore.logout()
        
        // Wait a moment to show the loading screen
        await new Promise(resolve => setTimeout(resolve, 2500))
        
        // Navigate to landing page
        console.log('Navigating to landing page...')
        this.$router.push('/')
      } catch (error) {
        console.error('Logout error:', error)
        // Navigate to landing page anyway
        this.$router.push('/')
      } finally {
        // Reset loading state
        this.isLoggingOut = false
      }
    },

    // NEW: Method to refresh sidebar stall types (can be called when stalls are modified)
    async refreshSidebarStallTypes() {
      if (this.$refs.appSidebar && this.$refs.appSidebar.refreshStallTypes) {
        await this.$refs.appSidebar.refreshStallTypes()
      }
    },

    // Handle sidebar toggle for content responsiveness
    handleSidebarToggle(expanded) {
      console.log('🔧 MainLayout: Sidebar toggle received:', expanded)
      this.isSidebarExpanded = expanded
    },

    // Handle sidebar toggle triggered from header hamburger menu
    handleSidebarToggleInHeader() {
      console.log('🔧 MainLayout: Header-triggered sidebar toggle')
      if (this.$refs.appSidebar) {
        this.$refs.appSidebar.toggleSidebar()
      }
    },
  },
}
