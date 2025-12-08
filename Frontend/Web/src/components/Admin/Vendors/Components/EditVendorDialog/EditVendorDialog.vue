<template>
  <v-dialog v-model="model" max-width="900" persistent>
    <v-card class="edit-modal">
      <!-- Header -->
      <v-card-title class="modal-header">
        <h2 class="modal-title">
          {{ step === 1 ? 'Edit Vendor — Personal Details' : 'Edit Vendor — Business Details' }}
        </h2>
        <v-btn icon class="close-btn" @click="cancel">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="modal-content">
        <v-row>
          <!-- PAGE 1 -->
          <v-col v-if="step === 1" cols="12">
            <div class="text-h5 font-weight-bold mb-4">Edit Vendor Details</div>

            <v-row>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.lastName"
                  label="Last Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.firstName"
                  label="First Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.middleName"
                  label="Middle Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>

              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.suffix"
                  label="Suffix (if any)"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.birthdate"
                  type="date"
                  label="Birthdate"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4">
                <div class="mb-1 text-medium-emphasis">Gender</div>
                <v-btn-toggle v-model="form.gender" divided mandatory>
                  <v-btn value="Male" size="small">Male</v-btn>
                  <v-btn value="Female" size="small">Female</v-btn>
                </v-btn-toggle>
              </v-col>

              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.phone"
                  label="Phone Number"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.email"
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.vendorId"
                  label="Vendor ID"
                  variant="outlined"
                  density="comfortable"
              /></v-col>

              <v-col cols="12"
                ><v-text-field
                  v-model="form.address"
                  label="Complete Address"
                  variant="outlined"
                  density="comfortable"
              /></v-col>

              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.spouseLast"
                  label="Spouse’s Last Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.spouseFirst"
                  label="Spouse’s First Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.spouseMiddle"
                  label="Spouse’s Middle Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>

              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.childLast"
                  label="Child’s Last Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.childFirst"
                  label="Child’s First Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="4"
                ><v-text-field
                  v-model="form.childMiddle"
                  label="Child’s Middle Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
            </v-row>
          </v-col>

          <!-- PAGE 2 -->
          <v-col v-else cols="12">
            <div class="text-h5 font-weight-bold mb-6">Edit Business Details</div>
            <v-row>
              <v-col cols="12" md="6"
                ><v-text-field
                  v-model="form.businessName"
                  label="Business Name"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="6"
                ><v-text-field
                  v-model="form.businessType"
                  label="Business Type"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="6"
                ><v-text-field
                  v-model="form.productsSold"
                  label="Products Sold"
                  variant="outlined"
                  density="comfortable"
              /></v-col>
              <v-col cols="12" md="6">
                <div class="mb-1 text-medium-emphasis">Vending Time</div>
                <div class="d-flex ga-2">
                  <v-text-field
                    v-model="form.vendStart"
                    type="time"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                  <span class="d-flex align-center">–</span>
                  <v-text-field
                    v-model="form.vendEnd"
                    type="time"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                </div>
              </v-col>
              <v-col cols="12"
                ><v-text-field
                  v-model="form.businessAddress"
                  label="Business Address"
                  variant="outlined"
                  density="comfortable"
              /></v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="form.assignedCollector"
                  :items="collectorItems"
                  :item-text="collectorItemText"
                  :item-value="collectorItemValue"
                  label="Assigned Collector"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <div class="text-h6 font-weight-bold mt-6 mb-2">Edit Uploaded Documents</div>
            <v-row>
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="form.files.clearance"
                  label="Barangay Business Clearance"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-paperclip"
                  show-size
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="form.files.votersId"
                  label="Voter’s ID"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-paperclip"
                  show-size
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="form.files.cedula"
                  label="Cedula"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-paperclip"
                  show-size
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="form.files.picture"
                  label="2x2 Picture (White background)"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-paperclip"
                  show-size
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="form.files.association"
                  label="Association Clearance"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-paperclip"
                  show-size
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="form.files.healthcard"
                  label="Health Card/Yellow Card"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-paperclip"
                  show-size
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="modal-footer">
        <v-spacer />
        <v-btn class="submit-btn" v-if="step === 1" color="primary" @click="goNext">NEXT</v-btn>
        <v-btn class="submit-btn" v-else color="primary" @click="submit">SUBMIT</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./EditVendorDialog.js"></script>

<style scoped>
.v-card-title {
  background: #f5f5f7;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.v-card-text {
  padding-top: 0.5rem;
}

.v-card-actions {
  padding: 16px 24px;
}
</style>
