<template>
  <div>
    <!-- Choice Modal -->
    <v-dialog v-model="showModal" max-width="800px" width="95vw" persistent>
      <v-card class="choice-modal-card">
        <v-card-title class="choice-modal-header">
          <span>How would you like to add vendors?</span>
          <v-btn icon @click="closeModal" color="white">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-8">
          <v-row dense justify="center">
            <!-- Add Individual Vendor Card -->
            <v-col cols="12" sm="6" md="6">
              <v-card
                class="choice-card vendor-card"
                :class="{ 'choice-card-hover': !loading }"
                @click="!loading && selectAddVendor()"
                :disabled="loading"
                elevation="4"
                role="button"
                :aria-label="'Add individual vendor'"
                tabindex="0"
                @keydown.enter="!loading && selectAddVendor()"
                @keydown.space="!loading && selectAddVendor()"
              >
                <div class="choice-card-content">
                  <div class="choice-icon-container vendor-icon">
                    <v-icon size="36" color="white">mdi-store-plus-outline</v-icon>
                  </div>
                  <h3 class="choice-title">Add Vendor</h3>
                  <p class="choice-description">
                    Add a single vendor with complete personal information, business details, and
                    collector assignment.
                  </p>
                  <div class="choice-features">
                    <div class="feature-item">
                      <v-icon size="16" color="rgb(0, 33, 129)">mdi-check-circle</v-icon>
                      <span>Personal Information</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="rgb(0, 33, 129)">mdi-check-circle</v-icon>
                      <span>Business Details</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="rgb(0, 33, 129)">mdi-check-circle</v-icon>
                      <span>Collector Assignment</span>
                    </div>
                  </div>
                </div>
                <div class="choice-card-overlay">
                  <v-btn color="primary" class="choice-btn" :loading="loading" :disabled="loading">
                    <v-icon left>mdi-store-plus-outline</v-icon>
                    Add Vendor
                  </v-btn>
                </div>
              </v-card>
            </v-col>

            <!-- Import Excel Card -->
            <v-col cols="12" sm="6" md="6">
              <v-card
                class="choice-card excel-card"
                :class="{ 'choice-card-hover': !loading }"
                @click="!loading && selectImportExcel()"
                :disabled="loading"
                elevation="4"
                role="button"
                :aria-label="'Import from Excel file'"
                tabindex="0"
                @keydown.enter="!loading && selectImportExcel()"
                @keydown.space="!loading && selectImportExcel()"
              >
                <div class="choice-card-content">
                  <div class="choice-icon-container excel-icon">
                    <v-icon size="36" color="white">mdi-microsoft-excel</v-icon>
                  </div>
                  <h3 class="choice-title">Import from Excel</h3>
                  <p class="choice-description">
                    Bulk import multiple vendors from an Excel file. Download template and upload
                    your data quickly.
                  </p>
                  <div class="choice-features">
                    <div class="feature-item">
                      <v-icon size="16" color="rgb(16, 124, 65)">mdi-check-circle</v-icon>
                      <span>Bulk Import</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="rgb(16, 124, 65)">mdi-check-circle</v-icon>
                      <span>Excel Template</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="rgb(16, 124, 65)">mdi-check-circle</v-icon>
                      <span>Data Validation</span>
                    </div>
                  </div>
                </div>
                <div class="choice-card-overlay">
                  <v-btn color="success" class="choice-btn" :loading="loading" :disabled="loading">
                    <v-icon left>mdi-microsoft-excel</v-icon>
                    Import Excel
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Add Vendor Modal -->
    <AddVendorDialog
      :isVisible="showAddVendorModal"
      @close="closeAddVendorModal"
      @save="handleVendorAdded"
    />

    <!-- Excel Import Modal -->
    <ExcelImport
      :isVisible="showExcelImportModal"
      @close="closeExcelImportModal"
      @import-complete="handleImportCompleted"
    />
  </div>
</template>

<script src="./AddVendorChoiceModal.js"></script>
<style scoped src="./AddVendorChoiceModal.css"></style>
