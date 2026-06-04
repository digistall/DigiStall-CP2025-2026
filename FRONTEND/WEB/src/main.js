/**
 * FRONTEND - Web Main Entry Point
 * =======================================
 * This file imports from MVC role-based folders
 * All actual code is in the role folders, not here
 */

// Silence verbose logs from console to secure app data
if (typeof window !== 'undefined') {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedState from 'pinia-plugin-persistedstate'
import vuetify from './plugins/vuetify'
import router from './router'
import App from './App.vue'
import './services/fetchInterceptor'
import startTableAutoHeight from './services/tableAutoHeight'

// Create Pinia store
const pinia = createPinia()
pinia.use(piniaPersistedState)

// Create and mount app
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(vuetify)
app.mount('#app')
startTableAutoHeight()
