<template>
  <section id="about" class="compliance-section">
    <div class="section-container">
      <!-- Background decorations -->
      <div class="bg-decorations">
        <div class="decoration-grid"></div>
      </div>
      
      <div class="image-container animate-on-scroll fade-left">
        <div class="image-wrapper">
          <img
            :src="reportingImage"
            alt="Compliance Dashboard"
            class="background-image"
          />
        </div>
      </div>
      
      <div class="content-overlay">
        <div class="section-badge animate-on-scroll">
          <i class="mdi mdi-shield-check-outline"></i>
          <span>Built for Business Owners</span>
        </div>
        
        <h2 class="section-title animate-on-scroll animate-delay-1">
          Complete <span class="highlight">Control</span>
        </h2>
        <h3 class="section-subtitle animate-on-scroll animate-delay-2">
          Over Your <span class="highlight">Stall Business</span>
        </h3>
        
        <p class="section-description animate-on-scroll animate-delay-3">
          Monitor compliance, track payments, and manage your entire stall rental 
          operation from one powerful dashboard. Built by business owners, for business owners.
        </p>
        
        <div class="compliance-features animate-on-scroll animate-delay-3">
          <div class="compliance-feature">
            <div class="feature-icon">
              <i class="mdi mdi-view-dashboard"></i>
            </div>
            <div class="feature-content">
              <strong>Live Dashboard</strong>
              <span>Real-time business overview</span>
            </div>
          </div>
          <div class="compliance-feature">
            <div class="feature-icon">
              <i class="mdi mdi-bell-ring-outline"></i>
            </div>
            <div class="feature-content">
              <strong>Smart Notifications</strong>
              <span>Payment & compliance alerts</span>
            </div>
          </div>
          <div class="compliance-feature">
            <div class="feature-icon">
              <i class="mdi mdi-file-chart"></i>
            </div>
            <div class="feature-content">
              <strong>Detailed Reports</strong>
              <span>Export anytime, anywhere</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import reportingImage from '@/assets/reporting.png'

export default {
  name: "ComplianceSection",
  data() {
    return {
      reportingImage
    }
  }
};
</script>

<style scoped>
.compliance-section {
  padding: 120px 30px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
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

.decoration-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 33, 129, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 33, 129, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

.section-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 80px;
}

.content-overlay {
  flex: 1;
  max-width: 600px;
  text-align: left;
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

.image-container {
  flex: 1;
  position: relative;
  z-index: 1;
}

.image-wrapper {
  position: relative;
  display: inline-block;
}

.image-wrapper::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 20px;
  right: -20px;
  bottom: -20px;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%);
  border-radius: 24px;
  z-index: -1;
}

.background-image {
  width: 100%;
  max-width: 600px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 20px 60px rgba(0, 0, 0, 0.1));
  transition: transform 0.4s ease;
  border-radius: 20px;
}

.background-image:hover {
  transform: scale(1.02);
}

.section-title {
  font-size: 4rem;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 4rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.1;
  margin: -5px 0 30px 0;
  letter-spacing: -0.02em;
}

.highlight {
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  font-size: 1.1rem;
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 35px 0;
  max-width: 550px;
  font-weight: 400;
}

/* Compliance Features */
.compliance-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.compliance-feature {
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

.compliance-feature:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 20px rgba(0, 33, 129, 0.1);
  border-color: rgba(0, 33, 129, 0.15);
}

.compliance-feature .feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.compliance-feature .feature-icon i {
  font-size: 22px;
  color: #002181;
}

.feature-content {
  display: flex;
  flex-direction: column;
}

.feature-content strong {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

.feature-content span {
  font-size: 13px;
  color: #64748b;
}

/* Responsive Design */
@media (max-width: 1400px) {
  .section-container {
    max-width: 1200px;
  }

  .background-image {
    max-width: 520px;
  }

  .section-title,
  .section-subtitle {
    font-size: 3.5rem;
  }
}

@media (max-width: 1024px) {
  .compliance-section {
    padding: 100px 25px;
    min-height: auto;
  }

  .section-container {
    gap: 60px;
  }

  .background-image {
    max-width: 450px;
  }

  .section-title,
  .section-subtitle {
    font-size: 3rem;
  }

  .section-description {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .compliance-section {
    padding: 60px 16px;
  }

  .section-container {
    flex-direction: column;
    text-align: center;
    justify-content: center;
    gap: 40px;
  }

  .content-overlay {
    text-align: center;
    max-width: 100%;
    order: 1;
  }
  
  .section-badge {
    margin-left: auto;
    margin-right: auto;
    font-size: 12px;
    padding: 10px 16px;
  }

  .image-container {
    order: 2;
  }

  .image-wrapper::before {
    display: none;
  }

  .background-image {
    max-width: 320px;
  }

  .section-title,
  .section-subtitle {
    font-size: 2rem;
    line-height: 1.2;
  }

  .section-description {
    max-width: 100%;
    font-size: 0.9rem;
    padding: 0 10px;
  }
  
  .compliance-features {
    align-items: center;
  }
  
  .compliance-feature {
    max-width: 350px;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .compliance-section {
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

  .section-title,
  .section-subtitle {
    font-size: 1.6rem;
    line-height: 1.2;
  }

  .section-description {
    font-size: 0.85rem;
    line-height: 1.6;
  }
  
  .compliance-feature {
    padding: 12px 14px;
  }
  
  .compliance-feature .feature-icon {
    width: 36px;
    height: 36px;
  }

  .compliance-feature .feature-icon i {
    font-size: 18px;
  }

  .feature-content strong {
    font-size: 0.9rem;
  }

  .feature-content span {
    font-size: 0.75rem;
  }

  .background-image {
    max-width: 260px;
  }
}

/* Extra small devices */
@media (max-width: 360px) {
  .compliance-section {
    padding: 40px 12px;
  }

  .section-title,
  .section-subtitle {
    font-size: 1.4rem;
  }

  .section-description {
    font-size: 0.8rem;
  }

  .compliance-feature {
    padding: 10px 12px;
  }

  .compliance-feature .feature-icon {
    width: 32px;
    height: 32px;
  }

  .feature-content strong {
    font-size: 0.85rem;
  }

  .feature-content span {
    font-size: 0.7rem;
  }

  .background-image {
    max-width: 220px;
  }
}
</style>
