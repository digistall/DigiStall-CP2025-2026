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

// Handle tab/window close (NOT page refresh)
// Strategy: set a flag in sessionStorage when the page loads.
// On beforeunload, if the flag is present it means the tab is still alive (refresh),
// so we skip the logout. The flag gets wiped on actual tab close.
const PAGE_LOADED_FLAG = 'page_loaded'

// Handle tab/window close
const handleBeforeUnload = () => {
  // Trigger for ALL authenticated users (not just employees/inspectors)
  if (authStore.isAuthenticated && authStore.user) {
    const userType = authStore.user.userType

    // Detect if this is a refresh vs an actual tab close.
    // On refresh: sessionStorage still has the flag we set on mount.
    // On tab close: sessionStorage is about to be wiped (flag was never re-set after last unload).
    const isRefresh = sessionStorage.getItem(PAGE_LOADED_FLAG) === 'true'

    // Remove the flag so next beforeunload (if it's a close) won't see it
    sessionStorage.removeItem(PAGE_LOADED_FLAG)

    if (isRefresh) {
      // This is a page refresh — do NOT log out or clear localStorage
      return
    }

    // This is an actual tab/window close — perform logout cleanup
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

    if (token) {
      const userId = authStore.user.id || authStore.user.userId || authStore.user.employeeId

      // Use URLSearchParams for application/x-www-form-urlencoded
      // Express body-parser handles this much more reliably than Blobs
      const params = new URLSearchParams()
      params.append('userId', userId)
      params.append('userType', userType)

      navigator.sendBeacon(`${apiUrl}/auth/logout`, params)

      // Clear local data synchronously
      localStorage.clear()
      sessionStorage.clear()
    }
  }
}

onMounted(() => {
  // Mark that the page is fully loaded (used to distinguish refresh vs close in beforeunload)
  sessionStorage.setItem(PAGE_LOADED_FLAG, 'true')
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style>
/* Global styles */
</style>
