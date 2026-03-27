<template>
  <div
    class="mobile-stall-drawer"
    :class="{ 'open': isOpen }"
  >
    <!-- Header -->
    <div class="mobile-drawer-header">
      <button class="mobile-drawer-back" @click="$emit('close')" aria-label="Go back">
        <i class="mdi mdi-arrow-left"></i>
      </button>
      <div class="mobile-drawer-title-container">
        <h2 class="mobile-drawer-title">{{ selectedBranch }}</h2>
        <p class="mobile-drawer-subtitle">{{ availableCount }} stalls available</p>
      </div>
    </div>

    <!-- Quick Filter Bar -->
    <div class="mobile-quick-filter">
      <button
        class="mobile-filter-chip"
        :class="{ 'active': showAvailableOnly }"
        @click="toggleAvailableFilter"
      >
        <i class="mdi mdi-check-circle-outline"></i>
        Available
      </button>
      <button
        class="mobile-filter-chip"
        :class="{ 'active': !showAvailableOnly }"
        @click="showAvailableOnly = false"
      >
        <i class="mdi mdi-view-grid-outline"></i>
        All Stalls
      </button>
    </div>

    <!-- Content - Using AvailableStalls component -->
    <div class="mobile-drawer-content">
      <AvailableStalls
        :filteredStalls="displayStalls"
        :loading="loading"
        :error="error"
        @retry="$emit('retry')"
        @modal-opened="handleModalOpened"
        @modal-closed="handleModalClosed"
        @application-form-opened="handleFormOpened"
        @application-form-closed="handleFormClosed"
      />
    </div>
  </div>
</template>

<script>
import AvailableStalls from '../../stalls/available_stalls/AvailableStalls.vue';

export default {
  name: "MobileStallDrawer",
  components: {
    AvailableStalls
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    selectedBranch: {
      type: String,
      default: ''
    },
    stalls: {
      type: Array,
      default: () => []
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
  emits: ['close', 'retry'],
  data() {
    return {
      showAvailableOnly: true,
      modalOpen: false,
      formOpen: false
    }
  },
  computed: {
    displayStalls() {
      if (this.showAvailableOnly) {
        return this.stalls.filter(stall => stall.isAvailable);
      }
      return this.stalls;
    },
    availableCount() {
      return this.stalls.filter(stall => stall.isAvailable).length;
    }
  },
  methods: {
    toggleAvailableFilter() {
      this.showAvailableOnly = !this.showAvailableOnly;
    },
    handleModalOpened() {
      this.modalOpen = true;
    },
    handleModalClosed() {
      this.modalOpen = false;
    },
    handleFormOpened() {
      this.formOpen = true;
    },
    handleFormClosed() {
      this.formOpen = false;
    }
  },
  watch: {
    isOpen(newVal) {
      // Prevent body scroll when drawer is open
      if (newVal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
        // Reset filter on close
        this.showAvailableOnly = true;
      }
    }
  },
  beforeUnmount() {
    document.body.style.overflow = '';
  }
}
</script>

<style>
/* Stall Drawer styles - unscoped for fixed positioning */
.mobile-stall-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 10002;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-stall-drawer.open {
  transform: translateX(0);
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  color: white;
  flex-shrink: 0;
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
}

.mobile-drawer-back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 22px;
  cursor: pointer;
}

.mobile-drawer-title-container {
  flex: 1;
}

.mobile-drawer-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.mobile-drawer-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  opacity: 0.9;
}

.mobile-quick-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  overflow-x: auto;
}

.mobile-filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
}

.mobile-filter-chip.active {
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  border-color: transparent;
  color: white;
}

.mobile-drawer-content {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}

/* Override stall grid for 2 columns on mobile drawer */
.mobile-drawer-content .stall-grid {
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 12px;
}

.mobile-drawer-content .stall-card {
  border-radius: 12px;
}

.mobile-drawer-content .stall-info {
  padding: 10px;
}

.mobile-drawer-content .stall-header {
  font-size: 13px;
}

.mobile-drawer-content .stall-details p {
  font-size: 12px;
}

.mobile-drawer-content .apply-btn {
  padding: 6px 12px;
  font-size: 11px;
}

@media (max-width: 360px) {
  .mobile-drawer-content .stall-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
