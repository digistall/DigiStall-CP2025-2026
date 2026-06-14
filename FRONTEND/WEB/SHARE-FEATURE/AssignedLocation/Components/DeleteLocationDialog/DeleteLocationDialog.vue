<template>
  <v-dialog :model-value="isVisible" max-width="440" @update:model-value="$emit('close')">
    <v-card class="delete-dialog-card">
      <!-- Warning Icon -->
      <div class="delete-dialog-header">
        <div class="warning-icon">
          <v-icon size="large" color="error">mdi-alert-circle</v-icon>
        </div>
        <h3 class="delete-title">Delete Location</h3>
        <p class="delete-subtitle">This action cannot be undone</p>
      </div>

      <!-- Body -->
      <v-card-text class="delete-body">
        <div class="delete-info-box">
          <v-icon size="small" color="grey" class="mr-2">mdi-map-marker</v-icon>
          <span class="location-to-delete">{{ location?.location_name }}</span>
        </div>
        <p class="delete-warning-text">
          Are you sure you want to permanently delete this location?
          This will remove it from the system entirely.
        </p>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="delete-actions">
        <v-btn variant="text" color="grey" @click="$emit('close')" :disabled="deleting">
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          :loading="deleting"
          prepend-icon="mdi-delete"
          @click="$emit('confirm')"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./DeleteLocationDialog.js"></script>
<style scoped src="./DeleteLocationDialog.css"></style>
