<template>
  <div class="online-payments">
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

    <!-- Payment Method Tabs -->
    <div class="payment-tabs">
      <div
        v-for="method in paymentMethods"
        :key="method.id"
        class="tab-item"
        :class="{ active: selectedMethod === method.id }"
        @click="selectedMethod = method.id"
      >
        <div class="tab-content">
          <div class="method-icon" :style="{ backgroundColor: method.color }">
            <v-icon color="white">{{ method.icon }}</v-icon>
          </div>
          <div class="tab-info">
            <span class="tab-label">{{ method.name }}</span>
            <span class="tab-count">{{ getMethodCount(method.id) }}</span>
          </div>
        </div>
      </div>
      <div
        class="tab-item"
        :class="{ active: selectedMethod === 'all' }"
        @click="selectedMethod = 'all'"
      >
        <div class="tab-content">
          <div class="method-icon" style="background-color: #002181">
            <v-icon color="white">mdi-view-grid</v-icon>
          </div>
          <div class="tab-info">
            <span class="tab-label">All</span>
            <span class="tab-count">{{ filteredPayments.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payments Table -->
    <div class="payments-table-container">
      <v-card class="payments-card" elevation="0">
        <div class="table-wrapper scrollable-table-wrapper">
          <table class="payments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th class="name-header">Stallholder Name</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Reference No.</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredPayments.length === 0">
                <td colspan="7" class="empty-state">
                  <v-icon size="48" color="grey">mdi-inbox</v-icon>
                  <p>No payments found</p>
                </td>
              </tr>
              <tr v-for="payment in filteredPayments" :key="payment.id" class="clickable-row">
                <td class="id-cell" @click="viewPaymentDetails(payment)">{{ payment.id }}</td>
                <td class="name-cell" @click="viewPaymentDetails(payment)">
                  <div class="stallholder-info">
                    <img 
                      v-if="payment.stallholderId"
                      :src="getAvatarUrl(payment.stallholderId) + '?t=' + avatarBuster"
                      @error="handleAvatarError"
                      class="avatar-img"
                      alt="Avatar"
                    />
                    <div class="avatar avatar-initials" :style="{ display: payment.stallholderId ? 'none' : 'flex' }">{{ getInitials(payment.stallholderName || 'N/A') }}</div>
                    <div class="name-details">
                      <span class="clickable-name name" @click.stop="showStallholderDetails(payment.stallholderId)">{{ payment.stallholderName || 'Unknown' }}</span>
                      <span class="stall-no">Stall #{{ payment.stallNo || 'N/A' }}</span>
                    </div>
                  </div>
                </td>
                <td @click="viewPaymentDetails(payment)">
                  <v-chip :color="getMethodColor(payment.method)" variant="flat" size="small">
                    {{ payment.method }}
                  </v-chip>
                </td>
                <td class="amount-cell" @click="viewPaymentDetails(payment)">
                  {{ formatCurrency(payment.amount) }}
                </td>
                <td class="reference-cell" @click="viewPaymentDetails(payment)">
                  {{ payment.referenceNo }}
                </td>
                <td class="date-cell" @click="viewPaymentDetails(payment)">
                  {{ formatDate(payment.paymentDate || payment.date || payment.payment_date) }}
                </td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button
                      class="table-action-btn accept-btn"
                      @click.stop="acceptPayment(payment)"
                    >
                      ACCEPT
                    </button>
                    <button
                      class="table-action-btn decline-btn"
                      @click.stop="declinePayment(payment)"
                    >
                      DECLINE
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>
    </div>

    <!-- Payment Details Modal -->
    <v-dialog v-model="showDetailsModal" max-width="900px">
      <v-card>
        <v-card-title class="modal-header">
          <span class="modal-title">Payment Details</span>
          <v-btn icon variant="text" @click="showDetailsModal = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <div v-if="selectedPayment" class="payment-details">
            <v-row>
              <!-- Left Column: Payment Info -->
              <v-col cols="12" md="6">
                <div class="info-section">
                  <h4 class="section-subtitle">Payment Information</h4>
                  <div class="info-list">
                    <div class="info-item">
                      <span class="info-label">Payment ID:</span>
                      <span class="info-value">{{ selectedPayment.id }}</span>
                    </div>
                    <div class="info-item" style="align-items: center; display: flex; gap: 12px;">
                      <span class="info-label" style="width: auto;">Stallholder Name:</span>
                      <div class="d-flex align-center">
                        <img 
                          v-if="selectedPayment.stallholderId"
                          :src="getAvatarUrl(selectedPayment.stallholderId) + '?t=' + avatarBuster"
                          @error="handleAvatarError"
                          class="avatar-img mr-2"
                          alt="Avatar"
                          style="width: 32px; height: 32px;"
                        />
                        <div class="avatar avatar-initials mr-2" :style="{ display: selectedPayment.stallholderId ? 'none' : 'flex', width: '32px', height: '32px' }">
                          {{ getInitials(selectedPayment.stallholderName) }}
                        </div>
                        <span class="clickable-name info-value" @click="showStallholderDetails(selectedPayment.stallholderId)">{{ selectedPayment.stallholderName }}</span>
                      </div>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Stall Number:</span>
                      <span class="info-value">{{ selectedPayment.stallNo }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Payment Method:</span>
                      <v-chip
                        :color="getMethodColor(selectedPayment.method)"
                        variant="flat"
                        size="small"
                      >
                        {{ selectedPayment.method }}
                      </v-chip>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Amount:</span>
                      <span class="info-value amount-highlight">{{
                        formatCurrency(selectedPayment.amount)
                      }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Reference Number:</span>
                      <span class="info-value">{{ selectedPayment.referenceNo }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Payment Date:</span>
                      <span class="info-value">{{ formatDate(selectedPayment.date) }}</span>
                    </div>
                  </div>
                </div>
              </v-col>

              <!-- Right Column: Screenshot -->
              <v-col cols="12" md="6">
                <div class="screenshot-section">
                  <h4 class="section-subtitle">Payment Screenshot</h4>
                  <div class="screenshot-image">
                    <img :src="selectedPayment.screenshot" alt="Payment Screenshot" />
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Accept Payment Confirmation Dialog -->
    <v-dialog v-model="showAcceptDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="bg-success text-white">
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="white">mdi-check-circle</v-icon>
              <span>Accept Payment</span>
            </div>
            <v-btn icon variant="text" @click="cancelAcceptDialog" size="small" color="white">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text class="pt-4">
          <div v-if="pendingPayment" class="text-center py-4">
            <v-icon size="64" color="success" class="mb-3">mdi-cash-check</v-icon>
            <h3 class="mb-2">Confirm Payment Acceptance</h3>
            <p class="text-medium-emphasis mb-4">Are you sure you want to accept this payment?</p>
            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <div class="d-flex justify-space-between mb-2">
                  <span class="font-weight-medium">Payment ID:</span>
                  <span>#{{ pendingPayment.id }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="font-weight-medium">Stallholder:</span>
                  <span>{{ pendingPayment.stallholderName }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="font-weight-medium">Amount:</span>
                  <span class="text-success font-weight-bold">{{
                    formatCurrency(pendingPayment.amount)
                  }}</span>
                </div>
                <div class="d-flex justify-space-between">
                  <span class="font-weight-medium">Method:</span>
                  <v-chip :color="getMethodColor(pendingPayment.method)" size="small">{{
                    pendingPayment.method
                  }}</v-chip>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn color="success" variant="flat" @click="confirmAcceptPayment">
            <v-icon class="mr-2">mdi-check</v-icon>
            Accept Payment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Decline Payment Confirmation Dialog -->
    <v-dialog v-model="showDeclineDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="bg-error text-white">
          <div class="d-flex align-center justify-space-between w-100">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="white">mdi-close-circle</v-icon>
              <span>Decline Payment</span>
            </div>
            <v-btn icon variant="text" @click="cancelDeclineDialog" size="small" color="white">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text class="pt-4">
          <div v-if="pendingPayment" class="py-4">
            <div class="text-center mb-4">
              <v-icon size="64" color="error" class="mb-3">mdi-alert-circle</v-icon>
              <h3 class="mb-2">Confirm Payment Decline</h3>
              <p class="text-medium-emphasis">Are you sure you want to decline this payment?</p>
            </div>
            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <div class="d-flex justify-space-between mb-2">
                  <span class="font-weight-medium">Payment ID:</span>
                  <span>#{{ pendingPayment.id }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="font-weight-medium">Stallholder:</span>
                  <span>{{ pendingPayment.stallholderName }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="font-weight-medium">Amount:</span>
                  <span class="font-weight-bold">{{ formatCurrency(pendingPayment.amount) }}</span>
                </div>
              </v-card-text>
            </v-card>
            <v-textarea
              v-model="declineReason"
              label="Reason for Decline (Optional)"
              placeholder="Enter the reason for declining this payment..."
              variant="outlined"
              rows="3"
              counter="200"
              maxlength="200"
            ></v-textarea>
          </div>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn color="error" variant="flat" @click="confirmDeclinePayment">
            <v-icon class="mr-2">mdi-close</v-icon>
            Decline Payment
          </v-btn>
        </v-card-actions>
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
                <span class="info-value text-right text-success font-weight-bold">{{ formatCurrency(stallholderDetails.monthly_rent || stallholderDetails.rental_price) }}</span>
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

    <!-- Toast Notification -->
    <ToastNotification
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>

<script src="./OnlinePayments.js"></script>
<style scoped src="./OnlinePayments.css"></style>
