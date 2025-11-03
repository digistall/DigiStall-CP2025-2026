<template>
  <section class="compliance-section">
    <div class="section-container">
      <div class="content-overlay">
        <h2 class="section-title">
          Report & Monitor Compliance
        </h2>
        <h3 class="section-subtitle">
          with <span class="highlight">Ease</span>
        </h3>
        <p class="section-description">
          Keep market running smoothly report issues, stay compliant, and ensure a better business environment.
        </p>
        <button class="member-btn">Report Now</button>
      </div>
      <div class="image-container">
        <img
          :src="reportingImage"
          alt="Compliance Dashboard"
          class="background-image"
        />
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
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  min-height: 1000px;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
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
  max-width: 700px;
  text-align: left;
  margin-left: auto;
  padding-left: 40px;
  z-index: 3;
  position: relative;
}

.image-container {
  position: absolute;
  left: -80px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  opacity: 0.95;
}

.background-image {
  width: 800px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 20px 60px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.background-image:hover {
  transform: scale(1.02);
}

.section-title {
  font-size: 4.5rem;
  font-weight: 900;
  color: #1a1a2e;
  margin-bottom: 0;
  line-height: 1.05;
  letter-spacing: -0.01em;
}

.section-subtitle {
  font-size: 4.5rem;
  font-weight: 900;
  color: #000000;
  line-height: 1.05;
  margin: -10px 0 50px 0;
  letter-spacing: -0.01em;
}

.highlight {
  color: #2563eb;
  text-shadow: 0 0 30px rgba(37, 99, 235, 0.3);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  font-size: 1rem;
  color: #4a5568;
  line-height: 1.7;
  margin: 0 0 60px 0;
  max-width: 600px;
  font-weight: 400;
}

.member-btn {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  border: none;
  padding: 15px 25px;
  font-size: 22px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.4s ease;
  width: fit-content;
  box-shadow: 0 8px 30px rgba(25, 118, 210, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.member-btn:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(13, 71, 161, 0.4);
}

.member-btn:active {
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 1400px) {
  .section-container {
    max-width: 1200px;
  }
  
  .background-image {
    width: 700px;
  }
  
  .section-title,
  .section-subtitle {
    font-size: 4rem;
  }
}

@media (max-width: 1024px) {
  .compliance-section {
    padding: 100px 25px;
    min-height: 900px;
  }
  
  .section-container {
    gap: 60px;
  }
  
  .background-image {
    width: 600px;
  }
  
  .section-title,
  .section-subtitle {
    font-size: 3.5rem;
  }
  
  .section-description {
    font-size: 1.2rem;
  }
}

@media (max-width: 768px) {
  .compliance-section {
    padding: 80px 20px;
    min-height: 800px;
  }
  
  .section-container {
    flex-direction: column;
    text-align: center;
    justify-content: center;
    gap: 50px;
  }
  
  .content-overlay {
    text-align: center;
    max-width: 100%;
    padding-left: 0;
  }
  
  .image-container {
    position: relative;
    left: 0;
    top: 0;
    transform: none;
    margin-top: 0;
    opacity: 0.8;
  }
  
  .background-image {
    width: 500px;
  }
  
  .section-title,
  .section-subtitle {
    font-size: 3.2rem;
  }
  
  .section-description {
    font-size: 1.1rem;
    max-width: 100%;
  }
  
  .member-btn {
    padding: 18px 40px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .compliance-section {
    padding: 60px 15px;
    min-height: 700px;
  }
  
  .section-title,
  .section-subtitle {
    font-size: 2.8rem;
  }
  
  .section-description {
    font-size: 1rem;
  }
  
  .member-btn {
    padding: 16px 36px;
    font-size: 18px;
  }
  
  .background-image {
    width: 400px;
  }
}
</style>