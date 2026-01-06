<template>
  <Transition name="fade">
    <div v-if="isVisible" class="logout-overlay">
      <div class="logout-background">
        <!-- Gradient overlay matching login loading screen -->
        <div class="gradient-overlay"></div>
        <div class="pattern-overlay"></div>
        
        <div class="logout-content">
          <!-- Logo Section -->
          <div class="logo-section">
            <div class="logo-glow"></div>
            <img
              src="../../../assets/DigiStall-Logo.png"
              alt="DigiStall Logo"
              class="digistall-logo pulse-animation"
            />
          </div>

          <!-- Main Message -->
          <h1 class="loading-title">Logging out...</h1>
          
          <p class="user-name" v-if="userName">Goodbye, {{ userName }}!</p>
          <p class="sub-message">{{ message }}</p>

          <!-- Progress Bar -->
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
            
          <!-- Progress dots -->
          <div class="progress-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>

          <!-- Security Note -->
          <div class="security-note">
            <svg class="shield-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#48bb78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="#48bb78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Securely ending your session</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="loading-footer">
          <p>Naga City Stall Management System</p>
          <p class="powered-by">Powered by DigiStall</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { watch, onUnmounted } from 'vue'

export default {
  name: 'LogoutLoadingScreen',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: 'Please wait while we securely log you out'
    },
    userName: {
      type: String,
      default: ''
    }
  },
  setup(props) {
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

    return {}
  }
}
</script>

<style scoped>
.logout-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
}

.logout-background {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #3182ce 100%);
  z-index: 0;
}

.pattern-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
                    radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.5;
  z-index: 1;
}

.logout-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.logo-section {
  position: relative;
  margin-bottom: 24px;
  animation: slideInDown 0.6s ease-out;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.digistall-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  position: relative;
  filter: drop-shadow(0 4px 20px rgba(0,0,0,0.3));
}

.pulse-animation {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.75rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  animation: slideInDown 0.7s ease-out;
}

.user-name {
  font-size: 1.25rem;
  color: #90cdf4;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  animation: slideInDown 0.75s ease-out;
}

.sub-message {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 2rem 0;
  animation: slideInDown 0.8s ease-out;
}

.progress-container {
  width: 100%;
  max-width: 350px;
  margin-bottom: 2rem;
  animation: scaleIn 0.5s ease-out;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
}

.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #48bb78, #38a169);
  border-radius: 10px;
  animation: progressFill 2s ease-out forwards;
  box-shadow: 0 0 10px rgba(72, 187, 120, 0.5);
}

@keyframes progressFill {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.logout-icon-wrapper {
  margin-bottom: 20px;
  animation: scaleIn 0.6s ease-out;
}

.icon-circle {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.logout-icon {
  width: 32px;
  height: 32px;
  color: white;
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

.spinner-container {
  position: relative;
  margin-bottom: 20px;
}

.spinner {
  width: 45px;
  height: 45px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
}

.dot {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: dotPulse 1.4s ease-in-out infinite;
  opacity: 0.3;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.3;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 300px;
}

.shield-icon {
  width: 18px;
  height: 18px;
}

.security-note span {
  font-size: 0.9rem;
  color: #48bb78;
  font-weight: 500;
}

.loading-footer {
  position: absolute;
  bottom: 30px;
  z-index: 2;
  text-align: center;
}

.loading-footer p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0 0 4px 0;
}

.loading-footer .powered-by {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
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

/* Responsive */
@media (max-width: 480px) {
  .digistall-logo {
    width: 100px;
    height: 100px;
  }

  .loading-title {
    font-size: 1.5rem;
  }

  .user-name {
    font-size: 1.1rem;
  }

  .sub-message {
    font-size: 0.9rem;
  }
}
</style>
