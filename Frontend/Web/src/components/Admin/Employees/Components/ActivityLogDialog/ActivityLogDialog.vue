<template>
  <v-dialog
    v-model="show"
    max-width="1400px"
    width="95%"
    scrollable
    persistent
  >
    <v-card class="activity-log-dialog">
      <!-- Header -->
      <v-card-title class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <v-icon class="header-icon" size="24">mdi-history</v-icon>
            <div class="header-text">
              <span class="header-title">Staff Activity Log</span>
              <div class="header-subtitle">Monitor all staff activities across the system</div>
            </div>
          </div>
          <v-btn icon variant="text" @click="closeDialog" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text class="dialog-content">
        <!-- Search and Filter Section - Like Employee Search -->
        <div class="search-filter-section">
          <v-row align="center">
            <!-- Search Bar -->
            <v-col cols="12" md="4">
              <v-text-field
                v-model="searchQuery"
                label="Search Activities"
                placeholder="Search by name, action, description..."
                variant="outlined"
                density="compact"
                clearable
                hide-details
                prepend-inner-icon="mdi-magnify"
                class="search-field"
                @update:model-value="filterLogs"
              ></v-text-field>
            </v-col>

            <!-- Spacer -->
            <v-col cols="12" md="4" class="d-none d-md-block"></v-col>

            <!-- Filter and Refresh Buttons -->
            <v-col cols="12" md="4" class="text-right">
              <div class="d-flex justify-end align-center button-group">
                <!-- Refresh Button -->
                <v-btn
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-refresh"
                  @click="fetchLogs"
                  :loading="loading"
                  class="refresh-btn"
                >
                  Refresh
                </v-btn>

                <!-- Filter Button -->
                <div class="filter-container" ref="filterContainer">
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-filter-variant"
                    @click="toggleFilter"
                    class="filter-btn"
                    :class="{ 'filter-active': showFilterPanel }"
                  >
                    Filter
                    <v-icon
                      :icon="showFilterPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                      size="small"
                      class="ml-1"
                    ></v-icon>
                  </v-btn>

                  <!-- Filter Dropdown Panel -->
                  <transition name="slide-down">
                    <div v-show="showFilterPanel" class="filter-dropdown">
                      <v-card elevation="8" class="filter-card">
                        <div class="filter-header">
                          <div class="d-flex align-center">
                            <v-icon icon="mdi-filter-variant" size="small" class="mr-2"></v-icon>
                            <span class="filter-title">FILTER OPTIONS</span>
                          </div>
                        </div>
                        
                        <div class="filter-content">
                          <v-select
                            v-model="filters.actionType"
                            :items="actionTypeOptions"
                            item-title="title"
                            item-value="value"
                            label="Action Type"
                            variant="outlined"
                            density="compact"
                            clearable
                            hide-details
                            class="mb-4"
                            @update:model-value="filterLogs"
                          ></v-select>
                          
                          <!-- Start Date with Date Picker -->
                          <div class="mb-4">
                            <v-text-field
                              v-model="formattedStartDate"
                              label="Start Date"
                              variant="outlined"
                              density="compact"
                              hide-details
                              readonly
                              placeholder="Click to select date"
                              prepend-inner-icon="mdi-calendar"
                              @click="startDateMenu = true"
                              clearable
                              @click:clear="clearStartDate"
                              style="cursor: pointer;"
                            ></v-text-field>
                            <v-dialog v-model="startDateMenu" width="auto" :z-index="9999999">
                              <v-date-picker
                                v-model="startDatePicker"
                                @update:model-value="updateStartDate"
                                show-adjacent-months
                                header="Select Start Date"
                              ></v-date-picker>
                            </v-dialog>
                          </div>
                          
                          <!-- End Date with Date Picker -->
                          <div class="mb-4">
                            <v-text-field
                              v-model="formattedEndDate"
                              label="End Date"
                              variant="outlined"
                              density="compact"
                              hide-details
                              readonly
                              placeholder="Click to select date"
                              prepend-inner-icon="mdi-calendar"
                              @click="endDateMenu = true"
                              clearable
                              @click:clear="clearEndDate"
                              style="cursor: pointer;"
                            ></v-text-field>
                            <v-dialog v-model="endDateMenu" width="auto" :z-index="9999999">
                              <v-date-picker
                                v-model="endDatePicker"
                                @update:model-value="updateEndDate"
                                :min="formattedStartDate"
                                show-adjacent-months
                                header="Select End Date"
                              ></v-date-picker>
                            </v-dialog>
                          </div>
                        
                          <div class="filter-actions">
                            <v-btn 
                              color="primary" 
                              variant="outlined"
                              size="small"
                              @click="resetFilters"
                            >
                              <v-icon left>mdi-refresh</v-icon>
                              Reset
                            </v-btn>
                          </div>
                        </div>
                      </v-card>
                    </div>
                  </transition>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>

        <!-- Activity Table with Scroll -->
        <div class="table-container" :class="{ 'has-scroll': filteredLogs.length > 7 }">
          <table class="activity-table">
            <thead>
              <tr>
                <th>Staff Type</th>
                <th>Staff Name</th>
                <th>Action</th>
                <th>Description</th>
                <th>Module</th>
                <th>Status</th>
                <th>Date/Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="loading-cell">
                  <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
                  <span class="ml-3">Loading activities...</span>
                </td>
              </tr>
              <tr v-else-if="filteredLogs.length === 0">
                <td colspan="7" class="empty-cell">
                  <v-icon size="48" color="grey-lighten-1">mdi-history</v-icon>
                  <p class="empty-title">No Activity Logs Found</p>
                  <p class="empty-subtitle">Activity logs will appear here when staff perform actions</p>
                </td>
              </tr>
              <tr v-else v-for="item in filteredLogs" :key="item.log_id" class="data-row">
                <td>
                  <v-chip
                    :color="getStaffTypeColor(item.staff_type)"
                    size="small"
                    variant="tonal"
                    class="staff-chip"
                  >
                    <v-icon size="14" class="mr-1">{{ getStaffTypeIcon(item.staff_type) }}</v-icon>
                    {{ formatStaffType(item.staff_type) }}
                  </v-chip>
                </td>
                <td class="staff-name">{{ item.staff_name || 'Unknown' }}</td>
                <td>
                  <v-chip
                    :color="getActionColor(item.action_type)"
                    size="small"
                    variant="flat"
                    class="action-chip"
                  >
                    <v-icon size="14" class="mr-1">{{ getActionIcon(item.action_type) }}</v-icon>
                    {{ item.action_type }}
                  </v-chip>
                </td>
                <td class="description-cell">{{ item.action_description || '-' }}</td>
                <td class="module-cell">{{ item.module || '-' }}</td>
                <td class="status-cell">
                  <v-icon
                    :color="item.status === 'success' ? 'success' : 'error'"
                    size="20"
                  >
                    {{ item.status === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                </td>
                <td class="date-cell">
                  <div class="date-time">{{ formatDateTime(item.created_at) }}</div>
                  <div class="date-relative">{{ formatRelativeTime(item.created_at) }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Results Count -->
        <div class="results-info" v-if="!loading && filteredLogs.length > 0">
          Showing {{ filteredLogs.length }} of {{ activityLogs.length }} activities
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script src="./ActivityLogDialog.js"></script>
<style src="./ActivityLogDialog.css"></style>
