<template>
  <v-dialog v-model="visibleModel" max-width="900px" persistent>
    <v-card class="add-modal">
      <!-- Custom Header -->
      <v-card-title class="modal-header">
        <h2 class="modal-title">Add New Collector</h2>
        <v-btn icon class="close-btn" @click="closeDialog">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Tabbed Content -->
      <v-card-text class="pa-0">
        <v-container>
          <v-form ref="collectorForm" v-model="formValid" lazy-validation>
            <v-tabs v-model="activeTab" show-arrows>
              <v-tab>
                <v-icon left>mdi-account</v-icon>
                Personal Info
              </v-tab>
              <v-tab>
                <v-icon left>mdi-briefcase</v-icon>
                Assignment Info
              </v-tab>
            </v-tabs>

            <v-window v-model="activeTab">
              <!-- Personal Information Tab -->
              <v-window-item>
                <v-container class="pt-6">
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
                        label="Email Address"
                        outlined
                        type="email"
                        prepend-inner-icon="mdi-email"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.birthdate"
                        label="Birthdate"
                        type="date"
                        outlined
                        prepend-inner-icon="mdi-calendar"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="form.gender"
                        label="Gender"
                        :items="['Male', 'Female', 'Other']"
                        outlined
                        prepend-inner-icon="mdi-human"
                      ></v-select>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="form.address"
                        label="Address"
                        outlined
                        prepend-inner-icon="mdi-map-marker"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>

              <!-- Assignment Information Tab -->
              <v-window-item>
                <v-container class="pt-6">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="form.collectorId"
                        label="Collector ID"
                        outlined
                        prepend-inner-icon="mdi-identifier"
                        disabled
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="form.location"
                        label="Assigned Location *"
                        :items="locations"
                        outlined
                        prepend-inner-icon="mdi-map-marker"
                        :rules="[(v) => !!v || 'Location is required']"
                        required
                      ></v-select>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="form.notes"
                        label="Notes"
                        outlined
                        rows="4"
                        prepend-inner-icon="mdi-note-text"
                      ></v-textarea>
                    </v-col>
                  </v-row>
                </v-container>
              </v-window-item>
            </v-window>
          </v-form>
        </v-container>
      </v-card-text>

      <!-- Action Buttons -->
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="closeDialog"> Cancel </v-btn>
        <v-btn color="primary" :loading="saving" @click="save"> Add Collector </v-btn>
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

<script src="./AddCollectorDialog.js"></script>
<style scoped src="./AddCollectorDialog.css"></style>
