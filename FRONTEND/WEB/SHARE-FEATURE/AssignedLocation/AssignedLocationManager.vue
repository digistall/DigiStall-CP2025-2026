<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="assigned-location-container">
    <div>
      <!-- Main Content -->
      <div class="assigned-location-main-content">
        <!-- Loading Overlay -->
        <LoadingOverlay :loading="loading" text="Loading locations..." :full-page="false" />

        <div class="feature-content-inner">
          <v-row>
            <v-col cols="12">
              <!-- Search Component -->
              <SearchLocation
                @search="handleSearch"
              />

              <!-- Table Component -->
              <TableLocation
                :locations="locations"
                :searchQuery="search"
                :sortBy="sortBy"
                :sortDir="sortDir"
                @edit="openEditDialog"
                @delete="confirmDelete"
                @open-add-dialog="openCreateDialog"
                @sort-change="handleSortChange"
              />

              <!-- Pagination -->
              <div class="pagination-section" v-if="totalPages > 1">
                <v-pagination
                  v-model="page"
                  :total-visible="5"
                  :length="totalPages"
                  color="primary"
                  class="my-4"
                  @update:model-value="fetchLocations"
                />
              </div>

              <!-- Add/Edit Dialog -->
              <LocationFormDialog
                :isVisible="dialog"
                :isEditing="isEditing"
                :form="form"
                :formErrors="formErrors"
                :saving="saving"
                @close="closeDialog"
                @save="saveLocation"
                @update:form="form = $event"
              />

              <!-- Delete Confirmation Dialog -->
              <DeleteLocationDialog
                :isVisible="deleteDialog"
                :location="deleteTarget"
                :deleting="deleting"
                @close="deleteDialog = false"
                @confirm="doDelete"
              />
            </v-col>
          </v-row>
        </div>

        <!-- Snackbar for notifications -->
        <v-snackbar
          v-model="snackbar.show"
          :color="snackbar.color"
          :timeout="snackbar.timeout"
          location="top"
        >
          {{ snackbar.message }}
          <template v-slot:actions>
            <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
          </template>
        </v-snackbar>
      </div>
    </div>
  </div>
</template>

<script src="./AssignedLocationManager.js"></script>
<style scoped src="./AssignedLocationManager.css"></style>
