<template>
  <div class="sub-navigation">
    <!-- Loading State -->
    <div v-if="loading" class="loading-branches">
      <p>Loading branches...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-branches">
      <p>{{ error }}</p>
      <button @click="fetchBranches" class="retry-btn">Try Again</button>
    </div>

    <!-- Branch Navigation -->
    <div v-else class="sub-nav-container">
      <div
        ref="scrollableContainer"
        class="scrollable-container"
        :class="{ 'overflow-scrolling': hasOverflow }"
      >
        <button
          v-for="branch in availableBranches"
          :key="branch.branch"
          class="sub-nav-item"
          :class="{ active: selectedBranch === branch.branch }"
          @click="handleBranchFilter(branch.branch)"
        >
          {{ branch.branch }}
        </button>
      </div>
    </div>

    <!-- Stalls Container with Filter -->
    <transition name="fade" mode="out-in">
      <div v-if="showStallsContainer && selectedBranch" class="stalls-container">
        <!-- Filter Container -->
        <StallFilter
          :selectedBranch="selectedBranch"
          :availableLocations="availableLocations"
          :loading="filterLoading"
          @filter-changed="handleFilterChanged"
          @search-changed="handleSearchChanged"
        />

        <!-- Available Stalls -->
        <AvailableStalls
          :filteredStalls="filteredStalls"
          :loading="stallsLoading"
          :error="stallsError"
          :key="filterKey"
        />
      </div>
    </transition>
  </div>
</template>

<script>
import AvailableStalls from "../stalls/available_stalls/AvailableStalls.vue";
import StallFilter from "../stalls/filter/StallFilter.vue";

import FetchService from "./SubNavigationComponents/fetch/FetchService.js";
import DataTransformService from "./SubNavigationComponents/transforms/DataTransformService.js";
import FilterService from "./SubNavigationComponents/filters/FilterService.js";
import UIHelperService from "./SubNavigationComponents/ui-helpers/UIHelperService.js";
import ErrorHandlingService from "./SubNavigationComponents/error-handling/ErrorHandlingService.js";

export default {
  name: "SubNavigation",
  components: {
    AvailableStalls,
    StallFilter,
  },
  data() {
    return {
      availableBranches: [],
      selectedBranch: null,
      showStallsContainer: false,

      availableLocations: [],
      filteredStalls: [],
      currentFilters: FilterService.getInitialFilters(),
      filterKey: 0,

      loading: false,
      filterLoading: false,
      stallsLoading: false,

      error: null,
      stallsError: null,

      hasOverflow: false,

      resizeCleanup: null,
    };
  },

  async mounted() {
    await this.fetchBranches();
    this.$nextTick(() => {
      this.checkOverflow();
      this.resizeCleanup = UIHelperService.setupResizeListener(() => {
        this.checkOverflow();
      });
    });
  },

  beforeUnmount() {
    if (this.resizeCleanup) {
      this.resizeCleanup();
    }
  },

  methods: {
    checkOverflow() {
      this.$nextTick(() => {
        const container = this.$refs.scrollableContainer;
        if (container) {
          this.hasOverflow = UIHelperService.checkOverflow(container);
        }
      });
    },

    async fetchBranches() {
      this.loading = true;
      this.error = null;

      try {
        this.availableBranches = await FetchService.fetchBranches();
        this.$nextTick(() => {
          this.checkOverflow();
        });
      } catch (error) {
        ErrorHandlingService.logError(error, "fetchBranches");
        this.error = ErrorHandlingService.handleNetworkError(error);
      } finally {
        this.loading = false;
      }
    },

    async handleBranchFilter(branch) {
      const selectionResult = UIHelperService.handleBranchSelection(
        this.selectedBranch,
        branch,
        this.showStallsContainer
      );

      this.selectedBranch = selectionResult.selectedBranch;
      this.showStallsContainer = selectionResult.showStallsContainer;

      if (selectionResult.shouldReset) {
        this.resetFilters();
      }

      if (this.selectedBranch) {
        await Promise.all([
          this.fetchLocationsByBranch(this.selectedBranch),
          this.fetchStallsByBranch(this.selectedBranch),
        ]);
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

    async fetchStallsByBranch(branch) {
      this.stallsLoading = true;
      this.stallsError = null;

      try {
        const stallsData = await FetchService.fetchStallsByBranch(branch);
        this.filteredStalls = DataTransformService.transformStallsArray(stallsData);
      } catch (error) {
        ErrorHandlingService.logError(error, "fetchStallsByBranch", { branch });
        this.stallsError = ErrorHandlingService.handleNetworkError(error);
      } finally {
        this.stallsLoading = false;
      }
    },

    async handleFilterChanged(filters) {
      this.currentFilters = FilterService.handleFilterChanged(
        this.currentFilters,
        filters
      );
      this.filterKey = UIHelperService.generateNewKey(this.filterKey);
      await this.applyFilters();
    },

    async handleSearchChanged(searchTerm) {
      this.currentFilters = FilterService.handleSearchChanged(
        this.currentFilters,
        searchTerm
      );
      this.filterKey = UIHelperService.generateNewKey(this.filterKey);
      await this.applyFilters();
    },

    async applyFilters() {
      this.stallsLoading = true;
      this.stallsError = null;

      try {
        console.log(
          "Applying filters:",
          FilterService.getFilterSummary(this.currentFilters)
        );

        const stallsData = await FetchService.fetchFilteredStalls(
          this.selectedBranch,
          this.currentFilters
        );

        this.filteredStalls = DataTransformService.transformStallsArray(stallsData);
      } catch (error) {
        ErrorHandlingService.logError(error, "applyFilters", {
          branch: this.selectedBranch,
          filters: this.currentFilters,
        });
        this.stallsError = ErrorHandlingService.handleNetworkError(error);
      } finally {
        this.stallsLoading = false;
      }
    },

    resetFilters() {
      this.currentFilters = FilterService.resetFilters();
      this.filteredStalls = [];
      this.availableLocations = [];
      this.filterKey = UIHelperService.generateNewKey(this.filterKey);
    },
  },
};
</script>

<style scoped src="../../../../assets/css/subnavigationstyle.css"></style>
