<template>
  <v-dialog v-model="isVisible" max-width="800px" persistent>
    <v-card>
      <v-card-title class="modal-header">
        <h2 class="modal-title">Import Vendors from Excel</h2>
        <v-btn icon class="close-btn" @click="closeDialog">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-alert type="info" variant="tonal" class="mb-4">
          Download the Excel template, fill in vendor information, and upload the file to import
          multiple vendors at once.
        </v-alert>

        <v-row>
          <v-col cols="12">
            <v-btn
              color="success"
              prepend-icon="mdi-download"
              variant="tonal"
              block
              @click="downloadTemplate"
            >
              Download Excel Template
            </v-btn>
          </v-col>

          <v-col cols="12">
            <v-file-input
              v-model="excelFile"
              label="Select Excel File"
              accept=".xlsx,.xls"
              prepend-icon="mdi-microsoft-excel"
              variant="outlined"
              :rules="fileRules"
              show-size
            ></v-file-input>
          </v-col>

          <v-col cols="12">
            <v-alert v-if="importStatus.message" :type="importStatus.type" variant="tonal">
              {{ importStatus.message }}
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="closeDialog">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="importing"
          :disabled="!excelFile || importing"
          @click="importVendors"
        >
          Import Vendors
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./ExcelImport.js"></script>
<style scoped src="./ExcelImport.css"></style>
