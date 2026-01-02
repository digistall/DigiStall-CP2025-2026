<template>
  <Transition name="fade">
    <div v-if="isVisible" class="logout-overlay">
      <div class="logout-container">
        <!-- Animated logout icon -->
        <div class="logout-icon-wrapper">
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
        
        <!-- Loading spinner -->
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>
        
        <!-- Text -->
        <div class="logout-text">
          <h2>Logging out...</h2>
          <p>{{ message }}</p>
        </div>
        
        <!-- Progress dots -->
        <div class="progress-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.logout-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 48px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: scaleIn 0.3s ease-out;
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
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-icon {
  width: 64px;
  height: 64px;
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
    transform: translateX(-5px);
  }
}

@keyframes lineSlide {
  0%, 100% {
    transform: translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateX(-5px);
    opacity: 0.7;
  }
}

.spinner-container {
  position: relative;
  width: 50px;
  height: 50px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
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

.logout-text {
  text-align: center;
  color: white;
}

.logout-text h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  animation: textFade 2s ease-in-out infinite;
}

.logout-text p {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
}

@keyframes textFade {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.progress-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: dotPulse 1.4s ease-in-out infinite;
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
    background: rgba(255, 255, 255, 0.5);
  }
  40% {
    transform: scale(1.2);
    background: white;
  }
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
</style>
