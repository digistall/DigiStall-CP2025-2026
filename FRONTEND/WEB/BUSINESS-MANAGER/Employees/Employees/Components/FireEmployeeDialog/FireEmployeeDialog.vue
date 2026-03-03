<template>
  <v-dialog v-model="dialogModel" max-width="550" persistent @click:outside="closeDialog">
    <v-card class="fire-employee-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="icon-wrapper danger">
            <v-icon size="28" color="white">mdi-account-remove</v-icon>
          </div>
          <div class="header-text">
            <h2 class="dialog-title">Terminate Employee</h2>
            <p class="dialog-subtitle">This action cannot be undone</p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          class="close-btn"
          @click="closeDialog"
          :disabled="saving"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider></v-divider>

      <!-- Employee Info -->
      <v-card-text class="dialog-body">
        <div class="employee-info-card">
          <div class="employee-avatar">
            <div class="avatar-circle">
              {{ getInitials(employee?.first_name, employee?.last_name) }}
            </div>
          </div>
          <div class="employee-details">
            <h3 class="employee-name">
              {{ employee?.first_name }} {{ employee?.last_name }}
            </h3>
            <p class="employee-email">{{ employee?.email }}</p>
            <div class="employee-badges">
              <v-chip
                size="small"
                :color="getRoleColor(employee)"
                variant="flat"
                class="role-chip"
              >
                <v-icon start size="14">{{ getRoleIcon(employee) }}</v-icon>
                {{ getRoleText(employee) }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <v-alert
          type="warning"
          variant="tonal"
          class="warning-alert mt-4"
          prominent
        >
          <template v-slot:prepend>
            <v-icon>mdi-alert</v-icon>
          </template>
          <div class="alert-content">
            <strong>Warning:</strong> This action will permanently remove the employee account.
            <ul class="warning-list">
              <li>All access will be immediately revoked</li>
              <li>Employee will no longer be able to log in</li>
              <li>This action is logged in the activity history</li>
            </ul>
          </div>
        </v-alert>

        <!-- Termination Reason -->
        <div class="reason-section mt-4">
          <label class="reason-label">
            <v-icon size="18" class="me-2">mdi-text-box-outline</v-icon>
            Reason for Termination <span class="required">*</span>
          </label>
          <v-textarea
            v-model="terminationReason"
            placeholder="Please provide a detailed reason for terminating this employee..."
            variant="outlined"
            rows="4"
            :error-messages="reasonError"
            @input="clearError"
            @focus="clearError"
            auto-grow
            counter="500"
            maxlength="500"
            class="reason-textarea"
            :disabled="saving"
            autofocus
          ></v-textarea>
          <p class="reason-hint">
            <v-icon size="14" class="me-1">mdi-information-outline</v-icon>
            This reason will be recorded in the system logs for audit purposes.
          </p>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Actions -->
      <v-card-actions class="dialog-actions">
        <v-btn
          variant="text"
          @click="closeDialog"
          :disabled="saving"
          class="cancel-btn"
        >
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          variant="flat"
          @click="confirmTermination"
          :loading="saving"
          :disabled="!terminationReason.trim() || saving"
          class="fire-btn"
        >
          <v-icon start>mdi-account-remove</v-icon>
          Terminate Employee
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./FireEmployeeDialog.js"></script>
<style scoped src="./FireEmployeeDialog.css"></style>
