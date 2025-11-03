<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-app>
    <!-- Main Content -->
    <v-main>
      <!-- Loading Overlay -->
      <v-overlay v-if="loading" contained>
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
        ></v-progress-circular>
        <div class="text-h6 mt-4">Loading stalls...</div>
      </v-overlay>

      <!-- Error State -->
      <v-alert v-if="error && !loading" type="error" prominent border="left" class="ma-4">
        <div class="text-h6">Failed to load stalls</div>
        <div>{{ error }}</div>
        <template v-slot:append>
          <v-btn color="red" variant="text" @click="retryFetch"> Retry </v-btn>
        </template>
      </v-alert>

      <!-- Main Content when loaded -->
      <div v-if="!loading && !error">
        <v-row>
          <v-col cols="12">
            <!-- Search Filter Component -->
            <SearchFilter
              ref="searchFilter"
              :stallsData="stallsData"
              @filtered-stalls="handleFilteredStalls"
            />

            <!-- Card Stalls Component -->
            <CardStallsComponent
              v-if="hasStalls"
              :stalls="displayStalls"
              @stall-edit="handleStallEdit"
              @stall-raffle-management="handleRaffleManagement"
              @stall-auction-management="handleAuctionManagement"
            />
            <!-- Empty State when no stalls are found -->
            <div v-if="!hasStalls && !loading" class="empty-state">
              <v-card class="pa-8 text-center" elevation="2">
                <v-icon size="64" color="grey-lighten-2">mdi-store-off</v-icon>
                <h3 class="text-h6 mt-4 mb-2 text-grey-darken-1">No stalls found</h3>
                <p class="text-body-2 text-grey">
                  No stalls are available in the database. Use the floating add button to get started.
                </p>
              </v-card>
            </div>

            <!-- Empty State when filtered results are empty -->
            <div
              v-if="hasStalls && displayStalls.length === 0 && !loading"
              class="empty-state"
            >
              <v-card class="pa-8 text-center" elevation="2">
                <v-icon size="64" color="grey-lighten-2">mdi-filter-off</v-icon>
                <h3 class="text-h6 mt-4 mb-2 text-grey-darken-1">
                  No stalls match your filters
                </h3>
                <p class="text-body-2 text-grey">
                  Try adjusting your search criteria or clear all filters to see all
                  stalls.
                </p>
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="refreshStalls"
                  class="mt-4"
                >
                  <v-icon left>mdi-refresh</v-icon>
                  Clear Filters
                </v-btn>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Add Choice Modal Component -->
      <AddChoiceModal
        :showModal="showModal"
        @open-modal="openAddStallModal"
        @close-modal="closeAddStallModal"
        @stall-added="handleStallAdded"
        @floor-added="handleFloorAdded"
        @section-added="handleSectionAdded"
        @show-message="showMessage"
        @show-warning-container="handleShowWarningContainer"
        @refresh-data="handleRefreshData"
      />

      <!-- Edit Stall Modal Component -->
      <EditStall
        :showModal="showEditModal"
        :stallData="selectedStall"
        @close="handleEditModalClose"
        @stall-updated="handleStallUpdated"
        @stall-deleted="handleStallDeleted"
        @error="handleEditError"
      />
    </v-main>

    <!-- Warning Container Dialog -->
    <v-dialog 
      v-model="showWarningContainer" 
      max-width="400" 
      persistent
    >
      <v-card>
        <v-card-title class="text-h6 bg-primary text-white">
          <v-icon class="mr-2" color="white">mdi-information</v-icon>
          {{ warningData.title }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert 
            type="info" 
            variant="tonal" 
            class="mb-0"
          >
            {{ warningData.message }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            color="primary" 
            variant="flat"
            @click="closeWarningAndShowModal"
          >
            Continue
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Custom Universal Popup -->
    <UniversalPopup
      :show="popup.show"
      :message="popup.message"
      :type="popup.type"
      :operation="popup.operation"
      :operationType="popup.operationType"
      @close="popup.show = false"
    />
  </v-app>
</template>

<script src="./Stalls.js"></script>
<style scoped src="./Stalls.css"></style>
