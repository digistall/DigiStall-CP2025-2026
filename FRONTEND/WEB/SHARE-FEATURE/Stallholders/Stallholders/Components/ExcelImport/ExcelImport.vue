<template>
  <v-dialog v-model="isVisible" max-width="700px" persistent>
    <v-card>
      <v-toolbar color="success" dark dense>
        <v-toolbar-title class="toolbar-title">
          <v-icon left>mdi-file-excel</v-icon>
          Import Stallholders from Excel
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0">
        <!-- Simple step-based interface without deprecated stepper components -->
        <div class="excel-import-steps">
          <!-- Step Indicator -->
          <div class="step-indicator">
            <div class="step-item" :class="{ active: currentStep === 1, complete: currentStep > 1 }">
              <div class="step-number">1</div>
              <div class="step-label">Upload File</div>
            </div>
            <div class="step-line" :class="{ active: currentStep > 1 }"></div>
            <div class="step-item" :class="{ active: currentStep === 2, complete: currentStep > 2 }">
              <div class="step-number">2</div>
              <div class="step-label">Preview Data</div>
            </div>
            <div class="step-line" :class="{ active: currentStep > 2 }"></div>
            <div class="step-item" :class="{ active: currentStep === 3, complete: currentStep > 3 }">
              <div class="step-number">3</div>
              <div class="step-label">Import</div>
            </div>
          </div>

          <!-- Step 1: File Upload -->
          <div v-if="currentStep === 1" class="step-content">
            <div class="upload-section">
              <!-- Template Download -->
              <v-card outlined class="mb-4">
                <v-card-text>
                  <div class="template-info">
                    <v-icon left size="24" color="info">mdi-download</v-icon>
                    <span class="template-text">Need a template? Download our Excel template with sample data</span>
                    <v-btn 
                      color="info" 
                      outlined 
                      small 
                      @click="downloadTemplate"
                      class="ml-4"
                    >
                      <v-icon left small>mdi-download</v-icon>
                      Download Template
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>

              <!-- File Upload -->
              <v-file-input
                v-model="selectedFile"
                label="Select Excel File"
                accept=".xlsx,.xls"
                outlined
                prepend-icon="mdi-file-excel"
                show-size
                @change="onFileSelected"
                :rules="fileRules"
                hint="Accepted formats: .xlsx, .xls (Maximum 10MB)"
                persistent-hint
              ></v-file-input>

              <!-- File Info -->
              <v-card v-if="selectedFile" outlined class="mt-4">
                <v-card-text>
                  <div class="file-info">
                    <v-icon left color="success">mdi-check-circle</v-icon>
                    <div class="file-details">
                      <div class="file-name">{{ selectedFile.name }}</div>
                      <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <div class="step-actions mt-6">
                <v-btn color="grey" text @click="closeDialog">Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-btn 
                  color="primary" 
                  @click="uploadAndPreview" 
                  :disabled="!selectedFile"
                  :loading="uploading"
                >
                  Next: Preview Data
                  <v-icon right>mdi-arrow-right</v-icon>
                </v-btn>
              </div>
            </div>
          </div>

          <!-- Step 2: Data Preview -->
          <div v-if="currentStep === 2" class="step-content">
            <div class="preview-section">
              <!-- Summary -->
              <v-row class="mb-4">
                <v-col cols="6" sm="3">
                  <v-card outlined>
                    <v-card-text class="text-center pa-2">
                      <div class="summary-number text-h5 primary--text">{{ previewData.length }}</div>
                      <div class="summary-label caption">Total Records</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-card outlined>
                    <v-card-text class="text-center pa-2">
                      <div class="summary-number text-h5 success--text">{{ validRecords }}</div>
                      <div class="summary-label caption">Valid Records</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-card outlined>
                    <v-card-text class="text-center pa-2">
                      <div class="summary-number text-h5 warning--text">{{ newStallsCount }}</div>
                      <div class="summary-label caption">New Stalls</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-card outlined>
                    <v-card-text class="text-center pa-2">
                      <div class="summary-number text-h5 error--text">{{ invalidRecords }}</div>
                      <div class="summary-label caption">Invalid</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Validation Errors -->
              <v-alert 
                v-if="validationErrors.length > 0" 
                type="warning" 
                outlined 
                class="mb-4"
                dense
              >
                <div class="alert-title font-weight-bold">
                  <v-icon left small>mdi-alert</v-icon>
                  Validation Issues Found
                </div>
                <ul class="validation-list mt-2">
                  <li v-for="(error, idx) in validationErrors.slice(0, 5)" :key="idx" class="caption">{{ error }}</li>
                  <li v-if="validationErrors.length > 5" class="caption">
                    ... and {{ validationErrors.length - 5 }} more issues
                  </li>
                </ul>
              </v-alert>

              <!-- Data Preview Table -->
              <v-card outlined>
                <v-card-title class="py-2">
                  <v-icon left small>mdi-table</v-icon>
                  Data Preview
                  <v-spacer></v-spacer>
                  <v-chip :color="validRecords === previewData.length ? 'success' : 'warning'" small>
                    {{ validRecords }}/{{ previewData.length }} Valid
                  </v-chip>
                </v-card-title>
                <v-data-table
                  :headers="previewHeaders"
                  :items="previewData.slice(0, 15)"
                  hide-default-footer
                  dense
                  class="preview-table"
                >
                  <template v-slot:item="{ item }">
                    <tr :class="{ 'invalid-row': !item._isValid }">
                      <td class="text-truncate" style="max-width: 100px;">
                        <v-chip x-small :color="item._stallExists ? 'info' : 'success'" outlined>
                          {{ item.stall_no }}
                        </v-chip>
                      </td>
                      <td class="text-truncate" style="max-width: 150px;">{{ item.stallholder_name }}</td>
                      <td class="text-truncate" style="max-width: 150px;">{{ item.business_type }}</td>
                      <td class="text-right" style="width: 80px;">{{ item.area_occupied || '-' }}</td>
                      <td class="text-right" style="width: 100px;">
                        <span v-if="item.monthly_rent">₱{{ parseFloat(item.monthly_rent).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                        <span v-else>-</span>
                      </td>
                      <td class="text-center">
                        <v-tooltip bottom v-if="!item._isValid && item._rowErrors">
                          <template v-slot:activator="{ on, attrs }">
                            <v-icon 
                              color="error" 
                              size="16"
                              v-bind="attrs"
                              v-on="on"
                            >mdi-alert-circle</v-icon>
                          </template>
                          <span>{{ item._rowErrors.join(', ') }}</span>
                        </v-tooltip>
                        <v-icon 
                          v-else
                          :color="item._isValid ? 'success' : 'error'" 
                          size="16"
                        >
                          {{ item._isValid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                        </v-icon>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
                <v-card-text v-if="previewData.length > 15" class="text-center text-caption py-2">
                  Showing first 15 of {{ previewData.length }} records
                </v-card-text>
              </v-card>

              <div class="step-actions mt-6">
                <v-btn text @click="currentStep = 1">
                  <v-icon left>mdi-arrow-left</v-icon>
                  Back
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn 
                  color="success" 
                  @click="importData" 
                  :disabled="validRecords === 0"
                  :loading="importing"
                >
                  Import {{ validRecords }} Records
                  <v-icon right>mdi-upload</v-icon>
                </v-btn>
              </div>
            </div>
          </div>

          <!-- Step 3: Import Results -->
          <div v-if="currentStep === 3" class="step-content">
            <div class="results-section">
              <v-alert :type="importSuccess ? 'success' : 'error'" prominent>
                <div class="alert-content">
                  <v-icon left size="32">
                    {{ importSuccess ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                  <div>
                    <div class="alert-title">
                      {{ importSuccess ? 'Import Successful!' : 'Import Failed' }}
                    </div>
                    <div class="alert-message">{{ importMessage }}</div>
                  </div>
                </div>
              </v-alert>

              <div class="step-actions mt-6">
                <v-btn color="primary" @click="closeAndRefresh">
                  <v-icon left>mdi-check</v-icon>
                  Done
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Toast Notification -->
    <ToastNotification
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </v-dialog>
</template>

<script src="./ExcelImport.js"></script>
<style scoped src="./ExcelImport.css"></style>