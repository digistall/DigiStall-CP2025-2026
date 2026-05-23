<template>
  <div class="search-filter-section mb-6">
    <div class="search-wrapper">
      <!-- Search Bar -->
      <v-col cols="12" md="6" lg="5">
        <v-text-field
          :model-value="search"
          @update:model-value="$emit('update:search', $event)"
          label="Search Employees"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
          class="search-field"
          placeholder="Search employees..."
        ></v-text-field>
      </v-col>

      <!-- Buttons Container -->
      <div class="d-flex align-center gap-4">
        <!-- Activity Log Button -->
        <button
          v-if="showActivityLog"
          class="activity-log-btn mr-3"
          @click="$emit('open-activity-log')"
        >
          <v-icon icon="mdi-history" size="small"></v-icon>
          Activity Log
        </button>

        <!-- Filter Button -->
        <div class="filter-container" ref="filterContainer">
          <button
            class="filter-btn"
            :class="{ 'filter-active': showFilterPanel }"
            @click="toggleFilter"
          >
            <v-icon icon="mdi-filter-variant" size="small" class="mr-1"></v-icon>
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
                  <div class="filter-group">
                    <v-select
                      :model-value="statusFilter"
                      @update:model-value="$emit('update:statusFilter', $event)"
                      :items="statusOptions"
                      item-title="title"
                      item-value="value"
                      label="Filter by Status"
                      variant="outlined"
                      density="compact"
                      clearable
                      hide-details
                      class="mb-3"
                    ></v-select>
                  </div>

                  <div class="filter-group">
                    <v-select
                      :model-value="permissionFilter"
                      @update:model-value="$emit('update:permissionFilter', $event)"
                      :items="permissionOptions"
                      item-title="title"
                      item-value="value"
                      label="Filter by Permission"
                      variant="outlined"
                      density="compact"
                      clearable
                      hide-details
                    ></v-select>
                  </div>

                  <div class="filter-actions">
                    <button class="reset-btn" @click="$emit('reset')">
                      <v-icon icon="mdi-refresh" size="small"></v-icon>
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./EmployeeSearch.js"></script>

<style scoped src="./EmployeeSearch.css"></style>
