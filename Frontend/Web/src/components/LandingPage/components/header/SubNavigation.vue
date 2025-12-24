<template>
  <div class="sub-navigation" :class="{ 'expanded': showStallsContainer && selectedBranch }">
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
      
      <!-- Bottom Navigation Arrows -->
      <div v-if="hasOverflow" class="bottom-nav-arrows">
        <button 
          v-if="canScrollLeft" 
          @click="scrollLeft" 
          class="bottom-arrow left-arrow"
          aria-label="Scroll left"
        >
          <i class="mdi mdi-chevron-left"></i>
        </button>
        
        <button 
          v-if="canScrollRight" 
          @click="scrollRight" 
          class="bottom-arrow right-arrow"
          aria-label="Scroll right"
        >
          <i class="mdi mdi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Stalls Container with Filter -->
    <transition name="stalls-slide" mode="out-in">
      <div v-if="showStallsContainer && selectedBranch" class="stalls-container">
        <div class="stalls-header">
          <h3 class="stalls-title">
            <i class="mdi mdi-store"></i>
            Available Stalls in <span>{{ selectedBranch }}</span>
          </h3>
          <button class="close-stalls-btn" @click="closeStallsContainer">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        
        <!-- Filter Container -->
        <StallFilter
          :selectedBranch="selectedBranch"
          :availableLocations="availableLocations"
          :loading="filterLoading"
          @filter-changed="handleFilterChanged"
          @search-changed="handleSearchChanged"
        />

        <!-- Available Stalls -->
        <div class="stalls-list-wrapper">
          <AvailableStalls
            :filteredStalls="filteredStalls"
            :loading="stallsLoading"
            :error="stallsError"
            :key="filterKey"
            @modal-opened="modalOpen = true"
            @modal-closed="modalOpen = false; lastScrollY = window.scrollY"
          />
        </div>
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
      canScrollLeft: false,
      canScrollRight: false,
      currentScrollPosition: 0,
      scrollListener: null,

      resizeCleanup: null,
      windowScrollListener: null,
      lastScrollY: 0,
      scrollThreshold: 100, // Pixels to scroll before auto-closing
      modalOpen: false, // Track if stall details modal is open
    };
  },

  async mounted() {
    await this.fetchBranches();
    this.$nextTick(() => {
      this.checkOverflow();
      this.updateArrowStates();
      this.setupScrollListener();
      this.setupWindowScrollListener();
      this.resizeCleanup = UIHelperService.setupResizeListener(() => {
        this.checkOverflow();
        this.updateArrowStates();
      });
    });
  },

  beforeUnmount() {
    if (this.resizeCleanup) {
      this.resizeCleanup();
    }
    if (this.scrollListener) {
      const container = this.$refs.scrollableContainer;
      if (container) {
        container.removeEventListener('scroll', this.scrollListener);
      }
    }
    if (this.windowScrollListener) {
      window.removeEventListener('scroll', this.windowScrollListener);
    }
  },

  methods: {
    checkOverflow() {
      this.$nextTick(() => {
        const container = this.$refs.scrollableContainer;
        if (container) {
          this.hasOverflow = UIHelperService.checkOverflow(container);
          this.updateArrowStates();
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
          this.updateArrowStates();
        });
      } catch (error) {
        ErrorHandlingService.logError(error, "fetchBranches");
        this.error = ErrorHandlingService.handleNetworkError(error);
      } finally {
        this.loading = false;
      }
    },

    async handleBranchFilter(branch) {
      console.log('🏢 Branch clicked:', branch);
      
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
        console.log('📥 Fetching stalls for branch:', this.selectedBranch);
        
        try {
          await Promise.all([
            this.fetchLocationsByBranch(this.selectedBranch),
            this.fetchStallsByBranch(this.selectedBranch),
          ]);
          console.log('✅ Stalls loaded successfully');
        } catch (error) {
          console.error('❌ Error loading stalls:', error);
        }
        
        // Reset scroll tracking AFTER data is loaded to prevent auto-close
        this.lastScrollY = window.scrollY;
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
    
    closeStallsContainer() {
      this.showStallsContainer = false;
      this.selectedBranch = null;
      this.resetFilters();
    },

    updateArrowStates() {
      this.$nextTick(() => {
        const container = this.$refs.scrollableContainer;
        if (container) {
          const scrollLeft = container.scrollLeft;
          const scrollWidth = container.scrollWidth;
          const clientWidth = container.clientWidth;
          
          this.canScrollLeft = scrollLeft > 0;
          this.canScrollRight = scrollLeft < (scrollWidth - clientWidth - 1);
          this.currentScrollPosition = scrollLeft;
        }
      });
    },

    scrollLeft() {
      const container = this.$refs.scrollableContainer;
      if (container) {
        const scrollAmount = 200; // Adjust scroll distance as needed
        container.scrollTo({
          left: container.scrollLeft - scrollAmount,
          behavior: 'smooth'
        });
        
        // Update arrow states after scroll
        setTimeout(() => {
          this.updateArrowStates();
        }, 300);
      }
    },

    scrollRight() {
      const container = this.$refs.scrollableContainer;
      if (container) {
        const scrollAmount = 200; // Adjust scroll distance as needed
        container.scrollTo({
          left: container.scrollLeft + scrollAmount,
          behavior: 'smooth'
        });
        
        // Update arrow states after scroll
        setTimeout(() => {
          this.updateArrowStates();
        }, 300);
      }
    },

    setupScrollListener() {
      const container = this.$refs.scrollableContainer;
      if (container) {
        this.scrollListener = () => {
          this.updateArrowStates();
        };
        container.addEventListener('scroll', this.scrollListener);
      }
    },

    setupWindowScrollListener() {
      this.windowScrollListener = () => {
        // Only auto-close if stalls container is open AND modal is NOT open
        // AND stallsLoading is false (to prevent closing while loading)
        if (this.showStallsContainer && this.selectedBranch && !this.modalOpen && !this.stallsLoading) {
          const currentScrollY = window.scrollY;
          const scrollDifference = currentScrollY - this.lastScrollY;
          
          // Check if user has scrolled down more than the threshold
          if (scrollDifference > this.scrollThreshold) {
            console.log('🔻 Auto-closing stalls container due to scroll');
            this.closeStallsContainer();
          }
        }
      };
      
      window.addEventListener('scroll', this.windowScrollListener, { passive: true });
    },
  },
};
</script>

<style scoped src="../../../../assets/css/subnavigationstyle.css"></style>
