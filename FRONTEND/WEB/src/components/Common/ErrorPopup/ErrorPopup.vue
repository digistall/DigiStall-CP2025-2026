<template>
  <v-dialog 
    v-model="dialog" 
    persistent 
    max-width="450"
    transition="dialog-bottom-transition"
  >
    <v-card class="error-popup-card">
      <!-- Red Header for Errors -->
      <div class="popup-header error-header">
        <div class="header-content">
          <v-icon 
            color="white" 
            size="24"
          >
            mdi-alert-circle
          </v-icon>
          <span class="header-title">Error</span>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="closePopup"
          class="header-close-btn"
        >
          <v-icon size="20" color="white">mdi-close</v-icon>
        </v-btn>
      </div>
      
      <!-- White Message Area -->
      <div class="popup-content">
        <div class="message-container">
          <p class="message-text">{{ getUserFriendlyMessage }}</p>
        </div>
        
        <div class="popup-actions">
          <v-btn
            color="error"
            variant="flat"
            @click="closePopup"
            class="action-btn"
            size="large"
          >
            OK
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ErrorPopup',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'error', // error, success, warning, info, primary
      validator: (value) => ['error', 'success', 'warning', 'info', 'primary'].includes(value),
    },
  },
  data() {
    return {
      dialog: false,
    }
  },
  computed: {
    getUserFriendlyMessage() {
      if (!this.message) return 'An error occurred. Please try again.'
      
      const msg = this.message.toLowerCase()
      
      // Handle floors and sections errors
      if (msg.includes('failed to load floors') || msg.includes('no floors') || msg.includes('404')) {
        return 'No floors and sections found! Please create floors and sections first before adding stalls.'
      }
      
      // Handle connection errors
      if (msg.includes('network') || msg.includes('connection') || msg.includes('fetch')) {
        return 'Connection error. Please check your internet connection and try again.'
      }
      
      // Handle authentication errors
      if (msg.includes('login') || msg.includes('unauthorized') || msg.includes('401')) {
        return 'Your session has expired. Please log in again.'
      }
      
      // Handle permission errors
      if (msg.includes('permission') || msg.includes('access denied') || msg.includes('403')) {
        return 'You do not have permission to perform this action.'
      }
      
      // Handle server errors
      if (msg.includes('500') || msg.includes('server error')) {
        return 'Server is temporarily unavailable. Please try again in a few minutes.'
      }
      
      // Handle validation errors
      if (msg.includes('required') || msg.includes('missing')) {
        return 'Please fill in all required fields before continuing.'
      }
      
      // Handle email errors
      if (msg.includes('email')) {
        return 'Please enter a valid email address.'
      }
      
      // Handle duplicate errors
      if (msg.includes('duplicate') || msg.includes('already exists')) {
        return 'This item already exists. Please use a different name or identifier.'
      }
      
      // Default: Clean up the message by removing technical parts
      let cleanMessage = this.message
      
      // Remove JSON formatting
      if (cleanMessage.includes('{"text":')) {
        try {
          const parsed = JSON.parse(cleanMessage)
          cleanMessage = parsed.text || cleanMessage
        // eslint-disable-next-line no-unused-vars
        } catch (_e) {
          // If parsing fails, continue with original message
        }
      }
      
      // Remove technical error codes and stack traces
      cleanMessage = cleanMessage
        .replace(/\{"text":"([^"]+)"[^}]*\}/g, '$1')
        .replace(/Error: /g, '')
        .replace(/\d{3}$/g, '') // Remove HTTP status codes at the end
        .replace(/:\s*\d{3}$/g, '') // Remove ": 404" patterns
        .trim()
      
      // Capitalize first letter and add period if missing
      if (cleanMessage) {
        cleanMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1)
        if (!cleanMessage.endsWith('.') && !cleanMessage.endsWith('!') && !cleanMessage.endsWith('?')) {
          cleanMessage += '.'
        }
      }
      
      return cleanMessage || 'An unexpected error occurred. Please try again.'
    }
  },
  watch: {
    show(newVal) {
      this.dialog = newVal
      if (newVal) {
        console.log('🚨 ErrorPopup opened with:')
        console.log('  - Type:', this.type)
        console.log('  - Message:', this.message)
        console.log('  - Show:', this.show)
      }
    },
    dialog(newVal) {
      if (!newVal) {
        this.$emit('close')
      }
    },
    type(newVal) {
      console.log('🔄 Type changed to:', newVal)
    },
  },
  mounted() {
    console.log('🎯 ErrorPopup mounted with type:', this.type)
  },
  methods: {
    closePopup() {
      this.dialog = false
      this.$emit('close')
    },
  },
}
</script>

<style scoped>
/* Error popup card */
.error-popup-card {
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  border: none !important;
  background: white;
}

/* Header styling */
.popup-header {
  background: #FF5252 !important; /* Always red for errors */
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-header {
  background: #FF5252 !important; /* Red for errors */
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.header-close-btn {
  color: rgba(255, 255, 255, 0.8) !important;
}

.header-close-btn:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* White content area */
.popup-content {
  background: white;
  padding: 24px;
}

.message-container {
  margin-bottom: 24px;
}

.message-text {
  font-size: 1rem;
  line-height: 1.5;
  color: #374151;
  margin: 0;
  font-weight: 400;
}

/* Actions */
.popup-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  min-width: 100px;
  height: 40px;
  font-weight: 600;
  text-transform: none;
  border-radius: 8px;
  font-size: 0.875rem;
}

/* Animation */
.error-popup-card {
  animation: errorSlideIn 0.25s ease-out;
}

@keyframes errorSlideIn {
  from {
    transform: translateY(20px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 600px) {
  .popup-header {
    padding: 16px 20px;
  }
  
  .popup-content {
    padding: 20px;
  }
  
  .header-title {
    font-size: 1.125rem;
  }
}
</style>