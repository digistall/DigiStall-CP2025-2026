<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row class="mb-4">
          <v-col>
            <h1 class="page-title">Reports & Analytics</h1>
            <p class="page-subtitle">View subscription and revenue reports</p>
          </v-col>
        </v-row>

        <!-- Report Cards Component -->
        <ReportCards
          :monthly-revenue="monthlyRevenue"
          :last-month-revenue="lastMonthRevenue"
          :status-counts="statusCounts"
        />

        <!-- Plan Distribution Table Component -->
        <PlanDistributionTable
          :plan-distribution="planDistribution"
          :headers="planHeaders"
          :loading="loading"
        />

        <!-- Expiring Subscriptions Table Component -->
        <ExpiringSubscriptionsTable
          :expiring-subscriptions="expiringSubscriptions"
          :headers="expiringHeaders"
          :loading="loading"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script src="./Reports.js"></script>
<style scoped src="./Reports.css"></style>
