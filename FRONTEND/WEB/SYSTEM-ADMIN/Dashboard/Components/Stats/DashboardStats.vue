<template>
  <v-row class="mb-6">
    <v-col cols="12" sm="6" md="4" lg="3">
      <v-card class="stat-card" elevation="0">
        <v-card-text class="stat-content">
          <div class="stat-icon-wrapper primary-gradient">
            <v-icon color="white">mdi-account-group</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.totalBusinessOwners || 0 }}</div>
            <div class="stat-label">Total Business Owners</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="4" lg="3">
      <v-card class="stat-card" elevation="0">
        <v-card-text class="stat-content">
          <div class="stat-icon-wrapper success-gradient">
            <v-icon color="white">mdi-check-decagram</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.activeSubscriptions || 0 }}</div>
            <div class="stat-label">Active Subscriptions</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="4" lg="3">
      <v-card class="stat-card" elevation="0">
        <v-card-text class="stat-content">
          <div class="stat-icon-wrapper warning-gradient">
            <v-icon color="white">mdi-clock-alert-outline</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.expiringSoon || 0 }}</div>
            <div class="stat-label">Expiring Soon</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="4" lg="3">
      <v-card class="stat-card" elevation="0">
        <v-card-text class="stat-content">
          <div class="stat-icon-wrapper error-gradient">
            <v-icon color="white">mdi-cancel</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.expiredSubscriptions || 0 }}</div>
            <div class="stat-label">Expired Subscriptions</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="4">
      <v-card class="stat-card" elevation="0">
        <v-card-text class="stat-content">
          <div class="stat-icon-wrapper info-gradient">
            <v-icon color="white">mdi-chart-line-variant</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">₱{{ formatCurrency(dashboardStats.revenueThisMonth || 0) }}</div>
            <div class="stat-label">Revenue This Month</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="4">
      <v-card class="stat-card" elevation="0">
        <v-card-text class="stat-content">
          <div class="stat-icon-wrapper purple-gradient">
            <v-icon color="white">mdi-cash-multiple</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">₱{{ formatCurrency(dashboardStats.totalRevenue || 0) }}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="4">
      <v-card class="stat-card" elevation="0">
        <v-card-text class="stat-content">
          <div class="stat-icon-wrapper amber-gradient">
            <v-icon color="white">mdi-timer-sand</v-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardStats.pendingPayments || 0 }}</div>
            <div class="stat-label">Pending Payments</div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'DashboardStats',
  props: {
    dashboardStats: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatCurrency(amount) {
      return parseFloat(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  }
}
</script>

<style scoped src="./DashboardStats.css"></style>
