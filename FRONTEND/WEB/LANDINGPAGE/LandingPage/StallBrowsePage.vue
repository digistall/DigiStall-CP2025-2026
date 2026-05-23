<template>
  <div class="stall-browse-page">
    <!-- Header Bar -->
    <header class="browse-header">
      <button class="browse-back-btn" @click="goBack" aria-label="Go back">
        <i class="mdi mdi-arrow-left"></i>
      </button>
      <div class="browse-header-text">
        <h1 class="browse-title">Find Your Stall</h1>
        <p class="browse-subtitle">
          {{ availableCount }} stalls available{{ selectedBranch ? ` in ${selectedBranch}` : '' }}
        </p>
      </div>
    </header>

    <!-- Stall Content (always shown) -->
    <div class="browse-content">
      <!-- Filter Bar -->
      <div class="browse-filter-bar">
        <button class="browse-chip browse-branches" @click="showBranchSelector">
          <i class="mdi mdi-store-outline"></i>
          {{ selectedBranch || 'All Branches' }}
          <i class="mdi mdi-chevron-down"></i>
        </button>
      </div>

      <!-- Filter Component (only shown when branch is selected) -->
      <StallFilter
        v-if="selectedBranch"
        :selectedBranch="selectedBranch"
        :availableLocations="availableLocations"
        :loading="filterLoading"
        @filter-changed="handleFilterChanged"
        @search-changed="handleSearchChanged"
      />

      <!-- Stalls List -->
      <div class="browse-stalls-area">
        <AvailableStalls
          :filteredStalls="filteredStalls"
          :loading="stallsLoading"
          :error="stallsError"
          @retry="retryStalls"
          @modal-opened="handleModalOpened"
          @modal-closed="handleModalClosed"
          @application-form-opened="handleFormOpened"
          @application-form-closed="handleFormClosed"
        />
      </div>
    </div>

    <!-- Branch Selector Modal -->
    <div v-if="showBranchModal" class="branch-modal-overlay" @click="closeBranchModal">
      <div class="branch-modal" @click.stop>
        <div class="branch-modal-header">
          <h2>Select Branch</h2>
          <button class="branch-modal-close" @click="closeBranchModal">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <div class="branch-modal-content">
          <div v-if="branchLoading" class="browse-loading">
            <div class="browse-spinner"></div>
            <p>Loading branches...</p>
          </div>
          <div v-else-if="branchError" class="browse-error">
            <i class="mdi mdi-alert-circle-outline"></i>
            <p>{{ branchError }}</p>
            <button class="browse-retry-btn" @click="fetchBranches">Try Again</button>
          </div>
          <div v-else class="branch-modal-list">
            <button
              class="branch-modal-item"
              :class="{ active: !selectedBranch }"
              @click="selectBranch(null)"
            >
              <i class="mdi mdi-store-outline"></i>
              <span>All Branches</span>
              <i class="mdi mdi-check" v-if="!selectedBranch"></i>
            </button>
            <button
              v-for="branch in availableBranches"
              :key="branch.branch"
              class="branch-modal-item"
              :class="{ active: selectedBranch === branch.branch }"
              @click="selectBranch(branch.branch)"
            >
              <i class="mdi mdi-store"></i>
              <span>{{ branch.branch }}</span>
              <i class="mdi mdi-check" v-if="selectedBranch === branch.branch"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AvailableStalls from "./components/stalls/available_stalls/AvailableStalls.vue";
import StallFilter from "./components/stalls/filter/StallFilter.vue";

import FetchService from "./components/header/SubNavigationComponents/fetch/FetchService.js";
import DataTransformService from "./components/header/SubNavigationComponents/transforms/DataTransformService.js";
import FilterService from "./components/header/SubNavigationComponents/filters/FilterService.js";
import ErrorHandlingService from "./components/header/SubNavigationComponents/error-handling/ErrorHandlingService.js";

export default {
  name: "StallBrowsePage",
  components: {
    AvailableStalls,
    StallFilter,
  },
  data() {
    return {
      // Branch state
      availableBranches: [],
      selectedBranch: null,
      branchLoading: false,
      branchError: null,

      // Stall state
      allStalls: [],
      filteredStalls: [],
      stallsLoading: false,
      stallsError: null,


      // Filter state
      availableLocations: [],
      filterLoading: false,
      currentFilters: FilterService.getInitialFilters(),
      filterKey: 0,

      // UI state
      modalOpen: false,
      formOpen: false,
      showBranchModal: false,
    };
  },
  computed: {
    availableCount() {
      return this.filteredStalls.length;
    },
  },
  async mounted() {
    // Check for branch query parameter
    const branchParam = this.$route.query.branch;
    if (branchParam) {
      await this.selectBranch(branchParam);
    } else {
      // No branch specified - fetch all stalls from all branches
      await this.fetchAllStalls();
    }

    await this.fetchBranches();
  },
  methods: {
    goBack() {
      this.$router.push("/");
    },
    showBranchSelector() {
      this.showBranchModal = true;
    },
    closeBranchModal() {
      this.showBranchModal = false;
    },
    changeBranch() {
      this.showBranchModal = true;
    },

    async fetchBranches() {
      this.branchLoading = true;
      this.branchError = null;
      try {
        this.availableBranches = await FetchService.fetchBranches();
      } catch (error) {
        ErrorHandlingService.logError(error, "fetchBranches");
        this.branchError = "Unable to load branches. Please try again.";
      } finally {
        this.branchLoading = false;
      }
    },

    async fetchAllStalls() {
      this.stallsLoading = true;
      this.stallsError = null;
      try {
        const stallsData = await FetchService.fetchAllStalls();
        this.allStalls = DataTransformService.transformStallsArray(stallsData);
        this.filteredStalls = this.allStalls;
      } catch (error) {
        ErrorHandlingService.logError(error, "fetchAllStalls");
        this.stallsError = "Unable to load stalls. Please try again.";
      } finally {
        this.stallsLoading = false;
      }
    },

    async selectBranch(branchName) {
      this.selectedBranch = branchName;
      this.showBranchModal = false;

      // Update URL query param
      if (branchName) {
        if (this.$route.query.branch !== branchName) {
          this.$router.replace({
            query: { branch: branchName },
          });
        }
        // Fetch stalls and locations for specific branch
        await Promise.all([
          this.fetchStallsByBranch(branchName),
          this.fetchLocationsByBranch(branchName),
        ]);
      } else {
        // No branch - fetch all stalls
        if (this.$route.query.branch) {
          this.$router.replace({ query: {} });
        }
        await this.fetchAllStalls();
        this.availableLocations = [];
      }
    },

    async fetchStallsByBranch(branch) {
      this.stallsLoading = true;
      this.stallsError = null;
      try {
        const stallsData = await FetchService.fetchStallsByBranch(branch);
        this.allStalls = DataTransformService.transformStallsArray(stallsData);
        this.filteredStalls = this.allStalls;
      } catch (error) {
        ErrorHandlingService.logError(error, "fetchStallsByBranch", { branch });
        this.stallsError = "Unable to load stalls. Please try again.";
      } finally {
        this.stallsLoading = false;
      }
    },

    async fetchLocationsByBranch(branch) {
      this.filterLoading = true;
      try {
        this.availableLocations = await FetchService.fetchLocationsByBranch(branch);
      } catch (error) {
        ErrorHandlingService.logError(error, "fetchLocationsByBranch", { branch });
      } finally {
        this.filterLoading = false;
      }
    },

    async handleFilterChanged(filters) {
      this.currentFilters = FilterService.handleFilterChanged(this.currentFilters, filters);
      this.filterKey++;
      await this.applyFilters();
    },
    async handleSearchChanged(searchTerm) {
      this.currentFilters = FilterService.handleSearchChanged(this.currentFilters, searchTerm);
      this.filterKey++;
      await this.applyFilters();
    },
    async applyFilters() {
      this.stallsLoading = true;
      this.stallsError = null;
      try {
        // If no branch is selected, fetch all stalls and apply client-side filtering if needed
        if (!this.selectedBranch) {
          await this.fetchAllStalls();
        } else {
          const stallsData = await FetchService.fetchFilteredStalls(
            this.selectedBranch,
            this.currentFilters
          );
          this.filteredStalls = DataTransformService.transformStallsArray(stallsData);
        }
      } catch (error) {
        ErrorHandlingService.logError(error, "applyFilters");
        this.stallsError = "Failed to apply filters.";
      } finally {
        this.stallsLoading = false;
      }
    },

    retryStalls() {
      if (this.selectedBranch) {
        this.fetchStallsByBranch(this.selectedBranch);
      }
    },
    handleModalOpened() { this.modalOpen = true; },
    handleModalClosed() { this.modalOpen = false; },
    handleFormOpened() { this.formOpen = true; },
    handleFormClosed() { this.formOpen = false; },
  },
};
</script>

<style scoped>
/* ===================== PAGE CONTAINER ===================== */
.stall-browse-page {
  min-height: 100vh;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* ===================== HEADER ===================== */
.browse-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  padding-top: calc(14px + env(safe-area-inset-top, 0px));
  background: linear-gradient(135deg, #001a6e 0%, #002181 40%, #1565c0 100%);
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 33, 129, 0.35);
}

.browse-back-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.browse-back-btn:hover,
.browse-back-btn:active {
  background: rgba(255, 255, 255, 0.22);
}

.browse-header-text {
  flex: 1;
  min-width: 0;
}

.browse-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.browse-subtitle {
  margin: 3px 0 0;
  font-size: 13px;
  opacity: 0.85;
  font-weight: 400;
}

/* ===================== BRANCH SELECTION ===================== */
.browse-branch-select {
  flex: 1;
  padding: 24px 16px;
}

.browse-branch-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.browse-branch-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: white;
  border-radius: 16px;
  border: 2px solid transparent;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.browse-branch-card:hover,
.browse-branch-card:active {
  border-color: #1976d2;
  box-shadow: 0 4px 20px rgba(25, 118, 210, 0.15);
  transform: translateY(-2px);
}

.browse-branch-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.08) 0%, rgba(25, 118, 210, 0.12) 100%);
  border-radius: 14px;
  flex-shrink: 0;
}

.browse-branch-icon i {
  font-size: 24px;
  color: #1976d2;
}

.browse-branch-info {
  flex: 1;
  min-width: 0;
}

.browse-branch-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.browse-branch-info p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.browse-branch-arrow {
  font-size: 22px;
  color: #94a3b8;
  flex-shrink: 0;
}

/* ===================== FILTER BAR ===================== */
.browse-filter-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.browse-filter-bar::-webkit-scrollbar {
  display: none;
}

.browse-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1.5px solid #e2e8f0;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.browse-chip:hover {
  background: #e2e8f0;
}

.browse-chip.active {
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 33, 129, 0.25);
}

.browse-chip.browse-branches {
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  border-color: transparent;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 33, 129, 0.25);
  min-width: 180px;
  justify-content: space-between;
}

.browse-chip.browse-branches:hover {
  background: linear-gradient(135deg, #001a66 0%, #1565c0 100%);
  box-shadow: 0 3px 12px rgba(0, 33, 129, 0.35);
}

.browse-chip.change-branch {
  margin-left: auto;
  background: transparent;
  border-color: #1976d2;
  color: #1976d2;
}

.browse-chip.change-branch:hover {
  background: rgba(25, 118, 210, 0.06);
}

/* ===================== CONTENT AREA ===================== */
.browse-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.browse-stalls-area {
  flex: 1;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}

/* ===================== STALL GRID RESPONSIVE LAYOUT ===================== */
/* Let availablestallstyle.css handle the base grid layout */
.browse-stalls-area :deep(.stall-grid) {
  gap: 14px;
}

.browse-stalls-area :deep(.stall-card) {
  border-radius: 14px;
}

/* Small mobile: 1 column */
@media (max-width: 500px) {
  .browse-stalls-area :deep(.stall-grid) {
    gap: 10px;
  }

  .browse-stalls-area :deep(.stall-card) {
    border-radius: 12px;
  }
}

/* Medium mobile: 2 columns (natural behavior from availablestallstyle.css) */
@media (min-width: 501px) and (max-width: 768px) {
  .browse-stalls-area :deep(.stall-grid) {
    gap: 12px;
  }
}

/* Tablet: 3 columns */
@media (min-width: 769px) {
  .browse-stalls-area :deep(.stall-grid) {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

/* Desktop: 4 columns */
@media (min-width: 1200px) {
  .browse-stalls-area :deep(.stall-grid) {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}

/* ===================== LOADING / ERROR ===================== */
.browse-loading,
.browse-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.browse-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid #e2e8f0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: browseSpin 0.8s linear infinite;
}

@keyframes browseSpin {
  to { transform: rotate(360deg); }
}

.browse-loading p,
.browse-error p {
  margin-top: 16px;
  font-size: 15px;
  color: #64748b;
}

.browse-error i {
  font-size: 56px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.browse-retry-btn {
  margin-top: 16px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 33, 129, 0.25);
}

.browse-retry-btn:hover {
  box-shadow: 0 4px 16px rgba(0, 33, 129, 0.35);
  transform: translateY(-1px);
}

/* ===================== BRANCH MODAL ===================== */
.branch-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.branch-modal {
  background: white;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.branch-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.branch-modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.branch-modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.branch-modal-close:hover {
  background: #e2e8f0;
}

.branch-modal-close i {
  font-size: 20px;
  color: #475569;
}

.branch-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.branch-modal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.branch-modal-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  text-align: left;
}

.branch-modal-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.branch-modal-item.active {
  border-color: #1976d2;
  background: linear-gradient(135deg, rgba(0, 33, 129, 0.05) 0%, rgba(25, 118, 210, 0.08) 100%);
}

.branch-modal-item i:first-child {
  font-size: 22px;
  color: #1976d2;
  flex-shrink: 0;
}

.branch-modal-item span {
  flex: 1;
}

.branch-modal-item .mdi-check {
  font-size: 20px;
  color: #1976d2;
  flex-shrink: 0;
}
</style>
