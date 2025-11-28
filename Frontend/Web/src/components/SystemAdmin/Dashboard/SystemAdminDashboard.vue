<template>
  <v-app>
    <v-main>
      <v-container fluid class="system-admin-dashboard">

        <!-- Statistics Cards -->
        <DashboardStats :dashboardStats="dashboardStats" class="mb-6" />

        <!-- Recent Business Owners Table -->
        <DashboardTable :recentOwners="recentOwners" :loading="loading" />

      </v-container>
    </v-main>
  </v-app>
</template>

<script src="./SystemAdminDashboard.js"></script>
<style scoped src="./SystemAdminDashboard.css"></style>
