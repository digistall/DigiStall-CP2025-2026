<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="payment-container">
    <div class="payment-page">
      <!-- Main Content -->
      <div class="payment-main-content">
        <!-- Standardized Loading Overlay - contained within main content -->
        <LoadingOverlay :loading="loading" text="Loading payment data..." :full-page="false" />

        <div class="feature-content-inner">
          <v-row>
            <v-col cols="12">
              <!-- Tab Navigation Container -->
              <v-card elevation="2" class="rounded-lg mb-4 d-inline-flex">
                <v-tabs
                  v-model="selectedPaymentType"
                  color="primary"
                  bg-color="white"
                  slider-color="primary"
                  align-tabs="start"
                >
                  <v-tab value="stall" class="text-subtitle-1 font-weight-bold"
                    >STALL APPLICANTS</v-tab
                  >
                  <v-tab value="daily" class="text-subtitle-1 font-weight-bold"
                    >DAILY PAYMENTS</v-tab
                  >
                  <v-tab value="penalty" class="text-subtitle-1 font-weight-bold"
                    >PENALTY PAYMENTS</v-tab
                  >
                </v-tabs>
              </v-card>

              <!-- Stall Applicants Payment Section -->
              <transition name="slide-fade" mode="out-in">
                <StallPayments v-if="selectedPaymentType === 'stall'" @loading="handleLoading" />

                <!-- Daily Payment Section -->
                <DailyPayments
                  v-else-if="selectedPaymentType === 'daily'"
                  @loading="handleLoading"
                />

                <!-- Penalty Payments Section -->
                <PenaltyPayments
                  v-else-if="selectedPaymentType === 'penalty'"
                  @loading="handleLoading"
                />
              </transition>
            </v-col>
          </v-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./Payment.js"></script>
<style scoped src="./Payment.css"></style>
