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
              console.log('→ Redirecting to dashboard for:', user.userType)
              this.$router.push('/app/dashboard')
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
