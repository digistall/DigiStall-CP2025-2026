<template>
  <v-dialog v-model="model" max-width="1200px" persistent>
    <v-card>
      <!-- Header with gradient matching Stallholder -->
      <v-card-title class="details-header">
        <div class="header-content">
          <v-icon class="mr-2">mdi-store</v-icon>
          <h2 class="header-title">Vendor Details - {{ fullName }}</h2>
        </div>
      </v-card-title>

      <!-- Tabs matching Stallholder structure -->
      <v-tabs v-model="activeTab" bg-color="transparent" class="detail-tabs">
        <v-tab value="personal">
          <v-icon left size="small">mdi-account</v-icon>
          PERSONAL INFORMATION
        </v-tab>
        <v-tab value="business">
          <v-icon left size="small">mdi-briefcase</v-icon>
          BUSINESS INFORMATION
        </v-tab>
        <v-tab value="documents">
          <v-icon left size="small">mdi-file-document</v-icon>
          DOCUMENTS
        </v-tab>
      </v-tabs>

      <v-card-text class="pa-6">
        <v-tabs-window v-model="activeTab">
          <!-- Personal Information Tab -->
          <v-tabs-window-item value="personal">
            <div class="info-section-title">Personal Information</div>
            <v-row>
              <v-col cols="12" md="6">
                <div class="info-label">FULL NAME:</div>
                <div class="info-value">{{ fullName }}</div>

                <div class="info-label mt-4">PHONE NUMBER:</div>
                <div class="info-value">{{ d.phone }}</div>

                <div class="info-label mt-4">ADDRESS:</div>
                <div class="info-value">{{ d.address }}</div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="info-label">EMAIL:</div>
                <div class="info-value">{{ d.email }}</div>

                <div class="info-label mt-4">DATE OF BIRTH:</div>
                <div class="info-value">{{ d.birthdate }}</div>

                <div class="info-label mt-4">GENDER:</div>
                <div class="info-value">{{ d.gender }}</div>
              </v-col>
            </v-row>

            <div class="info-section-title mt-6">Family Information</div>
            <v-row>
              <v-col cols="12" md="6">
                <div class="info-label">SPOUSE'S NAME:</div>
                <div class="info-value">{{ spouseFull || '—' }}</div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="info-label">CHILD'S NAME:</div>
                <div class="info-value">{{ childFull || '—' }}</div>
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <!-- Business Information Tab -->
          <v-tabs-window-item value="business">
            <div class="info-section-title">Business Information</div>
            <v-row>
              <v-col cols="12" md="6">
                <div class="info-label">BUSINESS NAME:</div>
                <div class="info-value">{{ d.business_name }}</div>

                <div class="info-label mt-4">BUSINESS TYPE:</div>
                <div class="info-value">{{ d.business_type }}</div>

                <div class="info-label mt-4">PRODUCTS SOLD:</div>
                <div class="info-value">{{ d.business_description || 'N/A' }}</div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="info-label">BUSINESS ADDRESS:</div>
                <div class="info-value">{{ d.business_address || 'N/A' }}</div>

                <div class="info-label mt-4">VENDING TIME:</div>
                <div class="info-value">{{ d.vend_start }} – {{ d.vend_end }}</div>
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <!-- Documents Tab -->
          <v-tabs-window-item value="documents">
            <div class="info-section-title">Documents</div>
            <v-row>
              <v-col cols="12" md="6" v-for="doc in allDocuments" :key="doc.key">
                <div class="info-label mb-2">{{ doc.label }}</div>
                <div class="d-flex gap-2">
                  <v-text-field
                    :model-value="fileName(d.files?.[doc.key], doc.fallback)"
                    variant="outlined"
                    density="compact"
                    readonly
                    prepend-inner-icon="mdi-file-document"
                  ></v-text-field>
                  <v-btn
                    color="grey"
                    variant="outlined"
                    size="small"
                    @click="openFile(d.files?.[doc.key])"
                    :disabled="!toUrl(d.files?.[doc.key])"
                  >
                    OPEN
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="flat"
                    size="small"
                    @click="downloadFile(d.files?.[doc.key], doc.fallback)"
                    :disabled="!toUrl(d.files?.[doc.key])"
                  >
                    DOWNLOAD
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>

      <!-- Action Buttons -->
      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-pencil" @click="editVendor">
          EDIT VENDOR
        </v-btn>
        <v-btn color="error" variant="outlined" prepend-icon="mdi-delete" @click="deleteVendor">
          DELETE
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="model = false"> CLOSE </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./VendorDetailsDialog.js"></script>
<style scoped src="./VendorDetailsDialog.css"></style>
