<!-- eslint-disable vue/multi-word-component-names -->
<!-- Compliance.vue -->
<template>
  <div class="compliance-container">
    <!-- Main Content -->
    <div class="compliance-main-content">
      <!-- Standardized Loading Overlay - contained within main content -->
      <LoadingOverlay
        :loading="isLoading"
        text="Loading compliance records..."
        :full-page="false"
      />

      <v-row>
        <v-col cols="12">
          <!-- Search Component -->
          <ComplianceSearch @search="handleSearch" />

          <!-- Error State -->
          <v-alert v-if="error" type="error" class="ma-4" dismissible @click:close="error = null">
            <strong>Error:</strong> {{ error }}
            <v-btn variant="text" size="small" @click="loadComplianceData" class="ml-2"
              >Retry</v-btn
            >
          </v-alert>

          <!-- Table Component -->
          <ComplianceTable
            v-if="!error"
            :searchQuery="searchQuery"
            :activeFilter="activeFilter"
            :complianceList="complianceList"
            @view-compliance="handleViewCompliance"
            @edit-compliance="handleEditCompliance"
            @delete-compliance="handleDeleteCompliance"
          />
          <!-- View Compliance Modal -->
          <ViewCompliance
            :isVisible="showViewComplianceModal"
            :compliance="selectedCompliance"
            @close="closeViewComplianceModal"
          />
        </v-col>
      </v-row>
    </div>

    <!-- CRUD Loading Overlay -->
    <CrudLoadingOverlay
      :visible="crudLoading.visible"
      :operation="crudLoading.operation"
      :entity="crudLoading.entity"
      :message="crudLoading.message"
      :sub-message="crudLoading.subMessage"
      :full-page="false"
    />

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSuccessSnackbar"
      :timeout="4000"
      location="bottom left"
      color="#4caf50"
    >
      <v-icon class="mr-2">mdi-check-circle</v-icon>
      {{ snackbarMessage }}
    </v-snackbar>

    <!-- Error Snackbar -->
    <v-snackbar v-model="showErrorSnackbar" :timeout="4000" location="bottom left" color="#f44336">
      <v-icon class="mr-2">mdi-alert-circle</v-icon>
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script src="./Compliance.js"></script>
<style scoped src="./Compliance.css"></style>
