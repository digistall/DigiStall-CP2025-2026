<template>
  <v-dialog v-model="model" max-width="1200px" persistent scrollable>
    <v-card>
      <!-- Header with gradient matching VendorDetailsDialog -->
      <v-toolbar color="primary" dark dense>
        <v-toolbar-title class="toolbar-title">
          <v-icon left>mdi-pencil</v-icon>
          Edit Vendor
        </v-toolbar-title>
      </v-toolbar>

      <!-- Tabbed Content -->
      <v-card-text class="pa-4" style="max-height: 65vh">
        <v-container class="pa-0">
          <v-form ref="vendorForm" v-model="formValid" lazy-validation>
            <!-- Tabs matching VendorDetailsDialog structure -->
            <v-tabs v-model="activeTab" bg-color="transparent" class="detail-tabs">
              <v-tab value="0">
                <v-icon left size="small">mdi-account</v-icon>
                PERSONAL INFO
              </v-tab>
              <v-tab value="1">
                <v-icon left size="small">mdi-briefcase</v-icon>
                BUSINESS INFO
              </v-tab>
              <v-tab value="2">
                <v-icon left size="small">mdi-file-document</v-icon>
                DOCUMENTS
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
                        type="number"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-numeric"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field
                        v-model="form.spouseBirthdate"
                        label="Spouse's Birthdate"
                        type="date"
                        outlined
                        density="compact"
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
                        type="number"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-numeric"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field
                        v-model="form.childBirthdate"
                        label="Child's Birthdate"
                        type="date"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-calendar"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>

              <!-- Business Information Tab -->
              <v-window-item>
                <v-container>
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
                        label="Business Description / Products Sold"
                        outlined
                        density="compact"
                        rows="3"
                        prepend-inner-icon="mdi-package-variant"
                      ></v-textarea>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.vendStart"
                        label="Vending Start Time"
                        type="time"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-clock-start"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.vendEnd"
                        label="Vending End Time"
                        type="time"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-clock-end"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.locationName"
                        label="Assigned Location"
                        outlined
                        density="compact"
                        prepend-inner-icon="mdi-map-marker"
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
                </v-container>
              </v-window-item>

              <!-- Documents Tab -->
              <v-window-item>
                <v-container>
                  <v-row dense>
                    <v-col cols="12">
                      <div class="text-subtitle-1 mb-4">Upload Vendor Documents</div>
                    </v-col>
                  </v-row>

                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.clearance"
                        label="Barangay Business Clearance"
                        outlined
                        density="compact"
                        prepend-icon="mdi-file-document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="PDF, JPG, or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.cedula"
                        label="Cedula"
                        outlined
                        density="compact"
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
                        v-model="form.files.association"
                        label="Association Clearance"
                        outlined
                        density="compact"
                        prepend-icon="mdi-file-document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="PDF, JPG, or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.votersId"
                        label="Voter's ID"
                        outlined
                        density="compact"
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
                        v-model="form.files.picture"
                        label="2x2 Picture (White background)"
                        outlined
                        density="compact"
                        prepend-icon="mdi-file-document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="PDF, JPG, or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.healthcard"
                        label="Health Card/Yellow Card"
                        outlined
                        density="compact"
                        prepend-icon="mdi-file-document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hint="PDF, JPG, or PNG (Max 5MB)"
                        persistent-hint
                        show-size
                      ></v-file-input>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>
            </v-window>
          </v-form>
        </v-container>
      </v-card-text>

      <v-card-actions class="px-6 py-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('close')"> Cancel </v-btn>
        <v-btn color="primary" variant="elevated" @click="submit"> Update Vendor </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./EditVendorDialog.js"></script>

<style scoped>
/* Details Header with Gradient (matching VendorDetailsDialog) */
.details-header {
  background: linear-gradient(135deg, #002181 0%, #0047ab 100%) !important;
  color: white !important;
  padding: 20px 24px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.header-content {
  display: flex;
  align-items: center;
  color: white;
}

.header-title {
  color: white !important;
  font-size: 20px !important;
  font-weight: 600 !important;
  margin: 0 !important;
  margin-left: 8px !important;
  letter-spacing: 0.5px;
}

.close-btn {
  background-color: #ef4444 !important;
  border-radius: 50% !important;
  width: 36px !important;
  height: 36px !important;
  min-width: unset !important;
  margin: 0 !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3) !important;
  transition: all 0.2s ease !important;
}

.close-btn:hover {
  background-color: #dc2626 !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
}

/* Tabs Styling (matching VendorDetailsDialog) */
.detail-tabs {
  border-bottom: 1px solid #e5e7eb;
}

.detail-tabs .v-tab {
  text-transform: uppercase;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.detail-tabs .v-tab--selected {
  color: rgb(0, 33, 129) !important;
}

/* Section headers within tabs */
.text-subtitle-1 {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
  margin-top: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid #e5e7eb;
}

/* Card Styling */
.v-card {
  border-radius: 12px !important;
}

.v-card-text {
  background-color: #fafafa !important;
}

/* Button Styling */
.v-card-actions {
  background-color: #fafafa !important;
  border-top: 1px solid #e5e7eb !important;
  padding: 12px 24px !important;
}

/* Compact form spacing */
.v-window-item {
  padding-top: 8px;
}
</style>
