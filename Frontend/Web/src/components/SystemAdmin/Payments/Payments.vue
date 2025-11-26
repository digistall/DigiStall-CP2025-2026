<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="payments-page">
    <h1 class="page-title">Subscription Payments</h1>

    <!-- Filter Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="filter.businessOwnerId"
              :items="businessOwners"
              item-title="full_name"
              item-value="business_owner_id"
              label="Filter by Business Owner"
              clearable
              @update:modelValue="loadPayments"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filter.status"
              :items="['Completed', 'Pending', 'Failed', 'Refunded']"
              label="Filter by Status"
              clearable
              @update:modelValue="loadPayments"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filter.paymentMethod"
              :items="paymentMethods"
              label="Filter by Payment Method"
              clearable
              @update:modelValue="loadPayments"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Payments Table -->
    <v-card elevation="2">
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="payments"
          :loading="loading"
          class="elevation-1"
        >
          <template #[`item.payment_status`]="{ item }">
            <v-chip
              :color="getPaymentStatusColor(item.payment_status)"
              text-color="white"
              small
            >
              {{ item.payment_status }}
            </v-chip>
          </template>
          <template #[`item.amount`]="{ item }">
            ₱{{ formatCurrency(item.amount) }}
          </template>
          <template #[`item.receipt_number`]="{ item }">
            <v-chip size="small" color="primary" variant="outlined">
              {{ item.receipt_number }}
            </v-chip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Payment Summary -->
    <v-row class="mt-6">
      <v-col cols="12" md="3">
        <v-card elevation="2">
          <v-card-text>
            <div class="summary-label">Total Payments</div>
            <div class="summary-value">{{ payments.length }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="2">
          <v-card-text>
            <div class="summary-label">Total Amount</div>
            <div class="summary-value">₱{{ formatCurrency(totalAmount) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="2">
          <v-card-text>
            <div class="summary-label">Completed</div>
            <div class="summary-value completed">{{ completedCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="2">
          <v-card-text>
            <div class="summary-label">Pending</div>
            <div class="summary-value pending">{{ pendingCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script src="./Payments.js"></script>
<style scoped src="./Payments.css"></style>
