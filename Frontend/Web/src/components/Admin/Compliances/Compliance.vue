<!-- eslint-disable vue/multi-word-component-names -->
<!-- Compliance.vue -->
<template>
  <v-app>
    <!-- Main Content -->
    <v-main>
      <v-row>
        <v-col cols="12">
          <!-- Search Component -->
          <ComplianceSearch @search="handleSearch" />

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center pa-6">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4 text-subtitle-1">Loading compliance records...</p>
          </div>

          <!-- Error State -->
          <v-alert v-else-if="error" type="error" class="ma-4" dismissible @click:close="error = null">
            <strong>Error:</strong> {{ error }}
            <v-btn variant="text" size="small" @click="loadComplianceData" class="ml-2">Retry</v-btn>
          </v-alert>

          <!-- Table Component -->
          <ComplianceTable
            v-else
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
