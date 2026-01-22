<template>
  <div class="applicants-table">
    <v-card elevation="1" class="table-card">
      <!-- Custom Table Header -->
      <div class="table-header">
        <div
          class="header-row simplified-layout"
        >
          <div class="header-cell id-col">ID</div>
          <div class="header-cell name-col">Full Name</div>
          <div class="header-cell email-col">Email Address</div>
          <div class="header-cell phone-col">Phone Number</div>
          <div class="header-cell address-col">Address</div>
          <div class="header-cell action-col">Status</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body scrollable-table-wrapper">
        <div
          v-for="applicant in applicants"
          :key="applicant.id"
          class="table-row simplified-layout clickable-row"
          @click="viewMoreInfo(applicant)"
        >
          <div class="table-cell id-col">
            {{ applicant.id }}
          </div>
          <div class="table-cell name-col">
            {{ applicant.fullName }}
          </div>
          <div class="table-cell email-col">
            {{ applicant.email }}
          </div>
          <div class="table-cell phone-col">
            {{ applicant.phoneNumber }}
          </div>
          <div class="table-cell address-col">
            <div class="address-text">
              {{ applicant.address }}
            </div>
          </div>
          <div class="table-cell action-col" @click.stop>
            <!-- Show Status Badge for Approved/Rejected/Under Review Applicants -->
            <div
              v-if="isProcessedStatus(applicant.application_status, applicant)"
              class="status-display"
            >
              <!-- Re-check tooltip for Rejected status -->
              <v-tooltip v-if="getEffectiveStatus(applicant) === 'Rejected'" location="bottom">
                <template v-slot:activator="{ props }">
                  <div
                    class="status-badge status-declined-recheck"
                    :class="{
                      'status-approved': getEffectiveStatus(applicant) === 'Approved',
                      'status-declined': getEffectiveStatus(applicant) === 'Rejected',
                      'status-under-review':
                        getEffectiveStatus(applicant) === 'Under Review',
                      'status-cancelled': getEffectiveStatus(applicant) === 'Cancelled',
                    }"
                    v-bind="props"
                    @click="handleStatusClick(applicant)"
                  >
                    <v-icon
                      :icon="getStatusIcon(getEffectiveStatus(applicant))"
                      size="16"
                      :color="getStatusColor(getEffectiveStatus(applicant))"
                      class="mr-1"
                    ></v-icon>
                    {{ getStatusText(getEffectiveStatus(applicant)) }}
                  </div>
                </template>
                <span>Click to re-check this applicant</span>
              </v-tooltip>

              <!-- Approve tooltip for Under Review status -->
              <v-tooltip
                v-else-if="getEffectiveStatus(applicant) === 'Under Review'"
                bottom
              >
                <template v-slot:activator="{ props }">
                  <div
                    class="status-badge status-under-review-approve"
                    :class="{
                      'status-approved': getEffectiveStatus(applicant) === 'Approved',
                      'status-declined': getEffectiveStatus(applicant) === 'Rejected',
                      'status-under-review':
                        getEffectiveStatus(applicant) === 'Under Review',
                      'status-cancelled': getEffectiveStatus(applicant) === 'Cancelled',
                    }"
                    v-bind="props"
                    @click="handleStatusClick(applicant)"
                  >
                    <v-icon
                      icon="mdi-check-circle-outline"
                      size="16"
                      :color="getStatusColor(getEffectiveStatus(applicant))"
                      class="mr-1"
                    ></v-icon>
                    {{ getStatusText(getEffectiveStatus(applicant)) }}
                  </div>
                </template>
                <span>Click to approve this applicant</span>
              </v-tooltip>

              <!-- Regular status badge for other statuses (Approved, etc.) -->
              <div
                v-else
                class="status-badge"
                :class="{
                  'status-approved': getEffectiveStatus(applicant) === 'Approved',
                  'status-declined': getEffectiveStatus(applicant) === 'Rejected',
                  'status-under-review': getEffectiveStatus(applicant) === 'Under Review',
                  'status-cancelled': getEffectiveStatus(applicant) === 'Cancelled',
                }"
              >
                <v-icon
                  :icon="getStatusIcon(getEffectiveStatus(applicant))"
                  size="16"
                  :color="getStatusColor(getEffectiveStatus(applicant))"
                  class="mr-1"
                ></v-icon>
                {{ getStatusText(getEffectiveStatus(applicant)) }}
              </div>
              <div
                v-if="
                  applicant.approved_at || applicant.declined_at || applicant.updated_at
                "
                class="status-date"
              >
                {{
                  formatStatusDate(
                    applicant.approved_at || applicant.declined_at || applicant.updated_at
                  )
                }}
              </div>
            </div>

            <!-- Show Action Buttons for Pending Applicants -->
            <div v-else class="action-buttons">
              <v-btn
                variant="flat"
                color="primary"
                size="small"
                class="mr-2 accept-btn"
                @click="acceptApplicant(applicant)"
              >
                ACCEPT
              </v-btn>
              <v-btn
                variant="outlined"
                color="black"
                size="small"
                class="decline-btn"
                style="background-color: white; color: black; border-color: black;"
                @click="declineApplicant(applicant)"
              >
                DECLINE
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="applicants.length === 0" class="empty-state">
        <v-icon size="48" color="grey-lighten-1" class="mb-3">
          mdi-account-group-outline
        </v-icon>
        <p class="text-grey-lighten-1">No applicants found</p>
      </div>
    </v-card>

    <!-- More Info Dialog -->
    <v-dialog v-model="showInfoDialog" max-width="900" scrollable>
      <v-card>
        <v-card-title class="text-h5 pa-4 bg-primary text-white">
          <v-icon class="mr-2" color="white">mdi-account-details</v-icon>
          Applicant Details - {{ selectedApplicant?.fullName }}
        </v-card-title>

        <v-card-text class="pa-0">
          <v-tabs v-model="activeTab" color="primary" class="border-b">
            <v-tab value="personal">Personal Information</v-tab>
            <v-tab value="business">Business Information</v-tab>
            <v-tab
              value="stall"
              v-if="selectedApplicant?.stall_info && applicantType === 'Stall Applicants'"
              >Stall Information</v-tab
            >
            <v-tab value="spouse" v-if="selectedApplicant?.spouse_information"
              >Spouse Information</v-tab
            >
            <v-tab value="documents">Other Information</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab" class="pa-4">
            <!-- Personal Information Tab -->
            <v-tabs-window-item value="personal">
              <div class="info-section">
                <h3 class="section-title">Personal Details</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Full Name:</span>
                      <span class="info-value">{{ selectedApplicant?.fullName }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Email Address:</span>
                      <span class="info-value">{{ selectedApplicant?.email }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Phone Number:</span>
                      <span class="info-value">{{ selectedApplicant?.phoneNumber }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Birth Date:</span>
                      <span class="info-value">{{
                        formatDate(selectedApplicant?.applicant_birthdate)
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Civil Status:</span>
                      <span class="info-value">{{
                        selectedApplicant?.applicant_civil_status
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Educational Attainment:</span>
                      <span class="info-value">{{
                        selectedApplicant?.applicant_educational_attainment
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="info-item">
                      <span class="info-label">Address:</span>
                      <span class="info-value">{{ selectedApplicant?.address }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <!-- Business Information Tab -->
            <v-tabs-window-item value="business">
              <div class="info-section" v-if="selectedApplicant?.business_information">
                <h3 class="section-title">Business Details</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Nature of Business:</span>
                      <span class="info-value">{{
                        selectedApplicant.business_information.nature_of_business
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Capitalization:</span>
                      <span class="info-value"
                        >₱{{
                          formatCurrency(
                            selectedApplicant.business_information.capitalization
                          )
                        }}</span
                      >
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Source of Capital:</span>
                      <span class="info-value">{{
                        selectedApplicant.business_information.source_of_capital
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Relative Stall Owner:</span>
                      <span class="info-value">{{
                        selectedApplicant.business_information.relative_stall_owner
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="info-item">
                      <span class="info-label">Previous Business Experience:</span>
                      <span class="info-value">{{
                        selectedApplicant.business_information
                          .previous_business_experience
                      }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <!-- Stall Information Tab -->
            <v-tabs-window-item
              value="stall"
              v-if="selectedApplicant?.stall_info && applicantType === 'Stall Applicants'"
            >
              <div class="info-section">
                <h3 class="section-title">Stall Application Details</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Stall Number:</span>
                      <span class="info-value stall-number">{{
                        selectedApplicant.stall_info.stall_no
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Location:</span>
                      <span class="info-value">{{
                        selectedApplicant.stall_info.stall_location
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Section:</span>
                      <span class="info-value">{{
                        selectedApplicant.stall_info.section_name
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Floor:</span>
                      <span class="info-value">{{
                        selectedApplicant.stall_info.floor_name
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Rental Price:</span>
                      <span class="info-value price"
                        >₱{{
                          formatCurrency(selectedApplicant.stall_info.rental_price)
                        }}</span
                      >
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Price Type:</span>
                      <span class="info-value">
                        <v-chip
                          size="small"
                          :color="
                            getStallTypeColor(selectedApplicant.stall_info.price_type)
                          "
                        >
                          {{ selectedApplicant.stall_info.price_type }}
                        </v-chip>
                      </span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Application Date:</span>
                      <span class="info-value">{{
                        formatDate(selectedApplicant.application_date)
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Application Status:</span>
                      <span class="info-value">
                        <v-chip
                          size="small"
                          :color="
                            getApplicationStatusColor(
                              selectedApplicant.application_status
                            )
                          "
                        >
                          {{ selectedApplicant.application_status }}
                        </v-chip>
                      </span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Stall Status:</span>
                      <span class="info-value">{{
                        selectedApplicant.stall_info.stall_status
                      }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <!-- Spouse Information Tab -->
            <v-tabs-window-item
              value="spouse"
              v-if="selectedApplicant?.spouse_information"
            >
              <div class="info-section">
                <h3 class="section-title">Spouse Details</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Full Name:</span>
                      <span class="info-value">{{
                        selectedApplicant.spouse_information.spouse_full_name
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Birth Date:</span>
                      <span class="info-value">{{
                        formatDate(selectedApplicant.spouse_information.spouse_birthdate)
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Educational Attainment:</span>
                      <span class="info-value">{{
                        selectedApplicant.spouse_information.spouse_educational_attainment
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Contact Number:</span>
                      <span class="info-value">{{
                        selectedApplicant.spouse_information.spouse_contact_number
                      }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Occupation:</span>
                      <span class="info-value">{{
                        selectedApplicant.spouse_information.spouse_occupation
                      }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <!-- Documents/Other Information Tab -->
            <v-tabs-window-item value="documents">
              <div class="info-section">
                <h3 class="section-title">Documents & Other Information</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Email Address:</span>
                      <span class="info-value">{{
                        selectedApplicant?.other_information?.email_address || selectedApplicant?.email || 'N/A'
                      }}</span>
                    </div>
                  </v-col>
                </v-row>
                
                <!-- Document Images -->
                <h4 class="subsection-title mt-4 mb-2">Uploaded Documents</h4>
                <v-row>
                  <!-- Signature -->
                  <v-col cols="12" md="4">
                    <div class="document-card">
                      <span class="document-label">Signature</span>
                      <div class="document-image-container">
                        <!-- Loading State -->
                        <div v-if="loadingDocuments" class="document-loading">
                          <v-progress-circular
                            indeterminate
                            color="primary"
                            size="32"
                          ></v-progress-circular>
                          <span class="loading-text">Loading...</span>
                        </div>
                        <!-- Image Loaded -->
                        <img 
                          v-else-if="applicantDocuments.signature" 
                          :src="applicantDocuments.signature" 
                          alt="Signature"
                          class="document-image"
                          @error="handleDocumentError('signature')"
                          @click="openDocumentPreview(applicantDocuments.signature, 'Signature')"
                        />
                        <!-- No Document -->
                        <div v-else class="no-document">
                          <v-icon size="48" color="grey">mdi-file-document-outline</v-icon>
                          <span>No signature uploaded</span>
                        </div>
                      </div>
                    </div>
                  </v-col>
                  
                  <!-- House Location Sketch -->
                  <v-col cols="12" md="4">
                    <div class="document-card">
                      <span class="document-label">House Location Sketch</span>
                      <div class="document-image-container">
                        <!-- Loading State -->
                        <div v-if="loadingDocuments" class="document-loading">
                          <v-progress-circular
                            indeterminate
                            color="primary"
                            size="32"
                          ></v-progress-circular>
                          <span class="loading-text">Loading...</span>
                        </div>
                        <!-- Image Loaded -->
                        <img 
                          v-else-if="applicantDocuments.house_location" 
                          :src="applicantDocuments.house_location" 
                          alt="House Location"
                          class="document-image"
                          @error="handleDocumentError('house_location')"
                          @click="openDocumentPreview(applicantDocuments.house_location, 'House Location Sketch')"
                        />
                        <!-- No Document -->
                        <div v-else class="no-document">
                          <v-icon size="48" color="grey">mdi-map-outline</v-icon>
                          <span>No house sketch uploaded</span>
                        </div>
                      </div>
                    </div>
                  </v-col>
                  
                  <!-- Valid ID -->
                  <v-col cols="12" md="4">
                    <div class="document-card">
                      <span class="document-label">Valid ID</span>
                      <div class="document-image-container">
                        <!-- Loading State -->
                        <div v-if="loadingDocuments" class="document-loading">
                          <v-progress-circular
                            indeterminate
                            color="primary"
                            size="32"
                          ></v-progress-circular>
                          <span class="loading-text">Loading...</span>
                        </div>
                        <!-- Image Loaded -->
                        <img 
                          v-else-if="applicantDocuments.valid_id" 
                          :src="applicantDocuments.valid_id" 
                          alt="Valid ID"
                          class="document-image"
                          @error="handleDocumentError('valid_id')"
                          @click="openDocumentPreview(applicantDocuments.valid_id, 'Valid ID')"
                        />
                        <!-- No Document -->
                        <div v-else class="no-document">
                          <v-icon size="48" color="grey">mdi-card-account-details-outline</v-icon>
                          <span>No valid ID uploaded</span>
                        </div>
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>

        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showInfoDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmation Dialog - Enhanced Design -->
    <v-dialog v-model="showConfirmDialog" max-width="420" persistent>
      <v-card class="confirm-dialog-card" rounded="lg">
        <!-- Header with Icon -->
        <div class="confirm-dialog-header" :class="confirmAction === 'accept' ? 'accept-header' : 'decline-header'">
          <button class="close-dialog-btn" @click="showConfirmDialog = false" :aria-label="'Close dialog'">
            <v-icon color="white" size="20">mdi-close</v-icon>
          </button>
        </div>

        <!-- Content -->
        <v-card-text class="confirm-dialog-content text-center pt-8 pb-4">
          <h3 class="confirm-dialog-title mb-3">
            {{ confirmAction === "accept" ? "Accept Applicant" : "Decline Applicant" }}
          </h3>
          <p class="confirm-dialog-message">
            Are you sure you want to {{ confirmAction }}
            <strong class="applicant-name">{{ selectedApplicant?.fullName }}</strong>?
          </p>
          <p v-if="confirmAction === 'accept'" class="confirm-dialog-note mt-3">
            <v-icon size="16" color="success" class="mr-1">mdi-information</v-icon>
            Login credentials will be generated and sent to the applicant's email.
          </p>
          <p v-else class="confirm-dialog-note mt-3">
            <v-icon size="16" color="warning" class="mr-1">mdi-alert</v-icon>
            You will need to provide a reason for declining this application.
          </p>
        </v-card-text>

        <!-- Actions -->
        <v-card-actions class="confirm-dialog-actions pa-4">
          <v-spacer></v-spacer>
          <v-btn
            :color="confirmAction === 'accept' ? 'primary' : 'error'"
            variant="flat"
            class="confirm-btn action-btn"
            @click="confirmActionHandler"
          >
            {{ confirmAction === "accept" ? "ACCEPT" : "DECLINE" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script src="./ApplicantsTable.js"></script>
<style scoped src="./ApplicantsTable.css"></style>
