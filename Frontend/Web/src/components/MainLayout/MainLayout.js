import AppHeader from '../Admin/AppHeader/AppHeader.vue'
import AppSidebar from '../Admin/AppSidebar/AppSidebar.vue'
import LogoutLoadingScreen from '../Common/LogoutLoadingScreen/LogoutLoadingScreen.vue'
import { useAuthStore } from '@/stores/authStore'

export default {
  name: 'MainLayout',
  components: { AppSidebar, AppHeader, LogoutLoadingScreen },
  data() {
    return {
      pageTitle: 'Dashboard',
      isLoggingOut: false,
      // Base menu items - will be updated based on user type
      menuItems: [],
      // Define menu items for different user types
      systemAdministratorMenuItems: [
        { id: 1, icon: 'mdi-view-dashboard', name: 'Dashboard', route: '/system-admin/dashboard' },
        { id: 2, icon: 'mdi-account-multiple', name: 'Business Owners', route: '/system-admin/business-owners' },
        { id: 3, icon: 'mdi-cash-multiple', name: 'Payments', route: '/system-admin/payments' },
        { id: 4, icon: 'mdi-chart-box', name: 'Reports', route: '/system-admin/reports' },
      ],
      businessOwnerMenuItems: [
        { id: 1, icon: 'mdi-view-dashboard', name: 'Dashboard', route: '/app/dashboard' },
        { id: 2, icon: 'mdi-credit-card', name: 'Payment', route: '/app/payment' },
        { id: 3, icon: 'mdi-domain', name: 'Branch', route: '/app/branch' },
        { id: 4, icon: 'mdi-account-group', name: 'Applicants', route: '/app/applicants' },
        { id: 5, icon: 'mdi-chart-line', name: 'Complaints', route: '/app/complaints' },
        { id: 50, icon: 'mdi-shield-check', name: 'Compliances', route: '/app/compliances' },
      ],
      businessManagerMenuItems: [
        { id: 1, icon: 'mdi-view-dashboard', name: 'Dashboard', route: '/app/dashboard' },
        { id: 2, icon: 'mdi-credit-card', name: 'Payment', route: '/app/payment' },
        { id: 3, icon: 'mdi-account-group', name: 'Applicants', route: '/app/applicants' },
        { id: 4, icon: 'mdi-chart-line', name: 'Complaints', route: '/app/complaints' },
        { id: 5, icon: 'mdi-shield-check', name: 'Compliances', route: '/app/compliances' },
      ],
      // Business Employee menu items based on permissions
      businessEmployeeMenuItems: {
        dashboard: { id: 1, icon: 'mdi-view-dashboard', name: 'Dashboard', route: '/app/dashboard' },
        payments: { id: 2, icon: 'mdi-credit-card', name: 'Payment', route: '/app/payment' },
        applicants: { id: 3, icon: 'mdi-account-group', name: 'Applicants', route: '/app/applicants' },
        complaints: { id: 4, icon: 'mdi-chart-line', name: 'Complaints', route: '/app/complaints' },
        compliances: {
          id: 5,
          icon: 'mdi-shield-check',
          name: 'Compliances',
          route: '/app/compliances',
        },
        vendors: { id: 6, icon: 'mdi-account-multiple', name: 'Vendors', route: '/app/vendors' },
        stallholders: {
          id: 7,
          icon: 'mdi-account-group',
          name: 'Stallholders',
          route: '/app/stallholders',
        },
        collectors: { id: 8, icon: 'mdi-account-cash', name: 'Collectors', route: '/app/collectors' },
        stalls: { id: 9, icon: 'mdi-store', name: 'Stalls', route: '/app/stalls' },
      },
      // Define all possible menu routes including "more items" (6-10) and submenu items (91-92)
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
        10: '/app/collectors', // Collectors
        11: '/app/inspectors', // Inspectors
        12: '/app/compliances', // Compliances (for Business Owner in More)
        13: '/app/subscription', // My Subscription (for Business Owner in More)
        // Submenu items for Stalls
        91: '/app/stalls/raffles', // Raffles submenu
        92: '/app/stalls/auctions', // Auctions submenu
      },
    }
  },
  mounted() {
    this.setMenuItemsBasedOnUserType()
  },
  watch: {
    // update header title on route change
    $route: {
      immediate: true,
      handler(to) {
        this.pageTitle = to.meta?.title || to.name || 'Dashboard'
        // Also check if user type has changed and update menu items
        this.setMenuItemsBasedOnUserType()
      },
    },
  },
  methods: {
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
        if (hasPermission('collectors')) {
          this.menuItems.push({ ...this.businessEmployeeMenuItems.collectors, id: menuId++ })
        }
        // NOTE: Stalls menu is handled separately in AppSidebar.vue for business employees
        // because it needs special submenu handling (Raffles/Auctions)
        // Do NOT add stalls to menuItems here for business employees

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
    },
    handleSettingsClick() {
      console.log('Settings clicked')
    },
    async handleLogoutClick() {
      console.log('Logout clicked - showing loading screen and calling authStore.logout()')
      
      // Show logout loading screen
      this.isLoggingOut = true
      
      try {
        // Call authStore.logout() which handles API call to update last_logout
        const authStore = useAuthStore()
        await authStore.logout()
        
        // Small delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Redirect to login page
        this.$router.push('/').catch(() => {
          window.location.href = '/'
        })
      } catch (error) {
        console.error('Logout error:', error)
        // Still redirect even on error
        this.$router.push('/').catch(() => {
          window.location.href = '/'
        })
      } finally {
        // Hide loading screen (in case redirect doesn't happen immediately)
        setTimeout(() => {
          this.isLoggingOut = false
        }, 500)
      }
    },

    // NEW: Method to refresh sidebar stall types (can be called when stalls are modified)
    async refreshSidebarStallTypes() {
      if (this.$refs.appSidebar && this.$refs.appSidebar.refreshStallTypes) {
        await this.$refs.appSidebar.refreshStallTypes()
      }
    },
  },
}
