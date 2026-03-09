/** * FRONTEND - App.vue * ========================== * Main app component that uses
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

// Handle tab/window close - always send logout beacon
// On refresh, the user will re-authenticate immediately via stored token,
// and a new heartbeat will start within seconds, so the brief offline blink is negligible.
const handleBeforeUnload = () => {
  if (authStore.isAuthenticated && authStore.user) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

    if (token) {
      const userId = authStore.user.id || authStore.user.userId || authStore.user.employeeId
      const userType = authStore.user.userType

      // Use URLSearchParams for application/x-www-form-urlencoded
      const params = new URLSearchParams()
      params.append('userId', userId)
      params.append('userType', userType)

      navigator.sendBeacon(`${apiUrl}/auth/logout`, params)
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
