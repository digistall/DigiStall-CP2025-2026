<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isVisible" class="beta-modal-overlay">
        <div class="beta-modal-container glass-card" role="dialog" aria-modal="true" aria-labelledby="beta-modal-title">
          
          <div class="beta-modal-header">
            <div class="icon-pulse-container">
              <i class="mdi mdi-alert-decagram-outline warning-icon"></i>
            </div>
            <h2 id="beta-modal-title" class="beta-title">DigiStall Beta Version</h2>
          </div>

          <div class="beta-modal-body">
            <p class="beta-text">
              Welcome to the <strong>DigiStall Stall Management System</strong>!
            </p>
            <p class="beta-text text-muted">
              Please note that this is currently a <strong>Testing Environment / Beta Version</strong>. 
            </p>
            <ul class="beta-points">
              <li><i class="mdi mdi-check-circle-outline"></i> This system is not yet live for public or official use.</li>
              <li><i class="mdi mdi-check-circle-outline"></i> Data entered here may be cleared or reset during development.</li>
              <li><i class="mdi mdi-check-circle-outline"></i> Do not upload real sensitive documents or perform actual payment transactions.</li>
            </ul>
          </div>

          <div class="beta-modal-footer">
            <button class="beta-accept-btn" @click="acceptDisclaimer">
              <span>I Understand, Continue to Site</span>
              <i class="mdi mdi-arrow-right"></i>
            </button>
          </div>
          
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: 'BetaDisclaimerModal',
  data() {
    return {
      isVisible: false
    }
  },
  mounted() {
    // Check if the user has already seen the disclaimer in this session
    const hasSeenBeta = sessionStorage.getItem('hasSeenDigiStallBeta')
    
    if (!hasSeenBeta) {
      // Small delay for better UX (allows page to load first)
      setTimeout(() => {
        this.isVisible = true;
        // Prevent background scrolling while modal is open
        document.body.style.overflow = 'hidden';
      }, 800);
    }
  },
  methods: {
    acceptDisclaimer() {
      this.isVisible = false;
      sessionStorage.setItem('hasSeenDigiStallBeta', 'true');
      
      // Restore scrolling
      document.body.style.overflow = '';
    }
  },
  beforeUnmount() {
    // Make sure to restore overflow if component is destroyed while open
    if (this.isVisible) {
      document.body.style.overflow = '';
    }
  }
}
</script>

<style scoped>
/* Overlay with strong blur - ensures user must interact */
.beta-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 15, 45, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999999; /* Extremely high z-index to sit on top of everything */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Modal Container */
.beta-modal-container {
  background: #ffffff;
  width: 100%;
  max-width: 500px;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Glassmorphism accent border */
.beta-modal-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #f59e0b, #ef4444, #3b82f6);
}

.beta-modal-header {
  padding: 32px 32px 16px;
  text-align: center;
}

.icon-pulse-container {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
  animation: pulseWarning 2s infinite;
}

.warning-icon {
  font-size: 36px;
  color: #f59e0b;
}

.beta-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.5px;
}

.beta-modal-body {
  padding: 0 32px 16px;
}

.beta-text {
  font-size: 15px;
  line-height: 1.6;
  color: #334155;
  margin-bottom: 12px;
  text-align: center;
}

.beta-text.text-muted {
  color: #64748b;
}

.beta-points {
  list-style-type: none;
  padding: 16px;
  margin: 16px 0 0;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.beta-points li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
  margin-bottom: 12px;
}

.beta-points li:last-child {
  margin-bottom: 0;
}

.beta-points i {
  color: #f59e0b;
  font-size: 18px;
  margin-top: -1px;
}

.beta-modal-footer {
  padding: 24px 32px 32px;
}

.beta-accept-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 33, 129, 0.25);
}

.beta-accept-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 33, 129, 0.35);
  background: linear-gradient(135deg, #00185e 0%, #1565c0 100%);
}

.beta-accept-btn:active {
  transform: translateY(0);
}

.beta-accept-btn i {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.beta-accept-btn:hover i {
  transform: translateX(4px);
}

/* Animations */
@keyframes slideUpFade {
  0% { transform: translateY(40px) scale(0.95); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes pulseWarning {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

/* Vue Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.4s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Mobile Responsiveness */
@media (max-width: 480px) {
  .beta-modal-header {
    padding: 24px 20px 12px;
  }
  
  .icon-pulse-container {
    width: 56px;
    height: 56px;
  }
  
  .warning-icon {
    font-size: 28px;
  }
  
  .beta-title {
    font-size: 20px;
  }
  
  .beta-modal-body {
    padding: 0 20px 12px;
  }
  
  .beta-text {
    font-size: 14px;
  }
  
  .beta-points {
    padding: 12px;
  }
  
  .beta-points li {
    font-size: 12px;
  }
  
  .beta-modal-footer {
    padding: 16px 20px 24px;
  }
  
  .beta-accept-btn {
    padding: 14px;
    font-size: 15px;
  }
}
</style>
