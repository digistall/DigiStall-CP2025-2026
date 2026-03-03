<template>
  <transition name="fade">
    <div v-if="visible" class="crud-loading-overlay" :class="{ 'full-page': fullPage }">
      <div class="crud-loading-content">
        <div class="crud-spinner">
          <div class="spinner-ring"></div>
          <div class="operation-icon">
            <v-icon v-if="operation === 'create'" size="32" color="white">mdi-plus-circle</v-icon>
            <v-icon v-else-if="operation === 'update' || operation === 'edit'" size="32" color="white">mdi-pencil-circle</v-icon>
            <v-icon v-else-if="operation === 'delete'" size="32" color="white">mdi-delete-circle</v-icon>
            <v-icon v-else size="32" color="white">mdi-loading</v-icon>
          </div>
        </div>
        <p class="crud-message">{{ displayMessage }}</p>
        <p v-if="displaySubMessage" class="crud-sub-message">{{ displaySubMessage }}</p>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'CrudLoadingOverlay',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    operation: {
      type: String,
      default: 'loading',
      validator: (value) => ['create', 'update', 'edit', 'delete', 'loading', 'generic'].includes(value)
    },
    entity: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    subMessage: {
      type: String,
      default: ''
    },
    fullPage: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    displayMessage() {
      if (this.message) return this.message
      const opLabels = {
        create: 'Creating',
        update: 'Updating',
        edit: 'Updating',
        delete: 'Deleting',
        loading: 'Processing'
      }
      const opLabel = opLabels[this.operation] || 'Processing'
      return this.entity ? `${opLabel} ${this.entity}...` : `${opLabel}...`
    },
    displaySubMessage() {
      return this.subMessage || 'Please wait while we process your request.'
    }
  }
}
</script>

<style scoped>
.crud-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.crud-loading-overlay.full-page {
  position: fixed;
}

.crud-loading-content {
  text-align: center;
  padding: 2rem;
}

.crud-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.operation-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crud-message {
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.crud-sub-message {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
