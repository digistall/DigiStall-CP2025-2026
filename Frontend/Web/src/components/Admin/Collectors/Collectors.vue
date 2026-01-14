<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-app>
    <div>
      <!-- Main Content -->
      <v-main class="collectors-main-content">
        <!-- Standardized Loading Overlay -->
        <LoadingOverlay :loading="loading" text="Loading collectors..." :full-page="false" />

        <v-container fluid class="main-content">
          <v-row>
            <v-col cols="12">
              <!-- Header Section -->
              <div class="page-header">
                <h1>Collectors Management</h1>
                <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
                  Add Collector
                </v-btn>
              </div>

              <!-- Table Component -->
              <TableCollector
                :collectors="filteredCollectors"
                @view="viewCollector"
                @edit="editCollector"
              />

              <!-- Add Collector Dialog -->
              <v-dialog v-model="addDialog" max-width="600px">
                <v-card>
                  <v-card-title>
                    <span class="text-h5">Add New Collector</span>
                  </v-card-title>
                  <v-card-text>
                    <v-form ref="addForm" v-model="formValid">
                      <v-container>
                        <v-row>
                          <v-col cols="12" sm="6">
                            <v-text-field
                              v-model="newCollector.firstName"
                              label="First Name"
                              :rules="[rules.required]"
                              required
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field
                              v-model="newCollector.lastName"
                              label="Last Name"
                              :rules="[rules.required]"
                              required
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="newCollector.email"
                              label="Email"
                              type="email"
                              :rules="[rules.required, rules.email]"
                              required
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="newCollector.phoneNumber"
                              label="Phone Number"
                              :rules="[rules.phone]"
                            ></v-text-field>
                          </v-col>
                        </v-row>
                      </v-container>
                    </v-form>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="addDialog = false"> Cancel </v-btn>
                    <v-btn
                      color="primary"
                      variant="elevated"
                      @click="handleSave"
                      :disabled="!formValid"
                    >
                      Save
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <!-- Edit Collector Dialog -->
              <v-dialog v-model="editDialog" max-width="600px">
                <v-card>
                  <v-card-title>
                    <span class="text-h5">Edit Collector</span>
                  </v-card-title>
                  <v-card-text>
                    <v-form ref="editForm" v-model="editFormValid">
                      <v-container>
                        <v-row>
                          <v-col cols="12" sm="6">
                            <v-text-field
                              v-model="editCollectorData.firstName"
                              label="First Name"
                              :rules="[rules.required]"
                              required
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field
                              v-model="editCollectorData.lastName"
                              label="Last Name"
                              :rules="[rules.required]"
                              required
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="editCollectorData.email"
                              label="Email"
                              type="email"
                              :rules="[rules.required, rules.email]"
                              required
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12">
                            <v-text-field
                              v-model="editCollectorData.phoneNumber"
                              label="Phone Number"
                              :rules="[rules.phone]"
                            ></v-text-field>
                          </v-col>
                        </v-row>
                      </v-container>
                    </v-form>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="editDialog = false"> Cancel </v-btn>
                    <v-btn
                      color="primary"
                      variant="elevated"
                      @click="handleEditSave"
                      :disabled="!editFormValid"
                    >
                      Update
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <!-- Credentials Dialog -->
              <v-dialog v-model="credentialsDialog" max-width="500px" persistent>
                <v-card>
                  <v-card-title class="bg-success text-white">
                    <v-icon icon="mdi-check-circle" class="mr-2"></v-icon>
                    Collector Created Successfully!
                  </v-card-title>
                  <v-card-text class="pt-4">
                    <v-alert type="warning" variant="tonal" class="mb-4">
                      Please save these credentials. They will not be shown again.
                    </v-alert>
                    <div class="credentials-container">
                      <div class="credential-item">
                        <strong>Username:</strong>
                        <v-chip color="primary" class="ml-2">{{ credentials.username }}</v-chip>
                      </div>
                      <div class="credential-item mt-3">
                        <strong>Password:</strong>
                        <v-chip color="primary" class="ml-2">{{ credentials.password }}</v-chip>
                      </div>
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="elevated" @click="closeCredentialsDialog">
                      I've Saved the Credentials
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <!-- Details Dialog -->
              <v-dialog v-model="detailsDialog" max-width="800px">
                <v-card>
                  <v-card-title>
                    <span class="text-h5">Collector Details</span>
                  </v-card-title>
                  <v-card-text v-if="detailsData">
                    <v-container>
                      <v-row>
                        <v-col cols="12">
                          <div class="detail-item">
                            <strong>Collector ID:</strong> #{{ detailsData.id }}
                          </div>
                        </v-col>
                        <v-col cols="12" sm="6">
                          <div class="detail-item">
                            <strong>Name:</strong> {{ detailsData.name }}
                          </div>
                        </v-col>
                        <v-col cols="12" sm="6">
                          <div class="detail-item">
                            <strong>Email:</strong> {{ detailsData.email || 'N/A' }}
                          </div>
                        </v-col>
                        <v-col cols="12" sm="6">
                          <div class="detail-item">
                            <strong>Contact:</strong> {{ detailsData.contact }}
                          </div>
                        </v-col>
                        <v-col cols="12" sm="6">
                          <div class="detail-item">
                            <strong>Location:</strong> {{ detailsData.location }}
                          </div>
                        </v-col>
                        <v-col cols="12" sm="6">
                          <div class="detail-item">
                            <strong>Status:</strong>
                            <v-chip
                              :color="detailsData.status === 'active' ? 'success' : 'error'"
                              size="small"
                            >
                              {{ detailsData.status }}
                            </v-chip>
                          </div>
                        </v-col>
                      </v-row>
                    </v-container>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="detailsDialog = false">
                      Close
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-col>
          </v-row>
        </v-container>

        <!-- Snackbar for notifications -->
        <v-snackbar
          v-model="snackbar.show"
          :color="snackbar.color"
          :timeout="snackbar.timeout"
          location="top"
        >
          {{ snackbar.message }}
          <template v-slot:actions>
            <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
          </template>
        </v-snackbar>
      </v-main>
    </div>
  </v-app>
</template>

<script src="./Collectors.js"></script>
<style scoped src="./Collectors.css"></style>
