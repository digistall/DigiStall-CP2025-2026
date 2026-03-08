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
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./Payment.js"></script>
<style scoped src="./Payment.css"></style>
