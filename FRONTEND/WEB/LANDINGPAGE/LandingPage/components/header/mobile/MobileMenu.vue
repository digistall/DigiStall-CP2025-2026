<template>
  <div class="mobile-menu-overlay" :class="{ 'open': isOpen }" @click="$emit('close')">
    <div class="mobile-menu" :class="{ 'open': isOpen }" @click.stop>
      <!-- Header -->
      <div class="mobile-menu-header">
        <div class="mobile-menu-brand">
          <img
            :src="digiStallLogo"
            alt="DigiStall Logo"
            class="mobile-menu-logo"
          />
          <div class="mobile-menu-brand-text">
            <div class="mobile-menu-title">DigiStall</div>
            <div class="mobile-menu-subtitle">Stall Management</div>
          </div>
        </div>
        <button class="mobile-menu-close" @click="$emit('close')" aria-label="Close menu">
          <i class="mdi mdi-close"></i>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="mobile-menu-nav">
        <a href="#home" class="mobile-menu-link" @click="handleNavClick">
          <i class="mdi mdi-home-outline"></i>
          <span>Home</span>
          <i class="mdi mdi-chevron-right arrow"></i>
        </a>
        <a href="#" class="mobile-menu-link" @click.prevent="handleOrdinanceClick">
          <i class="mdi mdi-file-document-outline"></i>
          <span>Ordinance</span>
          <i class="mdi mdi-chevron-right arrow"></i>
        </a>
        <a href="#about" class="mobile-menu-link" @click="handleNavClick">
          <i class="mdi mdi-information-outline"></i>
          <span>About Us</span>
          <i class="mdi mdi-chevron-right arrow"></i>
        </a>
        <a href="#contact" class="mobile-menu-link" @click="handleNavClick">
          <i class="mdi mdi-phone-outline"></i>
          <span>Contact</span>
          <i class="mdi mdi-chevron-right arrow"></i>
        </a>
      </nav>
    </div>
  </div>
</template>

<script>
import digiStallLogo from '@/assets/DigiStall-Logo.png'

export default {
  name: "MobileMenu",
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'open-ordinance'],
  data() {
    return {
      digiStallLogo
    }
  },
  methods: {
    handleNavClick() {
      // Close menu after clicking nav link (smooth scroll will happen via href)
      this.$emit('close');
    },
    handleOrdinanceClick() {
      // Close menu and emit event to open ordinance modal
      this.$emit('close');
      this.$nextTick(() => {
        this.$emit('open-ordinance');
      });
    }
  },
  watch: {
    isOpen(newVal) {
      // Lock/unlock body scroll when menu opens/closes
      if (newVal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  },
  beforeUnmount() {
    // Ensure body scroll is restored when component is destroyed
    document.body.style.overflow = '';
  }
}
</script>

<style scoped src="../../../../assets/css/MobileMenu.css"></style>
