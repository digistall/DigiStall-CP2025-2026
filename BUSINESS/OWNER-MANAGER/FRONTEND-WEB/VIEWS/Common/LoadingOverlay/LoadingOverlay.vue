<template>
  <transition name="fade">
    <div v-if="loading" class="loading-overlay" :class="{ 'full-page': fullPage }">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <img 
            src="@/assets/DigiStall-Logo.png" 
            alt="DigiStall" 
            class="spinner-logo"
          />
        </div>
        <p class="loading-text">{{ text }}</p>
        <div v-if="showProgress" class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'LoadingOverlay',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: 'Loading data...'
    },
    fullPage: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      progressPercent: 0,
      progressInterval: null
    }
  },
  watch: {
    loading(newVal) {
      if (newVal && this.showProgress) {
        this.startProgress()
      } else {
        this.stopProgress()
      }
    }
  },
  methods: {
    startProgress() {
      this.progressPercent = 0
      this.progressInterval = setInterval(() => {
        if (this.progressPercent < 90) {
          this.progressPercent += Math.random() * 15
        }
      }, 300)
    },
    stopProgress() {
      if (this.progressInterval) {
        clearInterval(this.progressInterval)
        this.progressPercent = 100
        setTimeout(() => {
          this.progressPercent = 0
        }, 300)
      }
    }
  },
  beforeUnmount() {
    this.stopProgress()
  }
}
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: inherit;
}

.loading-overlay.full-page {
  position: fixed;
  z-index: 9999;
  border-radius: 0;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid #e0e0e0;
  border-top-color: #002B5B;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  object-fit: contain;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.95); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
}

.loading-text {
  color: #333;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.loading-progress {
  margin-top: 16px;
  width: 200px;
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #002B5B, #0066cc);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
