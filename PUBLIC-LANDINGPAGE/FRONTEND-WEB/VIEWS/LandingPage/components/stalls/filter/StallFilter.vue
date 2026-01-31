<template>
  <div class="stall-filter">
    <!-- Top Filter Bar - Search Left, Filter Button Right -->
    <div class="search-wrapper">
      <!-- Search Bar (Left Side) -->
      <div class="search-field">
        <div class="search-input-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" />
          </svg>
          <input v-model="filters.search" type="text" placeholder="Search stalls" class="search-input"
            @input="handleSearchInput" />
        </div>
      </div>

      <!-- Filter Button (Right Side) -->
      <div class="filter-sort-container">
        <div class="filter-container" ref="filterContainer">
          <button @click="toggleFilters" class="filter-btn" :class="{ 'filter-active': showFilters }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="filter-icon">
              <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M10 18H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Filter & Sort
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="chevron-icon"
              :class="{ 'chevron-up': showFilters }">
              <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>

          <!-- Filter Dropdown Panel -->
          <transition name="slide-down">
            <div v-show="showFilters" class="filter-dropdown">
              <div class="filter-card">
                <div class="filter-header">
                  <div class="filter-header-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="header-icon">
                      <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      <path d="M10 18H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                    <h6 class="filter-title">Filter Options</h6>
                  </div>
                  <button @click="showFilters = false" class="close-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" />
                      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" />
                    </svg>
                  </button>
                </div>

                <div class="filter-content">
                  <!-- Location Filter -->
                  <div class="filter-group">
                    <label class="filter-label">Location</label>
                    <select v-model="filters.location" @change="handleFilterChange" class="filter-select">
                      <option value="">All Locations</option>
                      <option v-for="location in availableLocations" :key="location.location"
                        :value="location.location">
                        {{ location.location }}
                      </option>
                    </select>
                  </div>

                  <!-- Floor Filter -->
                  <div class="filter-group">
                    <label class="filter-label">Floor</label>
                    <select v-model="filters.floor" @change="handleFilterChange" class="filter-select">
                      <option value="">All Floors</option>
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="Second Floor">Second Floor</option>
                      <option value="Third Floor">Third Floor</option>
                    </select>
                  </div>

                  <!-- Section Filter -->
                  <div class="filter-group">
                    <label class="filter-label">Section</label>
                    <select v-model="filters.section" @change="handleFilterChange" class="filter-select">
                      <option value="">All Sections</option>
                      <option value="Grocery Section">Grocery Section</option>
                      <option value="Meat Section">Meat Section</option>
                      <option value="Fresh Produce">Fresh Produce</option>
                      <option value="Clothing Section">Clothing Section</option>
                      <option value="Electronics Section">Electronics Section</option>
                      <option value="Food Court">Food Court</option>
                      <option value="General Section">General Section</option>
                    </select>
                  </div>

                  <!-- Sort By Filter -->
                  <div class="filter-group">
                    <label class="filter-label">Sort By</label>
                    <select v-model="filters.sortBy" @change="handleFilterChange" class="filter-select">
                      <option value="default">Default</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="stall-number">Stall Number</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>

                  <!-- Action Buttons -->
                  <div class="filter-actions">
                    <button @click="clearAllFilters" class="clear-btn">Clear All</button>
                    <button @click="applyFilters" class="apply-btn">Apply</button>
                  </div>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="filter-loading">
                  <div class="loading-spinner"></div>
                  Loading locations...
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Active Filters Summary (Always Visible when filters applied) -->
    <div v-if="hasActiveFilters && !showFilters" class="active-filters-summary">
      <div class="filter-tags">
        <span v-if="filters.floor" class="filter-tag" @click="clearFilter('floor')">
          Floor: {{ filters.floor }} ×
        </span>
        <span v-if="filters.section" class="filter-tag" @click="clearFilter('section')">
          Section: {{ filters.section }} ×
        </span>
        <span v-if="filters.location" class="filter-tag" @click="clearFilter('location')">
          Location: {{ filters.location }} ×
        </span>
        <span v-if="filters.sortBy !== 'default'" class="filter-tag" @click="clearFilter('sortBy')">
          Sort: {{ getSortLabel(filters.sortBy) }} ×
        </span>
        <span v-if="filters.search" class="filter-tag" @click="clearFilter('search')">
          Search: "{{ filters.search }}" ×
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "StallFilter",
  props: {
    selectedBranch: {
      type: String,
      required: true,
    },
    availableLocations: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      showFilters: false,
      filters: {
        location: "",
        section: "",
        floor: "",
        search: "",
        sortBy: "default",
      },
      searchTimeout: null,
    };
  },
  computed: {
    hasActiveFilters() {
      return Object.values(this.filters).some(
        (value) => value && value.toString().trim() !== "" && value !== "default"
      );
    },
  },
  watch: {
    selectedBranch() {
      // Silently reset filters without triggering API call
      this.filters = {
        location: "",
        section: "",
        floor: "",
        search: "",
        sortBy: "default",
      };
    },
  },
  mounted() {
    document.addEventListener("click", this.handleOutsideClick);
    document.addEventListener("keydown", this.handleKeyDown);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleOutsideClick);
    document.removeEventListener("keydown", this.handleKeyDown);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
  methods: {
    toggleFilters() {
      this.showFilters = !this.showFilters;
    },

    handleFilterChange() {
      this.$emit("filter-changed", { ...this.filters });
    },

    handleSearchInput() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(() => {
        this.$emit("search-changed", this.filters.search);
      }, 500);
    },

    clearFilter(filterName) {
      if (filterName === "sortBy") {
        this.filters[filterName] = "default";
      } else {
        this.filters[filterName] = "";
      }
      this.handleFilterChange();
    },

    clearAllFilters() {
      this.filters = {
        location: "",
        section: "",
        floor: "",
        search: "",
        sortBy: "default",
      };
      this.handleFilterChange();
    },

    applyFilters() {
      this.handleFilterChange();
      this.showFilters = false;
    },

    getSortLabel(value) {
      const options = {
        default: "Default",
        "price-low": "Price: Low to High",
        "price-high": "Price: High to Low",
        "stall-number": "Stall Number",
        newest: "Newest First",
      };
      return options[value] || value;
    },

    handleOutsideClick(event) {
      if (
        this.$refs.filterContainer &&
        !this.$refs.filterContainer.contains(event.target)
      ) {
        this.showFilters = false;
      }
    },

    handleKeyDown(event) {
      if (event.key === "Escape") {
        if (this.showFilters) {
          this.showFilters = false;
        }
      }
    },
  },
};
</script>

<style scoped src="../../../../../assets/css/StallFilter.css"></style>
