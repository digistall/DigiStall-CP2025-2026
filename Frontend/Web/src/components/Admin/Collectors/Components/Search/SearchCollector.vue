<template>
  <div class="search-filter-section">
    <div class="search-wrapper">
      <!-- Search Bar -->
      <v-col cols="12" md="6" lg="4">
        <v-text-field
          v-model="searchQuery"
          label="Search collector"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
          class="search-field"
          placeholder="Search"
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
                <!-- Location Filter -->
                <div class="filter-group">
                  <label class="filter-label">Location</label>
                  <div class="location-buttons">
                    <button
                      class="location-btn"
                      :class="{ active: activeFilter === 'all' }"
                      @click="setFilter('all')"
                    >
                      All
                    </button>
                    <button
                      v-for="location in locations"
                      :key="location"
                      class="location-btn"
                      :class="{ active: activeFilter === location }"
                      @click="setFilter(location)"
                    >
                      {{ location }}
                    </button>
                  </div>
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

<script src="./SearchCollector.js"></script>
<style scoped src="./SearchCollector.css"></style>
