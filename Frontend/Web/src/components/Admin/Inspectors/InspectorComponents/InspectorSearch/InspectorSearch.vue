<template>
  <div class="search-filter-section mb-6">
    <div class="search-wrapper">
      <!-- Search Bar -->
      <v-col cols="12" md="6" lg="4">
        <v-text-field
          v-model="searchQuery"
          label="Search inspectors"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
          class="search-field"
          placeholder="Search by name, email, contact, or ID..."
        ></v-text-field>
      </v-col>

      <!-- Filter Button -->
      <div class="filter-container" ref="filterContainer">
        <button
          class="filter-btn"
          :class="{ 'filter-active': showFilterPanel }"
          @click="toggleFilter"
        >
          <v-icon icon="mdi-filter-variant" size="small" class="mr-2"></v-icon>
          Filter
          <v-icon
            :icon="showFilterPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="small"
            class="ml-1"
          ></v-icon>
        </button>

        <!-- Filter Dropdown Panel -->
        <transition name="slide-down">
          <div v-show="showFilterPanel" class="filter-dropdown">
            <div class="filter-card">
              <div class="filter-header">
                <div class="filter-header-content">
                  <v-icon icon="mdi-filter-variant" size="small" class="mr-2"></v-icon>
                  <h6 class="filter-title">Filter Options</h6>
                </div>
                <button class="close-btn" @click="showFilterPanel = false">
                  <v-icon icon="mdi-close" size="small"></v-icon>
                </button>
              </div>

              <div class="filter-content">
                <!-- Status Filter -->
                <div class="filter-group">
                  <label class="filter-label">Status</label>
                  <div class="status-buttons">
                    <button
                      class="status-btn"
                      :class="{ active: filters.status === 'all' }"
                      @click="filters.status = 'all'"
                    >
                      All
                    </button>
                    <button
                      class="status-btn status-active"
                      :class="{ active: filters.status === 'active' }"
                      @click="filters.status = 'active'"
                    >
                      Active
                    </button>
                    <button
                      class="status-btn status-inactive"
                      :class="{ active: filters.status === 'inactive' }"
                      @click="filters.status = 'inactive'"
                    >
                      Inactive
                    </button>
                    <button
                      class="status-btn status-suspended"
                      :class="{ active: filters.status === 'suspended' }"
                      @click="filters.status = 'suspended'"
                    >
                      Suspended
                    </button>
                  </div>
                </div>

                <!-- Date Hired Range Filter -->
                <div class="filter-group">
                  <label class="filter-label">Date Hired Range</label>
                  <div class="date-range-wrapper">
                    <v-text-field
                      v-model="filters.dateFrom"
                      type="date"
                      variant="outlined"
                      density="compact"
                      hide-details
                      label="From"
                      class="date-input"
                    ></v-text-field>
                    <span class="date-separator">to</span>
                    <v-text-field
                      v-model="filters.dateTo"
                      type="date"
                      variant="outlined"
                      density="compact"
                      hide-details
                      label="To"
                      class="date-input"
                    ></v-text-field>
                  </div>
                </div>

                <!-- Sort By -->
                <div class="filter-group">
                  <label class="filter-label">Sort By</label>
                  <v-select
                    v-model="filters.sortBy"
                    :items="sortOptions"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="filter-select"
                  ></v-select>
                </div>

                <!-- Action Buttons -->
                <div class="filter-actions">
                  <button class="clear-btn" @click="clearAllFilters">Clear All</button>
                  <button class="apply-btn" @click="applyFilters">Apply Filters</button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script src="./InspectorSearch.js"></script>
<style scoped src="./InspectorSearch.css"></style>
