<template>
  <div class="employee-table">
    <v-card elevation="1" class="table-card">
      <!-- Custom Table Header -->
      <div class="table-header">
        <div class="header-row">
          <div class="header-cell employee-col">Employee</div>
          <div class="header-cell role-col">Role</div>
          <div class="header-cell status-col">Status</div>
          <div class="header-cell permissions-col">Permissions</div>
          <div class="header-cell login-col">Last Login</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body scrollable-table-wrapper">
        <div v-if="employees.length === 0" class="no-data-container">
          <v-icon size="64" color="grey-lighten-2">mdi-account-off</v-icon>
          <p class="no-data-text">No employees found</p>
        </div>

        <div v-else>
          <div
            v-for="employee in employees"
            :key="employee.employee_id"
            class="table-row clickable-row"
            @click="openActionsPopup(employee)"
          >
            <div class="table-cell employee-col">
              <div class="employee-info">
                <v-avatar size="32" color="primary">
                  <v-img v-if="employee.avatar" :src="employee.avatar" />
                  <span v-else class="text-white text-caption">
                    {{ employee.first_name?.charAt(0)
                    }}{{ employee.last_name?.charAt(0) }}
                  </span>
                </v-avatar>
                <div class="employee-details">
                  <div class="employee-name">
                    {{ employee.first_name }} {{ employee.last_name }}
                  </div>
                  <div class="employee-email">{{ employee.email }}</div>
                </div>
              </div>
            </div>

            <div class="table-cell role-col">
              <v-chip
                :color="getRoleColor(employee)"
                size="small"
                variant="tonal"
              >
                <v-icon size="14" class="me-1">{{ getRoleIcon(employee) }}</v-icon>
                {{ employee.display_role || 'Web Employee' }}
              </v-chip>
            </div>

            <div class="table-cell status-col">
              <v-chip
                :color="getStatusColor(employee.status)"
                size="small"
                variant="flat"
              >
                {{ capitalizeStatus(employee.status) }}
              </v-chip>
            </div>

            <div class="table-cell permissions-col">
              <div 
                class="permissions-list"
                @mouseenter="showPermissionsPopup(employee, $event)"
                @mouseleave="hidePermissionsPopup"
                @click.stop="togglePermissionsPopup(employee, $event)"
              >
                <v-chip
                  v-for="permission in (employee.permissions || []).slice(0, 2)"
                  :key="permission"
                  size="x-small"
                  color="info"
                  variant="outlined"
                  class="permission-chip"
                >
                  {{ getPermissionText(permission) }}
                </v-chip>
                <v-tooltip 
                  v-if="(employee.permissions || []).length > 2"
                  size="x-small"
                  color="grey"
                  variant="outlined"
                  class="permission-chip more-chip"
                >
                  <template v-slot:activator="{ props }">
                    <v-chip
                      v-bind="props"
                      size="x-small"
                      color="grey"
                      variant="outlined"
                      class="permission-chip permission-more-chip"
                    >
                      +{{ (employee.permissions || []).length - 2 }} more
                    </v-chip>
                  </template>
                </v-tooltip>
              </div>
            </div>

            <div class="table-cell login-col">
              <div v-if="isEmployeeOnline(employee)">
                <div class="login-date">{{ formatDate(employee.last_login) }}</div>
                <div class="login-time">{{ formatTime(employee.last_login) }}</div>
              </div>
              <div v-else-if="employee.last_logout">
                <div class="login-date">{{ formatDate(employee.last_logout) }}</div>
                <div class="login-time">{{ formatTime(employee.last_logout) }}</div>
              </div>
              <span v-else class="text-grey">Never</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Permissions Popup -->
      <div 
        v-if="permissionsPopupVisible && hoveredEmployee"
        class="permissions-popup"
        :style="permissionsPopupStyle"
        @mouseenter="keepPermissionsPopupOpen"
        @mouseleave="hidePermissionsPopup"
      >
        <div class="permissions-popup-header">
          <v-icon size="16" class="me-1">mdi-shield-account</v-icon>
          <span class="permissions-popup-title">All Permissions</span>
        </div>
        <div class="permissions-popup-content">
          <div
            v-for="permission in (hoveredEmployee.permissions || [])"
            :key="permission"
            class="permission-item"
          >
            <v-icon size="14" color="success" class="permission-icon">mdi-check-circle</v-icon>
            <span class="permission-text">{{ getPermissionText(permission) }}</span>
          </div>
          <div v-if="!hoveredEmployee.permissions || hoveredEmployee.permissions.length === 0" class="no-permissions">
            <v-icon size="14" color="grey" class="me-1">mdi-information</v-icon>
            <span class="text-grey">No permissions assigned</span>
          </div>
        </div>
      </div>

      <!-- Actions Popup Dialog - Enhanced Design -->
      <v-dialog v-model="showActionsDialog" max-width="420">
        <v-card class="employee-actions-popup" rounded="lg" elevation="8">
          <!-- Header with Employee Info -->
          <div class="popup-header">
            <div class="employee-avatar-section">
              <v-avatar size="64" :color="getEmployeeTypeColor(selectedEmployee)" class="employee-avatar">
                <v-img v-if="selectedEmployee?.avatar" :src="selectedEmployee.avatar" />
                <span v-else class="text-white text-h5 font-weight-bold">
                  {{ selectedEmployee?.first_name?.charAt(0) }}{{ selectedEmployee?.last_name?.charAt(0) }}
                </span>
              </v-avatar>
            </div>
            <div class="employee-info-section">
              <div class="employee-name-large">{{ selectedEmployee?.first_name }} {{ selectedEmployee?.last_name }}</div>
              <div class="employee-email-display">{{ selectedEmployee?.email }}</div>
              <v-chip size="small" color="white" variant="flat" class="mt-1 role-chip-popup">
                <v-icon size="14" class="me-1">{{ getRoleIcon(selectedEmployee) }}</v-icon>
                {{ selectedEmployee?.display_role || 'Employee' }}
              </v-chip>
            </div>
            <v-btn icon variant="flat" size="default" class="close-btn" @click="closeActionsDialog">
              <v-icon size="24">mdi-close</v-icon>
            </v-btn>
          </div>

          <v-divider></v-divider>

          <!-- Action Buttons -->
          <v-card-text class="popup-actions pa-4">
            <!-- Edit Employee -->
            <v-btn
              block
              variant="flat"
              class="action-btn edit-btn mb-3"
              @click="handleEdit"
            >
              <v-icon class="me-3" size="20">mdi-pencil-outline</v-icon>
              <span class="action-text">Edit Employee</span>
              <v-icon class="ms-auto" size="18" color="grey-darken-1">mdi-chevron-right</v-icon>
            </v-btn>

            <!-- Reset Password -->
            <v-btn
              block
              variant="flat"
              class="action-btn reset-btn mb-3"
              @click="handleResetPassword"
            >
              <v-icon class="me-3" size="20">mdi-key-outline</v-icon>
              <span class="action-text">Reset Password</span>
              <v-icon class="ms-auto" size="18" color="grey-darken-1">mdi-chevron-right</v-icon>
            </v-btn>

            <v-divider class="my-3"></v-divider>

            <!-- Fire Employee - Danger Action -->
            <v-btn
              block
              variant="flat"
              class="action-btn fire-btn"
              @click="handleFireEmployee"
            >
              <v-icon class="me-3" size="20">mdi-account-remove-outline</v-icon>
              <span class="action-text">Fire Employee</span>
              <v-icon class="ms-auto" size="18">mdi-chevron-right</v-icon>
            </v-btn>
          </v-card-text>

          <!-- Footer removed - X button only -->
        </v-card>
      </v-dialog>

      <!-- Pagination Section (if needed) -->
      <div v-if="employees.length > 0" class="table-footer">
        <div class="pagination-info">
          <span class="text-caption"
            >{{ employees.length }} employee{{
              employees.length !== 1 ? "s" : ""
            }}
            total</span
          >
        </div>
      </div>
    </v-card>
  </div>
</template>

<script src="./EmployeeTable.js"></script>

<style scoped src="./EmployeeTable.css"></style>

