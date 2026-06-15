<template>
  <div class="locations-table">
    <v-card elevation="1" class="table-card">
      <!-- Custom Table Header -->
      <div class="table-header">
        <div class="header-row location-layout">
          <div class="header-cell id-col">#</div>
          <div class="header-cell name-col">
            <span>Location Name</span>
          </div>
          <div class="header-cell date-col">Date Created</div>
          <div class="header-cell actions-col">Actions</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body scrollable-table-wrapper">
        <div
          v-for="(location, index) in locations"
          :key="location.assigned_location_id"
          class="table-row location-layout"
        >
          <div class="table-cell id-col">
            <span class="row-number">{{ index + 1 }}</span>
          </div>
          <div class="table-cell name-col">
            <div class="location-info">
              <div class="location-icon">
                <v-icon size="small" color="white">mdi-map-marker</v-icon>
              </div>
              <div class="location-name">{{ location.location_name }}</div>
            </div>
          </div>
          <div class="table-cell date-col">
            <div class="date-info">
              <v-icon size="x-small" color="grey" class="mr-1">mdi-calendar</v-icon>
              {{ formatDate(location.created_at) }}
            </div>
          </div>
          <div class="table-cell actions-col" @click.stop>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  @click="$emit('edit', location)"
                >
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
              </template>
              <span>Edit Location</span>
            </v-tooltip>
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click="$emit('delete', location)"
                >
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>Delete Location</span>
            </v-tooltip>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="locations.length === 0" class="empty-state">
        <v-icon size="64" color="grey-lighten-1" class="mb-3">mdi-map-marker-off</v-icon>
        <h3 class="empty-title">No locations found</h3>
        <p class="empty-subtitle">
          {{ searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first location' }}
        </p>
        <v-btn
          v-if="!searchQuery"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          class="mt-4"
          @click="$emit('open-add-dialog')"
        >
          Add Location
        </v-btn>
      </div>
    </v-card>

    <!-- Add Location Floating Action Button -->
    <div class="floating-actions">
      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-fab
            v-bind="props"
            color="primary"
            icon="mdi-plus"
            size="large"
            @click="$emit('open-add-dialog')"
            aria-label="Add Location"
            role="button"
          ></v-fab>
        </template>
        <span>Add Location</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script src="./TableLocation.js"></script>
<style scoped src="./TableLocation.css"></style>
