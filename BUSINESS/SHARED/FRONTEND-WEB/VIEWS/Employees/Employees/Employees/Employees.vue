<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-app>
    <div class="employee-container">
      <!-- Standardized Loading Overlay - contained within employee container -->
      <LoadingOverlay 
        :loading="loading" 
        text="Loading employees..."
        :full-page="false"
      />
      
      <!-- Header Section - Simple white header like Applicants -->
      <v-container fluid class="main-content">
        <v-row>
          <v-col cols="12">
            <!-- Content Section -->
            <div class="employee-content">
              <!-- Search, Filters, and Activity Log Button -->
              <EmployeeSearch
                v-model:search="searchQuery"
                v-model:statusFilter="statusFilter"
                v-model:permissionFilter="permissionFilter"
                :permission-options="permissionOptions"
                :show-activity-log="!isBusinessOwner"
                @reset="resetFilters"
                @open-activity-log="openActivityLogDialog"
              />

              <!-- Employee Table -->
              <EmployeeTable
                :employees="filteredEmployees"
                @edit-employee="editEmployee"
                @manage-permissions="managePermissions"
                @toggle-status="toggleEmployeeStatus"
                @reset-password="resetEmployeePassword"
                @fire-employee="fireEmployee"
              />
            </div>

            <!-- Floating Button Container (Hidden for business owners - view only) -->
            <div class="floating-button-container" v-if="!isBusinessOwner">
              <button class="floating-btn" @click="openAddEmployeeDialog">
                <v-icon size="24">mdi-plus</v-icon>
                <div class="ripple-overlay"></div>
              </button>
            </div>

            <!-- Pulse Rings Animation (Hidden for business owners) -->
            <div class="pulse-rings" v-if="!isBusinessOwner">
              <div class="pulse-ring pulse-ring-1"></div>
              <div class="pulse-ring pulse-ring-2"></div>
              <div class="pulse-ring pulse-ring-3"></div>
              <div class="pulse-ring pulse-ring-4"></div>
            </div>

            <!-- Activity Log Dialog -->
            <ActivityLogDialog
              v-model="activityLogDialog"
              @close="closeActivityLogDialog"
            />

            <!-- Add/Edit Employee Dialog -->
            <AddEmployee
              v-model="employeeDialog"
              :employee="selectedEmployee"
              :is-edit-mode="isEditMode"
              :saving="saving"
              :available-permissions="availablePermissions"
              :selected-permissions="selectedPermissions"
              @save="saveEmployee"
              @close="closeEmployeeDialog"
              @toggle-permission="togglePermission"
            />

            <!-- Manage Permissions Dialog -->
            <ManagePermissions
              v-model="permissionsDialog"
              :employee="selectedEmployee"
              :selected-permissions="selectedPermissions"
              :available-permissions="availablePermissions"
              :saving="saving"
              @save="savePermissions"
              @close="closePermissionsDialog"
              @toggle-permission="togglePermission"
            />

            <!-- Fire Employee Dialog -->
            <FireEmployeeDialog
              v-model="fireEmployeeDialog"
              :employee="selectedEmployee"
              :saving="saving"
              @confirm="confirmFireEmployee"
              @close="closeFireEmployeeDialog"
            />

            <!-- Reset Password Dialog -->
            <ResetPasswordDialog
              v-model="resetPasswordDialog"
              :employee="selectedEmployee"
              :saving="saving"
              @confirm="confirmResetPassword"
              @close="closeResetPasswordDialog"
            />

            <!-- Credentials Dialog -->
            <v-dialog v-model="credentialsDialog" max-width="600" persistent>
              <v-card>
                <v-card-title class="text-h5 bg-success text-white d-flex align-center">
                  <v-icon class="mr-2" color="white">mdi-check-circle</v-icon>
                  Account Created Successfully!
                </v-card-title>
                
                <v-card-text class="pt-6">
                  <v-alert type="warning" variant="tonal" class="mb-4">
                    <div class="text-subtitle-2 font-weight-bold mb-1">
                      ⚠️ IMPORTANT: Save These Credentials Now!
                    </div>
                    <div class="text-caption">
                      This is the only time you'll see the password. Please copy and save it securely.
                    </div>
                  </v-alert>

                  <div class="credentials-info">
                    <v-row class="mb-3">
                      <v-col cols="12">
                        <div class="text-subtitle-2 text-grey-darken-2 mb-1">Employee Name</div>
                        <div class="text-h6">{{ generatedCredentials.employeeName }}</div>
                      </v-col>
                    </v-row>

                    <v-row class="mb-3">
                      <v-col cols="12">
                        <div class="text-subtitle-2 text-grey-darken-2 mb-1">Role</div>
                        <v-chip color="primary" size="small">{{ generatedCredentials.role }}</v-chip>
                      </v-col>
                    </v-row>

                    <v-divider class="my-4"></v-divider>

                    <v-row class="mb-3">
                      <v-col cols="12">
                        <div class="text-subtitle-2 text-grey-darken-2 mb-2">Username</div>
                        <v-card variant="outlined" class="pa-3">
                          <div class="d-flex align-center justify-space-between">
                            <span class="text-h6 font-weight-bold text-primary">
                              {{ generatedCredentials.username }}
                            </span>
                            <v-btn
                              icon
                              size="small"
                              variant="text"
                              color="primary"
                              @click="copyToClipboard(generatedCredentials.username)"
                            >
                              <v-icon>mdi-content-copy</v-icon>
                            </v-btn>
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col cols="12">
                        <div class="text-subtitle-2 text-grey-darken-2 mb-2">Password</div>
                        <v-card variant="outlined" class="pa-3" color="warning-lighten-5">
                          <div class="d-flex align-center justify-space-between">
                            <span class="text-h6 font-weight-bold text-error">
                              {{ generatedCredentials.password }}
                            </span>
                            <v-btn
                              icon
                              size="small"
                              variant="text"
                              color="error"
                              @click="copyToClipboard(generatedCredentials.password)"
                            >
                              <v-icon>mdi-content-copy</v-icon>
                            </v-btn>
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                </v-card-text>

                <v-card-actions class="px-6 pb-4">
                  <v-spacer></v-spacer>
                  <v-btn
                    color="success"
                    variant="elevated"
                    size="large"
                    @click="closeCredentialsDialog"
                  >
                    <v-icon left class="mr-2">mdi-check</v-icon>
                    I've Saved The Credentials
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Toast Notification -->
            <ToastNotification
              :show="toast.show"
              :message="toast.message"
              :type="toast.type"
              @close="toast.show = false"
            />
          </v-col>
        </v-row>
      </v-container>
    </div>
  </v-app>
</template>

<script src="./Employees.js"></script>
<style src="./Employees.css"></style>
