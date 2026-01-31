<template>
  <Transition name="fade">
    <div v-if="isVisible" class="logout-confirm-overlay" @click.self="handleCancel">
      <div class="logout-confirm-container" :class="{ 'slide-in': isVisible }">
        <!-- Logo Section -->
        <div class="logo-section">
          <img
            src="@shared-assets/DigiStall-Logo.png"
            alt="DigiStall Logo"
            class="digistall-logo"
          />
        </div>

        <!-- Icon Section -->
        <div class="icon-section">
          <div class="icon-circle">
            <svg class="logout-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                class="door" 
                d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round"
              />
              <path 
                class="arrow" 
                d="M10 17L15 12L10 7" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
              />
              <path 
                class="line" 
                d="M15 12H3" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round"
              />
            </svg>
          </div>
        </div>

        <!-- Title Section -->
        <div class="title-section">
          <h2 class="confirm-title">Sign Out</h2>
          <p class="confirm-subtitle" v-if="userName">
            Goodbye, <span class="user-name">{{ userName }}</span>!
          </p>
        </div>

        <!-- Message Section -->
        <div class="message-section">
          <p class="confirm-message">
            {{ message }}
          </p>
        </div>

        <!-- Security Note -->
        <div class="security-note">
          <v-icon size="16" color="#27ae60">mdi-shield-check</v-icon>
          <span>Your session will be securely terminated</span>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <v-btn
            class="cancel-btn"
            variant="outlined"
            size="large"
            @click="handleCancel"
            :disabled="isLoading"
          >
            <v-icon left>mdi-close</v-icon>
            Cancel
          </v-btn>
          <v-btn
            class="logout-btn"
            variant="elevated"
            size="large"
            @click="handleConfirm"
            :loading="isLoading"
            :disabled="isLoading"
          >
            <v-icon left>mdi-logout</v-icon>
            {{ isLoading ? 'Signing Out...' : 'Sign Out' }}
          </v-btn>
        </div>

        <!-- Powered By -->
        <div class="powered-by-section">
          <p class="powered-by">Powered by: <span class="brand">DigiStall</span></p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { watch, onUnmounted } from 'vue'

export default {
  name: 'LogoutConfirmationDialog',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: 'Are you sure you want to sign out? You will need to log in again to access your account.'
    },
    userName: {
      type: String,
      default: ''
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    // Prevent scrolling when overlay is visible
    watch(() => props.isVisible, (newVal) => {
      if (newVal) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    })

    onUnmounted(() => {
      document.body.style.overflow = ''
    })

    const handleConfirm = () => {
      emit('confirm')
    }

    const handleCancel = () => {
      if (!props.isLoading) {
        emit('cancel')
      }
    }

    return {
      handleConfirm,
      handleCancel
    }
  }
}
</script>

<style scoped>
.logout-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99998;
}

.logout-confirm-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 450px;
  width: 90%;
  animation: scaleIn 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  margin-bottom: 16px;
}

.digistall-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.icon-section {
  margin-bottom: 20px;
}

.icon-circle {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 50%;
  border: 3px solid #002181;
  box-shadow: 0 4px 12px rgba(0, 33, 129, 0.15);
}

.logout-icon {
  width: 40px;
  height: 40px;
  color: #002181;
}

.logout-icon .door {
  animation: doorPulse 2s ease-in-out infinite;
}

.logout-icon .arrow {
  animation: arrowSlide 1.5s ease-in-out infinite;
}

.logout-icon .line {
  animation: lineSlide 1.5s ease-in-out infinite;
}

@keyframes doorPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes arrowSlide {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

@keyframes lineSlide {
  0%, 100% {
    transform: translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateX(3px);
    opacity: 0.7;
  }
}

.title-section {
  text-align: center;
  margin-bottom: 16px;
}

.confirm-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.confirm-subtitle {
  font-size: 1rem;
  color: #5a6978;
  margin: 0;
}

.user-name {
  color: #002181;
  font-weight: 600;
}

.message-section {
  text-align: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.confirm-message {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(39, 174, 96, 0.1);
  border-radius: 8px;
  margin-bottom: 24px;
}

.security-note span {
  font-size: 0.85rem;
  color: #27ae60;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 16px;
  width: 100%;
  margin-bottom: 20px;
}

.cancel-btn {
  flex: 1;
  height: 48px !important;
  border-radius: 10px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
  border-color: #6c757d !important;
  color: #6c757d !important;
  transition: all 0.3s ease !important;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(108, 117, 125, 0.1) !important;
  border-color: #495057 !important;
  color: #495057 !important;
}

.logout-btn {
  flex: 1;
  height: 48px !important;
  border-radius: 10px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
  background: linear-gradient(135deg, #002181 0%, #1a237e 100%) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(0, 33, 129, 0.3) !important;
  transition: all 0.3s ease !important;
}

.logout-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 33, 129, 0.4) !important;
}

.logout-btn:disabled {
  opacity: 0.7;
}

.powered-by-section {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  width: 100%;
  text-align: center;
}

.powered-by {
  font-size: 0.85rem;
  color: #999;
  margin: 0;
}

.powered-by .brand {
  color: #002181;
  font-weight: 600;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive Styles */
@media (max-width: 480px) {
  .logout-confirm-container {
    padding: 30px 24px;
    margin: 16px;
    width: calc(100% - 32px);
  }

  .action-buttons {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .confirm-title {
    font-size: 1.5rem;
  }

  .digistall-logo {
    width: 60px;
    height: 60px;
  }

  .icon-circle {
    width: 70px;
    height: 70px;
  }

  .logout-icon {
    width: 36px;
    height: 36px;
  }
}
</style>
