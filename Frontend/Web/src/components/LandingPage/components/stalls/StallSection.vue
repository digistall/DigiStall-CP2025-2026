<template>
  <section class="hero-section">
    <div class="hero-background">
      <img :src="stallBackgroundImage" alt="Naga People's Mall" class="hero-image" />
      <div class="hero-overlay"></div>
    </div>
    <div class="hero-content">
      <div class="hero-text">
        <h1 class="hero-title">
          Rent The <span class="highlight">Perfect Stall</span>
        </h1>
        <h2 class="hero-subtitle">With us</h2>
      </div>

      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-number">1900 +</div>
          <div class="stat-label">Stall holder</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">300 +</div>
          <div class="stat-label">Available Stall</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">60</div>
          <div class="stat-label">Year's Of Service</div>
        </div>
      </div>

      <button class="apply-btn" @click="openGeneralApplicationForm">Apply Now</button>
    </div>

    <!-- StallApplicationContainer for General Application -->
    <StallApplicationContainer v-if="showApplyForm" :stall="generalStallInfo" :showForm="showApplyForm"
      @close="closeApplyForm" />
  </section>
</template>

<script src="./StallSection.js"></script>

<style src="../../../../assets/css/StallSection.css" scoped></style>