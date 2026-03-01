<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-app>
    <div class="payment-page">
      <!-- Main Content -->
      <v-main class="payment-main-content">
        <!-- Standardized Loading Overlay - contained within main content -->
        <LoadingOverlay :loading="loading" text="Loading payment data..." :full-page="false" />

        <v-container fluid class="main-content">
          <v-row>
            <v-col cols="12">
              <!-- Payment Type Selector -->
              <PaymentTypeSelector
                :selected-type="selectedPaymentType"
                @update:selected-type="handleTypeChange"
              />

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
        </v-container>
      </v-main>
    </div>
  </v-app>
</template>

<script src="./Payment.js"></script>
<style scoped src="./Payment.css"></style>
