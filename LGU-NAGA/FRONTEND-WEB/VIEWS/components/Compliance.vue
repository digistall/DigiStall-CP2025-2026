<!-- eslint-disable vue/multi-word-component-names -->
<!-- Compliance.vue -->
<template>
  <v-app>
    <!-- Main Content -->
    <v-main class="compliance-main-content">
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
            <v-btn variant="text" size="small" @click="loadComplianceData" class="ml-2">Retry</v-btn>
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
    </v-main>
  </v-app>
</template>

<script src="./Compliance.js"></script>
<style scoped src="./Compliance.css"></style>
