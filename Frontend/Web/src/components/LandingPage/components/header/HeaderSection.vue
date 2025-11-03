<template>
  <div class="header-wrapper">
    <!-- Main Header -->
    <header class="main-header">
      <div class="header-container">
        <!-- Left side: Logo and text -->
        <div class="header-left">
          <div class="logo-section">
            <img
              :src="digiStallLogo"
              alt="DigiStall Logo"
              class="logo"
            />
            <div class="header-text">
              <div class="republic-text">City Government Of Naga</div>
              <div class="text-divider"></div>
              <div class="city-text">Power by DigiStall</div>
            </div>
          </div>
        </div>

        <!-- Right side: Navigation -->
        <div class="header-right">
          <nav class="nav-menu">
            <a href="#" class="nav-link">Home</a>
            <a href="#" @click.prevent="showOrdinanceModal" class="nav-link">Ordinance</a>
            <a href="#" class="nav-link">About Us</a>
            <a href="#" class="nav-link">Contact</a>
            <button @click="goToLogin" class="login-btn">
              <i class="mdi mdi-login"></i>
              Login
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Sub Navigation Component -->
    <SubNavigation />

    <!-- Ordinance Modal Component -->
    <OrdinanceSection
      :isVisible="isOrdinanceModalVisible"
      @close-modal="closeOrdinanceModal"
    />
  </div>
</template>

<script>
import SubNavigation from "./SubNavigation.vue";
import OrdinanceSection from "./Ordinance/OrinanceSection.vue";
import digiStallLogo from '@/assets/DigiStall-Logo.png'

export default {
  name: "HeaderSection",
  components: {
    SubNavigation,
    OrdinanceSection,
  },
  data() {
    return {
      isOrdinanceModalVisible: false,
      digiStallLogo
    };
  },
  methods: {
    showOrdinanceModal() {
      this.isOrdinanceModalVisible = true;
    },
    closeOrdinanceModal() {
      this.isOrdinanceModalVisible = false;
    },
    goToLogin() {
      this.$router.push('/login');
    },
  },
  // Removed mounted hook to prevent automatic popup on page load
  // mounted() {
  //   this.showOrdinanceModal();
  // },
};
</script>

<style scoped src="../../../../assets/css/HeaderStyles.css"></style>
