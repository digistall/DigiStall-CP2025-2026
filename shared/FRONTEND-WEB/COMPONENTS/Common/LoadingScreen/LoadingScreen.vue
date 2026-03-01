<template>
  <transition name="fade">
    <div v-if="visible" class="loading-screen">
      <!-- Background Gradient -->
      <div class="loading-background">
        <div class="gradient-overlay"></div>
        <div class="pattern-overlay"></div>
      </div>

      <!-- Main Content -->
      <div class="loading-content">
        <!-- Logo Section -->
        <div class="logo-section">
          <div class="logo-glow"></div>
          <img 
            src="@/assets/DigiStall-Logo.png" 
            alt="DigiStall Logo" 
            class="loading-logo"
            :class="{ 'pulse': !showWelcome }"
          />
        </div>

        <!-- Loading State -->
        <transition name="slide-fade" mode="out-in">
          <div v-if="!showWelcome" key="loading" class="loading-state">
            <h1 class="loading-title">{{ currentStep.text }}</h1>
            
            <!-- Progress Bar -->
            <div class="progress-container">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: progressPercent + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ Math.round(progressPercent) }}%</span>
            </div>

            <!-- Loading Steps -->
            <div class="steps-container">
              <div 
                v-for="(step, index) in loadingSteps" 
                :key="index"
                class="step-item"
                :class="{ 
                  'completed': index < currentStepIndex,
                  'active': index === currentStepIndex,
                  'pending': index > currentStepIndex
                }"
              >
                <div class="step-icon">
                  <v-icon v-if="index < currentStepIndex" size="16" color="white">mdi-check</v-icon>
                  <v-icon v-else-if="index === currentStepIndex" size="16" color="white" class="rotating">mdi-loading</v-icon>
                  <v-icon v-else size="16" color="rgba(255,255,255,0.4)">mdi-circle-outline</v-icon>
                </div>
                <span class="step-text">{{ step.label }}</span>
              </div>
            </div>

            <!-- Animated Dots -->
            <div class="loading-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>

          <!-- Welcome State -->
          <div v-else key="welcome" class="welcome-state">
            <!-- Success Checkmark -->
            <div class="success-checkmark">
              <div class="checkmark-circle">
                <v-icon size="48" color="white">mdi-check</v-icon>
              </div>
            </div>

            <h1 class="welcome-title">Welcome Back!</h1>
            <h2 class="welcome-name">{{ userName }}</h2>
            
            <div class="user-info-card">
              <div class="info-row">
                <v-icon size="20" color="#4CAF50">mdi-shield-check</v-icon>
                <span>Account Verified</span>
              </div>
              <div v-if="userRole" class="info-row">
                <v-icon size="20" color="#2196F3">mdi-badge-account</v-icon>
                <span>{{ formatRole(userRole) }}</span>
              </div>
              <div v-if="branchName" class="info-row">
                <v-icon size="20" color="#FF9800">mdi-store</v-icon>
                <span>{{ branchName }}</span>
              </div>
            </div>

            <p class="redirect-text">
              <v-icon size="16" class="rotating" color="rgba(255,255,255,0.8)">mdi-loading</v-icon>
              Preparing your dashboard...
            </p>
          </div>
        </transition>
      </div>

      <!-- Footer -->
      <div class="loading-footer">
        <p>Naga City Stall Management System</p>
        <p class="powered-by">Powered by DigiStall</p>
      </div>
    </div>
  </transition>
</template>

<script>
// ===== LOADING SCREEN WITH REAL-TIME PROGRESS TRACKING =====
// This component now supports both:
// 1. Timer-based fake progress (legacy mode, isRealProgress=false)
// 2. Real-time progress updates from login process (isRealProgress=true)
//
// When isRealProgress=true, the parent component controls:
// - currentLoadingStep: Which step (0-4) is currently executing
// - currentProgress: Actual progress percentage (0-100)
//
// Real progress tracking shows users what's actually happening:
// Step 0: Server Connection (0-20%)
// Step 1: Authentication (20-40%)  
// Step 2: Profile Data Loading (40-80%)
// Step 3: Dashboard Setup (80-95%)
// Step 4: Finalizing (95-100%)
export default {
  name: 'LoadingScreen',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    userName: {
      type: String,
      default: 'User'
    },
    userRole: {
      type: String,
      default: ''
    },
    branchName: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 3000 // 3 seconds
    },
    currentLoadingStep: {
      type: Number,
      default: 0
    },
    currentProgress: {
      type: Number,
      default: 0
    },
    isRealProgress: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentStepIndex: 0,
      progressPercent: 0,
      showWelcome: false,
      loadingSteps: [
        { text: 'Connecting to server...', label: 'Server Connection', icon: 'mdi-server' },
        { text: 'Verifying credentials...', label: 'Authentication', icon: 'mdi-shield-check' },
        { text: 'Loading your profile...', label: 'Profile Data', icon: 'mdi-account' },
        { text: 'Preparing dashboard...', label: 'Dashboard Setup', icon: 'mdi-view-dashboard' },
        { text: 'Almost ready...', label: 'Finalizing', icon: 'mdi-check-circle' },
      ]
    }
  },
  computed: {
    currentStep() {
      return this.loadingSteps[this.currentStepIndex] || this.loadingSteps[0]
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.startLoading()
      } else {
        this.resetState()
      }
    },
    currentLoadingStep(newVal) {
      if (this.isRealProgress && newVal >= 0) {
        this.currentStepIndex = newVal
      }
    },
    currentProgress(newVal) {
      if (this.isRealProgress && newVal >= 0) {
        this.progressPercent = Math.min(newVal, 100)
      }
    }
  },
  methods: {
    startLoading() {
      this.currentStepIndex = 0
      this.progressPercent = 0
      this.showWelcome = false

      // If using real progress, don't run fake timer animations
      if (this.isRealProgress) {
        // Just watch for progress to reach 100%
        const checkComplete = setInterval(() => {
          if (this.progressPercent >= 100) {
            clearInterval(checkComplete)
            // Show welcome after progress completes
            setTimeout(() => {
              this.showWelcome = true
              this.$emit('loading-complete')
            }, 500)
            // Emit ready to navigate after welcome display
            setTimeout(() => {
              this.$emit('ready-to-navigate')
            }, 2500)
          }
        }, 100)
        return
      }

      // Legacy timer-based animation
      const stepDuration = this.duration / this.loadingSteps.length
      const progressInterval = 50 // Update every 50ms

      // Progress bar animation
      const progressTimer = setInterval(() => {
        if (this.progressPercent < 100) {
          this.progressPercent += (100 / (this.duration / progressInterval))
        } else {
          clearInterval(progressTimer)
        }
      }, progressInterval)

      // Step progression
      this.loadingSteps.forEach((_, index) => {
        setTimeout(() => {
          this.currentStepIndex = index
        }, stepDuration * index)
      })

      // Show welcome after loading
      setTimeout(() => {
        this.showWelcome = true
        this.$emit('loading-complete')
      }, this.duration)

      // Emit ready to navigate after welcome display
      setTimeout(() => {
        this.$emit('ready-to-navigate')
      }, this.duration + 2000)
    },

    resetState() {
      this.currentStepIndex = 0
      this.progressPercent = 0
      this.showWelcome = false
    },

    formatRole(role) {
      if (!role) return ''
      return role
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
  },
  mounted() {
    if (this.visible) {
      this.startLoading()
    }
  }
}
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Background */
.loading-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #3182ce 100%);
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
}

/* Content */
.loading-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
}

/* Logo Section */
.logo-section {
  position: relative;
  margin-bottom: 2rem;
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

.loading-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  position: relative;
  filter: drop-shadow(0 4px 20px rgba(0,0,0,0.3));
}

.loading-logo.pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1.5rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

/* Progress Bar */
.progress-container {
  width: 100%;
  max-width: 350px;
  margin-bottom: 2rem;
}

.progress-bar {
  height: 8px;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #38a169);
  border-radius: 10px;
  transition: width 0.1s ease-out;
  box-shadow: 0 0 10px rgba(72, 187, 120, 0.5);
}

.progress-text {
  display: block;
  text-align: right;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.8);
  margin-top: 0.5rem;
}

/* Steps */
.steps-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.step-item.completed {
  background: rgba(72, 187, 120, 0.3);
}

.step-item.active {
  background: rgba(255,255,255,0.2);
  box-shadow: 0 0 15px rgba(255,255,255,0.2);
}

.step-item.pending {
  opacity: 0.5;
}

.step-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
}

.step-item.completed .step-icon {
  background: #48bb78;
}

.step-item.active .step-icon {
  background: rgba(255,255,255,0.3);
}

.step-text {
  font-size: 0.85rem;
  color: white;
}

/* Loading Dots */
.loading-dots {
  display: flex;
  gap: 8px;
  margin-top: 1rem;
}

.dot {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0; }

/* Welcome State */
.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success-checkmark {
  margin-bottom: 1.5rem;
  animation: scaleIn 0.5s ease-out;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #48bb78, #38a169);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(72, 187, 120, 0.5);
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.welcome-name {
  font-size: 1.5rem;
  font-weight: 500;
  color: rgba(255,255,255,0.9);
  margin-bottom: 1.5rem;
}

.user-info-card {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255,255,255,0.2);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: white;
  font-size: 1rem;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.redirect-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255,255,255,0.8);
  font-size: 0.95rem;
}

/* Footer */
.loading-footer {
  position: absolute;
  bottom: 2rem;
  text-align: center;
  z-index: 1;
}

.loading-footer p {
  color: rgba(255,255,255,0.7);
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.loading-footer .powered-by {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
}

/* Animations */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes glow {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes scaleIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.5s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 600px) {
  .loading-logo {
    width: 80px;
    height: 80px;
  }

  .logo-glow {
    width: 120px;
    height: 120px;
  }

  .loading-title {
    font-size: 1.25rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-name {
    font-size: 1.25rem;
  }

  .progress-container {
    max-width: 280px;
  }

  .steps-container {
    gap: 0.5rem;
  }

  .step-item {
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
  }

  .user-info-card {
    padding: 1rem 1.5rem;
  }

  .checkmark-circle {
    width: 60px;
    height: 60px;
  }
}
</style>
