<template>
  <v-row class="mb-6">
    <!-- Monthly Revenue Card -->
    <v-col cols="12" md="6">
      <v-card class="report-card" elevation="3">
        <v-card-title class="report-header">
          <v-icon color="primary" class="mr-2">mdi-cash-multiple</v-icon>
          Monthly Revenue Report
        </v-card-title>
        <v-card-text>
          <div class="revenue-comparison">
            <div class="revenue-item current">
              <div class="revenue-icon-wrapper primary-gradient">
                <v-icon size="28" color="white">mdi-trending-up</v-icon>
              </div>
              <div class="revenue-info">
                <div class="revenue-label">This Month</div>
                <div class="revenue-value">₱{{ formatCurrency(monthlyRevenue) }}</div>
              </div>
            </div>
            <v-divider class="my-4"></v-divider>
            <div class="revenue-item previous">
              <div class="revenue-icon-wrapper secondary-gradient">
                <v-icon size="28" color="white">mdi-calendar-month</v-icon>
              </div>
              <div class="revenue-info">
                <div class="revenue-label">Last Month</div>
                <div class="revenue-value secondary">₱{{ formatCurrency(lastMonthRevenue) }}</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Subscription Status Distribution Card -->
    <v-col cols="12" md="6">
      <v-card class="report-card" elevation="3">
        <v-card-title class="report-header">
          <v-icon color="primary" class="mr-2">mdi-chart-pie</v-icon>
          Subscription Status Distribution
        </v-card-title>
        <v-card-text>
          <div class="status-distribution">
            <div class="status-item">
              <v-chip color="success" variant="flat" size="small" class="font-weight-bold">Active</v-chip>
              <span class="status-count success-text">{{ statusCounts.Active || 0 }}</span>
            </div>
            <div class="status-item">
              <v-chip color="warning" variant="flat" size="small" class="font-weight-bold">Pending</v-chip>
              <span class="status-count warning-text">{{ statusCounts.Pending || 0 }}</span>
            </div>
            <div class="status-item">
              <v-chip color="error" variant="flat" size="small" class="font-weight-bold">Expired</v-chip>
              <span class="status-count error-text">{{ statusCounts.Expired || 0 }}</span>
            </div>
            <div class="status-item">
              <v-chip color="grey" variant="flat" size="small" class="font-weight-bold">Suspended</v-chip>
              <span class="status-count grey-text">{{ statusCounts.Suspended || 0 }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'ReportCards',
  props: {
    monthlyRevenue: {
      type: Number,
      default: 0
    },
    lastMonthRevenue: {
      type: Number,
      default: 0
    },
    statusCounts: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    }
  }
}
</script>

<style scoped src="./ReportCards.css"></style>
