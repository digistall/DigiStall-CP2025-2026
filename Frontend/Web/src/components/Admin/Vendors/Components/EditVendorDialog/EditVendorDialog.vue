<template>
  <v-dialog v-model="model" max-width="900px" persistent>
    <v-card>
      <!-- Header (matching AddVendorDialog) -->
      <v-card-title class="modal-header">
        <h2 class="modal-title">Edit Vendor</h2>
        <v-btn icon class="close-btn" @click="cancel">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Tabbed Content (matching AddVendorDialog) -->
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
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.suffix"
                        label="Suffix (if any)"
                        outlined
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.birthdate"
                        label="Date of Birth"
                        outlined
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
                        prepend-inner-icon="mdi-gender-male-female"
                      ></v-select>
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

                  <v-row>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.spouseLast"
                        label="Spouse's Last Name"
                        outlined
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.spouseFirst"
                        label="Spouse's First Name"
                        outlined
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.spouseMiddle"
                        label="Spouse's Middle Name"
                        outlined
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.childLast"
                        label="Child's Last Name"
                        outlined
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.childFirst"
                        label="Child's First Name"
                        outlined
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="form.childMiddle"
                        label="Child's Middle Name"
                        outlined
                        prepend-inner-icon="mdi-account"
                      ></v-text-field>
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
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.productsSold"
                        label="Products Sold"
                        outlined
                        prepend-inner-icon="mdi-package-variant"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.businessAddress"
                        label="Business Address"
                        outlined
                        prepend-inner-icon="mdi-map-marker"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.vendStart"
                        label="Vending Start Time"
                        type="time"
                        outlined
                        prepend-inner-icon="mdi-clock-start"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.vendEnd"
                        label="Vending End Time"
                        type="time"
                        outlined
                        prepend-inner-icon="mdi-clock-end"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-divider class="my-4"></v-divider>
                  <v-subheader class="text-h6 font-weight-bold px-0">Documents</v-subheader>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.clearance"
                        label="Barangay Business Clearance"
                        outlined
                        prepend-icon="mdi-paperclip"
                        show-size
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.votersId"
                        label="Voter's ID"
                        outlined
                        prepend-icon="mdi-paperclip"
                        show-size
                      ></v-file-input>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.cedula"
                        label="Cedula"
                        outlined
                        prepend-icon="mdi-paperclip"
                        show-size
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.picture"
                        label="2x2 Picture (White background)"
                        outlined
                        prepend-icon="mdi-paperclip"
                        show-size
                      ></v-file-input>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.association"
                        label="Association Clearance"
                        outlined
                        prepend-icon="mdi-paperclip"
                        show-size
                      ></v-file-input>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-file-input
                        v-model="form.files.healthcard"
                        label="Health Card/Yellow Card"
                        outlined
                        prepend-icon="mdi-paperclip"
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

      <!-- Footer Actions (matching AddVendorDialog) -->
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="grey" @click="cancel">Cancel</v-btn>
        <v-btn color="primary" :disabled="!formValid" @click="submit"> Save Changes </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./EditVendorDialog.js"></script>

<style scoped>
/* Toolbar title styling */
.toolbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
