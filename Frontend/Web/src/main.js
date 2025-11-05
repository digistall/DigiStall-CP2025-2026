import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { autoConfigureSecurity } from './config/security.js'

// Configure security settings based on environment
autoConfigureSecurity()

const app = createApp(App)
const pinia = createPinia()

// IMPORTANT: Install Pinia BEFORE router to avoid store initialization errors
app.use(pinia)
app.use(router)
app.use(vuetify)
app.mount('#app')
