<template>
  <div class="stallholders-table">
    <v-card elevation="1" class="table-card">
      <!-- Custom Table Header -->
      <div class="table-header">
        <div class="header-row simplified-layout">
          <div class="header-cell id-col">ID</div>
          <div class="header-cell name-col">Full Name</div>
          <div class="header-cell business-col">Business</div>
          <div class="header-cell email-col">Email Address</div>
          <div class="header-cell phone-col">Phone Number</div>
          <div class="header-cell stall-col">Stall</div>
          <div class="header-cell status-col">Status</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body">
        <div
          v-for="stallholder in paginatedStallholders"
          :key="stallholder.stallholder_id"
          class="table-row simplified-layout clickable-row"
          @click="viewMoreInfo(stallholder)"
        >
          <div class="table-cell id-col">
            #{{ stallholder.stallholder_id }}
          </div>
          <div class="table-cell name-col">
            {{ stallholder.stallholder_name }}
          </div>
          <div class="table-cell business-col">
            <div class="business-info">
              <div class="business-name">{{ stallholder.business_name }}</div>
              <div class="business-type">{{ stallholder.business_type }}</div>
            </div>
          </div>
          <div class="table-cell email-col">
            {{ stallholder.email }}
          </div>
          <div class="table-cell phone-col">
            {{ stallholder.contact_number }}
          </div>
          <div class="table-cell stall-col">
            <div v-if="stallholder.stall_no" class="stall-info">
              <div class="stall-number">{{ stallholder.stall_no }}</div>
              <div class="stall-location">{{ stallholder.stall_location }}</div>
            </div>
            <div v-else class="stall-unassigned">
              <v-icon size="small" color="grey">mdi-minus</v-icon>
              Unassigned
            </div>
          </div>
          <div class="table-cell status-col" @click.stop>
            <!-- Show Status Badge -->
            <div class="status-display">
              <div
                class="status-badge"
                :class="{
                  'status-active': stallholder.contract_status === 'Active',
                  'status-expired': stallholder.contract_status === 'Expired',
                  'status-terminated': stallholder.contract_status === 'Terminated',
                  'status-current': stallholder.payment_status === 'current',
                  'status-overdue': stallholder.payment_status === 'overdue',
                  'status-grace': stallholder.payment_status === 'grace_period',
                  'status-compliant': stallholder.compliance_status === 'Compliant',
                  'status-non-compliant': stallholder.compliance_status === 'Non-Compliant'
                }"
              >
                <v-icon
                  :icon="getStatusIcon(stallholder.contract_status, stallholder.payment_status)"
                  size="16"
                  :color="getStatusColor(stallholder.contract_status, stallholder.payment_status)"
                  class="mr-1"
                ></v-icon>
                {{ getStatusText(stallholder.contract_status, stallholder.payment_status) }}
              </div>
              <div v-if="stallholder.last_payment_date" class="status-date">
                Last payment: {{ formatDate(stallholder.last_payment_date) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      <!-- Empty State -->
      <div v-if="stallholders.length === 0" class="empty-state">
        <v-icon size="48" color="grey-lighten-1" class="mb-3">
          mdi-account-tie
        </v-icon>
        <p class="text-grey-lighten-1">No stallholders found</p>
      </div>

      <!-- Pagination -->
      <div class="pagination-section" v-if="totalPages > 1">
        <v-pagination
          v-model="currentPage"
          :total-visible="5"
          :length="totalPages"
          color="primary"
          class="my-4"
        ></v-pagination>
      </div>
    </v-card>

    <!-- More Info Dialog -->
    <v-dialog v-model="showInfoDialog" max-width="1000" scrollable>
      <v-card>
        <v-card-title class="text-h5 pa-4 bg-primary text-white">
          <v-icon class="mr-2" color="white">mdi-account-tie</v-icon>
          Stallholder Details - {{ selectedStallholder?.stallholder_name }}
        </v-card-title>

        <v-card-text class="pa-0">
          <v-tabs v-model="activeTab" color="primary" class="border-b">
            <v-tab value="personal">Personal Information</v-tab>
            <v-tab value="business">Business Information</v-tab>
            <v-tab value="contract">Contract Details</v-tab>
            <v-tab value="payment">Payment History</v-tab>
            <v-tab value="documents">Documents</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab" class="pa-4">
            <!-- Personal Information Tab -->
            <v-tabs-window-item value="personal">
              <div class="info-section">
                <h3 class="section-title">Personal Information</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Full Name:</span>
                      <span class="info-value">{{ selectedStallholder?.stallholder_name }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Email:</span>
                      <span class="info-value">{{ selectedStallholder?.email }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Phone Number:</span>
                      <span class="info-value">{{ selectedStallholder?.contact_number }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="info-item">
                      <span class="info-label">Address:</span>
                      <span class="info-value">{{ selectedStallholder?.address }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <!-- Business Information Tab -->
            <v-tabs-window-item value="business">
              <div class="info-section">
                <h3 class="section-title">Business Information</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Business Name:</span>
                      <span class="info-value">{{ selectedStallholder?.business_name }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Business Type:</span>
                      <span class="info-value">{{ selectedStallholder?.business_type }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Stall Number:</span>
                      <span class="info-value stall-number">{{ selectedStallholder?.stall_no || 'Unassigned' }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Stall Location:</span>
                      <span class="info-value">{{ selectedStallholder?.stall_location || 'Not assigned' }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <!-- Contract Details Tab -->
            <v-tabs-window-item value="contract">
              <div class="info-section">
                <h3 class="section-title">Contract Information</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Contract Status:</span>
                      <span class="info-value">
                        <v-chip
                          :color="getContractStatusColor(selectedStallholder?.contract_status)"
                          size="small"
                          variant="flat"
                        >
                          {{ selectedStallholder?.contract_status }}
                        </v-chip>
                      </span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Payment Status:</span>
                      <span class="info-value">
                        <v-chip
                          :color="getPaymentStatusColor(selectedStallholder?.payment_status)"
                          size="small"
                          variant="flat"
                        >
                          {{ selectedStallholder?.payment_status }}
                        </v-chip>
                      </span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Contract Start:</span>
                      <span class="info-value">{{ formatDate(selectedStallholder?.contract_start_date) }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Contract End:</span>
                      <span class="info-value">{{ formatDate(selectedStallholder?.contract_end_date) }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Monthly Rent:</span>
                      <span class="info-value price">₱{{ selectedStallholder?.monthly_rent?.toLocaleString() }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Total Lease Amount:</span>
                      <span class="info-value price">₱{{ selectedStallholder?.lease_amount?.toLocaleString() }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="info-item">
                      <span class="info-label">Notes:</span>
                      <span class="info-value">{{ selectedStallholder?.notes || 'No notes available' }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <!-- Payment History Tab -->
            <v-tabs-window-item value="payment">
              <div class="info-section">
                <h3 class="section-title">Payment Information</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Last Payment Date:</span>
                      <span class="info-value">{{ formatDate(selectedStallholder?.last_payment_date) || 'No payment yet' }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Compliance Status:</span>
                      <span class="info-value">
                        <v-chip
                          :color="selectedStallholder?.compliance_status === 'Compliant' ? 'green' : 'red'"
                          size="small"
                          variant="flat"
                        >
                          {{ selectedStallholder?.compliance_status }}
                        </v-chip>
                      </span>
                    </div>
                  </v-col>
                  <v-col cols="12" v-if="selectedStallholder?.compliance_status === 'Non-Compliant'">
                    <div class="info-item">
                      <span class="info-label">Last Violation Date:</span>
                      <span class="info-value">{{ formatDate(selectedStallholder?.last_violation_date) || 'No violations recorded' }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <!-- Documents Tab -->
            <v-tabs-window-item value="documents">
              <div class="info-section">
                <h3 class="section-title">Documents & Attachments</h3>
                <div class="documents-placeholder">
                  <v-icon size="48" color="grey-lighten-1" class="mb-3">
                    mdi-file-document-outline
                  </v-icon>
                  <p class="text-grey-lighten-1">Document management coming soon</p>
                </div>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-btn
            color="primary"
            variant="flat"
            @click="editStallholder(selectedStallholder)"
          >
            <v-icon class="mr-2">mdi-pencil</v-icon>
            Edit Stallholder
          </v-btn>
          <v-btn
            color="red"
            variant="outlined"
            @click="deleteStallholder(selectedStallholder)"
            class="ml-2"
          >
            <v-icon class="mr-2">mdi-delete</v-icon>
            Delete
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Stallholder Floating Action Button -->
    <div class="floating-actions">
      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-fab
            v-bind="props"
            color="primary"
            icon="mdi-plus"
            size="large"
            @click="openChoiceModal"
            :aria-label="'Add Stallholders'"
            role="button"
          ></v-fab>
        </template>
        <span>Add Stallholders</span>
      </v-tooltip>
    </div>

    <!-- Add Stallholder Choice Modal -->
    <AddStallholderChoiceModal
      :showModal="showChoiceModal"
      @close-modal="closeChoiceModal"
      @stallholder-added="handleStallholderAdded"
      @import-completed="handleImportCompleted"
      @document-updated="handleDocumentUpdated"
      @show-message="handleShowMessage"
      @refresh-stallholders="fetchStallholders"
    />

    <!-- Excel Import Modal -->
    <ExcelImport
      :isVisible="showExcelImport"
      @close="closeExcelImport"
      @import-complete="handleImportComplete"
    />

    <!-- Document Customization Modal -->
    <DocumentCustomization
      :isVisible="showDocumentCustomization"
      @close="closeDocumentCustomization"
    />
  </div>
</template><script src="./TableStall.js"></script>
<style scoped src="./TableStall.css"></style>