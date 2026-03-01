<template>
  <v-dialog v-model="dialogModel" max-width="520" persistent @click:outside="closeDialog">
    <v-card>
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <div class="d-flex align-center">
          <v-icon size="32" color="white" class="mr-3">mdi-lock-reset</v-icon>
          <div>
            <div class="text-h6 text-white">Reset Employee Password</div>
            <div class="text-caption text-white" style="opacity: 0.9;">A new password will be generated</div>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="closeDialog"
          :disabled="saving"
        >
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Employee Info & Confirmation -->
      <v-card-text>
        <div class="employee-info-card">
          <div class="employee-avatar">
            <div class="avatar-circle">{{ getInitials(employee?.first_name, employee?.last_name) }}</div>
          </div>
          <div class="employee-details">
            <h3 class="employee-name">{{ employee?.first_name }} {{ employee?.last_name }}</h3>
            <p class="employee-email">{{ employee?.email }}</p>
            <div class="employee-badges" v-if="employee">
              <v-chip size="small" :color="getRoleColor(employee)" variant="flat" class="role-chip">
                <v-icon start size="14">{{ getRoleIcon(employee) }}</v-icon>
                {{ getRoleText(employee) }}
              </v-chip>
            </div>
          </div>
        </div>

        <v-alert type="info" variant="tonal" prominent class="mt-4">
          <template #prepend>
            <v-icon>mdi-information-outline</v-icon>
          </template>
          The new password will be generated and emailed to the employee. You will see a toast confirmation after the operation.
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="flat" @click="confirmReset" :loading="saving" :disabled="saving" size="large">
          <v-icon start>mdi-lock-reset</v-icon>
          Reset Password
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./ResetPasswordDialog.js"></script>
<style scoped src="./ResetPasswordDialog.css"></style>
