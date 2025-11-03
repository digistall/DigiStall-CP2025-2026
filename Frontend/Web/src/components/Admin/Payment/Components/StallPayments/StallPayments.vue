<template>
  <div class="stall-payments">
    <div class="tabs-container">
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
      <transition name="fade" mode="out-in">
        <OnlinePayments
          v-if="activeTab === 'online'"
          @accept-payment="handleAcceptPayment"
          @decline-payment="handleDeclinePayment"
        />
        <OnsitePayments
          v-else
          @payment-added="handlePaymentAdded"
          @delete-payment="handleDeletePayment"
        />
      </transition>
    </div>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top right"
    >
      <div class="d-flex align-center gap-2">
        <v-icon>{{ snackbarIcon }}</v-icon>
        <span>{{ snackbarMessage }}</span>
      </div>
    </v-snackbar>
  </div>
</template>

<script src="./StallPayments.js"></script>
<style scoped src="./StallPayments.css"></style>
