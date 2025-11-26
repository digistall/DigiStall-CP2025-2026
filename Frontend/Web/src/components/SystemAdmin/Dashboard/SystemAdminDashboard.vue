<template>
  <div class="system-admin-dashboard">
    <h1 class="dashboard-title">System Administrator Dashboard</h1>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <v-card class="stat-card" elevation="2">
        <v-card-text>
          <div class="stat-icon blue">
            <v-icon size="40">mdi-account-multiple</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.totalBusinessOwners || 0 }}</div>
            <div class="stat-label">Total Business Owners</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" elevation="2">
        <v-card-text>
          <div class="stat-icon green">
            <v-icon size="40">mdi-check-circle</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.activeSubscriptions || 0 }}</div>
            <div class="stat-label">Active Subscriptions</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" elevation="2">
        <v-card-text>
          <div class="stat-icon orange">
            <v-icon size="40">mdi-alert-circle</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.expiringSoon || 0 }}</div>
            <div class="stat-label">Expiring Soon</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" elevation="2">
        <v-card-text>
          <div class="stat-icon red">
            <v-icon size="40">mdi-close-circle</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.expiredSubscriptions || 0 }}</div>
            <div class="stat-label">Expired Subscriptions</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" elevation="2">
        <v-card-text>
          <div class="stat-icon teal">
            <v-icon size="40">mdi-cash</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">₱{{ formatCurrency(dashboardStats.revenueThisMonth || 0) }}</div>
            <div class="stat-label">Revenue This Month</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" elevation="2">
        <v-card-text>
          <div class="stat-icon purple">
            <v-icon size="40">mdi-currency-php</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">₱{{ formatCurrency(dashboardStats.totalRevenue || 0) }}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" elevation="2">
        <v-card-text>
          <div class="stat-icon amber">
            <v-icon size="40">mdi-clock-alert</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.pendingPayments || 0 }}</div>
            <div class="stat-label">Pending Payments</div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Recent Business Owners -->
    <v-card class="mt-6" elevation="2">
      <v-card-title>Recent Business Owners</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="recentOwners"
          :loading="loading"
          class="elevation-1"
        >
          <template #[`item.subscription_status`]="{ item }">
            <v-chip
              :color="getStatusColor(item.subscription_status)"
              text-color="white"
              small
            >
              {{ item.subscription_status }}
            </v-chip>
          </template>
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

<script src="./SystemAdminDashboard.js"></script>
<style scoped src="./SystemAdminDashboard.css"></style>
