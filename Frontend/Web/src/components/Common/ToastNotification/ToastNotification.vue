<template>
  <transition name="slide-fade">
    <div 
      v-if="visible" 
      class="toast-notification"
      :class="toastClass"
    >
      <div class="toast-content">
        <v-icon class="toast-icon" :color="iconColor">{{ icon }}</v-icon>
        <span class="toast-message">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ToastNotification',
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
      default: 'success', // success, update, delete, error, warning, info
      validator: (value) => ['success', 'update', 'delete', 'error', 'warning', 'info'].includes(value),
    },
    duration: {
      type: Number,
      default: 3000, // 3 seconds
    },
  },
  data() {
    return {
      visible: false,
      timeout: null,
    }
  },
  computed: {
    toastClass() {
      return `toast-${this.type}`
    },
    icon() {
      const iconMap = {
        success: 'mdi-check-circle',
        update: 'mdi-check-circle',
        delete: 'mdi-delete-circle',
        error: 'mdi-alert-circle',
        warning: 'mdi-alert',
        info: 'mdi-information',
      }
      return iconMap[this.type] || 'mdi-information'
    },
    iconColor() {
      const colorMap = {
        success: '#4caf50',
        update: '#4caf50',
        delete: '#f44336',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3',
      }
      return colorMap[this.type] || '#2196f3'
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.showToast()
      }
    },
  },
  methods: {
    showToast() {
      this.visible = true
      
      // Clear existing timeout
      if (this.timeout) {
        clearTimeout(this.timeout)
      }
      
      // Auto-hide after duration
      this.timeout = setTimeout(() => {
        this.hideToast()
      }, this.duration)
    },
    hideToast() {
      this.visible = false
      
      // Emit close event after transition completes
      setTimeout(() => {
        this.$emit('close')
      }, 300) // Match transition duration
    },
  },
  beforeUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  },
}
</script>

<style scoped>
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px 20px;
  min-width: 280px;
  max-width: 400px;
  pointer-events: auto;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-icon {
  flex-shrink: 0;
}

.toast-message {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 500;
}

/* Type-specific text colors */
.toast-success .toast-message {
  color: #4caf50;
}

.toast-update .toast-message {
  color: #4caf50;
}

.toast-delete .toast-message {
  color: #f44336;
}

.toast-error .toast-message {
  color: #f44336;
}

.toast-warning .toast-message {
  color: #ff9800;
}

.toast-info .toast-message {
  color: #2196f3;
}

/* Slide and fade animation */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .toast-notification {
    bottom: 16px;
    right: 16px;
    left: 16px;
    min-width: auto;
    max-width: none;
  }
}
</style>
