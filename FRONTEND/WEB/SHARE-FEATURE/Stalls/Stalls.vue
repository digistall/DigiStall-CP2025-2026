<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="stalls-container">
    <!-- Main Content -->
    <div class="stalls-main-content">
      <!-- Standardized Loading Overlay - contained within main content -->
      <LoadingOverlay :loading="loading" text="Loading stalls..." :full-page="false" />

      <!-- Error State -->
      <v-alert v-if="error && !loading" type="error" prominent border="start" class="ma-4">
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
              :key="stallsUpdateKey"
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
                  No stalls are available in the database. Use the floating add button to get
                  started.
                </p>
              </v-card>
            </div>

            <!-- Empty State when filtered results are empty -->
            <div v-if="hasStalls && displayStalls.length === 0 && !loading" class="empty-state">
              <v-card class="pa-8 text-center" elevation="2">
                <v-icon size="64" color="grey-lighten-2">mdi-filter-off</v-icon>
                <h3 class="text-h6 mt-4 mb-2 text-grey-darken-1">No stalls match your filters</h3>
                <p class="text-body-2 text-grey">
                  Try adjusting your search criteria or clear all filters to see all stalls.
                </p>
                <v-btn color="primary" variant="outlined" @click="refreshStalls" class="mt-4">
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

      <!-- Raffle Participants Modal -->
      <RaffleParticipantsModal
        :show="showRaffleParticipantsModal"
        :stall="selectedRaffleStall"
        @close="closeRaffleParticipantsModal"
        @winner-selected="handleRaffleWinnerSelected"
        @show-message="handleShowMessage"
      />

      <!-- Auction Participants Modal -->
      <AuctionParticipantsModal
        :show="showAuctionParticipantsModal"
        :stall="selectedAuctionStall"
        @close="closeAuctionParticipantsModal"
        @winner-selected="handleAuctionWinnerSelected"
        @show-message="handleShowMessage"
      />
    </div>

    <!-- Warning Container Dialog -->
    <ConfirmDialog
      v-model="showWarningContainer"
      :title="warningData.title"
      :message="warningData.message"
      type="primary"
      confirm-text="Continue"
      cancel-text="Cancel"
      @confirm="closeWarningAndShowModal"
      @cancel="showWarningContainer = false"
    />

    <!-- Toast Notification -->
    <ToastNotification
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />

    <!-- CRUD Loading Overlay for add/edit/delete operations -->
    <CrudLoadingOverlay
      :visible="crudLoading.visible"
      :operation="crudLoading.operation"
      :entity="crudLoading.entity"
      :message="crudLoading.message"
      :sub-message="crudLoading.subMessage"
      :full-page="false"
    />
  </div>
</template>

<script>
import StallsScript from './Stalls.js'
import ConfirmDialog from '@common/ConfirmDialog/ConfirmDialog.vue'
export default {
  ...StallsScript,
  components: {
    ...StallsScript.components,
    ConfirmDialog
  }
}
</script>
<style scoped src="./Stalls.css"></style>
