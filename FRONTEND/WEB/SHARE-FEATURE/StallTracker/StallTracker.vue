<template>
  <div class="stall-tracker-container">
    <div class="stall-tracker-main-content">
      <!-- Stall Tracker Header -->
      <v-card elevation="2" class="rounded-lg mb-4 d-inline-flex">
        <v-tabs
          v-model="activeTab"
          color="primary"
          bg-color="white"
          slider-color="primary"
          align-tabs="start"
        >
          <v-tab value="pending" class="text-subtitle-1 font-weight-bold">PENDING SURRENDERS</v-tab>
          <v-tab value="history" class="text-subtitle-1 font-weight-bold"
            >STALLHOLDER HISTORY</v-tab
          >
        </v-tabs>
      </v-card>

      <!-- Data Table Container -->
      <v-window v-model="activeTab" class="bg-transparent mt-2">
        <!--
- [x] Standardize ComplianceSearch to match ComplaintsSearch
- [x] Standardize SearchStall to match ComplaintsSearch
- [x] Standardize SearchAndFilter (Stalls) to match ComplaintsSearch
- [x] Standardize SearchVendor to match ComplaintsSearch
- [x] Standardize EmployeeSearch to match ComplaintsSearch
- [x] Standardize Payment Search Components
  - [x] OnsitePayments (Template, CSS, JS search logic)
  - [x] DailyPayments (Template, CSS)
  - [x] OnlinePayments (Template, CSS)
  - [x] PenaltyPayments (Template, CSS)
- [x] Standardize Stall Tracker Search Components
  - [x] Pending Surrenders
  - [x] Stallholder History
- [x] Verify Real-time Search (No Debounce)
  - [x] ApplicantsSearch
  - [x] EmployeeSearch
  - [x] SearchStall
  - [x] SearchVendor
- [x] Remove "Feedback" column from `StallTracker.js` in history tab
- [x] Fix search for Pending Surrenders to work with encrypted names in the database
- [x] Refactor Compliances search to be fully realtime and locally-filtered
- [x] Refactor Complaints search to be fully realtime and locally-filtered
- [x] Verify the search bar and filter button work in both tabs
- [ ] Expand Stallholder search to include Full Name (currently only email)
- [ ] Completely remove loading overlays from Compliances search
- [ ] Completely remove loading overlays from Stall Tracker search
        -->
        <v-window-item value="pending">
          <!-- Filter Container (Pending) -->
          <div class="search-filter-section mb-6 mt-2">
            <div class="search-wrapper">
              <!-- Search Bar -->
              <div class="search-input-wrapper">
                <v-text-field
                  v-model="searchQueryPending"
                  label="Search by Name"
                  placeholder="Search stallholder..."
                  variant="outlined"
                  clearable
                  hide-details
                  prepend-inner-icon="mdi-magnify"
                  class="search-field"
                ></v-text-field>
              </div>

              <!-- Filter Button -->
              <div class="filter-container">
                <button class="filter-btn" @click="fetchPendingRequests">
                  <v-icon icon="mdi-filter-variant" size="small" class="mr-1"></v-icon>
                  Filter
                  <v-icon icon="mdi-chevron-down" size="small" class="ml-1"></v-icon>
                </button>
              </div>
            </div>
          </div>

          <v-data-table
            :headers="pendingHeaders"
            :items="filteredPendingRequests"
            :items-per-page="-1"
            hide-default-footer
            class="elevation-2 mt-4 mb-2 custom-shadow-table"
            hover
          >
            <template v-slot:item.action="{ item }">
              <div class="d-flex justify-center">
                <v-btn
                  color="success"
                  size="small"
                  class="mr-2"
                  @click="approveRequest(item)"
                  prepend-icon="mdi-check"
                  elevation="1"
                >
                  Approve
                </v-btn>
                <v-btn
                  color="error"
                  size="small"
                  @click="rejectRequest(item)"
                  prepend-icon="mdi-close"
                  elevation="1"
                >
                  Reject
                </v-btn>
              </div>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip color="warning" text-color="white" size="small">{{ item.status }}</v-chip>
            </template>
          </v-data-table>
        </v-window-item>

        <!-- History Database Tab -->
        <v-window-item value="history">
          <!-- Filter Container (History) -->
          <div class="search-filter-section mb-6 mt-2">
            <div class="search-wrapper">
              <!-- Search Bar -->
              <div class="search-input-wrapper">
                <v-text-field
                  v-model="searchQueryHistory"
                  label="Search by Name"
                  placeholder="Search previous tenant..."
                  variant="outlined"
                  clearable
                  hide-details
                  prepend-inner-icon="mdi-magnify"
                  class="search-field"
                ></v-text-field>
              </div>

              <!-- Action Area -->
              <div class="filter-container d-flex align-center gap-2">
                <!-- Import Excel Section -->
                <div class="d-flex align-center gap-2 mr-2">
                  <v-file-input
                    v-model="excelFile"
                    label="Select Excel File"
                    accept=".xlsx,.xls"
                    variant="outlined"
                    hide-details
                    density="compact"
                    prepend-inner-icon="mdi-file-excel"
                    prepend-icon=""
                    class="search-field"
                    style="width: 250px"
                  ></v-file-input>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    @click="importExcel"
                    :loading="importing"
                    :disabled="!excelFile"
                    class="filter-btn"
                  >
                    <v-icon icon="mdi-file-upload-outline" size="small" class="mr-1"></v-icon>
                    Import
                  </v-btn>
                </div>

                <!-- Filter Button -->
                <button class="filter-btn" @click="fetchHistory">
                  <v-icon icon="mdi-filter-variant" size="small" class="mr-1"></v-icon>
                  Filter
                  <v-icon icon="mdi-chevron-down" size="small" class="ml-1"></v-icon>
                </button>
              </div>
            </div>
          </div>

          <v-data-table
            :headers="historyHeaders"
            :items="filteredHistoryLogs"
            :items-per-page="-1"
            hide-default-footer
            class="elevation-2 mt-4 mb-2 custom-shadow-table"
            hover
          >
          </v-data-table>
        </v-window-item>
      </v-window>

      <!-- Confirmation Dialog -->
      <v-dialog v-model="confirmDialog.show" max-width="450">
        <v-card class="rounded-lg">
          <v-card-title class="pa-4 flex-nowrap d-flex align-center bg-grey-lighten-4">
            <v-icon :color="confirmDialog.color" class="mr-3">
              {{ confirmDialog.action === 'Approved' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
            <span class="text-h6 font-weight-bold">{{ confirmDialog.title }}</span>
          </v-card-title>

          <v-card-text class="pa-6 text-body-1">
            {{ confirmDialog.message }}
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn variant="text" rounded="pill" class="px-6" @click="confirmDialog.show = false">
              Cancel
            </v-btn>
            <v-btn
              :color="confirmDialog.color"
              variant="flat"
              rounded="pill"
              class="px-6 ml-2"
              @click="executeConfirmAction"
              :loading="loading"
            >
              Confirm
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar for Notifications -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="3000"
        location="bottom left"
        elevation="24"
      >
        <div class="d-flex align-center">
          <v-icon left size="24" class="mr-2">{{ snackbarIcon }}</v-icon>
          <span class="text-body-1 font-weight-medium">{{ snackbar.message }}</span>
        </div>
        <template v-slot:actions>
          <v-btn color="white" variant="text" @click="snackbar.show = false"> Close </v-btn>
        </template>
      </v-snackbar>
    </div>
  </div>
</template>

<script>
import StallTrackerScript from './StallTracker.js'
export default StallTrackerScript
</script>

<style scoped>
@import './StallTracker.css';
</style>
