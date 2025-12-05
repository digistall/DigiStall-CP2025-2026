<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <!-- HEADER -->
      <div class="modal-header">
        <h3 class="modal-title">Inspector Details</h3>
        <button class="close-button" @click="closeModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- BODY -->
      <div class="modal-body" v-if="inspector">
        <!-- Top Info Grid -->
        <div class="info-grid">
          <div class="info-card">
            <strong>Inspector ID</strong>
            <p>{{ inspector.id }}</p>
          </div>
          <div class="info-card">
            <strong>Status</strong>
            <p>
              <span :class="getStatusClass(inspector.status)">
                {{ inspector.status.toUpperCase() }}
              </span>
            </p>
          </div>
          <div class="info-card">
            <strong>Date Hired</strong>
            <p>{{ inspector.date_hired }}</p>
          </div>
          <div class="info-card">
            <strong>Email</strong>
            <p>{{ inspector.email }}</p>
          </div>
        </div>

        <!-- Inspector Profile -->
        <div class="section-card">
          <div class="avatar">
            {{ inspector.name ? inspector.name[0] : "I" }}
          </div>
          <div class="details">
            <span class="name">{{ inspector.name }}</span>
            <span class="role">Market Inspector</span>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="info-card" style="margin-bottom: 12px;">
          <strong>Contact Number</strong>
          <p>{{ inspector.contact_no }}</p>
        </div>

        <!-- Additional Info -->
        <div class="info-grid">
          <div class="info-card">
            <strong>First Name</strong>
            <p>{{ inspector.first_name || 'N/A' }}</p>
          </div>
          <div class="info-card">
            <strong>Last Name</strong>
            <p>{{ inspector.last_name || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <!-- No Data -->
      <div class="modal-body" v-else>
        <p>No inspector data available.</p>
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button class="modal-button secondary" @click="closeModal">Close</button>
        <button class="modal-button primary">Edit Inspector</button>
      </div>
    </div>
  </div>
</template>

<script src="./ViewInspector.js"></script>
<style scoped src="./ViewInspector.css"></style>
