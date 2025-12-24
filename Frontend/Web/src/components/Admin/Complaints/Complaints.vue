<!-- eslint-disable vue/multi-word-component-names -->
<!-- Complaints.vue -->
<template>
  <v-app>
    <!-- Main Content -->
    <v-main class="complaints-main-content">
      <!-- Standardized Loading Overlay - contained within main content -->
      <LoadingOverlay 
        :loading="isLoading" 
        text="Loading complaints..."
        :full-page="false"
      />

      <v-row>
        <v-col cols="12">
          <!-- Search Component -->
          <ComplaintsSearch @search="handleSearch" />

          <!-- Table Component -->
          <ComplaintsTable
            :searchQuery="searchQuery"
            :activeFilter="activeFilter"
            :complaintsList="complaintsList"
            @view-complaints="handleViewComplaints"
            @edit-complaints="handleEditComplaints"
            @delete-complaints="handleDeleteComplaints"
          />
          <!-- View Complaints Modal -->
          <ViewComplaints
            :isVisible="showViewComplaintsModal"
            :complaints="selectedComplaints"
            @close="closeViewComplaintsModal"
          />
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<script src="./Complaints.js"></script>
<style scoped src="./Complaints.css"></style>
