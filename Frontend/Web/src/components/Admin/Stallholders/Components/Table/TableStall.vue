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
          <div class="header-cell compliance-col">Compliance</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body scrollable-table-wrapper">
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
                  'status-active': stallholder.contract_status === 'Active' && stallholder.payment_status !== 'overdue',
                  'status-expired': stallholder.contract_status === 'Expired',
                  'status-terminated': stallholder.contract_status === 'Terminated',
                  'status-current': stallholder.payment_status === 'current',
                  'status-overdue': stallholder.payment_status === 'overdue',
                  'status-grace': stallholder.payment_status === 'grace_period'
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
          <div class="table-cell compliance-col" @click.stop>
            <v-chip
              :color="stallholder.compliance_status === 'Compliant' ? 'green' : 'red'"
              size="small"
              variant="flat"
              :prepend-icon="stallholder.compliance_status === 'Compliant' ? 'mdi-check-circle' : 'mdi-alert-circle'"
            >
              {{ stallholder.compliance_status || 'Compliant' }}
            </v-chip>
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
            <v-tab value="violations">
              Violations
              <v-badge
                v-if="violationHistory.length > 0"
                :content="violationHistory.length"
                color="red"
                inline
                class="ml-1"
              ></v-badge>
            </v-tab>
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
                <div class="d-flex justify-space-between align-center mb-4">
                  <h3 class="section-title mb-0">
                    <v-icon class="mr-2" color="primary">mdi-file-document-multiple</v-icon>
                    Documents & Attachments
                  </h3>
                  <v-btn
                    variant="text"
                    color="primary"
                    size="small"
                    @click="refreshStallholderDocuments"
                    :loading="loadingDocuments"
                  >
                    <v-icon start>mdi-refresh</v-icon>
                    Refresh
                  </v-btn>
                </div>

                <!-- Document Statistics -->
                <v-row v-if="stallholderDocuments.length > 0" class="mb-4">
                  <v-col cols="4">
                    <v-card color="warning" variant="tonal" class="pa-3 text-center">
                      <div class="text-h5 font-weight-bold">{{ documentStats.pending }}</div>
                      <div class="text-caption">Pending Review</div>
                    </v-card>
                  </v-col>
                  <v-col cols="4">
                    <v-card color="success" variant="tonal" class="pa-3 text-center">
                      <div class="text-h5 font-weight-bold">{{ documentStats.approved }}</div>
                      <div class="text-caption">Approved</div>
                    </v-card>
                  </v-col>
                  <v-col cols="4">
                    <v-card color="error" variant="tonal" class="pa-3 text-center">
                      <div class="text-h5 font-weight-bold">{{ documentStats.rejected }}</div>
                      <div class="text-caption">Rejected</div>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Loading State -->
                <div v-if="loadingDocuments" class="text-center py-6">
                  <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
                  <p class="text-grey mt-2">Loading documents...</p>
                </div>

                <!-- Empty State -->
                <div v-else-if="stallholderDocuments.length === 0" class="documents-placeholder">
                  <v-icon size="64" color="grey-lighten-1" class="mb-3">
                    mdi-file-document-outline
                  </v-icon>
                  <p class="text-grey-lighten-1 text-h6">No Documents Uploaded</p>
                  <p class="text-grey text-body-2">This stallholder has not uploaded any documents yet.</p>
                </div>

                <!-- Documents List -->
                <div v-else class="documents-list">
                  <v-card
                    v-for="doc in stallholderDocuments"
                    :key="doc.submission_id"
                    class="document-item mb-3"
                    :class="{ 'pending-doc': doc.status === 'pending' }"
                    variant="outlined"
                  >
                    <v-card-text class="pa-3">
                      <div class="d-flex align-start">
                        <!-- Document Icon -->
                        <div class="document-icon-wrapper mr-3">
                          <v-icon 
                            :color="getDocFileTypeColor(doc.file_type)" 
                            size="36"
                          >
                            {{ getDocFileTypeIcon(doc.file_type) }}
                          </v-icon>
                        </div>

                        <!-- Document Info -->
                        <div class="flex-grow-1">
                          <div class="d-flex justify-space-between align-start mb-1">
                            <div>
                              <h4 class="document-name text-body-1 font-weight-medium">
                                {{ doc.document_name }}
                              </h4>
                              <p class="text-caption text-grey mb-0">{{ doc.file_name }}</p>
                            </div>
                            <v-chip
                              :color="getDocStatusColor(doc.status)"
                              size="small"
                              variant="flat"
                            >
                              {{ doc.status?.toUpperCase() }}
                            </v-chip>
                          </div>

                          <div class="d-flex align-center mt-2 text-caption text-grey">
                            <v-icon size="14" class="mr-1">mdi-calendar</v-icon>
                            Uploaded: {{ formatDate(doc.uploaded_at) }}
                            <span class="mx-2">•</span>
                            <v-icon size="14" class="mr-1">mdi-file</v-icon>
                            {{ formatFileSize(doc.file_size) }}
                          </div>

                          <!-- Rejection Reason -->
                          <v-alert
                            v-if="doc.status === 'rejected' && doc.rejection_reason"
                            type="error"
                            variant="tonal"
                            density="compact"
                            class="mt-2"
                          >
                            <strong>Rejection Reason:</strong> {{ doc.rejection_reason }}
                          </v-alert>

                          <!-- Review Info -->
                          <div v-if="doc.reviewed_by_name && doc.status !== 'pending'" class="mt-2 text-caption">
                            <v-icon size="14" class="mr-1">mdi-account-check</v-icon>
                            Reviewed by {{ doc.reviewed_by_name }} on {{ formatDate(doc.reviewed_at) }}
                          </div>
                        </div>
                      </div>

                      <!-- Actions for Pending Documents -->
                      <div v-if="doc.status === 'pending'" class="document-actions mt-3 pt-3 border-t">
                        <v-btn
                          color="primary"
                          variant="text"
                          size="small"
                          @click="previewDocument(doc)"
                        >
                          <v-icon start>mdi-eye</v-icon>
                          Preview
                        </v-btn>
                        <v-btn
                          color="success"
                          variant="flat"
                          size="small"
                          @click="approveDocument(doc)"
                          :loading="processingDocId === doc.submission_id"
                          class="ml-2"
                        >
                          <v-icon start>mdi-check</v-icon>
                          Approve
                        </v-btn>
                        <v-btn
                          color="error"
                          variant="outlined"
                          size="small"
                          @click="openRejectDialog(doc)"
                          class="ml-2"
                        >
                          <v-icon start>mdi-close</v-icon>
                          Reject
                        </v-btn>
                      </div>

                      <!-- Actions for Reviewed Documents -->
                      <div v-else class="document-actions mt-3 pt-3 border-t">
                        <v-btn
                          color="primary"
                          variant="text"
                          size="small"
                          @click="previewDocument(doc)"
                        >
                          <v-icon start>mdi-eye</v-icon>
                          View Document
                        </v-btn>
                        <v-btn
                          color="primary"
                          variant="text"
                          size="small"
                          @click="downloadDocument(doc)"
                          class="ml-2"
                        >
                          <v-icon start>mdi-download</v-icon>
                          Download
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </div>
            </v-tabs-window-item>

            <!-- Violations Tab -->
            <v-tabs-window-item value="violations">
              <div class="info-section">
                <h3 class="section-title">
                  <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
                  Violation History
                </h3>

                <!-- Violations Summary Card -->
                <v-card
                  v-if="!loadingViolations && violationHistory.length > 0"
                  class="mb-4 violation-summary-card"
                  color="grey-lighten-4"
                  variant="flat"
                >
                  <v-card-text class="pa-4">
                    <v-row align="center">
                      <v-col cols="12" sm="4" class="text-center">
                        <div class="summary-stat">
                          <v-icon size="28" color="error" class="mb-1">mdi-alert-octagon</v-icon>
                          <div class="stat-value text-h5 font-weight-bold">{{ violationHistory.length }}</div>
                          <div class="stat-label text-caption text-grey">Total Violations</div>
                        </div>
                      </v-col>
                      <v-col cols="12" sm="4" class="text-center">
                        <div class="summary-stat">
                          <v-icon size="28" color="warning" class="mb-1">mdi-clock-outline</v-icon>
                          <div class="stat-value text-h5 font-weight-bold">{{ pendingViolationsCount }}</div>
                          <div class="stat-label text-caption text-grey">Pending</div>
                        </div>
                      </v-col>
                      <v-col cols="12" sm="4" class="text-center">
                        <div class="summary-stat total-penalty">
                          <v-icon size="28" color="error" class="mb-1">mdi-cash-multiple</v-icon>
                          <div class="stat-value text-h5 font-weight-bold text-error">
                            ₱{{ unpaidPenaltyAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                          </div>
                          <div class="stat-label text-caption text-grey">Unpaid Penalties</div>
                        </div>
                      </v-col>
                    </v-row>
                    <v-divider class="my-3"></v-divider>
                    <v-row>
                      <v-col cols="6" class="text-center">
                        <span class="text-caption text-grey">Total Penalties (All Time):</span>
                        <strong class="ml-1">₱{{ totalPenaltyAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</strong>
                      </v-col>
                      <v-col cols="6" class="text-center">
                        <span class="text-caption text-grey">Resolved:</span>
                        <strong class="ml-1 text-success">{{ resolvedViolationsCount }} of {{ violationHistory.length }}</strong>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>

                <!-- Loading State -->
                <div v-if="loadingViolations" class="text-center py-4">
                  <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
                  <p class="text-grey mt-2">Loading violation history...</p>
                </div>

                <!-- No Violations -->
                <div v-else-if="violationHistory.length === 0" class="text-center py-6">
                  <v-icon size="64" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
                  <h4 class="text-success">No Violations Found</h4>
                  <p class="text-grey">This stallholder has a clean record with no violations.</p>
                </div>

                <!-- Violations List -->
                <div v-else class="violations-list">
                  <v-card
                    v-for="violation in violationHistory"
                    :key="violation.violation_id"
                    class="violation-card mb-3"
                    variant="outlined"
                  >
                    <v-card-text class="pa-3">
                      <div class="d-flex justify-space-between align-start mb-2">
                        <div>
                          <v-chip
                            :color="getSeverityColor(violation.severity)"
                            size="small"
                            class="mr-2"
                          >
                            {{ violation.severity?.toUpperCase() || 'MODERATE' }}
                          </v-chip>
                          <v-chip
                            :color="getViolationStatusColor(violation.status)"
                            size="small"
                            variant="outlined"
                          >
                            {{ violation.status?.toUpperCase() || 'PENDING' }}
                          </v-chip>
                        </div>
                        <span class="text-caption text-grey">
                          Offense #{{ violation.offense_no || 1 }}
                        </span>
                      </div>

                      <h4 class="violation-type mb-1">{{ violation.violation_type }}</h4>
                      <p class="text-caption text-grey mb-2" v-if="violation.ordinance_no">
                        {{ violation.ordinance_no }}
                      </p>

                      <v-row dense class="text-body-2">
                        <v-col cols="6">
                          <span class="text-grey">Date:</span>
                          <strong class="ml-1">{{ formatDate(violation.date_reported) }}</strong>
                        </v-col>
                        <v-col cols="6">
                          <span class="text-grey">Penalty:</span>
                          <strong class="ml-1 text-error">₱{{ Number(violation.penalty_amount || 0).toLocaleString() }}</strong>
                        </v-col>
                        <v-col cols="6" v-if="violation.receipt_number">
                          <span class="text-grey">Receipt #:</span>
                          <strong class="ml-1">{{ violation.receipt_number }}</strong>
                        </v-col>
                        <v-col cols="6" v-if="violation.branch_name">
                          <span class="text-grey">Branch:</span>
                          <strong class="ml-1">{{ violation.branch_name }}</strong>
                        </v-col>
                        <v-col cols="12" v-if="violation.inspector_name">
                          <span class="text-grey">Inspector:</span>
                          <strong class="ml-1">{{ violation.inspector_name }}</strong>
                        </v-col>
                        <v-col cols="12" v-if="violation.remarks">
                          <span class="text-grey">Remarks:</span>
                          <p class="text-body-2 mt-1 mb-0">{{ violation.remarks }}</p>
                        </v-col>
                        <v-col cols="12" v-if="violation.resolved_date">
                          <v-divider class="my-2"></v-divider>
                          <v-chip color="success" size="small" prepend-icon="mdi-check">
                            Resolved: {{ formatDate(violation.resolved_date) }}
                          </v-chip>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
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

    <!-- Document Preview Dialog -->
    <v-dialog v-model="showDocPreviewDialog" max-width="900" scrollable class="document-preview-dialog">
      <v-card v-if="previewingDocument" class="document-preview-card">
        <v-card-title class="d-flex justify-space-between align-center bg-primary text-white pa-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-file-document</v-icon>
            <div>
              <div class="text-subtitle-1 font-weight-medium">{{ previewingDocument.document_name }}</div>
              <div class="text-caption opacity-80">{{ previewingDocument.file_name }}</div>
            </div>
          </div>
          <div class="d-flex align-center ga-2">
            <!-- Zoom controls for images -->
            <template v-if="isImageDocument(previewingDocument)">
              <v-btn icon size="small" variant="text" color="white" @click="zoomOut" :disabled="imageZoom <= 0.5">
                <v-icon>mdi-magnify-minus</v-icon>
              </v-btn>
              <span class="text-caption">{{ Math.round(imageZoom * 100) }}%</span>
              <v-btn icon size="small" variant="text" color="white" @click="zoomIn" :disabled="imageZoom >= 3">
                <v-icon>mdi-magnify-plus</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="text" color="white" @click="resetZoom" class="mr-2">
                <v-icon>mdi-fit-to-screen</v-icon>
              </v-btn>
            </template>
            <v-btn icon variant="text" color="white" @click="showDocPreviewDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <v-card-text class="pa-0 preview-content">
          <!-- Image Preview -->
          <div v-if="isImageDocument(previewingDocument)" class="preview-image-container" ref="imageContainer">
            <div class="image-wrapper" :style="{ transform: `scale(${imageZoom})` }">
              <img 
                :src="documentPreviewUrl" 
                :alt="previewingDocument.file_name"
                class="preview-image"
                @error="documentPreviewError = true"
                @load="documentPreviewError = false"
              />
            </div>
            <div v-if="documentPreviewError" class="preview-error pa-8 text-center">
              <v-icon size="64" color="grey">mdi-image-off</v-icon>
              <p class="mt-2 text-grey">Unable to load image preview</p>
              <v-btn color="primary" variant="outlined" class="mt-4" @click="downloadDocument(previewingDocument)">
                <v-icon start>mdi-download</v-icon>
                Download Instead
              </v-btn>
            </div>
          </div>

          <!-- PDF Preview -->
          <div v-else-if="isPdfDocument(previewingDocument)" class="preview-pdf-container">
            <iframe 
              :src="documentPreviewUrl" 
              width="100%" 
              height="600"
              frameborder="0"
            ></iframe>
          </div>

          <!-- Generic File -->
          <div v-else class="preview-generic pa-8 text-center">
            <v-icon size="80" color="grey">mdi-file-document-outline</v-icon>
            <p class="mt-4 text-grey">Preview not available for this file type</p>
            <v-btn color="primary" class="mt-4" @click="downloadDocument(previewingDocument)">
              <v-icon start>mdi-download</v-icon>
              Download File
            </v-btn>
          </div>

          <!-- Document Details -->
          <div class="document-details pa-4">
            <v-row dense>
              <v-col cols="12" sm="6" md="3">
                <div class="detail-item">
                  <v-icon size="small" color="grey" class="mr-1">mdi-file</v-icon>
                  <span class="text-caption text-grey">File Size</span>
                </div>
                <div class="text-body-2 font-weight-medium">{{ formatFileSize(previewingDocument.file_size) }}</div>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <div class="detail-item">
                  <v-icon size="small" color="grey" class="mr-1">mdi-calendar</v-icon>
                  <span class="text-caption text-grey">Uploaded</span>
                </div>
                <div class="text-body-2 font-weight-medium">{{ formatDate(previewingDocument.uploaded_at) }}</div>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <div class="detail-item">
                  <v-icon size="small" color="grey" class="mr-1">mdi-tag</v-icon>
                  <span class="text-caption text-grey">Document Type</span>
                </div>
                <div class="text-body-2 font-weight-medium">{{ previewingDocument.document_name }}</div>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <div class="detail-item">
                  <v-icon size="small" color="grey" class="mr-1">mdi-check-circle</v-icon>
                  <span class="text-caption text-grey">Status</span>
                </div>
                <v-chip :color="getDocStatusColor(previewingDocument.status)" size="small" class="mt-1">
                  {{ previewingDocument.status?.toUpperCase() }}
                </v-chip>
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4" v-if="previewingDocument.status === 'pending'">
          <v-spacer></v-spacer>
          <v-btn 
            color="error" 
            variant="outlined"
            @click="openRejectDialog(previewingDocument); showDocPreviewDialog = false"
          >
            <v-icon start>mdi-close</v-icon>
            Reject
          </v-btn>
          <v-btn 
            color="success" 
            variant="flat"
            @click="approveDocument(previewingDocument)"
            :loading="processingDocId === previewingDocument.submission_id"
          >
            <v-icon start>mdi-check</v-icon>
            Approve
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Document Rejection Dialog -->
    <v-dialog v-model="showDocRejectDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-error text-white">
          <v-icon class="mr-2">mdi-file-document-remove</v-icon>
          Reject Document
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-4">
            Please provide a reason for rejecting this document. The stallholder will be notified.
          </p>
          <v-textarea
            v-model="docRejectionReason"
            label="Rejection Reason"
            placeholder="Enter the reason why this document is being rejected..."
            variant="outlined"
            rows="3"
            counter
            maxlength="500"
            :rules="[v => !!v || 'Rejection reason is required']"
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDocRejectDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            variant="flat"
            @click="rejectStallholderDocument"
            :disabled="!docRejectionReason"
            :loading="processingDocId === documentToReject?.submission_id"
          >
            Confirm Rejection
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Document Action Snackbar -->
    <v-snackbar v-model="docSnackbar.show" :color="docSnackbar.color" :timeout="3000">
      {{ docSnackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="docSnackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template><script src="./TableStall.js"></script>
<style scoped src="./TableStall.css"></style>
