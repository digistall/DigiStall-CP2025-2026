<template>
  <div>
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
                <!-- Clear All Button -->
                <v-btn
                  color="error"
                  variant="outlined"
                  prepend-icon="mdi-delete-sweep"
                  @click="openClearConfirmDialog"
                  class="clear-btn mr-2"
                >
                  Clear All
                </v-btn>

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
                <th>Device/IP</th>
                <th>Status</th>
                <th>Date/Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="loading-cell">
                  <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
                  <span class="ml-3">Loading activities...</span>
                </td>
              </tr>
              <tr v-else-if="filteredLogs.length === 0">
                <td colspan="8" class="empty-cell">
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
                <td class="device-cell">
                  <div class="device-info">
                    <v-tooltip location="top">
                      <template v-slot:activator="{ props }">
                        <div v-bind="props" class="device-wrapper">
                          <v-icon size="14" class="mr-1" :color="getDeviceIcon(item.user_agent).color">
                            {{ getDeviceIcon(item.user_agent).icon }}
                          </v-icon>
                          <span class="device-type">{{ getDeviceType(item.user_agent) }}</span>
                        </div>
                      </template>
                      <div class="device-tooltip">
                        <div class="tooltip-row">
                          <v-icon size="14" class="mr-1">mdi-ip-network</v-icon>
                          <strong>IP:</strong> {{ item.ip_address || 'Unknown' }}
                        </div>
                        <div class="tooltip-row" v-if="item.user_agent">
                          <v-icon size="14" class="mr-1">mdi-cellphone-information</v-icon>
                          <strong>Browser:</strong> {{ getBrowserName(item.user_agent) }}
                        </div>
                        <div class="tooltip-row" v-if="item.user_agent">
                          <v-icon size="14" class="mr-1">mdi-monitor</v-icon>
                          <strong>OS:</strong> {{ getOSName(item.user_agent) }}
                        </div>
                      </div>
                    </v-tooltip>
                    <div class="ip-address">{{ formatIP(item.ip_address) }}</div>
                  </div>
                </td>
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
    
  <!-- Clear All Confirmation Dialog -->
  <v-dialog
    v-model="showClearConfirmDialog"
    max-width="500px"
    persistent
  >
    <v-card class="clear-confirm-dialog">
      <v-card-title class="clear-dialog-header">
        <div class="header-content">
          <v-icon size="32" color="white" class="mr-3">mdi-alert-circle-outline</v-icon>
          <span class="clear-title">Clear Activity History?</span>
        </div>
      </v-card-title>
      
      <v-card-text class="clear-dialog-content">
        <div class="warning-section">
          <v-icon size="48" color="warning" class="mb-3">mdi-delete-alert</v-icon>
          <h3 class="mb-3">Are you sure you want to clear all activity history?</h3>
          <p class="warning-text mb-4">
            This action will permanently delete all activity log records from the system.
          </p>
        </div>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="backup-notice">
          <div class="notice-icon-wrapper">
            <v-icon size="24" color="success">mdi-file-excel</v-icon>
          </div>
          <div class="notice-content">
            <h4 class="notice-title">
              <v-icon size="18" color="success" class="mr-1">mdi-shield-check</v-icon>
              Don't Worry - Your Data is Safe!
            </h4>
            <p class="notice-description">
              Before clearing, all activity records will be automatically exported to an 
              <strong>Excel backup file</strong>. You can review this data anytime, even after 
              it's been removed from the system.
            </p>
            <div class="backup-features">
              <div class="feature-item">
                <v-icon size="16" color="primary" class="mr-1">mdi-check-circle</v-icon>
                Complete activity history exported
              </div>
              <div class="feature-item">
                <v-icon size="16" color="primary" class="mr-1">mdi-check-circle</v-icon>
                Professional Excel format with styling
              </div>
              <div class="feature-item">
                <v-icon size="16" color="primary" class="mr-1">mdi-check-circle</v-icon>
                Permanent backup for your records
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions class="clear-dialog-actions">
        <v-btn
          variant="outlined"
          @click="closeClearConfirmDialog"
          :disabled="clearingData"
        >
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          variant="flat"
          @click="clearAllActivities"
          :loading="clearingData"
          prepend-icon="mdi-delete-sweep"
        >
          Yes, Clear All & Export Backup
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Success Snackbar Notification (outside the dialog) -->
  <v-snackbar
    v-model="snackbar.show"
    :timeout="4000"
    location="bottom left"
    :class="['custom-snackbar', snackbar.color === 'success' ? 'success-snackbar' : 'error-snackbar']"
  >
    <div class="d-flex align-center" :class="snackbar.color === 'success' ? 'success-content' : 'error-content'">
      <v-icon class="mr-2" :style="{ color: snackbar.color === 'success' ? '#4caf50' : '#f44336' }">
        {{ snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
      </v-icon>
      <div>
        <div :style="{ color: snackbar.color === 'success' ? '#2e7d32' : '#c62828', fontWeight: 600 }">
          {{ snackbar.title }}
        </div>
        <div :style="{ color: snackbar.color === 'success' ? '#388e3c' : '#d32f2f', fontSize: '0.85rem' }">
          {{ snackbar.message }}
        </div>
      </div>
    </div>
    <template v-slot:actions>
      <v-btn variant="text" :style="{ color: snackbar.color === 'success' ? '#4caf50' : '#f44336' }" @click="snackbar.show = false">
        Close
      </v-btn>
    </template>
  </v-snackbar>
  </div>
</template>

<script src="./ActivityLogDialog.js"></script>
<style src="./ActivityLogDialog.css"></style>
