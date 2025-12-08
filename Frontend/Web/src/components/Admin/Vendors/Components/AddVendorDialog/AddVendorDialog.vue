<template>
  <v-dialog v-model="visibleModel" max-width="900px" persistent>
    <v-card class="add-modal">
      <!-- Custom Header -->
      <v-card-title class="modal-header">
        <h2 class="modal-title">Add New Vendor</h2>
        <v-btn icon class="close-btn" @click="closeDialog">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Tabbed Content (matching Stallholders structure) -->
      <v-card-text class="pa-0">
        <v-container>
          <v-form ref="vendorForm" v-model="formValid" lazy-validation>
            <v-tabs v-model="activeTab" show-arrows>
              <v-tab>
                <v-icon left>mdi-account</v-icon>
                Personal Info
              </v-tab>
              <v-tab>
                <v-icon left>mdi-briefcase</v-icon>
                Business Info
              </v-tab>
            </v-tabs>

            <v-window v-model="activeTab">
              <!-- Personal Information Tab -->
              <v-window-item>
                <v-container>
                  <v-row>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.lastName"
                        label="Last Name *"
                        :rules="[(v) => !!v || 'Last name is required']"
                        outlined
                        prepend-inner-icon="mdi-account"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.firstName"
                        label="First Name *"
                        :rules="[(v) => !!v || 'First name is required']"
                        outlined
                        prepend-inner-icon="mdi-account"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.middleName"
                        label="Middle Name"
                        outlined
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.phone"
                        label="Phone Number *"
                        :rules="[(v) => !!v || 'Phone number is required']"
                        outlined
                        prepend-inner-icon="mdi-phone"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.email"
                        label="Email Address *"
                        :rules="emailRules"
                        outlined
                        prepend-inner-icon="mdi-email"
                        type="email"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.birthdate"
                        label="Date of Birth"
                        outlined
                        type="date"
                        prepend-inner-icon="mdi-calendar"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="form.gender"
                        :items="genderOptions"
                        label="Gender"
                        outlined
                        prepend-inner-icon="mdi-gender-male-female"
                      ></v-select>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="form.address"
                        label="Complete Address *"
                        :rules="[(v) => !!v || 'Address is required']"
                        outlined
                        rows="3"
                        prepend-inner-icon="mdi-home"
                        required
                      ></v-textarea>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>

              <!-- Business Information Tab -->
              <v-window-item>
                <v-container>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.businessName"
                        label="Business Name *"
                        :rules="[(v) => !!v || 'Business name is required']"
                        outlined
                        prepend-inner-icon="mdi-store"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.businessType"
                        label="Business Type *"
                        :rules="[(v) => !!v || 'Business type is required']"
                        outlined
                        prepend-inner-icon="mdi-briefcase"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="form.businessDescription"
                        label="Business Description"
                        outlined
                        rows="3"
                        prepend-inner-icon="mdi-text"
                        hint="Describe the products or services offered"
                      ></v-textarea>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.vendorId"
                        label="Vendor ID"
                        outlined
                        prepend-inner-icon="mdi-identifier"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="form.assignedCollector"
                        :items="collectorItems"
                        :item-text="collectorItemText"
                        :item-value="collectorItemValue"
                        label="Assigned Collector"
                        outlined
                        prepend-inner-icon="mdi-account-tie"
                      ></v-select>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>
            </v-window>
          </v-form>
        </v-container>
      </v-card-text>

      <v-divider></v-divider>
      <!-- Action Buttons (matching Stallholders) -->
      <v-card-actions class="px-6 py-4">
        <v-btn color="grey" text @click="closeDialog">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="save" :loading="saving" :disabled="!formValid">
          <v-icon left>mdi-content-save</v-icon>
          Add Vendor
        </v-btn>
      </v-card-actions>

      <!-- Success Snackbar -->
      <v-snackbar v-model="showSuccess" color="success" timeout="3000" bottom>
        <v-icon left>mdi-check-circle</v-icon>
        Vendor added successfully!
      </v-snackbar>

      <!-- Error Snackbar -->
      <v-snackbar v-model="showError" color="error" timeout="5000" bottom>
        <v-icon left>mdi-alert-circle</v-icon>
        {{ errorMessage }}
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script src="./AddVendorDialog.js"></script>
<style scoped src="./AddVendorDialog.css"></style>
