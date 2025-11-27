<template>
  <div class="my-subscription-page">
    <!-- Loading State -->
    <div v-if="loading || loadingPlans" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-grey">Loading subscription plans...</p>
    </div>

    <!-- Pricing Tier Cards -->
    <div v-else>
      <div class="pricing-tiers-section mb-8">
        <h2 class="section-heading">Choose Your Plan</h2>
        <p class="section-subtitle">Scale your business with the perfect subscription plan</p>
        <v-row>
          <v-col
            v-for="plan in availablePlans"
            :key="plan.plan_id"
            cols="12"
            md="4"
          >
            <div 
              class="pricing-card"
              :class="{ 
                'pricing-card-active': plan.plan_id === subscription?.plan_id,
                'pricing-card-premium': plan.plan_name.includes('Premium'),
                'pricing-card-recommended': plan.plan_name.includes('Premium')
              }"
            >
              <!-- Recommended Badge (Premium Plan Only) -->
              <div v-if="plan.plan_name.includes('Premium')" class="recommended-badge">
                <v-icon size="small">mdi-star</v-icon>
                <span>MOST POPULAR</span>
              </div>

              <!-- Current Plan Badge -->
              <div v-if="plan.plan_id === subscription?.plan_id" class="current-badge">
                <v-icon size="small" color="white">mdi-check-circle</v-icon>
                <span>Current Plan</span>
              </div>

              <!-- Plan Name -->
              <div class="plan-header">
                <h3 class="plan-title">{{ plan.plan_name }}</h3>
                <p class="plan-subtitle">{{ plan.plan_description }}</p>
              </div>

              <!-- Pricing -->
              <div class="pricing-amount">
                <div class="price-container">
                  <span class="currency">₱</span>
                  <span class="price">{{ formatCurrency(plan.monthly_fee) }}</span>
                </div>
                <p class="billing-period">per month</p>
              </div>

              <!-- Features List -->
              <div class="features-section">
                <div class="feature-row">
                  <v-icon class="feature-icon" color="primary">mdi-check</v-icon>
                  <span class="feature-text">
                    <strong>{{ plan.max_branches }}</strong> 
                    {{ plan.max_branches === 1 ? 'Branch' : 'Branches' }}
                  </span>
                </div>
                <div class="feature-row">
                  <v-icon class="feature-icon" color="primary">mdi-check</v-icon>
                  <span class="feature-text">
                    <strong>{{ plan.max_employees }}</strong> 
                    {{ plan.max_employees === 1 ? 'Employee' : 'Employees' }}
                  </span>
                </div>
                <div class="feature-row">
                  <v-icon class="feature-icon" color="primary">mdi-check</v-icon>
                  <span class="feature-text">
                    <strong>{{ plan.features?.max_stalls || 'Unlimited' }}</strong> 
                    Stalls
                  </span>
                </div>
                <div class="feature-row">
                  <v-icon class="feature-icon" color="primary">mdi-check</v-icon>
                  <span class="feature-text">
                    {{ plan.features?.priority_support ? 'Priority' : 'Standard' }} Support
                  </span>
                </div>
                <div class="feature-row">
                  <v-icon class="feature-icon" color="primary">mdi-check</v-icon>
                  <span class="feature-text">
                    {{ plan.features?.advanced_reporting ? 'Advanced' : 'Basic' }} Reporting
                  </span>
                </div>
              </div>

              <!-- Action Button -->
              <div class="card-actions">
                <v-btn
                  v-if="plan.plan_id !== subscription?.plan_id"
                  color="primary"
                  block
                  size="large"
                  elevation="0"
                  @click="selectPlan(plan)"
                  :loading="selectingPlanId === plan.plan_id"
                >
                  Select Plan
                </v-btn>
                <v-btn
                  v-else
                  color="primary"
                  variant="outlined"
                  block
                  size="large"
                  disabled
                >
                  Active Plan
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Current Subscription Status -->
      <v-card v-if="subscription" class="subscription-status-card mb-8" elevation="2">
        <v-card-text>
          <v-row align="center">
            <v-col cols="12" md="3">
              <div class="status-item">
                <p class="status-label">Status</p>
                <v-chip
                  :color="getStatusColor(subscription.subscription_status)"
                  text-color="white"
                  size="small"
                >
                  {{ subscription.subscription_status }}
                </v-chip>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="status-item">
                <p class="status-label">Start Date</p>
                <p class="status-value">{{ subscription.start_date }}</p>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="status-item">
                <p class="status-label">End Date</p>
                <p class="status-value">{{ subscription.end_date }}</p>
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="status-item">
                <p class="status-label">Days Until Expiry</p>
                <p class="status-value" :class="{ 'text-warning': subscription.days_until_expiry < 7 }">
                  {{ subscription.days_until_expiry }} days
                </p>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Payment History Table -->
      <div class="payment-history-section">
        <h2 class="section-heading">Payment History</h2>
        <v-card elevation="2">
          <v-card-text class="pa-0">
            <v-data-table
              :headers="headers"
              :items="payments"
              :loading="loadingPayments"
              :items-per-page="10"
              class="payment-table"
            >
              <!-- Amount Column -->
              <template #[`item.amount`]="{ item }">
                <span class="amount-text">₱{{ formatCurrency(item.amount) }}</span>
              </template>

              <!-- Payment Status Column -->
              <template #[`item.payment_status`]="{ item }">
                <v-chip
                  :color="getPaymentStatusColor(item.payment_status)"
                  text-color="white"
                  size="small"
                >
                  {{ item.payment_status }}
                </v-chip>
              </template>

              <!-- Receipt Number Column -->
              <template #[`item.receipt_number`]="{ item }">
                <v-chip size="small" color="primary" variant="outlined">
                  {{ item.receipt_number }}
                </v-chip>
              </template>

              <!-- Payment Date Column -->
              <template #[`item.payment_date`]="{ item }">
                <span class="date-text">{{ item.payment_date }}</span>
              </template>

              <!-- Payment Method Column -->
              <template #[`item.payment_method`]="{ item }">
                <v-chip size="small" variant="tonal" color="primary">
                  {{ item.payment_method }}
                </v-chip>
              </template>

              <!-- Empty State -->
              <template #no-data>
                <div class="text-center py-8">
                  <v-icon size="64" color="grey-lighten-2">mdi-receipt-text-outline</v-icon>
                  <p class="text-grey mt-4">No payment history available</p>
                </div>
              </template>

              <!-- Loading State -->
              <template #loading>
                <div class="text-center py-8">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  <p class="mt-4 text-grey">Loading payment history...</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Professional Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="600" persistent>
      <v-card class="confirmation-dialog">
        <!-- Dialog Header with Plan Color -->
        <div 
          class="dialog-header"
          :class="{
            'header-premium': selectedPlanForConfirm?.plan_name.includes('Premium'),
            'header-standard': selectedPlanForConfirm?.plan_name.includes('Standard'),
            'header-basic': selectedPlanForConfirm?.plan_name.includes('Basic')
          }"
        >
          <v-icon size="64" color="white" class="mb-3">
            {{ selectedPlanForConfirm?.plan_name.includes('Premium') ? 'mdi-crown' : 
               selectedPlanForConfirm?.plan_name.includes('Standard') ? 'mdi-briefcase' : 'mdi-storefront' }}
          </v-icon>
          <h2 class="dialog-title">{{ selectedPlanForConfirm?.plan_name }}</h2>
          <p class="dialog-subtitle">{{ selectedPlanForConfirm?.plan_description }}</p>
        </div>

        <!-- Dialog Content -->
        <v-card-text class="pa-6">
          <!-- Pricing Highlight -->
          <div class="price-highlight mb-6">
            <div class="price-label">Monthly Investment</div>
            <div class="price-display">
              <span class="currency-symbol">₱</span>
              <span class="price-value">{{ formatCurrency(selectedPlanForConfirm?.monthly_fee || 0) }}</span>
              <span class="price-period">/month</span>
            </div>
          </div>

          <!-- Features Comparison -->
          <div class="features-comparison mb-6">
            <div class="comparison-title mb-4">
              <v-icon color="primary" class="mr-2">mdi-check-decagram</v-icon>
              <span>What You'll Get</span>
            </div>
            
            <v-row>
              <v-col cols="6">
                <div class="feature-item">
                  <v-icon color="success" size="20">mdi-check-circle</v-icon>
                  <div class="feature-content">
                    <div class="feature-value">{{ selectedPlanForConfirm?.max_branches }}</div>
                    <div class="feature-label">Branches</div>
                  </div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="feature-item">
                  <v-icon color="success" size="20">mdi-check-circle</v-icon>
                  <div class="feature-content">
                    <div class="feature-value">{{ selectedPlanForConfirm?.max_employees }}</div>
                    <div class="feature-label">Employees</div>
                  </div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="feature-item">
                  <v-icon color="success" size="20">mdi-check-circle</v-icon>
                  <div class="feature-content">
                    <div class="feature-value">{{ selectedPlanForConfirm?.features?.max_stalls || 'Unlimited' }}</div>
                    <div class="feature-label">Stalls</div>
                  </div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="feature-item">
                  <v-icon color="success" size="20">mdi-check-circle</v-icon>
                  <div class="feature-content">
                    <div class="feature-value">{{ selectedPlanForConfirm?.features?.priority_support ? '24/7' : 'Standard' }}</div>
                    <div class="feature-label">Support</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Premium Plan Extra Benefits -->
          <v-alert
            v-if="selectedPlanForConfirm?.plan_name.includes('Premium')"
            type="success"
            variant="tonal"
            class="mb-4"
          >
            <div class="premium-benefits">
              <div class="benefit-header">
                <v-icon class="mr-2">mdi-star-circle</v-icon>
                <strong>Premium Exclusive Benefits</strong>
              </div>
              <ul class="benefits-list">
                <li>✨ Unlimited branches and employees</li>
                <li>🎯 Priority 24/7 customer support</li>
                <li>📊 Advanced analytics and reporting</li>
                <li>🚀 Early access to new features</li>
                <li>💎 Dedicated account manager</li>
              </ul>
            </div>
          </v-alert>

          <!-- Confirmation Message -->
          <div class="confirmation-message">
            <v-icon color="info" class="mr-2">mdi-information</v-icon>
            <span>Your subscription will be updated immediately upon confirmation.</span>
          </div>
        </v-card-text>

        <!-- Dialog Actions -->
        <v-card-actions class="pa-6 pt-0">
          <v-btn
            variant="outlined"
            size="large"
            @click="showConfirmDialog = false"
            :disabled="selectingPlanId !== null"
          >
            Cancel
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            size="large"
            elevation="2"
            @click="confirmPlanSelection"
            :loading="selectingPlanId === selectedPlanForConfirm?.plan_id"
          >
            <v-icon left class="mr-2">mdi-check-bold</v-icon>
            Confirm Subscription
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script src="./MySubscription.js"></script>
<style scoped src="./MySubscription.css"></style>
