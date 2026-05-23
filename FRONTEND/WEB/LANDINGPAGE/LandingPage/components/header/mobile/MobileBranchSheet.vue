<template>
  <div>
    <!-- Overlay -->
    <div
      class="mobile-sheet-overlay"
      :class="{ 'open': isOpen }"
      @click="$emit('close')"
    ></div>

    <!-- Bottom Sheet -->
    <div
      class="mobile-sheet-container"
      :class="{ 'open': isOpen }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Drag Handle -->
      <div class="mobile-sheet-handle"></div>

      <!-- Header -->
      <div class="mobile-sheet-header">
        <h2 class="mobile-sheet-title">
          <i class="mdi mdi-map-marker"></i>
          Select a Branch
        </h2>
        <p class="mobile-sheet-subtitle">Choose a branch to view available stalls</p>
      </div>

      <!-- Content -->
      <div class="mobile-sheet-content">
        <!-- Loading State -->
        <div v-if="loading" class="mobile-loading">
          <div class="mobile-loading-spinner"></div>
          <p class="mobile-loading-text">Loading branches...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="mobile-error">
          <i class="mdi mdi-alert-circle-outline mobile-error-icon"></i>
          <p class="mobile-error-text">{{ error }}</p>
          <button class="mobile-retry-btn" @click="$emit('retry')">
            Try Again
          </button>
        </div>

        <!-- Branch List -->
        <div v-else class="mobile-branch-list">
          <div
            v-for="branch in branches"
            :key="branch.branch"
            class="mobile-branch-card"
            :class="{ 'active': selectedBranch === branch.branch }"
            @click="selectBranch(branch)"
          >
            <div class="mobile-branch-info">
              <h3 class="mobile-branch-name">{{ branch.branch }}</h3>
              <p v-if="branch.stallCount" class="mobile-branch-stall-count">
                {{ branch.stallCount }} stalls available
              </p>
            </div>
            <div class="mobile-branch-arrow">
              <i class="mdi mdi-chevron-right"></i>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="branches.length === 0" class="mobile-empty">
            <i class="mdi mdi-store-off-outline mobile-empty-icon"></i>
            <p class="mobile-empty-text">No branches available at the moment</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MobileBranchSheet",
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    branches: {
      type: Array,
      default: () => []
    },
    selectedBranch: {
      type: String,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    }
  },
  emits: ['close', 'select-branch', 'retry'],
  data() {
    return {
      touchStartY: 0,
      touchCurrentY: 0,
      isDragging: false
    }
  },
  methods: {
    selectBranch(branch) {
      this.$emit('select-branch', branch.branch);
    },
    handleTouchStart(e) {
      this.touchStartY = e.touches[0].clientY;
      this.isDragging = true;
    },
    handleTouchMove(e) {
      if (!this.isDragging) return;
      this.touchCurrentY = e.touches[0].clientY;
    },
    handleTouchEnd() {
      if (!this.isDragging) return;

      const deltaY = this.touchCurrentY - this.touchStartY;

      // If dragged down more than 100px, close the sheet
      if (deltaY > 100) {
        this.$emit('close');
      }

      this.isDragging = false;
      this.touchStartY = 0;
      this.touchCurrentY = 0;
    }
  }
}
</script>

<style>
/* Bottom Sheet styles - unscoped for fixed positioning */
.mobile-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 10000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.mobile-sheet-overlay.open {
  opacity: 1;
  visibility: visible;
}

.mobile-sheet-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 70vh;
  background: white;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
  z-index: 10001;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.mobile-sheet-container.open {
  transform: translateY(0);
}

.mobile-sheet-handle {
  width: 40px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
}

.mobile-sheet-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.mobile-sheet-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-sheet-title i {
  color: #1976d2;
}

.mobile-sheet-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}

.mobile-sheet-content {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 16px 16px;
}

.mobile-branch-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-branch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 16px 20px;
  background: #f8fafc;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-branch-card:hover,
.mobile-branch-card:active {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.mobile-branch-card.active {
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.05) 0%, rgba(25, 118, 210, 0.08) 100%);
  border-color: #1976d2;
}

.mobile-branch-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-branch-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.mobile-branch-stall-count {
  font-size: 13px;
  color: #64748b;
}

.mobile-branch-arrow {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  color: #1976d2;
  font-size: 20px;
}

.mobile-branch-card.active .mobile-branch-arrow {
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  color: white;
}

.mobile-loading,
.mobile-error,
.mobile-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.mobile-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mobile-loading-text,
.mobile-error-text,
.mobile-empty-text {
  margin-top: 16px;
  font-size: 14px;
  color: #64748b;
}

.mobile-error-icon,
.mobile-empty-icon {
  font-size: 48px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.mobile-retry-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
