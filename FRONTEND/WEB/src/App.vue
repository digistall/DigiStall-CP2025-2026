/** * FRONTEND - App.vue * ========================== * Main app component that uses RouterView *
All views are imported from MVC role folders */
<template>
  <v-app>
    <router-view />
    <!-- Global Offline Indicator -->
    <v-snackbar
      v-model="isOffline"
      timeout="-1"
      color="error"
      location="top"
      class="offline-snackbar"
      elevation="24"
    >
      <div class="d-flex align-center w-100 justify-center text-subtitle-1 font-weight-bold">
        <v-icon left size="24" class="mr-3">mdi-wifi-off</v-icon>
        No Internet Connection. You are offline.
      </div>
    </v-snackbar>

    <!-- Global Online Indicator -->
    <v-snackbar
      v-model="showOnline"
      :timeout="3000"
      color="success"
      location="top"
      class="online-snackbar"
      elevation="24"
    >
      <div class="d-flex align-center w-100 justify-center text-subtitle-1 font-weight-bold">
        <v-icon left size="24" class="mr-3">mdi-wifi</v-icon>
        Connection Restored
      </div>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// Offline state tracker
const isOffline = ref(!navigator.onLine)
const showOnline = ref(false)

const updateOnlineStatus = () => {
  const wasOffline = isOffline.value
  isOffline.value = !navigator.onLine

  if (wasOffline && !isOffline.value) {
    showOnline.value = true
  }
}

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
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style>
html,
body {
  overflow: hidden !important;
  height: 100%;
}

/* Global styles */
.offline-snackbar,
.online-snackbar {
  z-index: 9999 !important;
}
</style>
