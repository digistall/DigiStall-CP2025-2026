<template>
  <div>
    <!-- Choice Modal -->
    <v-dialog v-model="showModal" max-width="1200px" width="95vw" persistent>
      <v-card class="choice-modal-card">
        <v-card-title class="choice-modal-header">
          <span>How would you like to add stallholders?</span>
          <v-btn icon @click="closeModal" color="white">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-8">
          <v-row dense>
            <!-- Add Individual Stallholder Card -->
            <v-col cols="12" sm="6" md="4">
              <v-card
                class="choice-card stallholder-card"
                :class="{ 'choice-card-hover': !loading }"
                @click="!loading && selectAddStallholder()"
                :disabled="loading"
                elevation="4"
                role="button"
                :aria-label="'Add individual stallholder'"
                tabindex="0"
                @keydown.enter="!loading && selectAddStallholder()"
                @keydown.space="!loading && selectAddStallholder()"
              >
                <div class="choice-card-content">
                  <div class="choice-icon-container stallholder-icon">
                    <v-icon size="40" color="white">mdi-account-plus</v-icon>
                  </div>
                  <h3 class="choice-title">Add Stallholder</h3>
                  <p class="choice-description">
                    Add a single stallholder with complete personal information, 
                    business details, and contract terms.
                  </p>
                  <div class="choice-features">
                    <div class="feature-item">
                      <v-icon size="16" color="#4caf50">mdi-check-circle</v-icon>
                      <span>Personal Information</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="#4caf50">mdi-check-circle</v-icon>
                      <span>Business Details</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="#4caf50">mdi-check-circle</v-icon>
                      <span>Contract & Payment</span>
                    </div>
                  </div>
                </div>
                <div class="choice-card-overlay">
                  <v-btn
                    color="success"
                    class="choice-btn"
                    :loading="loading"
                    :disabled="loading"
                  >
                    <v-icon left>mdi-account-plus</v-icon>
                    Add Stallholder
                  </v-btn>
                </div>
              </v-card>
            </v-col>

            <!-- Import Excel Card -->
            <v-col cols="12" sm="6" md="4">
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
                    <v-icon size="40" color="white">mdi-file-excel</v-icon>
                  </div>
                  <h3 class="choice-title">Import from Excel</h3>
                  <p class="choice-description">
                    Bulk import multiple stallholders from an Excel file. 
                    Download template and upload your data quickly.
                  </p>
                  <div class="choice-features">
                    <div class="feature-item">
                      <v-icon size="16" color="#2196f3">mdi-check-circle</v-icon>
                      <span>Bulk Import</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="#2196f3">mdi-check-circle</v-icon>
                      <span>Excel Template</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="#2196f3">mdi-check-circle</v-icon>
                      <span>Data Validation</span>
                    </div>
                  </div>
                </div>
                <div class="choice-card-overlay">
                  <v-btn
                    color="info"
                    class="choice-btn"
                    :loading="loading"
                    :disabled="loading"
                  >
                    <v-icon left>mdi-file-excel</v-icon>
                    Import Excel
                  </v-btn>
                </div>
              </v-card>
            </v-col>

            <!-- Document Settings Card -->
            <v-col cols="12" sm="6" md="4">
              <v-card
                class="choice-card document-card"
                :class="{ 'choice-card-hover': !loading }"
                @click="!loading && selectDocumentSettings()"
                :disabled="loading"
                elevation="4"
                role="button"
                :aria-label="'Configure document requirements'"
                tabindex="0"
                @keydown.enter="!loading && selectDocumentSettings()"
                @keydown.space="!loading && selectDocumentSettings()"
              >
                <div class="choice-card-content">
                  <div class="choice-icon-container document-icon">
                    <v-icon size="40" color="white">mdi-cog</v-icon>
                  </div>
                  <h3 class="choice-title">Document Settings</h3>
                  <p class="choice-description">
                    Configure required documents and customize application 
                    requirements for stallholder registration.
                  </p>
                  <div class="choice-features">
                    <div class="feature-item">
                      <v-icon size="16" color="#ff9800">mdi-check-circle</v-icon>
                      <span>Document Types</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="#ff9800">mdi-check-circle</v-icon>
                      <span>Requirements Setup</span>
                    </div>
                    <div class="feature-item">
                      <v-icon size="16" color="#ff9800">mdi-check-circle</v-icon>
                      <span>Validation Rules</span>
                    </div>
                  </div>
                </div>
                <div class="choice-card-overlay">
                  <v-btn
                    color="warning"
                    class="choice-btn"
                    :loading="loading"
                    :disabled="loading"
                  >
                    <v-icon left>mdi-cog</v-icon>
                    Document Settings
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Helper Text -->
          <v-row class="mt-6">
            <v-col cols="12">
              <v-alert variant="tonal" class="helper-alert" density="compact">
                <div class="d-flex align-center">
                  <div>
                    <strong>Tip:</strong> Set up document requirements first, 
                    then add stallholders individually or import multiple records at once.
                  </div>
                </div>
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Add Stallholder Modal -->
    <AddStallholder
      :isVisible="showAddStallholderModal"
      @close="closeAddStallholderModal"
      @stallholder-added="handleStallholderAdded"
    />

    <!-- Excel Import Modal -->
    <ExcelImport
      :isVisible="showExcelImportModal"
      @close="closeExcelImportModal"
      @import-completed="handleImportCompleted"
    />

    <!-- Document Customization Modal -->
    <DocumentCustomization
      :isVisible="showDocumentModal"
      @close="closeDocumentModal"
      @document-updated="handleDocumentUpdated"
    />
  </div>
</template>

<script src="./AddStallholderChoiceModal.js"></script>
<style scoped src="./AddStallholderChoiceModal.css"></style>