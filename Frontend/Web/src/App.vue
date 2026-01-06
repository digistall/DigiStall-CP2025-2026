<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script>
export default {
  name: "App",
  
  mounted() {
    // Listen for storage changes (cross-tab login/logout sync)
    window.addEventListener('storage', this.handleStorageChange)
    console.log('✅ App mounted - cross-tab sync listener active')
  },
  
  beforeUnmount() {
    window.removeEventListener('storage', this.handleStorageChange)
  },
  
  methods: {
    handleStorageChange(event) {
      // Only respond to authToken changes
      if (event.key === 'authToken') {
        const currentPath = this.$route.path
        
        // Logout detected (authToken removed)
        if (!event.newValue) {
          console.log('🚪 Cross-tab logout detected in App.vue')
          
          // Only redirect if not already on login page
          if (currentPath !== '/login') {
            console.log('→ Redirecting to login...')
            sessionStorage.clear()
            this.$router.push('/login')
          }
        }
        // Login detected (authToken added)
        else if (event.newValue && currentPath === '/login') {
          console.log('🔐 Cross-tab login detected in App.vue')
          
          // Get user type to determine redirect
          const userData = localStorage.getItem('currentUser')
          if (userData) {
            try {
              const user = JSON.parse(userData)
              console.log('→ Redirecting based on permissions for:', user.userType)
              
              // Smart redirect based on user type and permissions
              let redirectPath = '/app/dashboard'
              
              if (user.userType === 'system_administrator') {
                redirectPath = '/system-admin/dashboard'
              } else if (user.userType === 'business_employee' && user.permissions) {
                const permissions = user.permissions
                const hasPermission = (perm) => {
                  if (Array.isArray(permissions)) return permissions.includes(perm)
                  return permissions[perm] === true
                }
                
                if (!hasPermission('dashboard')) {
                  // Find first available page
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
                      redirectPath = route
                      break
                    }
                  }
                }
              }
              
              this.$router.push(redirectPath)
            } catch (e) {
              console.error('Error parsing user data:', e)
              window.location.reload()
            }
          } else {
            window.location.reload()
          }
        }
      }
    }
  }
};
</script>

<style src="@/assets/css/fonts.css"></style>
<style src="@/assets/css/scrollable-tables.css"></style>
