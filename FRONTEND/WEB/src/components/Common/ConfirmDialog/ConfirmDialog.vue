<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="420"
    persistent
  >
    <v-card class="ds-confirm-card" rounded="lg">

      <!-- Coloured Header Bar -->
      <div class="ds-confirm-header" :class="headerClass">
        <button class="ds-close-btn" @click="$emit('cancel')" :aria-label="'Close dialog'">
          <v-icon color="white" size="20">mdi-close</v-icon>
        </button>
      </div>

      <!-- Body -->
      <v-card-text class="ds-confirm-body text-center pt-6 pb-2">
        <h3 class="ds-confirm-title mb-3">{{ title }}</h3>

        <p class="ds-confirm-message">
          <slot name="message">{{ message }}</slot>
        </p>

        <!-- Optional note pill -->
        <div v-if="note" class="ds-confirm-note mt-3">
          <v-icon size="15" :color="noteIconColor" class="mr-1">{{ noteIcon }}</v-icon>
          {{ note }}
        </div>

        <!-- Slot for any extra content -->
        <slot />
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="ds-confirm-actions pb-6 pt-2">
        <v-spacer />
        <v-btn
          :color="confirmColor"
          variant="flat"
          rounded="pill"
          class="ds-action-btn px-7"
          @click="$emit('confirm')"
          :loading="loading"
        >
          {{ confirmText }}
        </v-btn>
        <v-spacer />
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  emits: ['update:modelValue', 'confirm', 'cancel'],
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: 'Are you sure?' },
    message: { type: String, default: '' },
    note: { type: String, default: '' },
    noteIcon: { type: String, default: 'mdi-information' },
    noteIconColor: { type: String, default: 'success' },
    type: {
      type: String,
      default: 'primary',
      validator: (v) => ['primary', 'danger', 'warning', 'success'].includes(v),
    },
    confirmText: { type: String, default: 'Confirm' },
    cancelText: { type: String, default: 'Cancel' },
    loading: { type: Boolean, default: false },
  },
  computed: {
    headerClass() {
      return {
        'ds-header-primary': this.type === 'primary' || this.type === 'success',
        'ds-header-danger':  this.type === 'danger',
        'ds-header-warning': this.type === 'warning',
      };
    },
    confirmColor() {
      if (this.type === 'danger')  return 'error';
      if (this.type === 'warning') return 'warning';
      return 'primary';
    },
  },
};
</script>

<style scoped>
/* ─── Card ─────────────────────────────────────────── */
.ds-confirm-card {
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18) !important;
}

/* ─── Coloured Header Bar ───────────────────────────── */
.ds-confirm-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.ds-header-primary {
  background: linear-gradient(135deg, #002181 0%, #003399 100%);
}

.ds-header-danger {
  background: linear-gradient(135deg, #c62828 0%, #f44336 100%);
}

.ds-header-warning {
  background: linear-gradient(135deg, #e65100 0%, #ff9800 100%);
}

/* ─── Close Button ──────────────────────────────────── */
.ds-close-btn {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.2s ease;
  padding: 0;
}

.ds-close-btn:hover {
  background: rgba(255, 255, 255, 0.32);
  transform: translateY(-50%) scale(1.1);
}

/* ─── Body ──────────────────────────────────────────── */
.ds-confirm-body {
  padding-left: 32px !important;
  padding-right: 32px !important;
}

.ds-confirm-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.ds-confirm-message {
  font-size: 0.97rem;
  color: #4b5563;
  line-height: 1.65;
  margin: 0;
}

/* Highlight bold text inside message slot with primary colour */
.ds-confirm-message :deep(strong) {
  color: #002181;
  font-weight: 700;
}

/* ─── Note Pill ─────────────────────────────────────── */
.ds-confirm-note {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  color: #555;
  background: #f3f4f6;
  padding: 8px 14px;
  border-radius: 20px;
  line-height: 1.4;
}

/* ─── Actions ───────────────────────────────────────── */
.ds-confirm-actions {
  display: flex;
  justify-content: center !important;
  padding-left: 24px !important;
  padding-right: 24px !important;
}

.ds-cancel-btn {
  color: #6b7280 !important;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  font-size: 0.82rem;
}

.ds-action-btn {
  font-weight: 700 !important;
  letter-spacing: 0.6px;
  font-size: 0.88rem;
  box-shadow: 0 4px 14px rgba(0, 33, 129, 0.28) !important;
  transition: box-shadow 0.2s ease, transform 0.2s ease !important;
  min-width: 110px;
}

.ds-action-btn:hover {
  box-shadow: 0 6px 20px rgba(0, 33, 129, 0.4) !important;
  transform: translateY(-1px);
}
</style>
