<template>
  <section id="home" class="hero-section">
    <div class="hero-background">
      <img :src="stallBackgroundImage" alt="Naga People's Mall" class="hero-image" />
      <div class="hero-overlay"></div>
      <!-- Floating particles -->
      <div class="particles">
        <div class="particle" v-for="n in 8" :key="n" :style="{ animationDelay: `${n * 0.4}s` }"></div>
      </div>
    </div>
    
    <div class="hero-content">
      <div class="hero-badge animate-on-scroll">
        <i class="mdi mdi-storefront"></i>
        <span>#1 Stall Management Platform</span>
      </div>
      
      <div class="hero-text">
        <h1 class="hero-title animate-on-scroll animate-delay-1">
          Manage Your <span class="highlight">Stall Business</span>
        </h1>
        <h2 class="hero-subtitle animate-on-scroll animate-delay-2">Like a Pro</h2>
        <p class="hero-description animate-on-scroll animate-delay-3">
          The complete digital solution for stall rental business owners. 
          Track payments, manage tenants, monitor compliance — all in one powerful platform.
        </p>
      </div>

      <div class="stats-container animate-on-scroll animate-delay-3">
        <div class="stat-card" @mouseenter="animateStat($event)" @mouseleave="resetStat($event)">
          <div class="stat-icon">
            <i class="mdi mdi-account-group"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number counter" data-target="1900">1,900+</div>
            <div class="stat-label">Active Stallholders</div>
          </div>
        </div>
        <div class="stat-card" @mouseenter="animateStat($event)" @mouseleave="resetStat($event)">
          <div class="stat-icon">
            <i class="mdi mdi-store-check"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number counter" data-target="500">500+</div>
            <div class="stat-label">Stalls Managed</div>
          </div>
        </div>
        <div class="stat-card" @mouseenter="animateStat($event)" @mouseleave="resetStat($event)">
          <div class="stat-icon">
            <i class="mdi mdi-cash-multiple"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">₱2M+</div>
            <div class="stat-label">Monthly Transactions</div>
          </div>
        </div>
      </div>

      <div class="hero-actions animate-on-scroll animate-delay-4">
        <button class="apply-btn primary-btn" @click="openGeneralApplicationForm">
          <i class="mdi mdi-file-document-edit"></i>
          <span>Apply for a Stall</span>
        </button>
      </div>
      
      <div class="trust-badges animate-on-scroll animate-delay-5">
        <span class="trust-item">
          <i class="mdi mdi-shield-check"></i>
          Bank-level Security
        </span>
        <span class="trust-item">
          <i class="mdi mdi-clock-fast"></i>
          Setup in 5 Minutes
        </span>
        <span class="trust-item">
          <i class="mdi mdi-credit-card-off"></i>
          No Credit Card Required
        </span>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="scroll-indicator animate-on-scroll animate-delay-5">
      <div class="scroll-mouse">
        <div class="scroll-wheel"></div>
      </div>
      <span>Scroll to explore</span>
    </div>

    <!-- StallApplicationContainer for General Application -->
    <StallApplicationContainer v-if="showApplyForm" :stall="generalStallInfo" :showForm="showApplyForm"
      @close="closeApplyForm" />
  </section>
</template>

<script src="./StallSection.js"></script>

<style src="../../../../assets/css/StallSection.css" scoped></style>