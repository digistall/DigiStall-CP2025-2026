<template>
  <div id="app" class="landing-page">
    <!-- Scroll Progress Line - Full Height -->
    <div class="scroll-progress-container" :class="{ 'white-mode': isInDarkSection }">
      <div class="scroll-progress-track">
        <div class="scroll-progress-line" :style="{ height: scrollProgress + '%' }"></div>
      </div>
      <div class="scroll-sections">
        <div 
          v-for="(section, index) in sections" 
          :key="index" 
          class="section-marker"
          :class="{ active: currentSection === index, passed: currentSection > index }"
          :style="{ top: section.position + '%' }"
          @click="scrollToSection(section.id)"
        >
          <div class="marker-dot">
            <div class="dot-pulse" v-if="currentSection === index"></div>
          </div>
          <transition name="label-fade">
            <span class="marker-label" v-if="currentSection === index">{{ section.label }}</span>
          </transition>
        </div>
      </div>
    </div>

    <HeaderSection />
    <StallSection />
    <VendorSection />
    <ComplianceSection />
    <FreeTrialSection />
    <FooterSection />
  </div>
</template>

<script>
import HeaderSection from "./components/header/HeaderSection.vue";
import StallSection from "./components/stalls/StallSection.vue";
import VendorSection from "./components/vendor/VendorSection.vue";
import ComplianceSection from "./components/compliance/ComplianceSection.vue";
import FreeTrialSection from "./components/freetrial/FreeTrialSection.vue";
import FooterSection from "./components/footer/FooterSection.vue";

export default {
  name: "LandingPage",
  components: {
    HeaderSection,
    StallSection,
    VendorSection,
    ComplianceSection,
    FreeTrialSection,
    FooterSection,
  },
  data() {
    return {
      scrollProgress: 0,
      currentSection: 0,
      isInDarkSection: false,
      sections: [
        { id: 'stalls', label: 'HOME', position: 10 },
        { id: 'vendor', label: 'VENDOR', position: 35 },
        { id: 'about', label: 'REPORT', position: 60 },
        { id: 'free-trial', label: 'TRIAL', position: 85 }
      ]
    }
  },
  mounted() {
    // Initialize scroll animations
    this.initScrollAnimations();
    this.init3DEffects();
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    initScrollAnimations() {
      const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Scrolling down - animate in
            entry.target.classList.add('animate-in');
            entry.target.classList.remove('animate-out');
          } else {
            // Scrolling up or out of view - animate out
            entry.target.classList.remove('animate-in');
            entry.target.classList.add('animate-out');
          }
        });
      }, observerOptions);

      // Observe all animated elements after a short delay
      setTimeout(() => {
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
          observer.observe(el);
        });
      }, 100);
    },
    init3DEffects() {
      // Add 3D tilt effect to cards
      document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.tilt-card');
        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / 20;
          const rotateY = (centerX - x) / 20;
          
          if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
          } else {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
          }
        });
      });
    },
    handleScroll() {
      const scrolled = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      this.scrollProgress = Math.min((scrolled / docHeight) * 100, 100);
      
      // Determine current section
      const sectionIds = ['stalls', 'vendor', 'about', 'free-trial'];
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const section = document.getElementById(sectionIds[i]);
        if (section && scrolled >= section.offsetTop - 200) {
          this.currentSection = i;
          break;
        }
      }
      
      // Check if in dark section (free-trial has dark background)
      const trialSection = document.getElementById('free-trial');
      if (trialSection) {
        const trialTop = trialSection.offsetTop;
        const trialBottom = trialTop + trialSection.offsetHeight;
        this.isInDarkSection = scrolled >= trialTop - 300 && scrolled < trialBottom - 100;
      }

      // Parallax effect
      const parallaxElements = document.querySelectorAll('.parallax');
      parallaxElements.forEach(el => {
        const speed = el.dataset.speed || 0.5;
        el.style.transform = `translateY(${scrolled * speed}px)`;
      });
    },
    scrollToSection(id) {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
};
</script>

<style scoped src="../../assets/css/Global.css"></style>
<style>
/* Scroll Progress Line - Full Height Fixed */
.scroll-progress-container {
  position: fixed;
  left: 30px;
  top: 220px;
  bottom: 100px;
  z-index: 99999;
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 0;
  pointer-events: none;
}

.scroll-sections,
.section-marker {
  pointer-events: auto;
}

.scroll-progress-track {
  width: 3px;
  height: 100%;
  background: rgba(0, 33, 129, 0.12);
  border-radius: 3px;
  position: relative;
  overflow: visible;
  transition: background 0.5s ease;
}

.scroll-progress-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(180deg, #002181 0%, #1976d2 50%, #4FC3F7 100%);
  border-radius: 3px;
  transition: height 0.15s ease-out, background 0.5s ease, box-shadow 0.5s ease;
  box-shadow: 0 0 12px rgba(0, 33, 129, 0.3);
}

.scroll-sections {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.section-marker {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: rgba(0, 33, 129, 0.25);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid transparent;
}

.section-marker:hover .marker-dot {
  background: rgba(0, 33, 129, 0.5);
  transform: scale(1.2);
}

.section-marker.passed .marker-dot {
  background: #002181;
}

.section-marker.active .marker-dot {
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #002181, #1976d2);
  border: 2px solid white;
  box-shadow: 0 0 15px rgba(0, 33, 129, 0.5);
}

.dot-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  background: rgba(0, 33, 129, 0.3);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

.marker-label {
  font-size: 11px;
  font-weight: 700;
  color: #002181;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
  background: white;
  padding: 6px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 33, 129, 0.15);
  position: relative;
}

.marker-label::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid white;
}

/* Label Fade Transition */
.label-fade-enter-active,
.label-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* White Mode for Dark Sections */
.scroll-progress-container.white-mode .scroll-progress-track {
  background: rgba(255, 255, 255, 0.15);
}

.scroll-progress-container.white-mode .scroll-progress-line {
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 50%, rgba(255, 255, 255, 0.7) 100%);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
}

.scroll-progress-container.white-mode .marker-dot {
  background: rgba(255, 255, 255, 0.3);
}

.scroll-progress-container.white-mode .section-marker:hover .marker-dot {
  background: rgba(255, 255, 255, 0.6);
}

.scroll-progress-container.white-mode .section-marker.passed .marker-dot {
  background: white;
}

.scroll-progress-container.white-mode .section-marker.active .marker-dot {
  background: linear-gradient(135deg, #ffffff, #e0e0e0);
  border-color: rgba(0, 33, 129, 0.3);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.scroll-progress-container.white-mode .dot-pulse {
  background: rgba(255, 255, 255, 0.4);
}

.scroll-progress-container.white-mode .marker-label {
  background: rgba(255, 255, 255, 0.95);
  color: #002181;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
}

.scroll-progress-container.white-mode .marker-label::before {
  border-right-color: rgba(255, 255, 255, 0.95);
}

/* Global Scroll Animations - Reversible */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-on-scroll.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.animate-on-scroll.animate-out {
  opacity: 0;
  transform: translateY(50px);
}

.animate-on-scroll.fade-left {
  transform: translateX(-50px);
}

.animate-on-scroll.fade-left.animate-in {
  transform: translateX(0);
}

.animate-on-scroll.fade-left.animate-out {
  transform: translateX(-50px);
}

.animate-on-scroll.fade-right {
  transform: translateX(50px);
}

.animate-on-scroll.fade-right.animate-in {
  transform: translateX(0);
}

.animate-on-scroll.fade-right.animate-out {
  transform: translateX(50px);
}

.animate-on-scroll.scale-up {
  transform: scale(0.85);
}

.animate-on-scroll.scale-up.animate-in {
  transform: scale(1);
}

.animate-on-scroll.scale-up.animate-out {
  transform: scale(0.85);
}

/* Staggered Animation Delays */
.animate-delay-1 { transition-delay: 0.1s; }
.animate-delay-2 { transition-delay: 0.2s; }
.animate-delay-3 { transition-delay: 0.3s; }
.animate-delay-4 { transition-delay: 0.4s; }
.animate-delay-5 { transition-delay: 0.5s; }

/* 3D Card Effect */
.tilt-card {
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
}

.tilt-card:hover {
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

/* 3D Floating Animation */
.float-3d {
  animation: float3d 6s ease-in-out infinite;
}

@keyframes float3d {
  0%, 100% { transform: translateY(0) rotateX(0) rotateY(0); }
  25% { transform: translateY(-10px) rotateX(2deg) rotateY(2deg); }
  50% { transform: translateY(-5px) rotateX(0) rotateY(-2deg); }
  75% { transform: translateY(-15px) rotateX(-2deg) rotateY(1deg); }
}

/* Glassmorphism Effect */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 3D Shadow Effect */
.shadow-3d {
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.1),
    0 16px 32px rgba(0, 0, 0, 0.15),
    0 32px 64px rgba(0, 0, 0, 0.1);
}

/* Gradient Border Effect */
.gradient-border {
  position: relative;
  background: white;
  border-radius: 20px;
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #002181, #1976d2, #4FC3F7, #002181);
  border-radius: 22px;
  z-index: -1;
  background-size: 300% 300%;
  animation: gradientMove 4s ease infinite;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-delay-1 { transition-delay: 0.1s; }
.animate-delay-2 { transition-delay: 0.2s; }
.animate-delay-3 { transition-delay: 0.3s; }
.animate-delay-4 { transition-delay: 0.4s; }
.animate-delay-5 { transition-delay: 0.5s; }

/* Landing page smooth scroll */
.landing-page {
  scroll-behavior: smooth;
}

/* Hide scroll progress on mobile */
@media (max-width: 1024px) {
  .scroll-progress-container {
    display: none;
  }
}
</style>