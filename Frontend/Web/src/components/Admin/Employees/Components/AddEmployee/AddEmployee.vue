<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="750px"
    persistent
  >
    <v-card class="employee-dialog">
      <!-- Header -->
      <v-card-title class="dialog-header">
        <v-icon class="dialog-icon">mdi-account-plus</v-icon>
        <span>{{ isEditMode ? "Edit Employee" : "Add New Employee" }}</span>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="$emit('close')" class="close-btn">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="dialog-content">
        <v-form ref="form" v-model="formValid">
          <!-- Account Type Selection -->
          <div class="account-type-section" v-if="!isEditMode">
            <h3 class="section-title">
              <v-icon class="section-icon">mdi-account-cog</v-icon>
              Account Type
            </h3>
            <div class="account-type-grid">
              <div
                class="account-type-card"
                :class="{ active: accountType === 'web' }"
                @click="selectAccountType('web')"
              >
                <div class="account-type-icon-wrapper web">
                  <v-icon size="32">mdi-monitor</v-icon>
                </div>
                <div class="account-type-info">
                  <div class="account-type-title">Web Employee</div>
                  <div class="account-type-desc">Access to web dashboard & management</div>
                </div>
                <v-icon v-if="accountType === 'web'" class="check-icon" color="success">mdi-check-circle</v-icon>
              </div>

              <div
                class="account-type-card"
                :class="{ active: accountType === 'mobile' }"
                @click="selectAccountType('mobile')"
              >
                <div class="account-type-icon-wrapper mobile">
                  <v-icon size="32">mdi-cellphone</v-icon>
                </div>
                <div class="account-type-info">
                  <div class="account-type-title">Mobile Staff</div>
                  <div class="account-type-desc">Inspector or Collector for mobile app</div>
                </div>
                <v-icon v-if="accountType === 'mobile'" class="check-icon" color="success">mdi-check-circle</v-icon>
              </div>
            </div>
          </div>

          <!-- Mobile Role Selection (only when mobile is selected) -->
          <div class="mobile-role-section" v-if="accountType === 'mobile' && !isEditMode">
            <h3 class="section-title">
              <v-icon class="section-icon">mdi-badge-account</v-icon>
              Mobile Role
            </h3>
            <div class="mobile-role-grid">
              <div
                class="role-card"
                :class="{ active: mobileRole === 'inspector' }"
                @click="selectMobileRole('inspector')"
              >
                <div class="role-icon-wrapper inspector">
                  <v-icon size="28">mdi-clipboard-check-outline</v-icon>
                </div>
                <div class="role-info">
                  <div class="role-title">Inspector</div>
                  <div class="role-desc">Conduct inspections & compliance checks</div>
                </div>
                <v-radio
                  :model-value="mobileRole === 'inspector'"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-radio>
              </div>

              <div
                class="role-card"
                :class="{ active: mobileRole === 'collector' }"
                @click="selectMobileRole('collector')"
              >
                <div class="role-icon-wrapper collector">
                  <v-icon size="28">mdi-cash-multiple</v-icon>
                </div>
                <div class="role-info">
                  <div class="role-title">Collector</div>
                  <div class="role-desc">Collect payments from stallholders</div>
                </div>
                <v-radio
                  :model-value="mobileRole === 'collector'"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-radio>
              </div>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="personal-info-section">
            <h3 class="section-title">
              <v-icon class="section-icon">mdi-account-details</v-icon>
              Personal Information
            </h3>
            
            <div class="form-row">
              <v-text-field
                v-model="employeeForm.firstName"
                label="First Name"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                density="comfortable"
                required
              ></v-text-field>

              <v-text-field
                v-model="employeeForm.lastName"
                label="Last Name"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                density="comfortable"
                required
              ></v-text-field>
            </div>

            <v-text-field
              v-model="employeeForm.email"
              label="Email Address"
              :rules="[rules.required, rules.email]"
              variant="outlined"
              prepend-inner-icon="mdi-email"
              density="comfortable"
              type="email"
              required
            ></v-text-field>

            <v-text-field
              v-model="employeeForm.phoneNumber"
              label="Phone Number"
              :rules="[rules.required, rules.phone]"
              variant="outlined"
              prepend-inner-icon="mdi-phone"
              density="comfortable"
              placeholder="09XXXXXXXXX"
              required
            ></v-text-field>
          </div>

          <!-- Web Permissions Section (only for web account type, NOT for mobile staff in edit mode) -->
          <div class="permissions-section" v-if="accountType === 'web' && (!isEditMode || (isEditMode && !isMobileStaff))">
            <h3 class="section-title">
              <v-icon class="section-icon">mdi-shield-account</v-icon>
              Web System Permissions
            </h3>
            <p class="section-subtitle">Select which modules this employee can access on the web dashboard</p>

            <div class="permissions-grid">
              <div
                v-for="permission in availablePermissions"
                :key="permission.value"
                class="permission-item"
                :class="{ active: isPermissionSelected(permission.value) }"
                @click="$emit('toggle-permission', permission.value)"
              >
                <v-checkbox
                  :model-value="isPermissionSelected(permission.value)"
                  hide-details
                  density="compact"
                  :color="permission.color"
                ></v-checkbox>

                <div class="permission-info">
                  <v-icon :color="permission.color" class="permission-icon">
                    {{ permission.icon }}
                  </v-icon>
                  <div class="permission-text">
                    <div class="permission-title">{{ permission.text }}</div>
                    <div class="permission-description">{{ permission.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile Access Info (only for mobile account type) -->
          <div class="mobile-info-section" v-if="accountType === 'mobile' && !isEditMode">
            <!-- Collector-specific fields - Address and Assigned Location -->
            <div v-if="mobileRole === 'collector'" class="collector-fields mt-4">
              <h3 class="section-title">
                <v-icon class="section-icon">mdi-map-marker</v-icon>
                Assignment Information
              </h3>

              <v-text-field
                v-model="employeeForm.address"
                label="Address"
                variant="outlined"
                prepend-inner-icon="mdi-home-map-marker"
                density="comfortable"
                placeholder="Enter collector's home address"
              ></v-text-field>

              <v-select
                v-model="employeeForm.assignedLocation"
                label="Assigned Location *"
                :items="availableLocations"
                item-title="name"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                prepend-inner-icon="mdi-map-marker-radius"
                density="comfortable"
                required
              ></v-select>
            </div>

            <!-- Inspector-specific fields - Assigned Location (optional, can add more later) -->
            <div v-if="mobileRole === 'inspector'" class="inspector-fields mt-4">
              <h3 class="section-title">
                <v-icon class="section-icon">mdi-map-marker</v-icon>
                Assignment Information
              </h3>

              <v-text-field
                v-model="employeeForm.address"
                label="Address"
                variant="outlined"
                prepend-inner-icon="mdi-home-map-marker"
                density="comfortable"
                placeholder="Enter inspector's home address"
              ></v-text-field>
            </div>

            <!-- Alert message -->
            <v-alert
              type="info"
              variant="tonal"
              class="mobile-alert"
            >
              <div class="alert-content">
                <div class="alert-text">
                  <div class="alert-title">Mobile App Credentials</div>
                  <div class="alert-description">
                    Login credentials will be auto-generated and sent to the employee's email address.
                    They can use these credentials to login to the mobile app.
                  </div>
                </div>
              </div>
            </v-alert>

            <div class="mobile-features" v-if="mobileRole">
              <h4 class="features-title">
                {{ mobileRole === 'inspector' ? 'Inspector' : 'Collector' }} Features:
              </h4>
              <ul class="features-list" v-if="mobileRole === 'inspector'">
                <li><v-icon size="16" color="success">mdi-check</v-icon> Conduct stall inspections</li>
                <li><v-icon size="16" color="success">mdi-check</v-icon> Create compliance records</li>
                <li><v-icon size="16" color="success">mdi-check</v-icon> Report violations</li>
                <li><v-icon size="16" color="success">mdi-check</v-icon> View assigned stallholders</li>
              </ul>
              <ul class="features-list" v-else-if="mobileRole === 'collector'">
                <li><v-icon size="16" color="success">mdi-check</v-icon> Collect rental payments</li>
                <li><v-icon size="16" color="success">mdi-check</v-icon> Issue payment receipts</li>
                <li><v-icon size="16" color="success">mdi-check</v-icon> View payment history</li>
                <li><v-icon size="16" color="success">mdi-check</v-icon> Track collection routes</li>
              </ul>
            </div>
          </div>

          <!-- Mobile Staff Edit Mode Section -->
          <div class="mobile-edit-section" v-if="isEditMode && isMobileStaff">

            <h3 class="section-title">
              <v-icon class="section-icon">mdi-map-marker</v-icon>
              Assignment Information
            </h3>

            <v-text-field
              v-model="employeeForm.address"
              label="Address"
              variant="outlined"
              prepend-inner-icon="mdi-home-map-marker"
              density="comfortable"
              placeholder="Enter address"
            ></v-text-field>

            <!-- Collector-specific: Assigned Location -->
            <v-select
              v-if="mobileRole === 'collector'"
              v-model="employeeForm.assignedLocation"
              label="Assigned Location *"
              :items="availableLocations"
              item-title="name"
              item-value="value"
              :rules="[rules.required]"
              variant="outlined"
              prepend-inner-icon="mdi-map-marker-radius"
              density="comfortable"
              required
            ></v-select>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer></v-spacer>

        <!-- Test Email Button (only in development and for new employees) -->
        <v-btn
          v-if="!isEditMode && accountType === 'web'"
          color="info"
          variant="outlined"
          size="small"
          @click="testEmail"
          :disabled="!employeeForm.email || saving"
        >
          <v-icon left size="18">mdi-email-send</v-icon>
          Test Email
        </v-btn>

        <v-btn color="grey" variant="text" @click="$emit('close')">
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!canSave"
          @click="handleSave"
          class="save-btn"
        >
          <v-icon left size="18">mdi-content-save</v-icon>
          {{ getSaveButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./AddEmployee.js"></script>

<style scoped src="./AddEmployee.css"></style>

