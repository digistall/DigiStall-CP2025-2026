<template>
  <div class="loading-overlay">
    <div class="loading-content">
      <!-- Preparing State -->
      <div v-if="state === 'preparing'" class="loading-state">
        <div class="loading-icon preparing-icon">
          <div class="document-icon">
            <div class="document-lines"></div>
            <div class="document-lines"></div>
            <div class="document-lines"></div>
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
          <div class="spinner-modern">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
        </div>
        <h3 class="loading-title">Submitting Application</h3>
        <p class="loading-subtitle">Sending your application to the database...</p>
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
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.loading-content {
  background: white;
  padding: 3rem 2rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  min-width: 350px;
  position: relative;
  overflow: hidden;
}

.loading-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #4CAF50, #2196F3, #FF9800, #E91E63);
  background-size: 300% 100%;
  animation: gradient-shift 2s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 0%; }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

/* Preparing State Styles */
.preparing-icon {
  animation: bounce 2s infinite;
}

.document-icon {
  width: 50px;
  height: 60px;
  background: #2196F3;
  border-radius: 5px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

.document-icon::before {
  content: '';
  position: absolute;
  top: -5px;
  right: -5px;
  width: 15px;
  height: 15px;
  background: #2196F3;
  clip-path: polygon(0 100%, 100% 0, 100% 100%);
}

.document-lines {
  width: 30px;
  height: 3px;
  background: white;
  border-radius: 2px;
  opacity: 0.8;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

/* Submitting State Styles */
.spinner-modern {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: #4CAF50;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-right-color: #2196F3;
  animation-delay: 0.3s;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: #FF9800;
  animation-delay: 0.6s;
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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