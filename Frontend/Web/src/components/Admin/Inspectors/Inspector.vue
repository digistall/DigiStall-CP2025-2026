<!-- eslint-disable vue/multi-word-component-names -->
<!-- Inspector.vue -->
<template>
  <v-app>
    <!-- Main Content -->
    <v-main>
      <v-row>
        <v-col cols="12">
          <!-- Search Component -->
          <InspectorSearch @search="handleSearch" />

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center pa-6">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4 text-subtitle-1">Loading inspectors...</p>
          </div>

          <!-- Error State -->
          <v-alert v-else-if="error" type="error" class="ma-4" dismissible @click:close="error = null">
            <strong>Error:</strong> {{ error }}
            <v-btn variant="text" size="small" @click="loadInspectorData" class="ml-2">Retry</v-btn>
          </v-alert>

          <!-- Table Component -->
          <InspectorTable
            v-else
            :searchQuery="searchQuery"
            :activeFilter="activeFilter"
            :inspectorList="inspectorList"
            @view-inspector="handleViewInspector"
            @edit-inspector="handleEditInspector"
            @delete-inspector="handleDeleteInspector"
          />

          <!-- View Inspector Modal -->
          <ViewInspector
            :isVisible="showViewInspectorModal"
            :inspector="selectedInspector"
            @close="closeViewInspectorModal"
          />
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<script src="./Inspector.js"></script>
<style scoped src="./Inspector.css"></style>
