<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="reports-page">
    <h1 class="page-title">Subscription Reports</h1>

    <!-- Report Cards -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card elevation="2">
          <v-card-title>Monthly Revenue Report</v-card-title>
          <v-card-text>
            <div class="report-stat">
              <div class="stat-label">This Month</div>
              <div class="stat-value">₱{{ formatCurrency(monthlyRevenue) }}</div>
            </div>
            <v-divider class="my-4"></v-divider>
            <div class="report-stat">
              <div class="stat-label">Last Month</div>
              <div class="stat-value secondary">₱{{ formatCurrency(lastMonthRevenue) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card elevation="2">
          <v-card-title>Subscription Status Distribution</v-card-title>
          <v-card-text>
            <div class="status-distribution">
              <div class="status-item">
                <v-chip color="green" text-color="white" small>Active</v-chip>
                <span class="status-count">{{ statusCounts.Active || 0 }}</span>
              </div>
              <div class="status-item">
                <v-chip color="orange" text-color="white" small>Pending</v-chip>
                <span class="status-count">{{ statusCounts.Pending || 0 }}</span>
              </div>
              <div class="status-item">
                <v-chip color="red" text-color="white" small>Expired</v-chip>
                <span class="status-count">{{ statusCounts.Expired || 0 }}</span>
              </div>
              <div class="status-item">
                <v-chip color="grey" text-color="white" small>Suspended</v-chip>
                <span class="status-count">{{ statusCounts.Suspended || 0 }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Plan Distribution -->
    <v-card class="mt-6" elevation="2">
      <v-card-title>Subscription Plan Distribution</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="planHeaders"
          :items="planDistribution"
          :loading="loading"
          class="elevation-1"
        >
          <template #[`item.revenue`]="{ item }">
            ₱{{ formatCurrency(item.revenue) }}
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Expiring Subscriptions -->
    <v-card class="mt-6" elevation="2">
      <v-card-title>Expiring Subscriptions (Next 30 Days)</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="expiringHeaders"
          :items="expiringSubscriptions"
          :loading="loading"
          class="elevation-1"
        >
          <template #[`item.days_until_expiry`]="{ item }">
            <span :class="{ 'text-red': item.days_until_expiry < 7 }">
              {{ item.days_until_expiry }} days
            </span>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script src="./Reports.js"></script>
<style scoped src="./Reports.css"></style>
