<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="stallholders-container">
    <div>
      <!-- Main Content -->
      <div class="stallholders-main-content">
        <div class="feature-content-inner">
          <!-- Standardized Loading Overlay - contained within main content -->
          <LoadingOverlay :loading="loading" text="Loading stallholders..." :full-page="false" />

          <v-row>
            <v-col cols="12">
              <!-- Search Component -->
              <SearchStall @search="handleSearch" @open-activity-log="openActivityLogDialog" />

              <!-- Table Component -->
              <TableStall
                :searchQuery="searchQuery"
                :activeFilter="activeFilter"
                @loading-change="handleLoadingChange"
                @data-ready="handleDataReady"
              />

              <!-- Stallholder Activity Log Dialog -->
              <ActivityLogDialog
                v-model="showActivityLogDialog"
                @close="closeActivityLogDialog"
              />

              <!-- Documents View Modal -->
              <DocumentsView
                :isVisible="showDocumentsModal"
                :stallholder="selectedStallholder"
                @close="closeDocumentsModal"
                @view-document="handleViewDocument"
              />

              <!-- Document Detail Modal -->
              <DocumentDetail
                :isVisible="showDocumentDetail"
                :document="selectedDocument"
                :stallholder="selectedStallholder"
                @close="closeDocumentDetail"
                @accept-document="handleAcceptDocument"
                @decline-document="handleDeclineDocument"
              />

              <!-- Add Stallholder Modal -->
              <AddStallholder
                :isVisible="showAddStallholderModal"
                @close="closeAddStallholderModal"
                @add-stallholder="handleAddStallholderSubmit"
                @stallholder-added="handleStallholderAdded"
              />
            </v-col>
          </v-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./Stallholders.js"></script>
<style scoped src="./Stallholders.css"></style>
