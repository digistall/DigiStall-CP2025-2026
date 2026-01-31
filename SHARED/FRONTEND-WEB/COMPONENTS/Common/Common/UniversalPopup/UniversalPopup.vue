<template>
  <v-dialog 
    v-model="dialog" 
    persistent 
    max-width="400px"
    @click:outside="closePopup"
  >
    <v-card :class="popupCardClass">
      <div class="popup-content">
        <!-- Close Button -->
        <v-btn 
          icon 
          class="close-btn" 
          @click="closePopup"
          v-if="showCloseButton"
        >
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>

        <!-- Loading State -->
        <div v-if="popupState === 'loading'" class="popup-state">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <p class="popup-text">{{ loadingMessage || getDefaultLoadingMessage() }}</p>
        </div>

        <!-- Success State -->
        <div v-else-if="popupState === 'success'" class="popup-state">
          <div class="success-icon">
            <div class="checkmark-circle">
              <div class="checkmark"></div>
            </div>
          </div>
          <h3 class="success-title">{{ getSuccessTitle() }}</h3>
          <p class="popup-text">{{ message }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="popupState === 'error'" class="popup-state">
          <div class="error-icon">
            <div class="error-circle">
              <v-icon size="40" color="white">mdi-alert-circle</v-icon>
            </div>
          </div>
          <h3 class="error-title">{{ getErrorTitle() }}</h3>
          <p class="popup-text">{{ getUserFriendlyMessage }}</p>
        </div>

        <!-- Warning State -->
        <div v-else-if="popupState === 'warning'" class="popup-state">
          <div class="warning-icon">
            <div class="warning-circle">
              <v-icon size="40" color="white">mdi-alert</v-icon>
            </div>
          </div>
          <h3 class="warning-title">{{ getWarningTitle() }}</h3>
          <p class="popup-text">{{ message }}</p>
        </div>

        <!-- Info State -->
        <div v-else-if="popupState === 'info'" class="popup-state">
          <div class="info-icon">
            <div class="info-circle">
              <v-icon size="40" color="white">mdi-information</v-icon>
            </div>
          </div>
          <h3 class="info-title">{{ getInfoTitle() }}</h3>
          <p class="popup-text">{{ message }}</p>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'UniversalPopup',
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
      default: 'success', // success, error, warning, info, loading
      validator: (value) => ['success', 'error', 'warning', 'info', 'loading'].includes(value),
    },
    operation: {
      type: String,
      default: '', // add, update, delete, or custom message
    },
    operationType: {
      type: String,
      default: '', // stall, employee, stallholder, branch, applicant, etc.
    },
    loadingMessage: {
      type: String,
      default: '',
    },
    showCloseButton: {
      type: Boolean,
      default: true,
    },
    autoClose: {
      type: Boolean,
      default: false,
    },
    autoCloseDelay: {
      type: Number,
      default: 3000,
    }
  },
  data() {
    return {
      dialog: false,
      popupTimeout: null,
    }
  },
  computed: {
    popupState() {
      if (this.type === 'loading') return 'loading'
      if (this.type === 'success') return 'success'
      if (this.type === 'error') return 'error'
      if (this.type === 'warning') return 'warning'
      if (this.type === 'info') return 'info'
      return 'success'
    },
    popupCardClass() {
      return {
        'success-popup-card': this.popupState === 'success',
        'error-popup-card': this.popupState === 'error',
        'warning-popup-card': this.popupState === 'warning',
        'info-popup-card': this.popupState === 'info',
        'loading-popup-card': this.popupState === 'loading',
      }
    },
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
      
      // Default: Clean up the message
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
        console.log('🚀 UniversalPopup opened with:')
        console.log('  - Type:', this.type)
        console.log('  - Operation:', this.operation)
        console.log('  - OperationType:', this.operationType)
        console.log('  - Message:', this.message)

        // Auto close if enabled and not loading
        if (this.autoClose && this.type !== 'loading') {
          this.popupTimeout = setTimeout(() => {
            this.closePopup()
          }, this.autoCloseDelay)
        }
      } else {
        this.clearTimeout()
      }
    },
    dialog(newVal) {
      if (!newVal) {
        this.clearTimeout()
        this.$emit('close')
      }
    },
  },
  methods: {
    closePopup() {
      this.dialog = false
      this.clearTimeout()
      this.$emit('close')
    },
    clearTimeout() {
      if (this.popupTimeout) {
        clearTimeout(this.popupTimeout)
        this.popupTimeout = null
      }
    },
    getDefaultLoadingMessage() {
      if (this.operation && this.operationType) {
        return `${this.operation.charAt(0).toUpperCase() + this.operation.slice(1)}ing ${this.operationType}...`
      }
      return 'Processing...'
    },
    getSuccessTitle() {
      if (this.operation === 'delete' || this.operation === 'deleted') {
        return 'Deleted!'
      }
      if (this.operation === 'update' || this.operation === 'updated') {
        return 'Updated!'
      }
      if (this.operation === 'add' || this.operation === 'added') {
        return 'Added!'
      }
      return 'Success!'
    },
    getErrorTitle() {
      return 'Error'
    },
    getWarningTitle() {
      return 'Warning'
    },
    getInfoTitle() {
      return 'Information'
    }
  },
  beforeUnmount() {
    this.clearTimeout()
  },
}
</script>

<style scoped>
/* Base popup card styles */
.success-popup-card,
.error-popup-card,
.warning-popup-card,
.info-popup-card,
.loading-popup-card {
  border-radius: 20px !important;
  color: white !important;
  position: relative;
  overflow: hidden;
  min-height: 200px;
}

/* Success popup - Green gradient */
.success-popup-card {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%) !important;
}

/* Error popup - Red gradient */
.error-popup-card {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%) !important;
}

/* Warning popup - Orange gradient */
.warning-popup-card {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%) !important;
}

/* Info popup - Blue gradient */
.info-popup-card {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%) !important;
}

/* Loading popup - Primary gradient */
.loading-popup-card {
  background: linear-gradient(135deg, #002181 0%, #001565 100%) !important;
}

.popup-content {
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
}

.close-btn {
  position: absolute !important;
  top: 10px;
  right: 10px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.2) !important;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}

/* Loading Animation */
.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-top: 4px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  top: 10px;
  left: 10px;
  animation-duration: 1s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  width: 40px;
  height: 40px;
  top: 20px;
  left: 20px;
  animation-duration: 0.8s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Success Check Animation */
.success-icon {
  margin-bottom: 20px;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: circle-fill 0.6s ease-in-out;
}

.checkmark {
  width: 24px;
  height: 12px;
  border: 4px solid white;
  border-top: none;
  border-right: none;
  transform: rotate(-45deg);
  animation: checkmark-draw 0.4s ease-in-out 0.2s both;
  opacity: 0;
}

@keyframes circle-fill {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes checkmark-draw {
  0% {
    opacity: 0;
    transform: rotate(-45deg) scale(0);
  }
  100% {
    opacity: 1;
    transform: rotate(-45deg) scale(1);
  }
}

/* Error, Warning, Info Icons */
.error-icon,
.warning-icon,
.info-icon {
  margin-bottom: 20px;
}

.error-circle,
.warning-circle,
.info-circle {
  width: 80px;
  height: 80px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: circle-fill 0.6s ease-in-out;
}

/* Titles */
.success-title,
.error-title,
.warning-title,
.info-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
  animation: fade-in-up 0.6s ease-out 0.4s both;
}

.popup-text {
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.5;
  animation: fade-in-up 0.6s ease-out 0.6s both;
}

@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 0.9;
    transform: translateY(0);
  }
}

/* Popup State Transitions */
.popup-state {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease-in-out;
}

/* Mobile Responsiveness */
@media (max-width: 600px) {
  .popup-content {
    padding: 30px 20px;
  }
  
  .success-title,
  .error-title,
  .warning-title,
  .info-title {
    font-size: 20px;
  }
  
  .popup-text {
    font-size: 14px;
  }
  
  .checkmark-circle,
  .error-circle,
  .warning-circle,
  .info-circle {
    width: 60px;
    height: 60px;
  }
  
  .loading-spinner {
    width: 60px;
    height: 60px;
  }
}
</style>