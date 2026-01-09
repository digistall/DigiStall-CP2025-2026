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
