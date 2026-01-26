<template>
  <section id="vendor" class="vendor-section">
    <div class="container">
      <!-- Background decorations -->
      <div class="bg-decorations">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-line"></div>
      </div>
      
      <div class="content-wrapper">
        <div class="text-content">
          <div class="section-badge animate-on-scroll">
            <i class="mdi mdi-chart-line"></i>
            <span>For Stall Business Owners</span>
          </div>
          
          <h1 class="main-title animate-on-scroll animate-delay-1">
            Powerful <span class="highlight-blue">Features</span>
          </h1>
          <h2 class="sub-title animate-on-scroll animate-delay-2">
            For Your <span class="highlight-blue">Stall Business</span>
          </h2>
          
          <p class="description animate-on-scroll animate-delay-3">
            Everything you need to manage your stall rental business efficiently. 
            From tenant management to payment tracking — we've got you covered.
          </p>
          
          <div class="feature-list animate-on-scroll animate-delay-3">
            <div class="feature-item" @mouseenter="highlightFeature($event)" @mouseleave="unhighlightFeature($event)">
              <div class="feature-icon">
                <i class="mdi mdi-account-multiple-check"></i>
              </div>
              <div class="feature-text">
                <strong>Tenant Management</strong>
                <span>Track all your stallholders</span>
              </div>
            </div>
            <div class="feature-item" @mouseenter="highlightFeature($event)" @mouseleave="unhighlightFeature($event)">
              <div class="feature-icon">
                <i class="mdi mdi-cash-register"></i>
              </div>
              <div class="feature-text">
                <strong>Payment Tracking</strong>
                <span>Never miss a rental payment</span>
              </div>
            </div>
            <div class="feature-item" @mouseenter="highlightFeature($event)" @mouseleave="unhighlightFeature($event)">
              <div class="feature-icon">
                <i class="mdi mdi-file-document-check"></i>
              </div>
              <div class="feature-text">
                <strong>Compliance Monitoring</strong>
                <span>Stay compliant effortlessly</span>
              </div>
            </div>
            <div class="feature-item" @mouseenter="highlightFeature($event)" @mouseleave="unhighlightFeature($event)">
              <div class="feature-icon">
                <i class="mdi mdi-chart-areaspline"></i>
              </div>
              <div class="feature-text">
                <strong>Analytics Dashboard</strong>
                <span>Real-time business insights</span>
              </div>
            </div>
          </div>
          
          <button class="apply-btn animate-on-scroll animate-delay-4" @click="scrollToTrial">
            <i class="mdi mdi-rocket-launch"></i>
            <span>Try It Free</span>
          </button>
        </div>
        
        <div class="illustration-wrapper animate-on-scroll fade-right animate-delay-2">
          <div class="image-container">
            <img
              :src="vendorImage"
              alt="Vendor Cart"
              class="vendor-image"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import vendorImage from '@/assets/vendor.png'

export default {
  name: "VendorSection",
  data() {
    return {
      vendorImage
    }
  },
  methods: {
    scrollToTrial() {
      const trialSection = document.getElementById('free-trial')
      if (trialSection) {
        trialSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    highlightFeature(event) {
      const item = event.currentTarget
      item.style.transform = 'translateX(10px) scale(1.02)'
      item.style.background = 'rgba(0, 33, 129, 0.05)'
    },
    unhighlightFeature(event) {
      const item = event.currentTarget
      item.style.transform = ''
      item.style.background = ''
    }
  }
};
</script>

<style scoped>
.vendor-section {
  background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
  padding: 120px 30px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: visible;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 2;
  overflow: visible;
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

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.05) 0%, rgba(25, 118, 210, 0.05) 100%);
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
}

.decoration-line {
  position: absolute;
  top: 50%;
  right: 0;
  width: 60%;
  height: 1px;
  background: linear-gradient(to left, rgba(0, 33, 129, 0.1), transparent);
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 80px;
  align-items: center;
}

.text-content {
  padding-right: 40px;
  z-index: 3;
  position: relative;
}

/* Section Badge */
.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.08) 0%, rgba(25, 118, 210, 0.08) 100%);
  border: 1px solid rgba(0, 33, 129, 0.15);
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 13px;
  font-weight: 600;
  color: #002181;
  margin-bottom: 25px;
}

.section-badge i {
  font-size: 18px;
  color: #1976d2;
}

.main-title {
  font-size: 4rem;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.sub-title {
  font-size: 4rem;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 30px;
  line-height: 1.1;
  margin-top: -5px;
  letter-spacing: -0.02em;
}

.highlight-blue {
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.description {
  font-size: 1.1rem;
  color: #64748b;
  line-height: 1.7;
  margin-bottom: 35px;
  max-width: 550px;
  font-weight: 400;
}

/* Feature List */
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border-radius: 14px;
  border: 1px solid rgba(0, 33, 129, 0.08);
  box-shadow: 0 2px 10px rgba(0, 33, 129, 0.04);
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 20px rgba(0, 33, 129, 0.1);
  border-color: rgba(0, 33, 129, 0.15);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon i {
  font-size: 22px;
  color: #002181;
}

.feature-text {
  display: flex;
  flex-direction: column;
}

.feature-text strong {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

.feature-text span {
  font-size: 13px;
  color: #64748b;
}

.apply-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #002181 0%, #1565c0 100%);
  color: white;
  border: none;
  padding: 18px 36px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 30px rgba(0, 33, 129, 0.25);
  position: relative;
  overflow: hidden;
}

.apply-btn i {
  font-size: 20px;
}

.apply-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.apply-btn:hover::before {
  left: 100%;
}

.apply-btn:hover {
  background: linear-gradient(135deg, #001a66 0%, #0d47a1 100%);
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(0, 33, 129, 0.35);
}

.illustration-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
  overflow: visible;
}

.image-container {
  position: relative;
  overflow: visible;
}

.image-container::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  min-width: 520px;
  min-height: 520px;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.08) 0%, rgba(25, 118, 210, 0.08) 100%);
  border-radius: 50%;
  z-index: -1;
}

.vendor-image {
  width: 100%;
  max-width: 550px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 20px 60px rgba(0, 0, 0, 0.12));
  transition: transform 0.4s ease;
}

.vendor-image:hover {
  transform: scale(1.05);
}

/* Responsive Design */
@media (max-width: 1400px) {
  .container {
    max-width: 1200px;
  }
  
  .main-title, .sub-title {
    font-size: 3.5rem;
  }
  
  .vendor-image {
    max-width: 480px;
  }
}

@media (max-width: 1024px) {
  .vendor-section {
    padding: 100px 25px;
    min-height: auto;
  }
  
  .content-wrapper {
    gap: 60px;
  }
  
  .main-title, .sub-title {
    font-size: 3rem;
  }
  
  .description {
    font-size: 1rem;
  }
  
  .vendor-image {
    max-width: 420px;
  }

  .image-container::before {
    min-width: 450px;
    min-height: 450px;
  }
}

@media (max-width: 768px) {
  .vendor-section {
    padding: 60px 16px;
  }
  
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .text-content {
    padding-right: 0;
    order: 1;
  }
  
  .section-badge {
    margin-left: auto;
    margin-right: auto;
    font-size: 12px;
    padding: 10px 16px;
  }
  
  .illustration-wrapper {
    order: 2;
  }
  
  .main-title, .sub-title {
    font-size: 2rem;
    line-height: 1.2;
  }
  
  .description {
    max-width: 100%;
    font-size: 0.9rem;
    padding: 0 10px;
  }
  
  .feature-list {
    align-items: center;
  }
  
  .feature-item {
    max-width: 350px;
    width: 100%;
  }
  
  .apply-btn {
    padding: 14px 28px;
  }
  
  .vendor-image {
    max-width: 320px;
  }

  .image-container::before {
    min-width: 350px;
    min-height: 350px;
  }
}

@media (max-width: 480px) {
  .vendor-section {
    padding: 50px 14px;
  }
  
  .section-badge {
    font-size: 11px;
    padding: 8px 14px;
    gap: 6px;
  }

  .section-badge i {
    font-size: 16px;
  }
  
  .main-title, .sub-title {
    font-size: 1.6rem;
    line-height: 1.2;
  }
  
  .description {
    font-size: 0.85rem;
    line-height: 1.6;
  }
  
  .feature-item {
    padding: 12px 14px;
  }
  
  .feature-icon {
    width: 36px;
    height: 36px;
  }

  .feature-icon i {
    font-size: 18px;
  }

  .feature-text strong {
    font-size: 0.9rem;
  }

  .feature-text span {
    font-size: 0.75rem;
  }
  
  .apply-btn {
    padding: 12px 24px;
    font-size: 13px;
  }
  
  .vendor-image {
    max-width: 260px;
  }

  .image-container::before {
    min-width: 280px;
    min-height: 280px;
  }
}

/* Extra small devices */
@media (max-width: 360px) {
  .vendor-section {
    padding: 40px 12px;
  }

  .main-title, .sub-title {
    font-size: 1.4rem;
  }

  .description {
    font-size: 0.8rem;
  }

  .feature-item {
    padding: 10px 12px;
  }

  .feature-icon {
    width: 32px;
    height: 32px;
  }

  .feature-text strong {
    font-size: 0.85rem;
  }

  .feature-text span {
    font-size: 0.7rem;
  }

  .apply-btn {
    padding: 10px 20px;
    font-size: 12px;
  }

  .vendor-image {
    max-width: 220px;
  }

  .image-container::before {
    min-width: 240px;
    min-height: 240px;
  }
}
</style>