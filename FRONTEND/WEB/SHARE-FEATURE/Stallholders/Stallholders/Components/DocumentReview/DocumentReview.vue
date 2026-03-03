<template>
  <div class="document-review-container">
    <!-- Header Section -->
    <div class="review-header">
      <div class="header-content">
        <h2 class="header-title">
          <v-icon class="mr-2" color="primary">mdi-file-document-check</v-icon>
          Document Review
        </h2>
        <p class="header-subtitle">
          Review and approve documents uploaded by stallholders
        </p>
      </div>
      
      <!-- Statistics Cards -->
      <div class="stats-row">
        <div class="stat-card pending" @click="setFilter('pending')">
          <div class="stat-icon">
            <v-icon color="warning">mdi-clock-outline</v-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ counts.pending_count }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card approved" @click="setFilter('approved')">
          <div class="stat-icon">
            <v-icon color="success">mdi-check-circle</v-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ counts.approved_count }}</span>
            <span class="stat-label">Approved</span>
          </div>
        </div>
        <div class="stat-card rejected" @click="setFilter('rejected')">
          <div class="stat-icon">
            <v-icon color="error">mdi-close-circle</v-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ counts.rejected_count }}</span>
            <span class="stat-label">Rejected</span>
          </div>
        </div>
        <div class="stat-card total" @click="setFilter('all')">
          <div class="stat-icon">
            <v-icon color="primary">mdi-file-multiple</v-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ counts.total }}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & Search Section -->
    <div class="filter-section">
      <div class="filter-row">
        <v-btn-toggle v-model="activeFilter" mandatory color="primary" class="filter-toggle">
          <v-btn value="all" variant="outlined">All</v-btn>
          <v-btn value="pending" variant="outlined">
            <v-icon start>mdi-clock-outline</v-icon>
            Pending
            <v-badge v-if="counts.pending_count > 0" :content="counts.pending_count" color="warning" inline class="ml-1"></v-badge>
          </v-btn>
          <v-btn value="approved" variant="outlined">
            <v-icon start>mdi-check-circle</v-icon>
            Approved
          </v-btn>
          <v-btn value="rejected" variant="outlined">
            <v-icon start>mdi-close-circle</v-icon>
            Rejected
          </v-btn>
        </v-btn-toggle>

        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="Search stallholder or document..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="search-input"
        ></v-text-field>

        <v-btn 
          color="primary" 
          variant="outlined" 
          @click="refreshData"
          :loading="loading"
        >
          <v-icon>mdi-refresh</v-icon>
          Refresh
        </v-btn>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="loading-text">Loading document submissions...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredSubmissions.length === 0" class="empty-state">
      <v-icon size="80" color="grey-lighten-1">mdi-file-document-outline</v-icon>
      <h3>No Documents Found</h3>
      <p v-if="activeFilter === 'pending'">
        No pending documents to review. All caught up!
      </p>
      <p v-else>
        No documents match your current filter.
      </p>
    </div>

    <!-- Documents Grid -->
    <div v-else class="documents-grid">
      <v-card
        v-for="submission in filteredSubmissions"
        :key="submission.submission_id"
        class="document-card"
        :class="{ 'pending-card': submission.status === 'pending' }"
        elevation="2"
        @click="openDocumentPreview(submission)"
      >
        <div class="card-header">
          <v-chip
            :color="getStatusColor(submission.status)"
            size="small"
            variant="flat"
          >
            {{ submission.status.toUpperCase() }}
          </v-chip>
          <span class="upload-date">{{ formatDate(submission.uploaded_at) }}</span>
        </div>

        <div class="card-body">
          <div class="document-icon">
            <v-icon :color="getFileTypeColor(submission.file_type)" size="40">
              {{ getFileTypeIcon(submission.file_type) }}
            </v-icon>
          </div>
          
          <div class="document-info">
            <h4 class="document-name">{{ submission.document_name }}</h4>
            <p class="file-name">{{ submission.file_name }}</p>
            <p class="file-size">{{ formatFileSize(submission.file_size) }}</p>
          </div>
        </div>

        <v-divider></v-divider>

        <div class="stallholder-info">
          <v-avatar size="32" color="primary" class="mr-2">
            <span class="text-white text-body-2">{{ getInitials(submission.stallholder_name) }}</span>
          </v-avatar>
          <div class="stallholder-details">
            <span class="stallholder-name">{{ submission.stallholder_name }}</span>
            <span class="business-name">{{ submission.business_name }}</span>
          </div>
          <div class="stall-info" v-if="submission.stall_no">
            <v-chip size="x-small" color="grey" variant="outlined">
              {{ submission.stall_no }}
            </v-chip>
          </div>
        </div>

        <!-- Quick Actions for Pending Documents -->
        <div v-if="submission.status === 'pending'" class="card-actions" @click.stop>
          <v-btn
            color="success"
            variant="flat"
            size="small"
            @click="approveDocument(submission)"
            :loading="processingId === submission.submission_id"
          >
            <v-icon start>mdi-check</v-icon>
            Approve
          </v-btn>
          <v-btn
            color="error"
            variant="outlined"
            size="small"
            @click="openRejectDialog(submission)"
          >
            <v-icon start>mdi-close</v-icon>
            Reject
          </v-btn>
        </div>

        <!-- Review Info for Processed Documents -->
        <div v-else-if="submission.reviewed_by_name" class="review-info">
          <v-icon size="small" class="mr-1">mdi-account-check</v-icon>
          <span>Reviewed by {{ submission.reviewed_by_name }}</span>
          <span class="review-date">{{ formatDate(submission.reviewed_at) }}</span>
        </div>

        <!-- Rejection Reason -->
        <div v-if="submission.status === 'rejected' && submission.rejection_reason" class="rejection-reason">
          <v-icon size="small" color="error" class="mr-1">mdi-alert-circle</v-icon>
          <span>{{ submission.rejection_reason }}</span>
        </div>
      </v-card>
    </div>

    <!-- Document Preview Dialog -->
    <v-dialog v-model="showPreviewDialog" max-width="900" scrollable>
      <v-card v-if="selectedDocument">
        <v-card-title class="d-flex justify-space-between align-center bg-primary text-white pa-4">
          <span>
            <v-icon class="mr-2">mdi-file-document</v-icon>
            {{ selectedDocument.document_name }}
          </span>
          <v-btn icon variant="text" color="white" @click="showPreviewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-0">
          <div class="preview-container">
            <!-- Image Preview -->
            <div v-if="isImageFile(selectedDocument.file_type)" class="image-preview">
              <img 
                :src="documentPreviewUrl" 
                :alt="selectedDocument.file_name"
                @error="previewError = true"
              />
              <div v-if="previewError" class="preview-error">
                <v-icon size="64" color="grey">mdi-image-off</v-icon>
                <p>Unable to load image preview</p>
              </div>
            </div>

            <!-- PDF Preview -->
            <div v-else-if="isPdfFile(selectedDocument.file_type)" class="pdf-preview">
              <iframe 
                :src="documentPreviewUrl" 
                width="100%" 
                height="500"
                frameborder="0"
              ></iframe>
            </div>

            <!-- Generic File -->
            <div v-else class="generic-preview">
              <v-icon size="80" color="grey">mdi-file-document-outline</v-icon>
              <p>Preview not available for this file type</p>
              <v-btn color="primary" @click="downloadDocument">
                <v-icon start>mdi-download</v-icon>
                Download File
              </v-btn>
            </div>
          </div>

          <!-- Document Details -->
          <div class="document-details pa-4">
            <v-row>
              <v-col cols="12" md="6">
                <h4 class="mb-2">Document Information</h4>
                <div class="detail-row">
                  <span class="label">Document Type:</span>
                  <span class="value">{{ selectedDocument.document_name }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">File Name:</span>
                  <span class="value">{{ selectedDocument.file_name }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">File Size:</span>
                  <span class="value">{{ formatFileSize(selectedDocument.file_size) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Uploaded:</span>
                  <span class="value">{{ formatDateTime(selectedDocument.uploaded_at) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <v-chip :color="getStatusColor(selectedDocument.status)" size="small">
                    {{ selectedDocument.status.toUpperCase() }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <h4 class="mb-2">Stallholder Information</h4>
                <div class="detail-row">
                  <span class="label">Name:</span>
                  <span class="value">{{ selectedDocument.stallholder_name }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Business:</span>
                  <span class="value">{{ selectedDocument.business_name }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Stall:</span>
                  <span class="value">{{ selectedDocument.stall_no || 'N/A' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Contact:</span>
                  <span class="value">{{ selectedDocument.stallholder_phone }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Email:</span>
                  <span class="value">{{ selectedDocument.stallholder_email }}</span>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4" v-if="selectedDocument.status === 'pending'">
          <v-spacer></v-spacer>
          <v-btn 
            color="error" 
            variant="outlined"
            @click="openRejectDialog(selectedDocument)"
          >
            <v-icon start>mdi-close</v-icon>
            Reject
          </v-btn>
          <v-btn 
            color="success" 
            variant="flat"
            @click="approveDocument(selectedDocument)"
            :loading="processingId === selectedDocument.submission_id"
          >
            <v-icon start>mdi-check</v-icon>
            Approve Document
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Dialog -->
    <v-dialog v-model="showRejectDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-error text-white">
          <v-icon class="mr-2">mdi-file-document-remove</v-icon>
          Reject Document
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-4">
            Please provide a reason for rejecting this document. This will be visible to the stallholder.
          </p>
          <v-textarea
            v-model="rejectionReason"
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
          <v-btn variant="text" @click="showRejectDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            variant="flat"
            @click="rejectDocument"
            :disabled="!rejectionReason"
            :loading="processingId === documentToReject?.submission_id"
          >
            Confirm Rejection
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script src="./DocumentReview.js"></script>
<style scoped src="./DocumentReview.css"></style>
