<template>
  <footer id="contact" class="footer">
    <!-- Decorative top border gradient -->
    <div class="footer-accent-border"></div>


    <!-- Main Footer Content -->
    <div class="footer-main">
      <div class="footer-container">
        <!-- Brand Column -->
        <div class="footer-brand">
          <div class="brand-logo">
            <div class="brand-logo-circle">
              <img src="../../../assets/DigiStall-Logo.png" alt="DigiStall Logo" class="logo-img" />
            </div>
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
            <a href="#" class="social-link facebook" aria-label="Facebook">
              <i class="mdi mdi-facebook"></i>
            </a>
            <a href="#" class="social-link twitter" aria-label="Twitter">
              <i class="mdi mdi-twitter"></i>
            </a>
            <a href="#" class="social-link instagram" aria-label="Instagram">
              <i class="mdi mdi-instagram"></i>
            </a>
            <a href="#" class="social-link linkedin" aria-label="LinkedIn">
              <i class="mdi mdi-linkedin"></i>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-links">
          <h4 class="footer-title">Quick Links</h4>
          <ul class="link-list">
            <li><a href="#home"><i class="mdi mdi-chevron-right"></i> Home</a></li>
            <li><a href="#about"><i class="mdi mdi-chevron-right"></i> About Us</a></li>
            <li><a href="/stall-browse"><i class="mdi mdi-chevron-right"></i> Browse Stalls</a></li>
            <li><a href="#" @click.prevent="$emit('open-team')"><i class="mdi mdi-account-group-outline"></i> View Team</a></li>
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> FAQs</a></li>
          </ul>
        </div>

        <!-- Services -->
        <div class="footer-links">
          <h4 class="footer-title">Our Services</h4>
          <ul class="link-list">
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> Stall Management</a></li>
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> Vendor Portal</a></li>
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> Compliance Tracking</a></li>
            <li><a href="#"><i class="mdi mdi-chevron-right"></i> Analytics Dashboard</a></li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div class="footer-contact">
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
                <i class="mdi mdi-email-outline"></i>
              </div>
              <div class="contact-details">
                <a href="mailto:mepo.office@gmail.com">mepo.office@gmail.com</a>
              </div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">
                <i class="mdi mdi-phone-outline"></i>
              </div>
              <div class="contact-details">
                <a href="tel:0548817906">054-881-7906</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Bottom Bar -->
    <div class="footer-bottom">
      <div class="footer-bottom-container">
        <p class="copyright">
          © {{ currentYear }} <strong>DigiStall</strong>. All Rights Reserved. Developed by <strong class="team-name">Naga Stall Team</strong>
        </p>
        <div class="footer-legal">
          <a href="#">Privacy Policy</a>
          <span class="dot-separator"></span>
          <a href="#">Terms of Service</a>
          <span class="dot-separator"></span>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </div>

    <!-- Background decorative elements -->
    <div class="footer-bg-shapes">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-grid"></div>
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
/* ===================== BASE ===================== */
.footer {
  background: #060d1e;
  color: white;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* Gradient accent border at top */
.footer-accent-border {
  height: 4px;
  background: linear-gradient(90deg, #002181, #1976d2, #4FC3F7, #1976d2, #002181);
  background-size: 200% 100%;
  animation: shimmerBorder 4s ease-in-out infinite;
}

@keyframes shimmerBorder {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* ===================== BACKGROUND SHAPES ===================== */
.footer-bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.03;
}

.bg-circle-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #1976d2, transparent 70%);
  top: -200px;
  right: -100px;
}

.bg-circle-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #4FC3F7, transparent 70%);
  bottom: -100px;
  left: -80px;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ===================== MAIN FOOTER ===================== */
.footer-main {
  padding: 80px 30px 60px;
  position: relative;
  z-index: 2;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.3fr;
  gap: 50px;
}

/* Brand Section */
.footer-brand {
  padding-right: 30px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.brand-logo-circle {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.15), rgba(79, 195, 247, 0.1));
  border: 1px solid rgba(79, 195, 247, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 500;
}

.brand-description {
  font-size: 0.9rem;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 28px;
}

/* Social Links */
.social-links {
  display: flex;
  gap: 10px;
}

.social-link {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

.social-link i {
  font-size: 20px;
}

.social-link:hover {
  transform: translateY(-4px);
  color: white;
}

.social-link.facebook:hover {
  background: #1877F2;
  border-color: #1877F2;
  box-shadow: 0 6px 20px rgba(24, 119, 242, 0.35);
}

.social-link.twitter:hover {
  background: #1DA1F2;
  border-color: #1DA1F2;
  box-shadow: 0 6px 20px rgba(29, 161, 242, 0.35);
}

.social-link.instagram:hover {
  background: linear-gradient(135deg, #833AB4, #FD1D1D, #F77737);
  border-color: transparent;
  box-shadow: 0 6px 20px rgba(131, 58, 180, 0.35);
}

.social-link.linkedin:hover {
  background: #0A66C2;
  border-color: #0A66C2;
  box-shadow: 0 6px 20px rgba(10, 102, 194, 0.35);
}

/* Footer Links */
.footer-title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 28px;
  color: rgba(255, 255, 255, 0.95);
  position: relative;
  padding-bottom: 14px;
}

.footer-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 32px;
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
  gap: 16px;
}

.link-list li a {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 400;
  transition: all 0.3s ease;
  position: relative;
}

.link-list li a i {
  font-size: 14px;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s ease;
  color: #4FC3F7;
}

.link-list li a:hover {
  color: white;
  transform: translateX(6px);
}

.link-list li a:hover i {
  opacity: 1;
  transform: translateX(0);
}

/* Contact Section */
.contact-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.contact-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.12), rgba(79, 195, 247, 0.08));
  border: 1px solid rgba(79, 195, 247, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.contact-item:hover .contact-icon {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.25), rgba(79, 195, 247, 0.15));
  border-color: rgba(79, 195, 247, 0.25);
  transform: scale(1.05);
}

.contact-icon i {
  font-size: 18px;
  color: #4FC3F7;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 4px;
}

.contact-details span,
.contact-details a {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  line-height: 1.5;
  transition: color 0.3s ease;
}

.contact-details a:hover {
  color: #4FC3F7;
}

/* ===================== FOOTER BOTTOM ===================== */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 24px 30px;
  position: relative;
  z-index: 2;
}

.footer-bottom-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.copyright {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.copyright strong {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.copyright .team-name {
  color: #4FC3F7;
}

.footer-legal {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-legal a {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-legal a:hover {
  color: #4FC3F7;
}

.dot-separator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 1200px) {
  .footer-container {
    grid-template-columns: 1fr 1fr;
    gap: 50px 40px;
  }

  .footer-brand {
    grid-column: span 2;
    padding-right: 0;
    max-width: 480px;
  }
}

@media (max-width: 768px) {
  .footer-main {
    padding: 50px 20px 40px;
  }

  .footer-container {
    grid-template-columns: 1fr;
    gap: 36px;
    text-align: left;
  }

  .footer-brand {
    grid-column: span 1;
    max-width: 340px;
  }

  .brand-logo-circle {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }

  .logo-img { width: 30px; height: 30px; }
  .brand-name { font-size: 1.2rem; }
  .brand-tagline { font-size: 0.6rem; }
  .brand-description { font-size: 0.82rem; margin-bottom: 20px; }

  .social-link {
    width: 40px;
    height: 40px;
  }

  .social-link i { font-size: 18px; }

  .footer-title {
    font-size: 0.8rem;
    margin-bottom: 20px;
    padding-bottom: 12px;
  }

  .link-list {
    align-items: flex-start;
    gap: 12px;
  }

  .link-list li a { font-size: 0.85rem; }

  .contact-list { align-items: flex-start; gap: 16px; }
  .contact-item { justify-content: flex-start; text-align: left; }

  .contact-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }

  .contact-icon i { font-size: 16px; }
  .contact-details span,
  .contact-details a { font-size: 0.82rem; }

  .footer-bottom { padding: 20px 16px; }

  .footer-bottom-container {
    flex-direction: column;
    text-align: left;
    align-items: flex-start;
    gap: 12px;
  }

  .copyright { font-size: 0.78rem; }

  .footer-legal { flex-wrap: wrap; gap: 12px; }
  .footer-legal a { font-size: 0.78rem; }
}

@media (max-width: 480px) {
  .footer-main { padding: 40px 16px 32px; }
  .footer-container { gap: 28px; }

  .brand-logo-circle { width: 42px; height: 42px; }
  .logo-img { width: 28px; height: 28px; }
  .brand-name { font-size: 1.1rem; }
  .brand-description { font-size: 0.78rem; max-width: 300px; }

  .social-link { width: 36px; height: 36px; }
  .social-link i { font-size: 16px; }

  .footer-title { font-size: 0.75rem; margin-bottom: 16px; }
  .link-list li a { font-size: 0.8rem; }

  .contact-icon { width: 34px; height: 34px; }
  .contact-icon i { font-size: 15px; }
  .contact-details span,
  .contact-details a { font-size: 0.78rem; }

  .footer-legal { align-items: flex-start; gap: 8px; }
  .footer-legal a { font-size: 0.72rem; }
  .copyright { font-size: 0.72rem; }
}
</style>