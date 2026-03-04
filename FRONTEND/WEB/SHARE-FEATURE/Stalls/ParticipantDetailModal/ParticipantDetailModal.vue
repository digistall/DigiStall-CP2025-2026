<template>
  <v-dialog v-model="show" max-width="900px" persistent scrollable>
    <v-card class="participant-detail-modal">
      <!-- Header -->
      <div class="detail-header">
        <div class="header-content">
          <div class="header-info">
            <div class="header-icon">
              <v-icon size="32" color="white">mdi-account-details</v-icon>
            </div>
            <div class="header-text">
              <h2 class="header-title">Participant Information</h2>
              <p class="header-subtitle" v-if="detail">{{ detail.personalInfo.fullName }}</p>
            </div>
          </div>
          <v-btn icon size="large" color="white" variant="text" @click="handleClose" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <v-progress-circular indeterminate size="48" color="primary" :width="4"></v-progress-circular>
        <p class="loading-text">Loading participant details...</p>
      </div>

      <!-- Error -->
      <v-alert v-if="error && !loading" type="error" variant="tonal" class="mx-4 my-3">
        {{ error }}
      </v-alert>

      <!-- Content -->
      <v-card-text v-if="detail && !loading" class="detail-content pa-0">
        <!-- Personal Information -->
        <div class="detail-section">
          <div class="section-header">
            <v-icon color="primary" size="20">mdi-account</v-icon>
            <span class="section-title">Personal Information</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Full Name</span>
                <span class="info-value">{{ detail.personalInfo.fullName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">{{ detail.personalInfo.email || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Contact Number</span>
                <span class="info-value">{{ detail.personalInfo.contactNumber }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Address</span>
                <span class="info-value">{{ detail.personalInfo.address }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Birthdate</span>
                <span class="info-value">{{ formatDate(detail.personalInfo.birthdate) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Civil Status</span>
                <span class="info-value">{{ detail.personalInfo.civilStatus }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Educational Attainment</span>
                <span class="info-value">{{ detail.personalInfo.educationalAttainment }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Application Status</span>
                <v-chip :color="getStatusColor(detail.personalInfo.status)" size="small" variant="flat">
                  {{ capitalize(detail.personalInfo.status) }}
                </v-chip>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Stalls -->
        <div class="detail-section" v-if="detail.stallCount > 0">
          <div class="section-header">
            <v-icon color="primary" size="20">mdi-store</v-icon>
            <span class="section-title">Active Stalls ({{ detail.stallCount }})</span>
          </div>
          <div class="section-body">
            <div class="stalls-chips">
              <v-chip 
                v-for="stall in detail.activeStalls" 
                :key="stall.stallId"
                color="primary" 
                variant="outlined" 
                size="small"
                class="mr-2 mb-1"
              >
                <v-icon start size="small">mdi-store</v-icon>
                {{ stall.stallNumber }} - {{ stall.branchName }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Spouse Information -->
        <div class="detail-section" v-if="detail.spouseInfo">
          <div class="section-header">
            <v-icon color="primary" size="20">mdi-account-heart</v-icon>
            <span class="section-title">Spouse Information</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Full Name</span>
                <span class="info-value">{{ detail.spouseInfo.fullName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Birthdate</span>
                <span class="info-value">{{ formatDate(detail.spouseInfo.birthdate) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Educational Attainment</span>
                <span class="info-value">{{ detail.spouseInfo.educationalAttainment }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Contact Number</span>
                <span class="info-value">{{ detail.spouseInfo.contactNumber }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Occupation</span>
                <span class="info-value">{{ detail.spouseInfo.occupation }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Business Information -->
        <div class="detail-section" v-if="detail.businessInfo">
          <div class="section-header">
            <v-icon color="primary" size="20">mdi-briefcase</v-icon>
            <span class="section-title">Business Information</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nature of Business</span>
                <span class="info-value">{{ detail.businessInfo.natureOfBusiness }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Capitalization</span>
                <span class="info-value">{{ detail.businessInfo.capitalization ? '₱' + formatPrice(detail.businessInfo.capitalization) : 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Source of Capital</span>
                <span class="info-value">{{ detail.businessInfo.sourceOfCapital }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Previous Experience</span>
                <span class="info-value">{{ detail.businessInfo.previousExperience }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Relative as Stall Owner</span>
                <span class="info-value">{{ detail.businessInfo.relativeStallOwner }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Documents & Files (Uploaded Documents with inline preview) -->
        <div class="detail-section" v-if="detail.documents && detail.documents.length > 0">
          <div class="section-header">
            <v-icon color="primary" size="20">mdi-file-document</v-icon>
            <span class="section-title">Uploaded Documents</span>
          </div>
          <div class="section-body">
            <div class="documents-preview-grid">
              <div 
                v-for="doc in detail.documents" 
                :key="doc.documentId" 
                class="document-preview-card"
              >
                <div class="doc-preview-title">{{ getDocLabel(doc.type) }}</div>
                <div class="doc-preview-image-container" @click="viewUploadedDocument(doc)">
                  <img 
                    v-if="documentImages[doc.documentId]"
                    :src="documentImages[doc.documentId]"
                    :alt="doc.type || doc.name"
                    class="doc-preview-thumbnail"
                  />
                  <div v-else-if="documentLoadingStates[doc.documentId]" class="doc-preview-loading">
                    <v-progress-circular indeterminate size="24" color="primary" :width="2"></v-progress-circular>
                  </div>
                  <div v-else class="doc-preview-placeholder">
                    <v-icon color="grey-lighten-1" size="40">{{ getDocIcon(doc.type) }}</v-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Other info files (fallback if no applicant_documents exist) -->
        <div class="detail-section" v-if="detail.otherInfo">
          <div class="section-header">
            <v-icon color="primary" size="20">mdi-file-document</v-icon>
            <span class="section-title">Uploaded Documents</span>
          </div>
          <div class="section-body">
            <div class="documents-preview-grid">
              <div v-if="detail.otherInfo.signature" class="document-preview-card">
                <div class="doc-preview-title">SIGNATURE</div>
                <div class="doc-preview-image-container" @click="!otherInfoImageFailed.signature && viewDocument(detail.otherInfo.signature, 'Signature')">
                  <img 
                    v-if="!otherInfoImageFailed.signature"
                    :src="getStaticFileUrl(detail.otherInfo.signature)"
                    alt="Signature"
                    class="doc-preview-thumbnail"
                    @error="handleOtherInfoImageError('signature')"
                  />
                  <div v-else class="doc-preview-placeholder">
                    <v-icon color="grey-lighten-1" size="40">mdi-draw</v-icon>
                    <span class="doc-unavailable-text">File not available</span>
                  </div>
                </div>
              </div>
              <div v-if="detail.otherInfo.houseSketch" class="document-preview-card">
                <div class="doc-preview-title">HOUSE LOCATION SKETCH</div>
                <div class="doc-preview-image-container" @click="!otherInfoImageFailed.houseSketch && viewDocument(detail.otherInfo.houseSketch, 'House Location Sketch')">
                  <img 
                    v-if="!otherInfoImageFailed.houseSketch"
                    :src="getStaticFileUrl(detail.otherInfo.houseSketch)"
                    alt="House Location Sketch"
                    class="doc-preview-thumbnail"
                    @error="handleOtherInfoImageError('houseSketch')"
                  />
                  <div v-else class="doc-preview-placeholder">
                    <v-icon color="grey-lighten-1" size="40">mdi-home-map-marker</v-icon>
                    <span class="doc-unavailable-text">File not available</span>
                  </div>
                </div>
              </div>
              <div v-if="detail.otherInfo.validId" class="document-preview-card">
                <div class="doc-preview-title">VALID ID</div>
                <div class="doc-preview-image-container" @click="!otherInfoImageFailed.validId && viewDocument(detail.otherInfo.validId, 'Valid ID')">
                  <img 
                    v-if="!otherInfoImageFailed.validId"
                    :src="getStaticFileUrl(detail.otherInfo.validId)"
                    alt="Valid ID"
                    class="doc-preview-thumbnail"
                    @error="handleOtherInfoImageError('validId')"
                  />
                  <div v-else class="doc-preview-placeholder">
                    <v-icon color="grey-lighten-1" size="40">mdi-card-account-details</v-icon>
                    <span class="doc-unavailable-text">File not available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No documents at all -->
        <div class="detail-section" v-if="!detail.otherInfo && (!detail.documents || detail.documents.length === 0)">
          <div class="section-header">
            <v-icon color="primary" size="20">mdi-file-document</v-icon>
            <span class="section-title">Documents & Files</span>
          </div>
          <div class="section-body">
            <div class="no-documents">
              <v-icon color="grey-lighten-2" size="40">mdi-file-document-outline</v-icon>
              <span>No documents available</span>
            </div>
          </div>
        </div>

        <!-- No additional info message -->
        <div v-if="!detail.spouseInfo && !detail.businessInfo && !detail.otherInfo && (!detail.documents || detail.documents.length === 0)" class="detail-section">
          <div class="section-body text-center py-4">
            <v-icon color="grey-lighten-2" size="48">mdi-information-outline</v-icon>
            <p class="text-grey mt-2">No additional information available for this participant.</p>
          </div>
        </div>
      </v-card-text>

      <!-- Document Viewer Dialog -->
      <v-dialog v-model="showDocViewer" max-width="700px">
        <v-card>
          <v-card-title class="d-flex align-center pa-4" style="background-color: #002181; color: white;">
            <v-icon color="white" class="mr-2">mdi-file-eye</v-icon>
            {{ docViewerTitle }}
            <v-spacer></v-spacer>
            <v-btn icon variant="text" color="white" @click="closeDocViewer">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="pa-4 text-center">
            <!-- Loading state -->
            <div v-if="docViewerLoading" class="d-flex flex-column align-center justify-center pa-8">
              <v-progress-circular indeterminate size="48" color="primary" :width="4"></v-progress-circular>
              <p class="text-grey mt-3">Loading document...</p>
            </div>
            <!-- Error state -->
            <div v-else-if="docViewerError" class="d-flex flex-column align-center justify-center pa-8">
              <v-icon size="64" color="grey-lighten-2">mdi-image-broken</v-icon>
              <p class="text-grey mt-2">Unable to load document</p>
            </div>
            <!-- Image preview -->
            <v-img 
              v-else-if="docViewerUrl" 
              :src="docViewerUrl" 
              max-height="500" 
              contain
              class="doc-preview-img"
            >
              <template v-slot:error>
                <div class="d-flex flex-column align-center justify-center pa-8">
                  <v-icon size="64" color="grey-lighten-2">mdi-image-broken</v-icon>
                  <p class="text-grey mt-2">Unable to load document</p>
                </div>
              </template>
            </v-img>
            <div v-else class="pa-8">
              <v-icon size="64" color="grey-lighten-2">mdi-file-question</v-icon>
              <p class="text-grey mt-2">Document not available</p>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
</template>

<script src="./ParticipantDetailModal.js"></script>
<style src="./ParticipantDetailModal.css" scoped></style>
