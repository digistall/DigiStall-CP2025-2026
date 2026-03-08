<template>
  <v-container fluid class="stall-tracker-container">
    <!-- Tab Navigation Container -->
    <v-card elevation="2" class="rounded-lg mb-4 d-inline-flex">
      <v-tabs
        v-model="activeTab"
        color="primary"
        bg-color="white"
        slider-color="primary"
        align-tabs="start"
      >
        <v-tab value="pending" class="text-subtitle-1 font-weight-bold">PENDING SURRENDERS</v-tab>
        <v-tab value="history" class="text-subtitle-1 font-weight-bold">STALLHOLDER HISTORY</v-tab>
      </v-tabs>
    </v-card>

    <!-- Data Table Container -->
    <v-window v-model="activeTab" class="bg-transparent mt-2">
      <v-window-item value="pending">
        <!-- Filter Container (Pending) -->
        <div class="search-filter-section mb-6 mt-2">
          <v-row align="center">
            <!-- Search Bar -->
            <v-col cols="12" md="6" lg="4">
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
            </v-col>

            <!-- Spacer -->
            <v-col class="d-none d-md-block"></v-col>

            <!-- Filter Button -->
            <v-col cols="auto" class="text-right">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-filter-variant"
                @click="fetchPendingRequests"
                class="filter-btn"
              >
                Filter
                <v-icon icon="mdi-chevron-down" size="small" class="ml-1"></v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <v-data-table
          :headers="pendingHeaders"
          :items="pendingRequests"
          :loading="loading"
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
          <v-row align="center">
            <!-- Search Bar -->
            <v-col cols="12" md="4" lg="4">
              <v-text-field
                v-model="searchQueryHistory"
                label="Search by Name"
                placeholder="Search previous tenant..."
                variant="outlined"
                clearable
                hide-details
                prepend-inner-icon="mdi-magnify"
                @keyup.enter="fetchHistory"
                class="search-field"
              ></v-text-field>
            </v-col>

            <!-- Spacer -->
            <v-col class="d-none d-md-block"></v-col>

            <!-- Import Legacy Excel Section -->
            <v-col cols="auto">
              <div class="d-flex align-center gap-2">
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
            </v-col>

            <!-- Filter Button -->
            <v-col cols="auto" class="text-right">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-filter-variant"
                @click="fetchHistory"
                class="filter-btn"
              >
                Filter
                <v-icon icon="mdi-chevron-down" size="small" class="ml-1"></v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <v-data-table
          :headers="historyHeaders"
          :items="historyLogs"
          :loading="loading"
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
  </v-container>
</template>

<script>
import StallTrackerScript from './StallTracker.js'
export default StallTrackerScript
</script>

<style scoped>
@import './StallTracker.css';
</style>
