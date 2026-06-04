<template>
  <!-- Delete Confirmation Dialog -->
  <ConfirmDialog
    :model-value="showModal"
    @update:model-value="$emit('update:showModal', $event)"
    title="Delete Stall"
    type="danger"
    confirm-text="Delete"
    cancel-text="Cancel"
    note="This action cannot be undone. All data will be permanently removed."
    note-icon="mdi-alert-circle-outline"
    note-icon-color="error"
    :loading="loading"
    @confirm="handleConfirmDelete"
    @cancel="handleCancel"
  >
    <template #message>
      Are you sure you want to delete
      <strong>{{ stallData.stallNumber || stallData.stall_number }}</strong>?
    </template>

    <!-- Stall detail mini-card inside the dialog body -->
    <div v-if="stallData && stallData.location" class="ds-stall-details mt-3">
      <p class="ds-detail-row"><span class="ds-detail-label">Location:</span> {{ stallData.location }}</p>
      <p class="ds-detail-row"><span class="ds-detail-label">Floor:</span> {{ stallData.floor }}</p>
      <p class="ds-detail-row"><span class="ds-detail-label">Section:</span> {{ stallData.section }}</p>
      <p class="ds-detail-row"><span class="ds-detail-label">Price:</span> {{ formatPrice(stallData.price) }}</p>
    </div>
  </ConfirmDialog>
</template>

<script>
import ConfirmDialog from '@common/ConfirmDialog/ConfirmDialog.vue'
import DeleteStallScript from './DeleteStall.js'
export default {
  ...DeleteStallScript,
  components: {
    ...DeleteStallScript.components,
    ConfirmDialog
  }
}
</script>

<style scoped src="./DeleteStall.css"></style>
<style scoped>
.ds-stall-details {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  text-align: left;
}
.ds-detail-row {
  font-size: 0.85rem;
  color: #4b5563;
  margin: 0 0 4px;
}
.ds-detail-label {
  font-weight: 600;
  color: #1f2937;
}
</style>
