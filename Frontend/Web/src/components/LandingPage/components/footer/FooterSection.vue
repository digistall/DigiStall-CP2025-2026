<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-left">
        <div class="contact-item">
          <span class="contact-icon">✉</span>
          <span class="contact-text">mepo.office@gmail.com</span>
        </div>
        <div class="contact-item">
          <span class="contact-icon">📍</span>
          <span class="contact-text">132 Caceres, Naga, 4400 Camarines Sur</span>
        </div>
        <div class="contact-item">
          <span class="contact-icon">📞</span>
          <span class="contact-text">0548817906</span>
        </div>
      </div>

      <div class="footer-right">
        <h4 class="footer-title">About the developers</h4>
        <p class="footer-description">
          We are the Naga Stall Team, dedicated to making stall renting simple and efficient.
          Our website helps vendors apply, manage, and track stalls with ease,
          ensuring a smoother market experience for everyone.
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: "FooterSection",
};
</script>

<style scoped>
.footer {
  background: #2E5BBA;
  color: white;
  padding: 30px 0;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 60px;
}

.footer-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-icon {
  font-size: 16px;
  width: 20px;
  flex-shrink: 0;
}

.contact-text {
  font-size: 15px;
  line-height: 1.4;
}

.footer-right {
  flex: 1;
  max-width: 500px;
}

.footer-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  color: white;
}

.footer-description {
  font-size: 15px;
  line-height: 1.6;
  opacity: 0.95;
  margin: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    gap: 30px;
    padding: 0 20px;
  }
  
  .footer-right {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .footer {
    padding: 25px 0;
  }
  
  .contact-text {
    font-size: 13px;
  }
  
  .footer-description {
    font-size: 13px;
  }
}
</style>

<style scoped src="../../../../assets/LandingPage/css/Global.css"></style>