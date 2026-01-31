<template>
  <div class="branch-table">
    <v-card elevation="1" class="table-card">
      <!-- Custom Table Header -->
      <div class="table-header">
        <div class="header-row">
          <div class="header-cell name-col">Branch Name</div>
          <div class="header-cell area-col">Area</div>
          <div class="header-cell location-col">Location</div>
          <div class="header-cell status-col">Status</div>
          <div class="header-cell manager-col">Manager</div>
          <div class="header-cell contact-col">Contact</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body scrollable-table-wrapper">
        <div
          v-for="branch in branches"
          :key="branch.branch_id"
          class="table-row clickable-row"
          @click="viewBranchDetails(branch)"
        >
          <div class="table-cell name-col">
            <span class="branch-name-text">{{ branch.branch_name }}</span>
          </div>
          <div class="table-cell area-col">
            {{ branch.area }}
          </div>
          <div class="table-cell location-col">
            <div class="location-text">{{ branch.location }}</div>
          </div>
          <div class="table-cell status-col">
            <div
              class="status-badge"
              :class="getStatusClass(branch.status)"
            >
              <v-icon
                :icon="getStatusIcon(branch.status)"
                size="16"
                class="mr-1"
              ></v-icon>
              {{ branch.status }}
            </div>
          </div>
          <div class="table-cell manager-col">
            <div class="manager-display">
              <v-icon
                :color="branch.manager_name ? 'success' : 'warning'"
                size="16"
                class="mr-1"
              >
                {{ branch.manager_name ? "mdi-check-circle" : "mdi-account-question" }}
              </v-icon>
              <span :class="branch.manager_name ? 'text-success' : 'text-warning'">
                {{ branch.manager_name || 'Not Assigned' }}
              </span>
            </div>
          </div>
          <div class="table-cell contact-col">
            {{ branch.contact_number || 'N/A' }}
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="branches.length === 0 && !loading" class="empty-state">
        <v-icon size="48" color="grey-lighten-1" class="mb-3">
          mdi-domain
        </v-icon>
        <p class="text-grey-lighten-1">No branches found</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <p class="mt-3">Loading branches...</p>
      </div>
    </v-card>

    <!-- Branch Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="700" scrollable>
      <v-card>
        <v-card-title class="text-h5 pa-4 bg-primary text-white">
          <v-icon class="mr-2" color="white">mdi-domain</v-icon>
          Branch Details - {{ selectedBranch?.branch_name }}
        </v-card-title>

        <v-card-text class="pa-0">
          <v-tabs v-model="activeTab" color="primary" class="border-b">
            <v-tab value="info">Branch Information</v-tab>
            <v-tab value="manager">Manager Details</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab" class="pa-4">
            <!-- Branch Information Tab -->
            <v-tabs-window-item value="info">
              <div class="info-section">
                <h3 class="section-title">Branch Details</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Branch Name:</span>
                      <span class="info-value">{{ selectedBranch?.branch_name }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Area:</span>
                      <span class="info-value">{{ selectedBranch?.area }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Location:</span>
                      <span class="info-value">{{ selectedBranch?.location }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Status:</span>
                      <span class="info-value">
                        <v-chip :color="getStatusColor(selectedBranch?.status)" size="small">
                          {{ selectedBranch?.status }}
                        </v-chip>
                      </span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Contact Number:</span>
                      <span class="info-value">{{ selectedBranch?.contact_number || 'N/A' }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="info-item">
                      <span class="info-label">Address:</span>
                      <span class="info-value">{{ selectedBranch?.address || 'N/A' }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <!-- Manager Details Tab -->
            <v-tabs-window-item value="manager">
              <div class="info-section">
                <h3 class="section-title">Manager Information</h3>
                <v-row v-if="selectedBranch?.manager_name">
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Manager Name:</span>
                      <span class="info-value">{{ selectedBranch?.manager_name }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Manager Email:</span>
                      <span class="info-value">{{ selectedBranch?.manager_email || 'N/A' }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Manager Contact:</span>
                      <span class="info-value">{{ selectedBranch?.manager_contact || 'N/A' }}</span>
                    </div>
                  </v-col>
                </v-row>
                <div v-else class="no-manager-state">
                  <v-icon size="48" color="warning" class="mb-3">mdi-account-question</v-icon>
                  <p class="text-grey">No manager assigned to this branch</p>
                </div>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>

        <!-- Action Buttons -->
        <v-card-actions class="pa-4 border-t action-buttons-container">
          <div class="action-buttons">
            <v-btn
              color="primary"
              variant="flat"
              @click="handleAssignManager"
            >
              <v-icon left>mdi-account-plus</v-icon>
              {{ selectedBranch?.manager_name ? 'Change Manager' : 'Assign Manager' }}
            </v-btn>
            <v-btn
              color="info"
              variant="flat"
              @click="handleEditBranch"
            >
              <v-icon left>mdi-pencil</v-icon>
              Edit Branch
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              @click="handleDeleteBranch"
            >
              <v-icon left>mdi-delete</v-icon>
              Delete Branch
            </v-btn>
          </div>
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showDetailsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script src="./BranchList.js"></script>
<style scoped src="./BranchList.css"></style>

