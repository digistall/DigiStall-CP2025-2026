<template>
  <div class="daily-payments">
    <div class="search-filter-section mb-6">
      <div class="search-wrapper">
        <div class="search-input-wrapper">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search by receipt ID, collector, vendor, reference..."
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
    <div class="stallholders-table">
      <v-card elevation="1" class="table-card">
        <!-- Custom Table Header -->
        <div class="table-header">
          <div class="header-row simplified-layout">
            <div class="header-cell reference-col">Reference No.</div>
            <div class="header-cell collector-col">Collector's Name</div>
            <div class="header-cell vendor-col">Vendor's Name</div>
            <div class="header-cell amount-col">Amount</div>
            <div class="header-cell date-col">Payment Date</div>
            <div class="header-cell status-col">Status</div>
          </div>
        </div>

        <!-- Table Body -->
        <div class="table-body scrollable-table-wrapper">
          <div
            v-for="payment in filteredPayments"
            :key="payment.receipt_id"
            class="table-row simplified-layout clickable-row"
            @click="viewPayment(payment)"
          >
            <div class="table-cell reference-col">{{ payment.reference_no || 'N/A' }}</div>
            <div class="table-cell collector-col">
              <div class="collector-info">
                <div class="avatar">
                  {{ (payment.collector_name || 'N/A').charAt(0) }}
                </div>
                <span class="name-text">{{ payment.collector_name || 'N/A' }}</span>
              </div>
            </div>
            <div class="table-cell vendor-col">
              <div class="vendor-info">
                <div class="avatar vendor-avatar avatar-initials d-flex">
                  {{ getInitials(payment.vendor_name || 'N/A') }}
                </div>
                <span class="name-text">{{ payment.vendor_name || 'N/A' }}</span>
              </div>
            </div>
            <div class="table-cell amount-col">{{ formatCurrency(payment.amount) }}</div>
            <div class="table-cell date-col">{{ formatDateTime(payment.time_date) }}</div>
            <div class="table-cell status-col">
              <v-chip :color="payment.statusColor" variant="flat" size="small">
                {{ payment.status }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredPayments.length === 0" class="empty-state">
          <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-inbox</v-icon>
          <p class="text-grey-lighten-1">No daily payments recorded</p>
        </div>
      </v-card>
    </div>

    <!-- Floating Action Button -->
    <v-btn
      color="#002181"
      size="large"
      icon
      elevation="4"
      class="add-payment-btn"
      @click="openAddModal"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>

    <!-- Add Payment Modal -->
    <v-dialog v-model="showAddModal" max-width="700px" persistent>
      <v-card>
        <v-card-title class="modal-header">
          <span class="modal-title">Add Daily Payment</span>
          <v-btn icon variant="text" @click="closeAddModal">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="addForm" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="form.collectorId"
                  :items="collectors"
                  item-title="collector_name"
                  item-value="collector_id"
                  label="Select Collector"
                  variant="outlined"
                  density="comfortable"
                  :rules="[(v) => !!v || 'Please select a collector']"
                  prepend-inner-icon="mdi-account"
                  :loading="loadingCollectors"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="form.vendorId"
                  :items="vendors"
                  item-title="vendor_name"
                  item-value="vendor_id"
                  label="Select Vendor"
                  variant="outlined"
                  density="comfortable"
                  :rules="[(v) => !!v || 'Please select a vendor']"
                  prepend-inner-icon="mdi-store"
                  :loading="loadingVendors"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.amount"
                  label="Amount"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  :rules="[(v) => !!v || 'Required', (v) => v > 0 || 'Must be greater than 0']"
                  prepend-inner-icon="mdi-currency-php"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.referenceNo"
                  label="Reference Number (Optional)"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-barcode"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="form.status"
                  :items="['completed', 'pending', 'failed', 'cancelled']"
                  label="Status"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-check-circle"
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="closeAddModal">Cancel</v-btn>
          <v-btn
            color="#002181"
            variant="flat"
            :disabled="!formValid || submitting"
            :loading="submitting"
            @click="submitPayment"
          >
            Add Payment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Payment Modal -->
    <v-dialog v-model="showViewModal" max-width="700px">
      <v-card v-if="selectedPayment">
        <v-card-title class="modal-header">
          <span class="modal-title">Payment Details</span>
          <v-btn icon variant="text" @click="closeViewModal">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <span class="detail-label">Receipt ID:</span>
                <span class="detail-value">{{ selectedPayment.receipt_id }}</span>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <span class="detail-label">Reference No:</span>
                <span class="detail-value">{{ selectedPayment.reference_no || 'N/A' }}</span>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <span class="detail-label">Collector's Name:</span>
                <span class="detail-value">{{ selectedPayment.collector_name }}</span>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <span class="detail-label">Vendor's Name:</span>
                <div class="d-flex align-center">
                  <div class="avatar vendor-avatar avatar-initials mr-2 d-flex" style="width: 32px; height: 32px;">
                    {{ getInitials(selectedPayment.vendor_name || 'N/A') }}
                  </div>
                  <span class="detail-value">{{ selectedPayment.vendor_name }}</span>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">{{ formatCurrency(selectedPayment.amount) }}</span>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">{{ formatDateTime(selectedPayment.time_date) }}</span>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <span class="detail-label">Status:</span>
                <div class="status-chip-wrapper">
                  <v-chip :color="selectedPayment.statusColor" variant="flat" size="small">
                    {{ selectedPayment.status }}
                  </v-chip>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400px">
      <v-card>
        <v-card-title class="modal-header">
          <span class="modal-title">Confirm Delete</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <p>Are you sure you want to delete this payment?</p>
          <p class="text-error mt-2">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="showDeleteConfirm = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="deletePayment">
            Delete
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

<script src="./DailyPayments.js"></script>
<style scoped src="./DailyPayments.css"></style>

<style>
/* Force visible blue scrollbar on Daily table-wrapper globally to override App.vue white scrollbars and scrollable-tables.css hidden rules */
.daily-payments .scrollable-table-wrapper {
  scrollbar-width: thin !important;
  scrollbar-color: #002181 #f1f1f1 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  max-height: var(--table-scroll-max-height) !important;
}

.daily-payments .scrollable-table-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 8px !important;
  display: block !important;
}

.daily-payments .scrollable-table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 4px !important;
}

.daily-payments .scrollable-table-wrapper::-webkit-scrollbar-thumb {
  background: #002181 !important;
  border-radius: 4px !important;
}

.daily-payments .scrollable-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #001557 !important;
}
</style>
