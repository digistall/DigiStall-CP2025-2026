<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-app>
    <div class="payment-page">
      <!-- Main Content -->
      <v-main>
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
                <StallPayments v-if="selectedPaymentType === 'stall'" />
                
                <!-- Vendor Applicants Payment Section (Blank for now) -->
                <div v-else class="vendor-section">
                  <v-card class="vendor-placeholder" elevation="2">
                    <v-card-text class="text-center pa-12">
                      <v-icon size="80" color="grey-lighten-1">mdi-account-tie</v-icon>
                      <h3 class="text-h5 mt-4 mb-2 text-grey-darken-1">
                        Vendor Applicants Payment
                      </h3>
                      <p class="text-body-1 text-grey">
                        This section is currently being developed and will be available soon.
                      </p>
                      <p class="text-body-2 text-grey mt-4">
                        Focus is on Stall Applicants payment processing.
                      </p>
                    </v-card-text>
                  </v-card>
                </div>
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
