<template>
  <div class="search-filter-section mb-6">
    <div class="search-wrapper">
      <!-- Search Bar -->
      <v-col cols="12" md="6" lg="4">
        <v-text-field
          v-model="searchQuery"
          label="Search location"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
          class="search-field"
          placeholder="Search by location name"
        ></v-text-field>
      </v-col>

      <!-- Sort Controls -->
      <div class="sort-container" ref="sortContainer">
        <button
          class="filter-btn"
          :class="{ 'filter-active': showSortPanel }"
          @click="toggleSort"
        >
          <v-icon icon="mdi-sort" size="small" class="mr-2"></v-icon>
          Sort
          <v-icon
            :icon="showSortPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="small"
            class="ml-1"
          ></v-icon>
        </button>

        <!-- Sort Dropdown Panel -->
        <transition name="slide-down">
          <div v-show="showSortPanel" class="filter-dropdown">
            <div class="filter-card">
              <div class="filter-header">
                <div class="filter-header-content">
                  <v-icon icon="mdi-sort" size="small" class="mr-2"></v-icon>
                  <h6 class="filter-title">Sort Options</h6>
                </div>
                <button class="close-btn" @click="showSortPanel = false">
                  <v-icon icon="mdi-close" size="small"></v-icon>
                </button>
              </div>

              <div class="filter-content">
                <!-- Sort By -->
                <div class="filter-group">
                  <label class="filter-label">Sort By</label>
                  <div class="status-buttons">
                    <button
                      class="status-btn"
                      :class="{ active: activeSortBy === 'location_name' }"
                      @click="activeSortBy = 'location_name'"
                    >
                      <v-icon icon="mdi-alphabetical" size="small" class="mr-1"></v-icon>
                      Name
                    </button>
                    <button
                      class="status-btn"
                      :class="{ active: activeSortBy === 'created_at' }"
                      @click="activeSortBy = 'created_at'"
                    >
                      <v-icon icon="mdi-calendar" size="small" class="mr-1"></v-icon>
                      Date Created
                    </button>
                  </div>
                </div>

                <!-- Sort Direction -->
                <div class="filter-group">
                  <label class="filter-label">Direction</label>
                  <div class="status-buttons">
                    <button
                      class="status-btn"
                      :class="{ active: activeSortDir === 'ASC' }"
                      @click="activeSortDir = 'ASC'"
                    >
                      <v-icon icon="mdi-sort-ascending" size="small" class="mr-1"></v-icon>
                      Ascending
                    </button>
                    <button
                      class="status-btn"
                      :class="{ active: activeSortDir === 'DESC' }"
                      @click="activeSortDir = 'DESC'"
                    >
                      <v-icon icon="mdi-sort-descending" size="small" class="mr-1"></v-icon>
                      Descending
                    </button>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="filter-actions">
                  <button class="clear-btn" @click="clearSort">Reset</button>
                  <button class="apply-btn" @click="applySort">Apply Sort</button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script src="./SearchLocation.js"></script>
<style scoped src="./SearchLocation.css"></style>
