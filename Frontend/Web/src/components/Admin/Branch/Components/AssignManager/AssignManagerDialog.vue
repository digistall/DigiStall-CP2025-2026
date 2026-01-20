<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title class="text-h5 primary white--text">
        <v-icon left class="mr-2">mdi-account-plus</v-icon>
        {{ branch?.manager_name ? "Change" : "Assign" }} Branch Manager
      </v-card-title>

      <v-form ref="form" v-model="valid">
        <v-card-text class="pt-4">
          <v-container>
            <!-- Error Alert -->
            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>

            <!-- Success Alert -->
            <v-alert
              v-if="successMessage"
              type="success"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="successMessage = ''"
            >
              {{ successMessage }}
            </v-alert>

            <!-- Branch Info -->
            <v-row v-if="branch">
              <v-col cols="12">
                <v-card variant="outlined" class="mb-4">
                  <v-card-text>
                    <h4 class="text-h6 mb-2">{{ branch.branch_name }}</h4>
                    <p class="text-body-2 text--secondary mb-1">
                      <v-icon small class="mr-1">mdi-map-marker</v-icon>
                      {{ branch.area }} - {{ branch.location }}
                    </p>
                    <p v-if="branch.manager_name" class="text-body-2 text--secondary">
                      <v-icon small class="mr-1">mdi-account-tie</v-icon>
                      Current Manager: {{ branch.manager_name }}
                    </p>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Manager Form -->
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.first_name"
                  label="First Name *"
                  :rules="[rules.required]"
                  variant="outlined"
                  prepend-inner-icon="mdi-account"
                  placeholder="Enter first name"
                  :disabled="loading"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.last_name"
                  label="Last Name *"
                  :rules="[rules.required]"
                  variant="outlined"
                  prepend-inner-icon="mdi-account"
                  placeholder="Enter last name"
                  :disabled="loading"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="formData.email"
                  label="Email Address *"
                  :rules="[rules.required, rules.email]"
                  variant="outlined"
                  prepend-inner-icon="mdi-email"
                  placeholder="manager@example.com"
                  :disabled="loading"
                />
                <v-alert type="info" variant="tonal" density="compact" class="mt-2">
                  <small>Credentials will be auto-generated and sent to this email address</small>
                </v-alert>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.contact_number"
                  label="Contact Number"
                  variant="outlined"
                  prepend-inner-icon="mdi-phone"
                  placeholder="+63 XXX XXX XXXX"
                  :disabled="loading"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="formData.status"
                  label="Status *"
                  :items="statusOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  prepend-inner-icon="mdi-check-circle"
                  :disabled="loading"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="grey" variant="outlined" @click="closeDialog" :disabled="loading">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="assignManager"
            :loading="loading"
            :disabled="!valid || loading"
          >
            {{ branch?.manager_name ? "Update" : "Assign" }} Manager
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script src="./AssignManagerDialog.js"></script>

<style scoped src="./AssignManagerDialog.css"></style>

