<template>
  <div class="loading-overlay">
    <div class="loading-content">
      <!-- Logo Header - Always visible -->
      <div class="logo-header">
        <img src="@/assets/DigiStall-Logo.png" alt="DigiStall" class="digistall-logo" />
      </div>

      <!-- Preparing State -->
      <div v-if="state === 'preparing'" class="loading-state">
        <div class="loading-icon preparing-icon">
          <div class="spinner-container">
            <div class="spinner-ring-logo"></div>
          </div>
        </div>
        <h3 class="loading-title">Preparing Application</h3>
        <p class="loading-subtitle">Please wait while we prepare your information...</p>
        <div class="progress-bar">
          <div class="progress-fill preparing-progress"></div>
        </div>
      </div>

      <!-- Submitting State -->
      <div v-else-if="state === 'submitting'" class="loading-state">
        <div class="loading-icon submitting-icon">
          <div class="spinner-container">
            <div class="spinner-ring-logo submitting"></div>
          </div>
        </div>
        <h3 class="loading-title">Submitting Application</h3>
        <p class="loading-subtitle">Saving your Application</p>
        <div class="progress-bar">
          <div class="progress-fill submitting-progress"></div>
        </div>
      </div>

      <!-- Success State -->
      <div v-else-if="state === 'success'" class="loading-state">
        <div class="loading-icon success-icon">
          <div class="checkmark-container">
            <svg class="checkmark" viewBox="0 0 52 52">
              <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="m14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>
        <h3 class="loading-title success-title">Congratulations!</h3>
        <p class="loading-subtitle">Your stall application has been submitted successfully!</p>
        <div class="success-details">
          <p>We'll review your application and contact you soon.</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="state === 'error'" class="loading-state">
        <div class="loading-icon error-icon">
          <div class="error-symbol">
            <div class="error-line error-line1"></div>
            <div class="error-line error-line2"></div>
          </div>
        </div>
        <h3 class="loading-title error-title">Oops! Something went wrong</h3>
        <p class="loading-subtitle">{{ errorMessage || 'Failed to submit your application. Please try again.' }}</p>
        <button @click="$emit('retry')" class="retry-button">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ApplicationLoadingOverlay',
  props: {
    state: {
      type: String,
      default: 'preparing', // 'preparing', 'submitting', 'success', 'error'
      validator: value => ['preparing', 'submitting', 'success', 'error'].includes(value)
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['retry']
}
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.loading-content {
  background: white;
  padding: 2.5rem 2rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 420px;
  min-width: 360px;
  position: relative;
  overflow: hidden;
}

.loading-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #002181, #1976D2, #002181);
  background-size: 200% 100%;
  animation: gradient-shift 2s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 0%; }
}

/* Logo Header */
.logo-header {
  margin-bottom: 1.5rem;
}

.digistall-logo {
  width: 120px;
  height: auto;
  object-fit: contain;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
}

.loading-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

/* Spinner with Logo Theme */
.spinner-container {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring-logo {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid #e3e8f0;
  border-top-color: #002181;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-ring-logo.submitting {
  border-top-color: #1976D2;
  border-right-color: #002181;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse-scale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Submitting State Styles */
.submitting-icon {
  animation: pulse-scale 1.5s ease-in-out infinite;
}

/* Success State Styles */
.success-icon {
  animation: success-pop 0.6s ease-out;
}

.checkmark-container {
  width: 60px;
  height: 60px;
}

.checkmark {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #4CAF50;
  stroke-miterlimit: 10;
  box-shadow: inset 0px 0px 0px #4CAF50;
}

.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #4CAF50;
  fill: none;
  animation: checkmark-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkmark-check 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes checkmark-circle {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes checkmark-check {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes success-pop {
  0% {
    transform: scale(0.8);
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

/* Error State Styles */
.error-symbol {
  width: 60px;
  height: 60px;
  border: 3px solid #f44336;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-line {
  position: absolute;
  width: 30px;
  height: 3px;
  background: #f44336;
  border-radius: 2px;
}

.error-line1 {
  transform: rotate(45deg);
}

.error-line2 {
  transform: rotate(-45deg);
}

.error-icon {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Text Styles */
.loading-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  color: #333;
}

.success-title {
  color: #4CAF50;
}

.error-title {
  color: #f44336;
}

.loading-subtitle {
  font-size: 1rem;
  margin: 0;
  color: #666;
  line-height: 1.4;
}

.success-details {
  margin-top: 1rem;
}

.success-details p {
  font-size: 0.9rem;
  color: #888;
  margin: 0;
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.preparing-progress {
  width: 30%;
  background: linear-gradient(90deg, #2196F3, #4CAF50);
  animation: progress-preparing 2s ease-in-out infinite;
}

.submitting-progress {
  width: 80%;
  background: linear-gradient(90deg, #4CAF50, #FF9800);
  animation: progress-submitting 1.5s ease-in-out infinite;
}

@keyframes progress-preparing {
  0%, 100% { width: 30%; }
  50% { width: 50%; }
}

@keyframes progress-submitting {
  0%, 100% { width: 80%; }
  50% { width: 90%; }
}

/* Retry Button */
.retry-button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.retry-button:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.retry-button:active {
  transform: translateY(0);
}
</style>