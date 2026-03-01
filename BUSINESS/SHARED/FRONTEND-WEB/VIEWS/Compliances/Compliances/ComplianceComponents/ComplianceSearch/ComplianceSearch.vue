<template>
  <div class="search-filter-section mb-6">
    <div class="search-wrapper">
      <!-- Search Bar -->
      <v-col cols="12" md="6" lg="4">
        <v-text-field
          v-model="searchQuery"
          label="Search anything"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
          class="search-field"
          placeholder="Search ID, Type, Inspector, Stallholder, or Status..."
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
                      class="status-btn"
                      :class="{ active: filters.status === 'pending' }"
                      @click="filters.status = 'pending'"
                    >
                      Pending
                    </button>
                    <button
                      class="status-btn"
                      :class="{ active: filters.status === 'in-progress' }"
                      @click="filters.status = 'in-progress'"
                    >
                      In Progress
                    </button>
                    <button
                      class="status-btn"
                      :class="{ active: filters.status === 'complete' }"
                      @click="filters.status = 'complete'"
                    >
                      Complete
                    </button>
                    <button
                      class="status-btn"
                      :class="{ active: filters.status === 'incomplete' }"
                      @click="filters.status = 'incomplete'"
                    >
                      Incomplete
                    </button>
                  </div>
                </div>

                <!-- Severity Filter -->
                <div class="filter-group">
                  <label class="filter-label">Severity</label>
                  <div class="status-buttons">
                    <button
                      class="status-btn"
                      :class="{ active: filters.severity === 'all' }"
                      @click="filters.severity = 'all'"
                    >
                      All
                    </button>
                    <button
                      class="status-btn severity-low"
                      :class="{ active: filters.severity === 'low' }"
                      @click="filters.severity = 'low'"
                    >
                      Low
                    </button>
                    <button
                      class="status-btn severity-medium"
                      :class="{ active: filters.severity === 'medium' }"
                      @click="filters.severity = 'medium'"
                    >
                      Medium
                    </button>
                    <button
                      class="status-btn severity-high"
                      :class="{ active: filters.severity === 'high' }"
                      @click="filters.severity = 'high'"
                    >
                      High
                    </button>
                    <button
                      class="status-btn severity-critical"
                      :class="{ active: filters.severity === 'critical' }"
                      @click="filters.severity = 'critical'"
                    >
                      Critical
                    </button>
                  </div>
                </div>

                <!-- Type Filter -->
                <div class="filter-group">
                  <label class="filter-label">Compliance Type</label>
                  <v-select
                    v-model="filters.type"
                    :items="typeOptions"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="filter-select"
                  ></v-select>
                </div>

                <!-- Date Range Filter -->
                <div class="filter-group">
                  <label class="filter-label">Date Range</label>
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

<script src="./ComplianceSearch.js"></script>
<style scoped src="./ComplianceSearch.css"></style>


