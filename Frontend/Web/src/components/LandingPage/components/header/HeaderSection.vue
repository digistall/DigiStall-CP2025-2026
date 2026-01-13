<template>
  <div class="header-wrapper" :class="{ 'header-hidden': !isVisible }">
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
              <div class="city-text">DigiStall</div>
              <div class="text-divider"></div>
              <div class="republic-text">Stall Management System</div>
            </div>
          </div>
        </div>

        <!-- Right side: Navigation -->
        <div class="header-right">
          <nav class="nav-menu">
            <a href="#home" class="nav-link">
              <i class="mdi mdi-home-outline"></i>
              <span>Home</span>
            </a>
            <a href="#" @click.prevent="showOrdinanceModal" class="nav-link">
              <i class="mdi mdi-file-document-outline"></i>
              <span>Ordinance</span>
            </a>
            <a href="#about" class="nav-link">
              <i class="mdi mdi-information-outline"></i>
              <span>About Us</span>
            </a>
            <a href="#contact" class="nav-link">
              <i class="mdi mdi-phone-outline"></i>
              <span>Contact</span>
            </a>
            <button @click="handleLoginButtonClick" class="login-btn" :class="{ 'logged-in': isLoggedIn }">
              <i :class="isLoggedIn ? 'mdi mdi-account-circle' : 'mdi mdi-login'"></i>
              <span v-if="isLoggedIn" class="username-display">{{ currentUsername }}</span>
              <span v-else>Login</span>
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
  props: {
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isOrdinanceModalVisible: false,
      digiStallLogo,
      isLoggedIn: false,
      currentUsername: '',
      currentUser: null
    };
  },
  async mounted() {
    // Check for existing authentication when component loads
    await this.checkAuthentication();
    
    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', this.handleStorageChange);
  },
  beforeUnmount() {
    // Clean up event listeners
    window.removeEventListener('storage', this.handleStorageChange);
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
    goToDashboard() {
      this.$router.push('/app/dashboard');
    },
    handleLoginButtonClick() {
      if (this.isLoggedIn) {
        // If logged in, go to dashboard
        this.goToDashboard();
      } else {
        // If not logged in, go to login page
        this.goToLogin();
      }
    },
    async checkAuthentication() {
      try {
        // Check sessionStorage and localStorage for auth token
        const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
        const userDataStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        
        if (token && userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            
            // Simple token validation - check if it looks like a JWT and isn't expired
            if (this.isValidToken(token)) {
              this.isLoggedIn = true;
              this.currentUser = userData;
              this.currentUsername = this.getUserDisplayName(userData);
              console.log('✅ User session found on landing page:', this.currentUsername);
            } else {
              // Token invalid, clear auth state
              this.clearAuthState();
            }
          } catch (parseError) {
            console.error('❌ Error parsing user data:', parseError);
            this.clearAuthState();
          }
        } else {
          this.clearAuthState();
        }
      } catch (error) {
        console.error('❌ Authentication check error:', error);
        this.clearAuthState();
      }
    },
    isValidToken(token) {
      try {
        // Basic JWT format check (has 3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        // Decode payload to check expiration
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if token is not expired
        return payload.exp && payload.exp > currentTime;
      } catch (error) {
        console.warn('Token validation error:', error.message);
        return false;
      }
    },
    getUserDisplayName(user) {
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
      }
      if (user.username) {
        // Capitalize first letter and clean up username for display
        return user.username.replace(/[_\d]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      return 'User';
    },
    clearAuthState() {
      this.isLoggedIn = false;
      this.currentUsername = '';
      this.currentUser = null;
    },
    handleStorageChange(event) {
      // Listen for auth changes in other tabs
      if (event.key === 'authToken') {
        if (event.newValue) {
          // User logged in on another tab
          console.log('🔄 Login detected from another tab');
          this.checkAuthentication();
        } else {
          // User logged out from another tab
          console.log('🔄 Logout detected from another tab');
          this.clearAuthState();
        }
      }
    }
  },
  // Removed mounted hook to prevent automatic popup on page load
  // mounted() {
  //   this.showOrdinanceModal();
  // },
};
</script>

<style scoped src="../../../../assets/css/HeaderStyles.css"></style>
