<template>
  <v-dialog v-model="visibleModel" max-width="1200px" persistent scrollable>
    <v-card>
      <!-- Header -->
      <v-toolbar color="primary" dark dense>
        <v-toolbar-title>
          <v-icon left>mdi-account-plus</v-icon>
          Add New Vendor
        </v-toolbar-title>
      </v-toolbar>

      <!-- Tabbed Content -->
      <v-card-text class="pa-4" style="max-height: 65vh">
        <v-container class="pa-0">
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
              <v-tab>
                <v-icon left>mdi-file-document</v-icon>
                Documents
              </v-tab>
            </v-tabs>

            <v-window v-model="activeTab" class="mt-4">
              <!-- Personal Information Tab -->
              <v-window-item>
                <v-container class="pa-0">
                  <v-row dense>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.lastName"
                        label="Last Name *"
                        :rules="[(v) => !!v || 'Last name is required']"
                        outlined
                        density="compact"
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
                        density="compact"
                        prepend-inner-icon="mdi-account"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.middleName"
                        label="Middle Name"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.suffix"
                        label="Suffix (if any)"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.birthdate"
                        label="Date of Birth"
                        outlined
                        density="compact"
                        type="date"
                        prepend-inner-icon="mdi-calendar"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="form.gender"
                        :items="genderOptions"
                        label="Gender"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-gender-male-female"
                      ></v-select>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.phone"
                        label="Phone Number *"
                        :rules="[(v) => !!v || 'Phone number is required']"
                        outlined
                        density="compact"
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
                        density="compact"
                        prepend-inner-icon="mdi-email"
                        type="email"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12">
                      <v-textarea
                        v-model="form.address"
                        label="Complete Address *"
                        :rules="[(v) => !!v || 'Address is required']"
                        outlined
                        density="compact"
                        rows="3"
                        prepend-inner-icon="mdi-home"
                        required
                      ></v-textarea>
                    </v-col>
                  </v-row>

                  <!-- Spouse Section -->
                  <v-row dense>
                    <v-col cols="12">
                      <div class="text-subtitle-1 mb-2 mt-2">Spouse Information</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.spouseFullName"
                        label="Spouse's Full Name"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field
                        v-model="form.spouseAge"
                        label="Spouse's Age"
                        outlined
                        density="compact"
                        type="number"
                        prepend-inner-icon="mdi-numeric"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field
                        v-model="form.spouseBirthdate"
                        label="Spouse's Birthdate"
                        outlined
                        density="compact"
                        type="date"
                        prepend-inner-icon="mdi-calendar"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.spouseEducation"
                        label="Spouse's Education"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-school"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.spouseContact"
                        label="Spouse's Contact"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-phone"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.spouseOccupation"
                        label="Spouse's Occupation"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-briefcase"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <!-- Child Section -->
                  <v-row dense>
                    <v-col cols="12">
                      <div class="text-subtitle-1 mb-2 mt-2">Child Information</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.childFullName"
                        label="Child's Full Name"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field
                        v-model="form.childAge"
                        label="Child's Age"
                        outlined
                        density="compact"
                        type="number"
                        prepend-inner-icon="mdi-numeric"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field
                        v-model="form.childBirthdate"
                        label="Child's Birthdate"
                        outlined
                        density="compact"
                        type="date"
                        prepend-inner-icon="mdi-calendar"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>

              <!-- Business Information Tab -->
              <v-window-item>
                <v-container class="pa-0">
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.businessName"
                        label="Business Name *"
                        :rules="[(v) => !!v || 'Business name is required']"
                        outlined
                        density="compact"
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
                        density="compact"
                        prepend-inner-icon="mdi-briefcase"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12">
                      <v-textarea
                        v-model="form.businessDescription"
                        label="Business Description"
                        outlined
                        density="compact"
                        rows="3"
                        prepend-inner-icon="mdi-text"
                        hint="Describe the products or services offered"
                      ></v-textarea>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.locationName"
                        label="Assigned Location *"
                        :rules="[(v) => !!v || 'Location is required']"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-map-marker"
                        hint="e.g., Panganiban Sidewalk, Naga City Public Market"
                        persistent-hint
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.vendorId"
                        label="Vendor ID"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-identifier"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12">
                      <div class="text-subtitle-2 mb-2">Vending Time</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.vendStart"
                        label="Start Time"
                        outlined
                        density="compact"
                        type="time"
                        prepend-inner-icon="mdi-clock-start"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.vendEnd"
                        label="End Time"
                        outlined
                        density="compact"
                        type="time"
                        prepend-inner-icon="mdi-clock-end"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>

              <!-- Documents Tab -->
              <v-window-item>
                <v-container class="pa-0">
                  <v-row dense>
                    <v-col cols="12">
                      <div class="text-subtitle-1 mb-4">Upload Vendor Documents</div>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="documents.clearance"
                        label="Barangay Business Clearance"
                        outlined
                        prepend-icon="mdi-file-document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="PDF, JPG, or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="documents.cedula"
                        label="Cedula"
                        outlined
                        prepend-icon="mdi-file-document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="PDF, JPG, or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="documents.association"
                        label="Association Clearance"
                        outlined
                        prepend-icon="mdi-file-document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="PDF, JPG, or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="documents.votersId"
                        label="Voter's ID"
                        outlined
                        prepend-icon="mdi-file-document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="PDF, JPG, or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="documents.picture"
                        label="2x2 Picture (White Background)"
                        outlined
                        prepend-icon="mdi-image"
                        accept=".jpg,.jpeg,.png"
                        hint="JPG or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="documents.healthCard"
                        label="Health Card/Yellow Card"
                        outlined
                        prepend-icon="mdi-file-document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="PDF, JPG, or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12">
                      <v-alert type="info" variant="tonal" density="compact" class="mb-0">
                        <div class="text-caption">
                          <v-icon size="small" class="mr-1">mdi-information</v-icon>
                          Documents can be uploaded during vendor creation or added later through
                          the vendor details page.
                        </div>
                      </v-alert>
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

      <!-- Toast Notification -->
      <ToastNotification
        :show="toast.show"
        :message="toast.message"
        :type="toast.type"
        @close="toast.show = false"
      />
    </v-card>
  </v-dialog>
</template>

<script src="./AddVendorDialog.js"></script>
<style scoped src="./AddVendorDialog.css"></style>
