<template>
  <div class="stall-payments">
    <!-- Hide online payment tab per boss requirement - only onsite allowed -->
    <div class="tabs-container" style="display: none;">
      <div
        class="tab-button"
        :class="{ active: activeTab === 'online' }"
        @click="activeTab = 'online'"
      >
        <v-icon class="tab-icon">mdi-cellphone-wireless</v-icon>
        <span class="tab-text">Online Payments</span>
        <v-chip color="#002181" variant="flat" size="x-small" class="tab-badge">
          {{ onlineCount }}
        </v-chip>
      </div>
      <div
        class="tab-button"
        :class="{ active: activeTab === 'onsite' }"
        @click="activeTab = 'onsite'"
      >
        <v-icon class="tab-icon">mdi-cash-register</v-icon>
        <span class="tab-text">Onsite Payments</span>
        <v-chip color="#002181" variant="flat" size="x-small" class="tab-badge">
          {{ onsiteCount }}
        </v-chip>
      </div>
    </div>

    <div class="tab-content">
      <!-- Always show onsite payments only -->
      <OnsitePayments
        @payment-added="handlePaymentAdded"
        @delete-payment="handleDeletePayment"
        @count-updated="handleOnsiteCountUpdate"
        @loading="$emit('loading', $event)"
      />
    </div>

    <!-- Toast Notification -->
    <ToastNotification
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>

<script src="./StallPayments.js"></script>
<style scoped src="./StallPayments.css"></style>
