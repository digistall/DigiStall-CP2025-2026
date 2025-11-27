<template>
  <div class="my-subscription-page">
    <h1 class="page-title">My Subscription</h1>

    <!-- Current Subscription Card -->
    <v-card class="mb-6" elevation="2">
      <v-card-title>Current Subscription Plan</v-card-title>
      <v-card-text>
        <v-row v-if="!loading && subscription">
          <v-col cols="12" md="6">
            <div class="subscription-info">
              <h2 class="plan-name">{{ subscription.plan_name }}</h2>
              <p class="plan-description">{{ subscription.plan_description }}</p>
              
              <v-chip
                :color="getStatusColor(subscription.subscription_status)"
                text-color="white"
                class="my-3"
              >
                {{ subscription.subscription_status }}
              </v-chip>

              <div class="subscription-details">
                <div class="detail-row">
                  <span class="detail-label">Monthly Fee:</span>
                  <span class="detail-value">₱{{ formatCurrency(subscription.monthly_fee) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Subscription Start:</span>
                  <span class="detail-value">{{ subscription.start_date }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Subscription End:</span>
                  <span class="detail-value">{{ subscription.end_date }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Days Until Expiry:</span>
                  <span class="detail-value" :class="{ 'text-red': subscription.days_until_expiry < 7 }">
                    {{ subscription.days_until_expiry }} days
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Last Payment:</span>
                  <span class="detail-value">{{ subscription.last_payment_date || 'No payment yet' }}</span>
                </div>
              </div>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="plan-features">
              <h3>Plan Features</h3>
              <div class="feature-list">
                <div class="feature-item">
                  <v-icon color="primary">mdi-check-circle</v-icon>
                  <span>Max {{ subscription.max_branches }} branches</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary">mdi-check-circle</v-icon>
                  <span>Max {{ subscription.max_employees }} employees</span>
                </div>
                <div v-if="subscription.features" class="feature-item">
                  <v-icon color="primary">mdi-check-circle</v-icon>
                  <span>Max {{ subscription.features.max_stalls || 'Unlimited' }} stalls</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary">mdi-check-circle</v-icon>
                  <span>{{ subscription.features?.priority_support ? 'Priority Support' : 'Standard Support' }}</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary">mdi-check-circle</v-icon>
                  <span>{{ subscription.features?.advanced_reporting ? 'Advanced Reporting' : 'Basic Reporting' }}</span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
        <div v-else-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <div v-else class="text-center py-6">
          <p>No subscription found. Please contact the system administrator.</p>
        </div>
      </v-card-text>
      <v-card-actions v-if="!loading && subscription">
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="showUpgradeDialog = true">
          <v-icon left>mdi-arrow-up-circle</v-icon>
          Change Plan
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Available Plans Dialog -->
    <v-dialog v-model="showUpgradeDialog" max-width="1200px" scrollable>
      <v-card>
        <v-card-title class="text-h5">
          Choose Your Subscription Plan
          <v-spacer></v-spacer>
          <v-btn icon @click="showUpgradeDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-row v-if="loadingPlans" class="justify-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </v-row>
          
          <v-row v-else>
            <v-col
              v-for="plan in availablePlans"
              :key="plan.plan_id"
              cols="12"
              md="4"
            >
              <v-card
                :class="{ 'current-plan-card': plan.plan_id === subscription?.plan_id }"
                elevation="3"
                outlined
              >
                <v-card-title class="justify-center text-h5 pb-2">
                  {{ plan.plan_name }}
                  <v-chip
                    v-if="plan.plan_id === subscription?.plan_id"
                    color="success"
                    size="small"
                    class="ml-2"
                  >
                    Current
                  </v-chip>
                </v-card-title>
                
                <v-card-subtitle class="text-center">
                  {{ plan.plan_description }}
                </v-card-subtitle>
                
                <v-card-text>
                  <div class="text-center mb-4">
                    <div class="text-h3 primary--text font-weight-bold">
                      ₱{{ formatCurrency(plan.monthly_fee) }}
                    </div>
                    <div class="text-caption grey--text">per month</div>
                  </div>
                  
                  <v-divider class="mb-4"></v-divider>
                  
                  <div class="plan-features-list">
                    <div class="feature-item-sm">
                      <v-icon color="success" size="small">mdi-check-circle</v-icon>
                      <span>{{ plan.max_branches }} Branch{{ plan.max_branches > 1 ? 'es' : '' }}</span>
                    </div>
                    <div class="feature-item-sm">
                      <v-icon color="success" size="small">mdi-check-circle</v-icon>
                      <span>{{ plan.max_employees }} Employee{{ plan.max_employees > 1 ? 's' : '' }}</span>
                    </div>
                    <div v-if="plan.features" class="feature-item-sm">
                      <v-icon color="success" size="small">mdi-check-circle</v-icon>
                      <span>{{ plan.features.max_stalls || 'Unlimited' }} Stalls</span>
                    </div>
                    <div class="feature-item-sm">
                      <v-icon color="success" size="small">mdi-check-circle</v-icon>
                      <span>{{ plan.features?.priority_support ? 'Priority' : 'Standard' }} Support</span>
                    </div>
                    <div class="feature-item-sm">
                      <v-icon color="success" size="small">mdi-check-circle</v-icon>
                      <span>{{ plan.features?.advanced_reporting ? 'Advanced' : 'Basic' }} Reporting</span>
                    </div>
                  </div>
                </v-card-text>
                
                <v-card-actions class="justify-center pb-4">
                  <v-btn
                    v-if="plan.plan_id !== subscription?.plan_id"
                    color="primary"
                    block
                    @click="selectPlan(plan)"
                    :loading="selectingPlanId === plan.plan_id"
                  >
                    Select Plan
                  </v-btn>
                  <v-btn
                    v-else
                    color="grey"
                    block
                    disabled
                  >
                    Current Plan
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Payment History -->
    <v-card elevation="2">
      <v-card-title>Payment History</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="payments"
          :loading="loadingPayments"
          class="elevation-1"
        >
          <template #[`item.amount`]="{ item }">
            ₱{{ formatCurrency(item.amount) }}
          </template>
          <template #[`item.payment_status`]="{ item }">
            <v-chip
              :color="getPaymentStatusColor(item.payment_status)"
              text-color="white"
              small
            >
              {{ item.payment_status }}
            </v-chip>
          </template>
          <template #[`item.receipt_number`]="{ item }">
            <v-chip size="small" color="primary" variant="outlined">
              {{ item.receipt_number }}
            </v-chip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script src="./MySubscription.js"></script>
<style scoped src="./MySubscription.css"></style>
