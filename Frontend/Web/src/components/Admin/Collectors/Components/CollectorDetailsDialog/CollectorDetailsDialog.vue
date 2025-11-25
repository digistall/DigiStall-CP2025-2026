<template>
  <v-dialog v-model="visibleModel" max-width="900px">
    <v-card>
      <!-- Toolbar Header -->
      <v-toolbar color="primary" dark dense>
        <v-toolbar-title class="toolbar-title">
          <v-icon left>mdi-account-details</v-icon>
          Collector Details
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Content -->
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="4" class="text-center">
            <v-avatar size="120" class="mb-4">
              <v-img :src="photo" />
            </v-avatar>
            <h3 class="text-h6 font-weight-bold mb-2">{{ normalizedData.firstName }} {{ normalizedData.lastName }}</h3>
            <p class="text-body2 text-medium-emphasis">{{ normalizedData.collectorId }}</p>
          </v-col>

          <v-col cols="12" md="8">
            <v-row>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <label class="info-label">Phone Number</label>
                  <p class="info-value">{{ normalizedData.phone }}</p>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <label class="info-label">Email Address</label>
                  <p class="info-value">{{ normalizedData.email }}</p>
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <label class="info-label">Birthdate</label>
                  <p class="info-value">{{ formatDate(normalizedData.birthdate) }}</p>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <label class="info-label">Gender</label>
                  <p class="info-value">{{ normalizedData.gender }}</p>
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <div class="info-item">
                  <label class="info-label">Address</label>
                  <p class="info-value">{{ normalizedData.address }}</p>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <v-divider class="my-6"></v-divider>

        <v-row>
          <v-col cols="12" md="6">
            <div class="info-item">
              <label class="info-label">Assigned Location</label>
              <v-chip color="primary" text-color="white">
                {{ normalizedData.location }}
              </v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="info-item">
              <label class="info-label">Collector ID</label>
              <p class="info-value">{{ normalizedData.collectorId }}</p>
            </div>
          </v-col>
        </v-row>

        <v-row v-if="normalizedData.notes">
          <v-col cols="12">
            <div class="info-item">
              <label class="info-label">Notes</label>
              <p class="info-value">{{ normalizedData.notes }}</p>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Action Buttons -->
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="closeDialog"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./CollectorDetailsDialog.js"></script>
<style scoped src="./CollectorDetailsDialog.css"></style>
