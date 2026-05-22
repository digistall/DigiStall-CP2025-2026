<template>
  <div class="penalty-payments">
    <div class="search-filter-section mb-6">
      <div class="search-wrapper">
        <div class="search-input-wrapper">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search by ID, name, reference number..."
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            class="search-field"
          ></v-text-field>
        </div>
      </div>
    </div>

    <!-- Payments Table -->
    <div class="payments-table-container">
      <v-card class="payments-card" elevation="0">
        <div class="table-wrapper">
          <table class="payments-table">
            <thead>
              <tr>
                <th class="name-header">Stallholder Name</th>
                <th>Violation</th>
                <th>Offense #</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Collected By</th>
                <th>Reference No.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="empty-state">
                  <v-progress-circular indeterminate color="primary" size="48" />
                  <p>Loading penalty payments...</p>
                </td>
              </tr>
              <tr v-else-if="error">
                <td colspan="8" class="empty-state">
                  <v-icon size="48" color="error">mdi-alert-circle-outline</v-icon>
                  <p>{{ error }}</p>
                  <v-btn color="primary" size="small" @click="fetchPenaltyPayments"
                    >Try Again</v-btn
                  >
                </td>
              </tr>
              <tr v-else-if="filteredPayments.length === 0">
                <td colspan="8" class="empty-state">
                  <v-icon size="48" color="grey">mdi-cash-remove</v-icon>
                  <p>No penalty payments recorded</p>
                </td>
              </tr>
              <tr
                v-for="payment in filteredPayments"
                :key="payment.penaltyPaymentId"
                class="clickable-row"
                @click="viewPayment(payment)"
              >
                <td class="name-cell">
                  <div class="stallholder-info">
                    <img 
                      v-if="payment.stallholderId"
                      :src="getAvatarUrl(payment.stallholderId) + '?t=' + avatarBuster"
                      @error="handleAvatarError"
                      class="avatar-img"
                      alt="Avatar"
                    />
                    <div class="avatar avatar-initials" :style="{ display: payment.stallholderId ? 'none' : 'flex' }">
                      {{ getInitials(payment.stallholderName || 'N/A') }}
                    </div>
                    <div class="name-details">
                      <span class="clickable-name name" @click.stop="showStallholderDetails(payment.stallholderId)">{{ payment.stallholderName || 'N/A' }}</span>
                      <span v-if="payment.branchName" class="branch-name">{{
                        payment.branchName
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="violation-cell">
                  <div class="violation-info">
                    <span class="violation-type">{{ payment.violationType || 'N/A' }}</span>
                    <span v-if="payment.ordinanceNo" class="ordinance-no">{{
                      payment.ordinanceNo
                    }}</span>
                  </div>
                </td>
                <td class="offense-cell">
                  <v-chip color="warning" variant="flat" size="small">
                    #{{ payment.offenseNo || 1 }}
                  </v-chip>
                </td>
                <td class="amount-cell">{{ formatAmount(payment.amount) }}</td>
                <td class="date-cell">{{ formatDate(payment.paymentDate) }}</td>
                <td class="collector-cell">{{ payment.collectedBy || '-' }}</td>
                <td class="receipt-cell">{{ payment.referenceNumber || '-' }}</td>
                <td class="status-cell">
                  <v-chip
                    :color="getStatusColor(payment.paymentStatus)"
                    variant="flat"
                    size="small"
                  >
                    {{ payment.paymentStatus || 'completed' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>
    </div>

    <!-- View Payment Modal -->
    <v-dialog v-model="showViewModal" max-width="600px">
      <v-card>
        <v-card-title class="modal-header">
          <span class="modal-title">Penalty Payment Details</span>
          <v-btn icon variant="text" @click="showViewModal = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <div v-if="selectedPayment" class="payment-details">
            <div class="detail-group">
              <div class="detail-item">
                <span class="detail-label">Payment ID:</span>
                <span class="detail-value">{{ selectedPayment.penaltyPaymentId }}</span>
              </div>
              <div class="detail-item" style="align-items: center; display: flex; gap: 12px; flex-direction: row;">
                <span class="detail-label" style="width: 140px; margin-bottom: 0;">Stallholder Name:</span>
                <div class="d-flex align-center">
                  <img 
                    v-if="selectedPayment.stallholderId"
                    :src="getAvatarUrl(selectedPayment.stallholderId) + '?t=' + avatarBuster"
                    @error="handleAvatarError"
                    class="avatar-img mr-2"
                    alt="Avatar"
                    style="width: 32px; height: 32px;"
                  />
                  <div class="avatar avatar-initials mr-2" :style="{ display: selectedPayment.stallholderId ? 'none' : 'flex', width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }">
                    {{ getInitials(selectedPayment.stallholderName) }}
                  </div>
                  <span class="clickable-name detail-value" style="margin-left: 0;" @click="showStallholderDetails(selectedPayment.stallholderId)">{{ selectedPayment.stallholderName }}</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-label">Violation Type:</span>
                <span class="detail-value">{{ selectedPayment.violationType }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Offense #:</span>
                <span class="detail-value">#{{ selectedPayment.offenseNo || 1 }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount">{{ formatAmount(selectedPayment.amount) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">{{ formatDate(selectedPayment.paymentDate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Payment Time:</span>
                <span class="detail-value">{{ formatTime(selectedPayment.paymentTime) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Collected By:</span>
                <span class="detail-value">{{ selectedPayment.collectedBy }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Reference Number:</span>
                <span class="detail-value">{{ selectedPayment.referenceNumber }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status:</span>
                <v-chip
                  :color="getStatusColor(selectedPayment.paymentStatus)"
                  variant="flat"
                  size="small"
                >
                  {{ selectedPayment.paymentStatus || 'completed' }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Stallholder Details Popup Modal (Premium Glassmorphic Design) -->
    <v-dialog v-model="showStallholderModal" max-width="550px">
      <v-card class="stallholder-detail-modal">
        <v-card-title class="modal-header d-flex justify-space-between align-center">
          <span class="modal-title">Stallholder Information</span>
          <v-btn icon variant="text" @click="showStallholderModal = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6 modal-body-glass">
          <div v-if="loadingStallholderDetails" class="text-center py-8">
            <v-progress-circular indeterminate color="#002181" size="50"></v-progress-circular>
            <p class="mt-4 text-muted font-weight-medium">Fetching details securely...</p>
          </div>
          
          <div v-else-if="!stallholderDetails" class="text-center py-8">
            <v-icon size="60" color="error">mdi-alert-circle-outline</v-icon>
            <p class="mt-4 text-error font-weight-bold">Failed to load stallholder profile.</p>
          </div>
          
          <div v-else class="stallholder-profile-container text-center">
            <!-- Header Section with Large Profile Pic -->
            <div class="profile-header-wrap mb-6">
              <div class="avatar-container-lg mx-auto mb-4" @click="openZoomModal" title="Click to zoom">
                <img 
                  v-if="stallholderDetails.stallholder_id || stallholderDetails.id"
                  :src="getAvatarUrl(stallholderDetails.stallholder_id || stallholderDetails.id) + '?t=' + avatarBuster"
                  @error="handleAvatarError"
                  class="profile-avatar-lg"
                  alt="Profile Avatar"
                />
                <div class="profile-avatar-lg avatar-initials d-flex align-center justify-center text-h3 font-weight-bold text-white bg-primary">
                  {{ getInitials(stallholderDetails.full_name || stallholderDetails.stallholder_name || 'N/A') }}
                </div>
              </div>
              <h2 class="profile-fullname">{{ stallholderDetails.full_name || stallholderDetails.stallholder_name || 'N/A' }}</h2>
              <p class="profile-business-name mb-0" v-if="stallholderDetails.business_name">
                <v-icon size="16" class="mr-1">mdi-storefront</v-icon>
                {{ stallholderDetails.business_name }}
              </p>
            </div>
            
            <!-- Details Grid -->
            <div class="profile-info-grid">
              <div class="profile-info-item">
                <span class="info-label"><v-icon size="16" class="mr-2">mdi-store</v-icon>Stall Info</span>
                <span class="info-value text-right">
                  Stall #{{ stallholderDetails.stall_number || stallholderDetails.stall_no || 'N/A' }}
                  <span class="text-caption text-muted" v-if="stallholderDetails.branch_name">({{ stallholderDetails.branch_name }})</span>
                </span>
              </div>
              
              <div class="profile-info-item">
                <span class="info-label"><v-icon size="16" class="mr-2">mdi-email</v-icon>Email</span>
                <span class="info-value text-right">{{ stallholderDetails.email || 'N/A' }}</span>
              </div>
              
              <div class="profile-info-item">
                <span class="info-label"><v-icon size="16" class="mr-2">mdi-phone</v-icon>Contact Number</span>
                <span class="info-value text-right">{{ stallholderDetails.contact_number || stallholderDetails.stallholder_contact || 'N/A' }}</span>
              </div>
              
              <div class="profile-info-item">
                <span class="info-label"><v-icon size="16" class="mr-2">mdi-map-marker</v-icon>Address</span>
                <span class="info-value text-right text-truncate-custom" :title="stallholderDetails.address || stallholderDetails.stallholder_address">{{ stallholderDetails.address || stallholderDetails.stallholder_address || 'N/A' }}</span>
              </div>
              
              <div class="profile-info-item">
                <span class="info-label"><v-icon size="16" class="mr-2">mdi-calendar-range</v-icon>Move-In Date</span>
                <span class="info-value text-right">{{ formatDate(stallholderDetails.move_in_date || stallholderDetails.contract_start_date) }}</span>
              </div>
              
              <div class="profile-info-item" v-if="stallholderDetails.monthly_rent || stallholderDetails.rental_price">
                <span class="info-label"><v-icon size="16" class="mr-2">mdi-cash-multiple</v-icon>Monthly Rental</span>
                <span class="info-value text-right text-success font-weight-bold">{{ formatAmount(stallholderDetails.monthly_rent || stallholderDetails.rental_price) }}</span>
              </div>
              
              <div class="profile-info-item">
                <span class="info-label"><v-icon size="16" class="mr-2">mdi-shield-check</v-icon>Compliance Status</span>
                <v-chip 
                  :color="stallholderDetails.compliance_status === 'Compliant' ? 'success' : 'error'" 
                  variant="flat" 
                  size="small" 
                  class="ml-auto"
                >
                  {{ stallholderDetails.compliance_status || 'Compliant' }}
                </v-chip>
              </div>
              
              <div class="profile-info-item">
                <span class="info-label"><v-icon size="16" class="mr-2">mdi-file-document-outline</v-icon>Contract Status</span>
                <v-chip 
                  :color="stallholderDetails.status === 'Active' ? 'info' : 'warning'" 
                  variant="flat" 
                  size="small" 
                  class="ml-auto"
                >
                  {{ stallholderDetails.status || 'Active' }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Premium Glassmorphic Zoom Lightbox Dialog -->
    <v-dialog v-model="showZoomModal" max-width="800px" content-class="zoom-lightbox-dialog">
      <v-card class="zoom-lightbox-card">
        <v-card-title class="zoom-lightbox-header d-flex justify-space-between align-center">
          <span class="zoom-lightbox-title">Profile Photo Viewer</span>
          <div class="zoom-hud-percentage mr-4">
            <span class="hud-pill">{{ Math.round(zoomScale * 100) }}%</span>
          </div>
          <v-btn icon variant="text" @click="closeZoomModal" color="white">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="zoom-lightbox-body d-flex align-center justify-center overflow-hidden position-relative">
          <div 
            class="zoom-image-wrapper"
            @mousedown="startDrag"
            @mousemove="onDrag"
            @mouseup="endDrag"
            @mouseleave="endDrag"
            @wheel.prevent="onWheel"
          >
            <img 
              v-if="stallholderDetails"
              :src="getAvatarUrl(stallholderDetails.stallholder_id || stallholderDetails.id) + '?t=' + avatarBuster"
              :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`, cursor: isDragging ? 'grabbing' : 'grab' }"
              @error="handleAvatarError"
              class="zoomable-profile-img"
              alt="Enlarged Profile Avatar"
              draggable="false"
            />
          </div>
        </v-card-text>
        
        <v-card-actions class="zoom-lightbox-actions justify-center py-4">
          <v-btn icon color="white" class="control-btn" @click="zoomIn" title="Zoom In">
            <v-icon>mdi-magnify-plus</v-icon>
          </v-btn>
          <v-btn icon color="white" class="control-btn mx-3" @click="zoomOut" title="Zoom Out">
            <v-icon>mdi-magnify-minus</v-icon>
          </v-btn>
          <v-btn icon color="white" class="control-btn" @click="resetZoom" title="Reset Zoom">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script src="./PenaltyPayments.js"></script>
<style scoped src="./PenaltyPayments.css"></style>
