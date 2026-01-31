<template>
  <footer class="footer">
    <!-- Top Wave -->
    <div class="footer-wave">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,60 1440,60 L1440,120 L0,120 Z" fill="#0a1628"></path>
      </svg>
    </div>

    <div class="footer-main">
      <div class="footer-container">
        <!-- Brand Section -->
        <div class="footer-brand animate-on-scroll">
          <div class="brand-logo">
            <img src="../../../../assets/DigiStall-Logo.png" alt="DigiStall Logo" class="logo-img" />
            <div class="brand-text">
              <span class="brand-name">DigiStall</span>
              <span class="brand-tagline">Stall Management System</span>
            </div>
          </div>
          <p class="brand-description">
            Empowering vendors with modern stall management solutions. 
            Simplify your business operations and grow with confidence.
          </p>
          <div class="social-links">
            <a href="#" class="social-link" aria-label="Facebook">
              <i class="mdi mdi-facebook"></i>
            </a>
            <a href="#" class="social-link" aria-label="Twitter">
              <i class="mdi mdi-twitter"></i>
            </a>
            <a href="#" class="social-link" aria-label="Instagram">
              <i class="mdi mdi-instagram"></i>
            </a>
            <a href="#" class="social-link" aria-label="LinkedIn">
              <i class="mdi mdi-linkedin"></i>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-links animate-on-scroll animate-delay-1">
          <h4 class="footer-title">Quick Links</h4>
          <ul class="link-list">
            <li><a href="#stalls"><i class="mdi mdi-chevron-right"></i> Home</a></li>
            <li><a href="#about"><i class="mdi mdi-chevron-right"></i> About Us</a></li>
            <!--<li><a href="#free-trial"><i class="mdi mdi-chevron-right"></i> Free Trial</a></li>-->
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> FAQs</a></li>
          </ul>
        </div>

        <!-- Services -->
        <div class="footer-links animate-on-scroll animate-delay-2">
          <h4 class="footer-title">Our Services</h4>
          <ul class="link-list">
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> Stall Management</a></li>
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> Vendor Portal</a></li>
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> Compliance Tracking</a></li>
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> Analytics Dashboard</a></li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div class="footer-contact animate-on-scroll animate-delay-3">
          <h4 class="footer-title">Contact Us</h4>
          <div class="contact-list">
            <div class="contact-item">
              <div class="contact-icon">
                <i class="mdi mdi-map-marker"></i>
              </div>
              <div class="contact-details">
                <span>132 Caceres, Naga</span>
                <span>4400 Camarines Sur</span>
              </div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">
                <i class="mdi mdi-email"></i>
              </div>
              <div class="contact-details">
                <a href="mailto:mepo.office@gmail.com">mepo.office@gmail.com</a>
              </div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">
                <i class="mdi mdi-phone"></i>
              </div>
              <div class="contact-details">
                <a href="tel:0548817906">054-881-7906</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Bottom -->
    <div class="footer-bottom">
      <div class="footer-bottom-container">
        <p class="copyright">
          © {{ currentYear }} DigiStall. All rights reserved. Developed by <strong>Naga Stall Team</strong>
        </p>
        <div class="footer-legal">
          <a href="#">Privacy Policy</a>
          <span class="separator">|</span>
          <a href="#">Terms of Service</a>
          <span class="separator">|</span>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: "FooterSection",
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  }
};
</script>

<style scoped>
.footer {
  background: linear-gradient(135deg, #0a1628 0%, #0f172a 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.footer-wave {
  position: absolute;
  top: -1px;
  left: 0;
  width: 100%;
  height: 120px;
  overflow: hidden;
  line-height: 0;
}

.footer-wave svg {
  width: 100%;
  height: 100%;
}

.footer-main {
  padding: 140px 30px 60px;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
  gap: 60px;
}

/* Brand Section */
.footer-brand {
  padding-right: 40px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.logo-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.brand-description {
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24px;
}

.social-links {
  display: flex;
  gap: 12px;
}

.social-link {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s ease;
}

.social-link i {
  font-size: 20px;
}

.social-link:hover {
  background: linear-gradient(135deg, #002181, #1976d2);
  transform: translateY(-4px);
}

/* Footer Links */
.footer-links {
  /* empty for layout */
}

.footer-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 24px;
  color: white;
  position: relative;
  padding-bottom: 12px;
}

.footer-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #4FC3F7, #1976d2);
  border-radius: 2px;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.link-list li a {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.link-list li a i {
  font-size: 16px;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.link-list li a:hover {
  color: #4FC3F7;
  transform: translateX(5px);
}

.link-list li a:hover i {
  opacity: 1;
  transform: translateX(0);
}

/* Contact Section */
.contact-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.contact-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact-icon i {
  font-size: 20px;
  color: #4FC3F7;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 4px;
}

.contact-details span,
.contact-details a {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.contact-details a:hover {
  color: #4FC3F7;
}

/* Footer Bottom */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px 30px;
  background: rgba(0, 0, 0, 0.2);
}

.footer-bottom-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.copyright {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.copyright strong {
  color: #4FC3F7;
}

.footer-legal {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-legal a {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-legal a:hover {
  color: #4FC3F7;
}

.footer-legal .separator {
  color: rgba(255, 255, 255, 0.3);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .footer-container {
    grid-template-columns: 1fr 1fr;
    gap: 50px;
  }

  .footer-brand {
    grid-column: span 2;
    padding-right: 0;
    text-align: center;
  }

  .brand-logo {
    justify-content: center;
  }

  .social-links {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .footer-main {
    padding: 100px 16px 40px;
  }

  .footer-container {
    grid-template-columns: 1fr;
    gap: 30px;
    text-align: center;
  }

  .footer-brand {
    grid-column: span 1;
  }

  .brand-logo {
    justify-content: center;
  }

  .logo-img {
    width: 40px;
    height: 40px;
  }

  .brand-name {
    font-size: 1.3rem;
  }

  .brand-tagline {
    font-size: 0.65rem;
  }

  .brand-description {
    max-width: 350px;
    margin: 0 auto 20px;
    font-size: 0.85rem;
  }

  .social-links {
    justify-content: center;
  }

  .social-link {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }

  .footer-title {
    font-size: 1rem;
    margin-bottom: 16px;
  }

  .footer-title::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .link-list {
    align-items: center;
    gap: 10px;
  }

  .link-list a {
    font-size: 0.85rem;
  }

  .contact-list {
    align-items: center;
    gap: 14px;
  }

  .contact-item {
    justify-content: center;
    text-align: left;
  }

  .contact-icon {
    width: 36px;
    height: 36px;
  }

  .contact-icon i {
    font-size: 16px;
  }

  .contact-details {
    font-size: 0.85rem;
  }

  .footer-bottom-container {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .copyright {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .footer-main {
    padding: 80px 14px 30px;
  }

  .footer-container {
    gap: 24px;
  }

  .logo-img {
    width: 36px;
    height: 36px;
  }

  .brand-name {
    font-size: 1.1rem;
  }

  .brand-description {
    font-size: 0.8rem;
    max-width: 280px;
  }

  .social-link {
    width: 34px;
    height: 34px;
    font-size: 14px;
  }

  .footer-title {
    font-size: 0.9rem;
    margin-bottom: 12px;
  }

  .link-list a {
    font-size: 0.8rem;
  }

  .contact-icon {
    width: 32px;
    height: 32px;
  }

  .contact-details {
    font-size: 0.8rem;
  }

  .footer-legal {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .footer-legal a {
    font-size: 0.75rem;
  }

  .copyright {
    font-size: 0.75rem;
  }
}

/* Extra small devices */
@media (max-width: 360px) {
  .footer-main {
    padding: 70px 12px 24px;
  }

  .footer-container {
    gap: 20px;
  }

  .logo-img {
    width: 32px;
    height: 32px;
  }

  .brand-name {
    font-size: 1rem;
  }

  .brand-tagline {
    font-size: 0.6rem;
  }

  .brand-description {
    font-size: 0.75rem;
    max-width: 240px;
  }

  .social-link {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }

  .footer-title {
    font-size: 0.85rem;
  }

  .link-list a {
    font-size: 0.75rem;
  }

  .contact-details {
    font-size: 0.75rem;
  }

  .footer-legal a {
    font-size: 0.7rem;
  }

  .copyright {
    font-size: 0.7rem;
  }
}
</style>