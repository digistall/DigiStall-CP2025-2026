<template>
  <v-dialog :model-value="isVisible" max-width="500" persistent @update:model-value="$emit('close')">
    <v-card class="dialog-card">
      <!-- Dialog Header -->
      <div class="dialog-header">
        <div class="dialog-header-content">
          <div class="dialog-icon">
            <v-icon size="small" color="white">
              {{ isEditing ? 'mdi-pencil' : 'mdi-map-marker-plus' }}
            </v-icon>
          </div>
          <div>
            <h3 class="dialog-title">{{ isEditing ? 'Edit Location' : 'Add New Location' }}</h3>
            <p class="dialog-subtitle">
              {{ isEditing ? 'Update the location name below' : 'Enter a name for the new assigned location' }}
            </p>
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Dialog Body -->
      <v-card-text class="dialog-body">
        <v-text-field
          :model-value="form.location_name"
          @update:model-value="updateForm($event)"
          label="Location Name"
          placeholder="e.g. Market Area A, Building 3"
          :error-messages="formErrors"
          maxlength="100"
          counter="100"
          variant="outlined"
          prepend-inner-icon="mdi-map-marker"
          autofocus
          @keyup.enter="$emit('save')"
        />
      </v-card-text>

      <!-- Dialog Actions -->
      <v-card-actions class="dialog-actions">
        <v-btn variant="text" color="grey" @click="$emit('close')" :disabled="saving">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!form.location_name?.trim()"
          @click="$emit('save')"
          :prepend-icon="isEditing ? 'mdi-check' : 'mdi-plus'"
        >
          {{ isEditing ? 'Update' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./LocationFormDialog.js"></script>
<style scoped src="./LocationFormDialog.css"></style>
