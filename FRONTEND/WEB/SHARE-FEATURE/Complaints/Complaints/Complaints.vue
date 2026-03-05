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
            :isResolvingFromParent="isResolvingComplaint"
            @close="closeViewComplaintsModal"
            @resolve-complaint="handleResolveComplaint"
            @edit-complaints="handleEditComplaints"
          />
        </v-col>
      </v-row>
    </v-main>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSuccessSnackbar"
      :timeout="4000"
      location="bottom left"
      class="custom-snackbar success-snackbar"
    >
      <div class="d-flex align-center" style="background-color: #ffffff;">
        <v-icon class="mr-2" style="color: #4caf50;">mdi-check-circle</v-icon>
        <span style="color: #2e7d32; font-weight: 500;">{{ snackbarMessage }}</span>
      </div>
      <template v-slot:actions>
        <v-btn variant="text" style="color: #4caf50;" @click="showSuccessSnackbar = false">Close</v-btn>
      </template>
    </v-snackbar>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="showErrorSnackbar"
      :timeout="4000"
      location="bottom left"
      class="custom-snackbar error-snackbar"
    >
      <div class="d-flex align-center" style="background-color: #ffffff;">
        <v-icon class="mr-2" style="color: #f44336;">mdi-alert-circle</v-icon>
        <span style="color: #c62828; font-weight: 500;">{{ snackbarMessage }}</span>
      </div>
      <template v-slot:actions>
        <v-btn variant="text" style="color: #f44336;" @click="showErrorSnackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script src="./Complaints.js"></script>
<style scoped src="./Complaints.css"></style>
