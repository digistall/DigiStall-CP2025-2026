/** * FRONTEND-RUNNER - App.vue * ========================== * Main app component that uses
RouterView * All views are imported from MVC role folders */
<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// Handle tab/window close
const handleBeforeUnload = () => {
  // Only trigger if user is authenticated and is an employee/inspector/collector
  if (authStore.isAuthenticated && authStore.user) {
    const userType = authStore.user.userType
    if (['business_employee', 'inspector', 'collector', 'web_employee'].includes(userType)) {
      // Use sendBeacon for reliable delivery during page unload
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

      if (token) {
        const userId = authStore.user.id || authStore.user.userId || authStore.user.employeeId
        const payload = JSON.stringify({ userId, userType })

        // Use URLSearchParams for application/x-www-form-urlencoded
        // Express body-parser handles this much more reliably than Blobs
        const params = new URLSearchParams()
        params.append('userId', userId)
        params.append('userType', userType)

        navigator.sendBeacon(`${apiUrl}/auth/logout`, params)

        // Also clear local data synchronously
        localStorage.clear()
        sessionStorage.clear()
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style>
/* Global styles */
</style>
