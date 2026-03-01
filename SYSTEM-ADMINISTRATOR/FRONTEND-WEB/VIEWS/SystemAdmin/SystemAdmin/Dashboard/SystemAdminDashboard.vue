<template>
  <v-app>
    <v-main>
      <v-container fluid class="system-admin-dashboard">
        
        <!-- Welcome Header -->
        <div class="dashboard-header mb-6">
          <div class="header-content">
            <h1 class="dashboard-title">Welcome back, Admin</h1>
            <p class="dashboard-subtitle">Here's what's happening with your platform today</p>
          </div>
        </div>

        <!-- Statistics Cards -->
        <DashboardStats :dashboardStats="dashboardStats" class="mb-6" />

        <!-- Charts and AI Section -->
        <v-row class="mb-6">
          <!-- Revenue Chart -->
          <v-col cols="12" lg="8">
            <RevenueChart :revenueData="revenueData" />
          </v-col>
          
          <!-- Subscription Distribution -->
          <v-col cols="12" lg="4">
            <SubscriptionChart :subscriptionData="subscriptionData" />
          </v-col>
        </v-row>

        <!-- AI Suggestions and Quick Actions -->
        <v-row class="mb-6">
          <v-col cols="12" lg="8">
            <AISuggestions :dashboardStats="dashboardStats" />
          </v-col>
          
          <v-col cols="12" lg="4">
            <QuickActions @action="handleQuickAction" />
          </v-col>
        </v-row>

        <!-- Recent Business Owners Table -->
        <DashboardTable :recentOwners="recentOwners" :loading="loading" />

      </v-container>
    </v-main>
  </v-app>
</template>

<script src="./SystemAdminDashboard.js"></script>
<style scoped src="./SystemAdminDashboard.css"></style>

