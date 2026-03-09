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

    <!-- Global Event Notification Indicator -->
    <v-snackbar
      v-model="showNotification"
      :timeout="5000"
      :color="notificationType"
      location="top"
      class="online-snackbar"
      elevation="24"
    >
      <div class="d-flex align-center w-100 justify-center text-subtitle-1 font-weight-bold">
        <v-icon left size="24" class="mr-3">{{ notificationIcon }}</v-icon>
        {{ notificationMessage }}
      </div>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import offlineSyncService from '@/services/offlineSyncService'
import apiClient from '@/services/apiClient'
import { eventBus, EVENTS } from '@/eventBus'

const authStore = useAuthStore()

// Offline state tracker
const isOffline = ref(!navigator.onLine)
const showOnline = ref(false)

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('info')
const notificationIcon = ref('mdi-information')

const handleNotification = (data) => {
  notificationMessage.value = data.message
  notificationType.value = data.type || 'info'

  if (data.type === 'error') notificationIcon.value = 'mdi-alert-circle'
  else if (data.type === 'success') notificationIcon.value = 'mdi-check-circle'
  else if (data.type === 'warning') notificationIcon.value = 'mdi-alert'
  else notificationIcon.value = 'mdi-information'

  showNotification.value = true
}

const updateOnlineStatus = () => {
  const wasOffline = isOffline.value
  isOffline.value = !navigator.onLine

  if (wasOffline && !isOffline.value) {
    showOnline.value = true

    // Process the offline queue automatically when connection is restored
    if (offlineSyncService && offlineSyncService.hasPendingRequests()) {
      offlineSyncService.processQueue(apiClient)
    } else {
      // If there's no queue but we just came online, we should still refresh current views
      eventBus.emit(EVENTS.DATA_REFRESH)
    }
  }
}

// Handle tab/window close - always send logout beacon
// On refresh, the user will re-authenticate immediately via stored token,
// and a new heartbeat will start within seconds, so the brief offline blink is negligible.
const handleBeforeUnload = (event) => {
  // Check if there are unsynced changes to warn the user before closing tab
  if (offlineSyncService && offlineSyncService.hasPendingRequests()) {
    const message = 'You have unsynced offline changes. If you close this tab, data may be lost.'
    event.preventDefault()
    // Standard required way to show the browser confirmation dialogue
    event.returnValue = message
    return message
  }

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
  eventBus.on(EVENTS.NOTIFICATION, handleNotification)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
  eventBus.off(EVENTS.NOTIFICATION, handleNotification)
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
