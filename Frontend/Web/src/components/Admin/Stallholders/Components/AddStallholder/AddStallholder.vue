<template>
  <v-dialog v-model="isVisible" max-width="800px" persistent>
    <v-card>
      <v-toolbar color="primary" dark dense>
        <v-toolbar-title class="toolbar-title">
          <v-icon left>mdi-account-plus</v-icon>
          Add New Stallholder
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0">
        <v-container>
          <v-form ref="stallholderForm" v-model="formValid" lazy-validation>
            <v-tabs v-model="activeTab" show-arrows>
              <v-tab>
                <v-icon left>mdi-account</v-icon>
                Personal Info
              </v-tab>
              <v-tab>
                <v-icon left>mdi-store</v-icon>
                Business Info
              </v-tab>
              <v-tab>
                <v-icon left>mdi-file-document</v-icon>
                Contract & Payment
              </v-tab>
            </v-tabs>

            <v-window v-model="activeTab">
              <!-- Personal Information Tab -->
              <v-window-item>
                <v-container>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="stallholder.stallholder_name"
                        label="Full Name *"
                        :rules="[v => !!v || 'Full name is required']"
                        outlined
                        prepend-inner-icon="mdi-account"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="stallholder.email"
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
                        v-model="stallholder.phone"
                        label="Phone Number *"
                        :rules="[v => !!v || 'Phone number is required']"
                        outlined
                        prepend-inner-icon="mdi-phone"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="stallholder.date_of_birth"
                        label="Date of Birth"
                        outlined
                        type="date"
                        prepend-inner-icon="mdi-calendar"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="stallholder.address"
                        label="Home Address *"
                        :rules="[v => !!v || 'Address is required']"
                        outlined
                        rows="3"
                        prepend-inner-icon="mdi-home"
                        required
                      ></v-textarea>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="stallholder.gender"
                        :items="genderOptions"
                        label="Gender"
                        outlined
                        prepend-inner-icon="mdi-gender-male-female"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="stallholder.civil_status"
                        :items="civilStatusOptions"
                        label="Civil Status"
                        outlined
                        prepend-inner-icon="mdi-heart"
                      ></v-select>
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
                        v-model="stallholder.business_name"
                        label="Business Name *"
                        :rules="[v => !!v || 'Business name is required']"
                        outlined
                        prepend-inner-icon="mdi-store"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="stallholder.business_type"
                        :items="businessTypeOptions"
                        label="Business Type *"
                        :rules="[v => !!v || 'Business type is required']"
                        outlined
                        prepend-inner-icon="mdi-domain"
                        required
                      ></v-select>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="stallholder.business_description"
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
                      <v-select
                        v-model="stallholder.branch_id"
                        :items="branches"
                        item-text="branch_name"
                        item-value="branch_id"
                        label="Branch *"
                        :rules="[v => !!v || 'Branch is required']"
                        outlined
                        prepend-inner-icon="mdi-office-building"
                        required
                      >
                        <template v-slot:selection="{ item }">
                          {{ item.branch_name }} - {{ item.branch_location }}
                        </template>
                        <template v-slot:item="{ item }">
                          <v-list-item>
                            <v-list-item-title>{{ item.branch_name }}</v-list-item-title>
                            <v-list-item-subtitle>{{ item.branch_location }}</v-list-item-subtitle>
                          </v-list-item>
                        </template>
                      </v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="stallholder.stall_id"
                        :items="availableStalls"
                        item-text="stall_display"
                        item-value="stall_id"
                        label="Assign Stall (Optional)"
                        outlined
                        prepend-inner-icon="mdi-store-outline"
                        clearable
                        @change="onStallChange"
                      ></v-select>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>

              <!-- Contract & Payment Tab -->
              <v-window-item>
                <v-container>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="stallholder.contract_start_date"
                        label="Contract Start Date *"
                        :rules="[v => !!v || 'Contract start date is required']"
                        outlined
                        type="date"
                        prepend-inner-icon="mdi-calendar-start"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="stallholder.contract_end_date"
                        label="Contract End Date *"
                        :rules="contractEndDateRules"
                        outlined
                        type="date"
                        prepend-inner-icon="mdi-calendar-end"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="stallholder.monthly_rental"
                        label="Monthly Rental (₱) *"
                        :rules="[v => !!v || 'Monthly rental is required', v => v > 0 || 'Must be greater than 0']"
                        outlined
                        type="number"
                        step="0.01"
                        min="0"
                        prepend-inner-icon="mdi-currency-php"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="stallholder.payment_status"
                        :items="paymentStatusOptions"
                        label="Payment Status *"
                        :rules="[v => !!v || 'Payment status is required']"
                        outlined
                        prepend-inner-icon="mdi-credit-card"
                        required
                      ></v-select>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="stallholder.last_payment_date"
                        label="Last Payment Date"
                        outlined
                        type="date"
                        prepend-inner-icon="mdi-calendar-check"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="stallholder.compliance_status"
                        :items="complianceStatusOptions"
                        label="Compliance Status *"
                        :rules="[v => !!v || 'Compliance status is required']"
                        outlined
                        prepend-inner-icon="mdi-check-circle"
                        required
                      ></v-select>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="stallholder.notes"
                        label="Additional Notes"
                        outlined
                        rows="3"
                        prepend-inner-icon="mdi-note-text"
                        hint="Any special notes or remarks"
                      ></v-textarea>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>
            </v-window>
          </v-form>
        </v-container>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="px-6 py-4">
        <v-btn color="grey" text @click="closeDialog">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          @click="saveStallholder" 
          :loading="saving"
          :disabled="!formValid"
        >
          <v-icon left>mdi-content-save</v-icon>
          Add Stallholder
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSuccess"
      color="success"
      timeout="3000"
      bottom
    >
      <v-icon left>mdi-check-circle</v-icon>
      Stallholder added successfully!
    </v-snackbar>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="showError"
      color="error"
      timeout="5000"
      bottom
    >
      <v-icon left>mdi-alert-circle</v-icon>
      {{ errorMessage }}
    </v-snackbar>
  </v-dialog>
</template>

<script src="./AddStallholder.js"></script>
<style scoped src="./AddStallholder.css"></style>