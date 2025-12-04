<template>
  <section id="free-trial" class="free-trial-section">
    <div class="container">
      <!-- Background decorations -->
      <div class="bg-decorations">
        <div class="decoration-blob blob-1"></div>
        <div class="decoration-blob blob-2"></div>
        <div class="decoration-lines"></div>
      </div>

      <div class="section-header animate-on-scroll">
        <div class="section-badge">
          <i class="mdi mdi-gift-outline"></i>
          <span>For Stall Business Owners</span>
        </div>
        <h2 class="section-title">
          Start Your <span class="highlight">Free Trial</span> Today
        </h2>
        <p class="section-subtitle">
          Own a stall rental business but don't have a management system yet? 
          Try DigiStall free for 30 days — no credit card required.
        </p>
      </div>

      <div class="pricing-container">
        <!-- Free Trial Card - Compact Design -->
        <div class="pricing-card animate-on-scroll animate-delay-1">
          <div class="card-ribbon">FREE 30 DAYS</div>
          
          <div class="card-header">
            <div class="plan-icon">
              <i class="mdi mdi-rocket-launch"></i>
            </div>
            <h3 class="plan-name">Starter Trial</h3>
            <p class="plan-tagline">For stall rental business owners</p>
          </div>

          <div class="price-section">
            <div class="price-display">
              <span class="currency">₱</span>
              <span class="price-amount">0</span>
              <span class="price-period">/month</span>
            </div>
            <div class="original-price">
              <span class="strikethrough">₱999</span>
              <span class="save-badge">SAVE 100%</span>
            </div>
          </div>

          <div class="features-section">
            <p class="features-title">What's Included:</p>
            <ul class="features-list">
              <li><i class="mdi mdi-check-circle"></i> <strong>1</strong> Branch</li>
              <li><i class="mdi mdi-check-circle"></i> <strong>20</strong> Stalls</li>
              <li><i class="mdi mdi-check-circle"></i> <strong>30</strong> Days Free</li>
              <li><i class="mdi mdi-check-circle"></i> Email Support</li>
            </ul>
          </div>

          <button class="cta-button" @click="startFreeTrial">
            <i class="mdi mdi-rocket-launch-outline"></i>
            Start Free Trial
          </button>

          <p class="no-credit-card">
            <i class="mdi mdi-shield-check"></i>
            No credit card required
          </p>
        </div>

        <!-- Why Choose Section -->
        <div class="comparison-section animate-on-scroll animate-delay-2">
          <h3 class="comparison-title">Why Choose DigiStall?</h3>
          
          <div class="benefit-cards">
            <div class="benefit-card">
              <div class="benefit-icon"><i class="mdi mdi-lightning-bolt"></i></div>
              <div class="benefit-content">
                <h4>Quick Setup</h4>
                <p>Get started in under 5 minutes with our easy onboarding</p>
              </div>
            </div>
            
            <div class="benefit-card">
              <div class="benefit-icon"><i class="mdi mdi-chart-line"></i></div>
              <div class="benefit-content">
                <h4>Powerful Analytics</h4>
                <p>Track your stall occupancy and revenue performance</p>
              </div>
            </div>
            
            <div class="benefit-card">
              <div class="benefit-icon"><i class="mdi mdi-shield-lock"></i></div>
              <div class="benefit-content">
                <h4>Secure & Reliable</h4>
                <p>Your business data is protected 24/7</p>
              </div>
            </div>
            
            <div class="benefit-card">
              <div class="benefit-icon"><i class="mdi mdi-cellphone-link"></i></div>
              <div class="benefit-content">
                <h4>Mobile Ready</h4>
                <p>Manage your stalls from anywhere on any device</p>
              </div>
            </div>
          </div>

          <div class="upgrade-notice">
            <div class="upgrade-icon"><i class="mdi mdi-arrow-up-bold-circle"></i></div>
            <div class="upgrade-content">
              <h4>Ready to Scale?</h4>
              <p>After your trial, upgrade for more branches, employees, and stalls.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Trust indicators -->
      <div class="trust-section animate-on-scroll animate-delay-3">
        <div class="trust-item">
          <i class="mdi mdi-account-group"></i>
          <span><strong>1,900+</strong> Business Owners</span>
        </div>
        <div class="trust-item">
          <i class="mdi mdi-star"></i>
          <span><strong>4.9/5</strong> Rating</span>
        </div>
        <div class="trust-item">
          <i class="mdi mdi-shield-check"></i>
          <span><strong>99.9%</strong> Uptime</span>
        </div>
        <div class="trust-item">
          <i class="mdi mdi-headset"></i>
          <span><strong>24/7</strong> Support</span>
        </div>
      </div>
    </div>

    <!-- Free Trial Application Modal - Professional Design -->
    <div v-if="showTrialModal" class="modal-overlay" @click.self="closeTrialModal">
      <div class="trial-modal">
        <button class="modal-close" @click="closeTrialModal">
          <i class="mdi mdi-close"></i>
        </button>
        
        <div class="modal-header">
          <div class="modal-icon">
            <i class="mdi mdi-rocket-launch"></i>
          </div>
          <h3>Start Your Free Trial</h3>
          <p>Register as a stall business owner to begin your 30-day free trial</p>
        </div>

        <form @submit.prevent="submitTrialApplication" class="trial-form">
          <div class="form-group">
            <label for="businessName">
              <i class="mdi mdi-store"></i> Business Name
            </label>
            <input 
              type="text" 
              id="businessName" 
              v-model="trialForm.businessName" 
              placeholder="Your stall rental business name"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="firstName">
                <i class="mdi mdi-account"></i> First Name
              </label>
              <input 
                type="text" 
                id="firstName" 
                v-model="trialForm.firstName" 
                placeholder="First name"
                required
              />
            </div>
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                v-model="trialForm.lastName" 
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="email">
              <i class="mdi mdi-email"></i> Email Address
            </label>
            <input 
              type="email" 
              id="email" 
              v-model="trialForm.email" 
              placeholder="your@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="phone">
              <i class="mdi mdi-phone"></i> Phone Number
            </label>
            <input 
              type="tel" 
              id="phone" 
              v-model="trialForm.phone" 
              placeholder="+63 XXX XXX XXXX"
              required
            />
          </div>

          <div class="trial-summary">
            <p class="summary-title">Your Trial Includes:</p>
            <div class="summary-grid">
              <span><i class="mdi mdi-check-circle"></i> 1 Branch</span>
              <span><i class="mdi mdi-check-circle"></i> 20 Stalls</span>
              <span><i class="mdi mdi-check-circle"></i> <strong>30</strong> Days Free</span>
              <span><i class="mdi mdi-check-circle"></i> Email Support</span>
            </div>
          </div>

          <div class="form-checkbox">
            <input type="checkbox" id="terms" v-model="trialForm.acceptTerms" required />
            <label for="terms">
              I agree to the <a href="#" @click.prevent>Terms of Service</a> and <a href="#" @click.prevent>Privacy Policy</a>
            </label>
          </div>

          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            <i class="mdi mdi-rocket-launch" v-if="!isSubmitting"></i>
            <i class="mdi mdi-loading mdi-spin" v-else></i>
            {{ isSubmitting ? 'Starting Trial...' : 'Start My Free Trial' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "FreeTrialSection",
  data() {
    return {
      showTrialModal: false,
      isSubmitting: false,
      trialForm: {
        businessName: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        acceptTerms: false
      }
    }
  },
  methods: {
    startFreeTrial() {
      this.showTrialModal = true
      document.body.style.overflow = 'hidden'
    },
    closeTrialModal() {
      this.showTrialModal = false
      document.body.style.overflow = ''
    },
    async submitTrialApplication() {
      if (!this.trialForm.acceptTerms) {
        alert('Please accept the terms and conditions')
        return
      }

      this.isSubmitting = true

      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false
        this.closeTrialModal()
        
        // Show success message or redirect
        alert('🎉 Congratulations! Your free trial has been activated. Check your email for login details.')
        
        // Reset form
        this.trialForm = {
          businessName: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          acceptTerms: false
        }
      }, 2000)
    }
  }
}
</script>

<style scoped>
.free-trial-section {
  padding: 100px 30px;
  background: linear-gradient(135deg, #002181 0%, #1565c0 50%, #1976d2 100%);
  position: relative;
  overflow: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

/* Background Decorations */
.bg-decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-blob {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  filter: blur(60px);
}

.blob-1 {
  width: 500px;
  height: 500px;
  top: -150px;
  right: -150px;
}

.blob-2 {
  width: 300px;
  height: 300px;
  bottom: -80px;
  left: -80px;
}

.decoration-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* Section Header */
.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.section-badge i {
  font-size: 18px;
  color: #fbbf24;
}

.section-title {
  font-size: 2.8rem;
  font-weight: 800;
  color: white;
  margin-bottom: 16px;
  line-height: 1.2;
}

.highlight {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 550px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Pricing Container */
.pricing-container {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 40px;
  align-items: start;
}

/* Pricing Card - 3D Effect */
.pricing-card {
  background: white;
  border-radius: 24px;
  padding: 32px;
  position: relative;
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 10px 20px rgba(0, 0, 0, 0.1),
    0 30px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transform-style: preserve-3d;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.pricing-card::before {
  content: '';
  position: absolute;
  inset: -3px;
  background: linear-gradient(135deg, #002181, #1976d2, #4FC3F7, #fbbf24, #002181);
  border-radius: 26px;
  z-index: -1;
  background-size: 400% 400%;
  animation: gradientRotate 6s ease infinite;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.pricing-card:hover::before {
  opacity: 1;
}

.pricing-card:hover {
  transform: translateY(-8px) rotateX(2deg);
  box-shadow: 
    0 8px 12px rgba(0, 0, 0, 0.08),
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 40px 80px rgba(0, 33, 129, 0.2);
}

@keyframes gradientRotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.card-ribbon {
  position: absolute;
  top: 16px;
  right: -32px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  padding: 6px 40px;
  font-size: 10px;
  font-weight: 700;
  transform: rotate(45deg);
  letter-spacing: 0.5px;
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.plan-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.plan-icon i {
  font-size: 28px;
  color: #002181;
}

.plan-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 4px;
}

.plan-tagline {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

/* Price Section */
.price-section {
  text-align: center;
  margin-bottom: 20px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.05) 0%, rgba(25, 118, 210, 0.05) 100%);
  border-radius: 12px;
}

.price-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}

.currency {
  font-size: 1.5rem;
  font-weight: 700;
  color: #002181;
}

.price-amount {
  font-size: 3.5rem;
  font-weight: 900;
  color: #002181;
  line-height: 1;
}

.price-period {
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
}

.original-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}

.strikethrough {
  font-size: 1rem;
  color: #94a3b8;
  text-decoration: line-through;
}

.save-badge {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  padding: 3px 10px;
  border-radius: 50px;
  font-size: 10px;
  font-weight: 700;
}

/* Features Section - Compact */
.features-section {
  margin-bottom: 20px;
}

.features-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.features-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #334155;
}

.features-list li i {
  font-size: 16px;
  color: #059669;
}

.features-list li strong {
  font-weight: 700;
  color: #0f172a;
}

/* CTA Button */
.cta-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #002181 0%, #1565c0 100%);
  color: white;
  border: none;
  padding: 16px 28px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px rgba(0, 33, 129, 0.35);
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transition: left 0.6s ease;
}

.cta-button:hover::before {
  left: 100%;
}

.cta-button::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 17px;
  background: linear-gradient(135deg, #fbbf24, #4FC3F7, #fbbf24);
  background-size: 200% 200%;
  z-index: -1;
  opacity: 0;
  animation: gradientRotate 3s linear infinite;
  transition: opacity 0.3s ease;
}

.cta-button:hover::after {
  opacity: 1;
}

.cta-button i {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.cta-button:hover {
  background: linear-gradient(135deg, #001a66 0%, #0d47a1 100%);
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 15px 40px rgba(0, 33, 129, 0.45);
}

.cta-button:hover i {
  transform: translateX(4px);
}

.no-credit-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  font-size: 0.85rem;
  color: #64748b;
}

.no-credit-card i {
  color: #059669;
  font-size: 18px;
}

/* Comparison Section */
.comparison-section {
  color: white;
}

.comparison-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 24px;
}

.benefit-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  perspective: 1000px;
}

.benefit-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  position: relative;
}

.benefit-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.5), rgba(79, 195, 247, 0.5), rgba(251, 191, 36, 0.5));
  background-size: 200% 200%;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.benefit-card:hover::before {
  opacity: 1;
  animation: gradientRotate 3s linear infinite;
}

.benefit-card:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-6px) rotateX(5deg) scale(1.02);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}

.benefit-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(255, 255, 255, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.4s ease;
  box-shadow: 0 4px 15px rgba(251, 191, 36, 0.2);
}

.benefit-card:hover .benefit-icon {
  transform: scale(1.1) rotateZ(5deg);
  box-shadow: 0 6px 20px rgba(251, 191, 36, 0.35);
}

.benefit-icon i {
  font-size: 20px;
  color: #fbbf24;
}

.benefit-content h4 {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.benefit-content p {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.4;
  margin: 0;
}

/* Upgrade Notice */
.upgrade-notice {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 18px;
}

.upgrade-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.upgrade-icon i {
  font-size: 24px;
  color: white;
}

.upgrade-content h4 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.upgrade-content p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  margin: 0;
}

/* Trust Section */
.trust-section {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 50px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.trust-section .trust-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

.trust-section .trust-item i {
  font-size: 20px;
  color: #fbbf24;
}

.trust-section .trust-item strong {
  font-weight: 700;
}

/* Modal Styles - Professional & Wider */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.trial-modal {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  position: relative;
  animation: modalSlideIn 0.4s ease-out;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.modal-close i {
  font-size: 20px;
  color: white;
}

.modal-header {
  text-align: center;
  padding: 32px 32px 28px;
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  color: white;
  border-radius: 24px 24px 0 0;
}

.modal-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.modal-icon i {
  font-size: 28px;
  color: white;
}

.modal-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.modal-header p {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

/* Trial Form - Clean White Layout */
.trial-form {
  padding: 28px 32px 32px;
  background: #ffffff;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.form-group label i {
  font-size: 16px;
  color: #1976d2;
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background: #ffffff;
}

.form-group input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-group input::placeholder {
  color: #94a3b8;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.trial-summary {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 18px;
  border: 1px solid #e2e8f0;
}

.summary-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  margin: 0 0 10px 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.summary-grid span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #334155;
  font-weight: 500;
}

.summary-grid i {
  color: #059669;
  font-size: 16px;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.form-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  min-width: 18px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: #002181;
  margin: 0;
}

.form-checkbox label {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
  white-space: nowrap;
}

.form-checkbox a {
  color: #1976d2;
  text-decoration: none;
  font-weight: 600;
}

.form-checkbox a:hover {
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  color: white;
  border: none;
  padding: 14px 24px;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 33, 129, 0.3);
}

.submit-btn i {
  font-size: 18px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 33, 129, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .pricing-container {
    grid-template-columns: 1fr;
    max-width: 600px;
    margin: 0 auto;
  }

  .pricing-card {
    max-width: 360px;
    margin: 0 auto;
  }

  .comparison-section {
    margin-top: 40px;
  }
}

@media (max-width: 768px) {
  .free-trial-section {
    padding: 70px 20px;
  }

  .section-title {
    font-size: 2.2rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .benefit-cards {
    grid-template-columns: 1fr;
  }

  .trust-section {
    flex-wrap: wrap;
    gap: 20px;
  }

  .trial-form {
    padding: 24px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

@media (max-width: 480px) {
  .free-trial-section {
    padding: 50px 16px;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .pricing-card {
    padding: 24px 20px;
  }

  .price-amount {
    font-size: 3rem;
  }

  .features-list {
    grid-template-columns: 1fr;
  }

  .trust-section {
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .trial-modal {
    margin: 10px;
    max-width: calc(100vw - 20px);
  }

  .modal-header {
    padding: 24px 20px 20px;
  }

  .trial-form {
    padding: 20px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
