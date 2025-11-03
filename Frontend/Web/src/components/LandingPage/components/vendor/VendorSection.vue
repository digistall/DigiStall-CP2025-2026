<template>
  <section class="vendor-section">
    <div class="container">
      <div class="content-wrapper">
        <div class="text-content">
          <h1 class="main-title">
            Become a <span class="highlight-blue">Vendor</span>
          </h1>
          <h2 class="sub-title">
            Grow Your <span class="highlight-blue">Business Today!</span>
          </h2>
          <p class="description">
            Start your journey as a vendor and secure your spot in a thriving marketplace.<br>
            Expand your reach, serve more customers, and build your success!
          </p>
          <button class="apply-btn">Apply Now</button>
        </div>
        
        <div class="illustration-wrapper">
          <img
            :src="vendorImage"
            alt="Vendor Cart"
            class="vendor-image"
          />
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
  }
};
</script>

<style scoped>
.vendor-section {
  background: linear-gradient(135deg, #fefefe 0%, #ffffff 100%);
  padding: 120px 30px;
  min-height: 1000px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 2;
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

.main-title {
  font-size: 4.5rem;
  font-weight: 900;
  color: #1a1a2e;
  margin-bottom: 0;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.sub-title {
  font-size: 4.5rem;
  font-weight: 900;
  color: #1a1a2e;
  margin-bottom: 50px;
  line-height: 1.05;
  margin-top: -15px;
  letter-spacing: -0.02em;
}

.highlight-blue {
  color: #2563eb;
  text-shadow: 0 0 30px rgba(37, 99, 235, 0.3);
}

.description {
  font-size: 1rem;
  color: #4a5568;
  line-height: 1.7;
  margin-bottom: 60px;
  max-width: 600px;
  font-weight: 400;
}

.apply-btn {
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

.apply-btn:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(13, 71, 161, 0.4);
}

.illustration-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
}

.vendor-image {
  width: 100%;
  max-width: 600px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 20px 60px rgba(0, 0, 0, 0.15));
  transform: scale(1.1);
  transition: transform 0.3s ease;
}

.vendor-image:hover {
  transform: scale(1.15);
}

/* Responsive Design */
@media (max-width: 1400px) {
  .container {
    max-width: 1200px;
  }
  
  .main-title, .sub-title {
    font-size: 4rem;
  }
  
  .vendor-image {
    max-width: 550px;
  }
}

@media (max-width: 1024px) {
  .vendor-section {
    padding: 100px 25px;
    min-height: 900px;
  }
  
  .content-wrapper {
    gap: 60px;
  }
  
  .main-title, .sub-title {
    font-size: 3.5rem;
  }
  
  .description {
    font-size: 1.2rem;
  }
  
  .vendor-image {
    max-width: 500px;
  }
}

@media (max-width: 768px) {
  .vendor-section {
    padding: 80px 20px;
    min-height: 800px;
  }
  
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 50px;
    text-align: center;
  }
  
  .text-content {
    padding-right: 0;
    order: 1;
  }
  
  .illustration-wrapper {
    order: 2;
  }
  
  .main-title, .sub-title {
    font-size: 3.2rem;
  }
  
  .description {
    font-size: 1.1rem;
    max-width: 100%;
  }
  
  .apply-btn {
    padding: 18px 40px;
    font-size: 20px;
  }
  
  .vendor-image {
    max-width: 450px;
  }
}

@media (max-width: 480px) {
  .vendor-section {
    padding: 60px 15px;
    min-height: 700px;
  }
  
  .main-title, .sub-title {
    font-size: 2.8rem;
  }
  
  .description {
    font-size: 1rem;
  }
  
  .apply-btn {
    padding: 16px 36px;
    font-size: 18px;
  }
  
  .vendor-image {
    max-width: 350px;
  }
}
</style>