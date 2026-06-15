<template>
  <div class="daily-payments">
    <!-- Search & Filter Section -->
    <div class="search-filter-section mb-6">
      <div class="search-wrapper">
        <!-- Search Bar -->
        <div class="search-input-wrapper">
          <v-text-field
            v-model="searchQuery"
            label="Search Vendors"
            placeholder="Search by vendor name..."
            variant="outlined"
            clearable
            hide-details
            prepend-inner-icon="mdi-magnify"
            class="search-field"
          ></v-text-field>
        </div>

        <!-- Filter Button -->
        <div class="filter-container" ref="filterContainer">
          <button
            class="filter-btn"
            :class="{ 'filter-active': showFilterPanel }"
            @click="toggleFilter"
          >
            <v-icon icon="mdi-filter-variant" size="small" class="mr-1"></v-icon>
            Filter
            <v-icon
              :icon="showFilterPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="small"
              class="ml-1"
            ></v-icon>
          </button>

          <!-- Filter Dropdown Panel -->
          <transition name="slide-down">
            <div v-show="showFilterPanel" class="filter-dropdown">
              <div class="filter-card">
                <div class="filter-header">
                  <div class="filter-header-content">
                    <v-icon icon="mdi-filter-variant" size="small" class="mr-2"></v-icon>
                    <h6 class="filter-title">Filter Options</h6>
                  </div>
                  <button class="close-btn" @click="showFilterPanel = false">
                    <v-icon icon="mdi-close" size="small"></v-icon>
                  </button>
                </div>

                <div class="filter-content">
                  <!-- Status Filter -->
                  <div class="filter-group">
                    <label class="filter-label">PAYMENT STATUS</label>
                    <div class="status-buttons">
                      <button
                        class="status-btn"
                        :class="{ active: !filters.status }"
                        @click="filters.status = null"
                      >
                        All
                      </button>
                      <button
                        v-for="option in statusFilterOptions"
                        :key="option.value"
                        class="status-btn"
                        :class="{ active: filters.status === option.value }"
                        @click="filters.status = filters.status === option.value ? null : option.value"
                      >
                        {{ option.title }}
                      </button>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="filter-actions">
                    <button class="reset-btn" @click="clearFilters">
                      <v-icon icon="mdi-refresh" size="small"></v-icon>
                      Reset
                    </button>
                    <button class="apply-btn" @click="applyFilters">Apply Filters</button>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Vendor Table (one row per vendor - like Rental Payments) -->
    <div class="payments-table-container">
      <v-card class="payments-card" elevation="0">
        <div class="table-wrapper">
          <table class="payments-table">
            <thead>
              <tr>
                <th class="name-header">Vendor Name</th>
                <th>Total Collected</th>
                <th>Total Payments</th>
                <th>Last Payment</th>
                <th class="center-th">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredVendors.length === 0">
                <td colspan="5" class="empty-state">
                  <v-icon size="48" color="grey">mdi-store-off</v-icon>
                  <p>No vendors found</p>
                </td>
              </tr>
              <tr
                v-for="vendor in filteredVendors"
                :key="vendor.vendor_id"
                class="clickable-row"
                @click="viewVendorTracker(vendor)"
              >
                <td class="name-cell">
                  <div class="vendor-info">
                    <div class="avatar avatar-initials d-flex">
                      {{ getInitials(vendor.vendor_name || 'N/A') }}
                    </div>
                    <span class="name">{{ vendor.vendor_name || 'N/A' }}</span>
                  </div>
                </td>
                <td class="amount-cell">{{ formatCurrency(vendor.total_collected) }}</td>
                <td class="count-cell">{{ vendor.total_payments }}</td>
                <td class="date-cell">{{ formatDate(vendor.last_payment_date) }}</td>
                <td class="status-cell center-td">
                  <v-chip
                    :color="getLastPaymentStatusLabel(vendor).color"
                    variant="flat"
                    size="small"
                  >
                    {{ getLastPaymentStatusLabel(vendor).label }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </table>
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

    <!-- ============================================ -->
    <!-- PAYMENT HISTORY MODAL (like Rental Tracker) -->
    <!-- ============================================ -->
    <v-dialog v-model="showTrackerModal" max-width="1100px">
      <v-card v-if="selectedVendor" class="tracker-card">
        <v-card-title class="modal-header">
          <span class="modal-title">Payment Details</span>
          <v-btn icon variant="text" @click="showTrackerModal = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <div class="tracker-two-col">
            <!-- LEFT: Vendor Details Panel -->
            <div class="tracker-details-panel">
              <div class="detail-cards-wrapper">
                <!-- Vendor Name Card -->
                <div class="detail-card vendor-name-card">
                  <span class="detail-card-label">VENDOR NAME</span>
                  <div class="vendor-card-content">
                    <div class="avatar-lg avatar-initials d-flex align-center justify-center">
                      {{ getInitials(selectedVendor.vendor_name || 'N/A') }}
                    </div>
                    <span class="detail-card-value vendor-name-value">
                      {{ selectedVendor.vendor_name }}
                    </span>
                  </div>
                </div>

                <!-- Summary Cards -->
                <div class="detail-card">
                  <span class="detail-card-label">
                    <v-icon size="14" color="#6b7280" class="mr-1">mdi-receipt</v-icon>TOTAL PAYMENTS
                  </span>
                  <span class="detail-card-value">{{ vendorSummary?.totalPayments || selectedVendor.total_payments || 0 }}</span>
                </div>

                <div class="detail-card">
                  <span class="detail-card-label">
                    <v-icon size="14" color="#6b7280" class="mr-1">mdi-check-circle</v-icon>COMPLETED
                  </span>
                  <span class="detail-card-value">{{ vendorSummary?.completedCount || 0 }}</span>
                </div>

                <div class="detail-card">
                  <span class="detail-card-label">
                    <v-icon size="14" color="#6b7280" class="mr-1">mdi-calendar</v-icon>LAST PAYMENT
                  </span>
                  <span class="detail-card-value">{{ formatDate(selectedVendor.last_payment_date) }}</span>
                </div>

                <!-- Total Amount - highlighted card -->
                <div class="detail-card detail-card-total">
                  <span class="detail-card-label total-label">
                    <v-icon size="16" color="white" class="mr-1">mdi-currency-php</v-icon>TOTAL COLLECTED
                  </span>
                  <span class="detail-card-value total-value">
                    {{ formatCurrency(vendorSummary?.totalAmount || selectedVendor.total_collected || 0) }}
                  </span>
                </div>

                <!-- Add Payment Button -->
                <v-btn
                  color="#002181"
                  variant="flat"
                  class="mt-2"
                  block
                  @click="openAddModal"
                >
                  <v-icon class="mr-1">mdi-plus</v-icon>
                  Add Payment
                </v-btn>
              </div>
            </div>

            <!-- RIGHT: Payment History Grid -->
            <div class="tracker-timeline-panel">
              <div class="tracker-section">
                <div class="tracker-title">
                  <div class="tracker-title-icon">
                    <v-icon size="18" color="white">mdi-history</v-icon>
                  </div>
                  <span>Payment History</span>
                </div>

                <div v-if="trackerLoading" class="tracker-loading">
                  <v-progress-circular
                    indeterminate
                    color="#002181"
                    size="28"
                  ></v-progress-circular>
                  <span>Loading payment history...</span>
                </div>

                <div v-else-if="vendorPayments.length === 0" class="tracker-empty">
                  <v-icon size="36" color="grey">mdi-cash-off</v-icon>
                  <p>No payment history yet</p>
                </div>

                <div v-else class="tracker-grid">
                  <div
                    v-for="payment in vendorPayments"
                    :key="payment.receipt_id"
                    class="tracker-grid-card"
                    :class="`tracker-${payment.status?.toLowerCase() || 'completed'}`"
                  >
                    <div class="tracker-card-top">
                      <div class="tracker-icon-wrap">
                        <v-icon size="14" :color="getStatusColor(payment.status)">
                          {{ payment.status === 'completed' ? 'mdi-check-circle' : payment.status === 'pending' ? 'mdi-clock-outline' : 'mdi-close-circle' }}
                        </v-icon>
                      </div>
                      <div class="tracker-date-block">
                        <span class="tracker-due-label">{{ formatDate(payment.time_date) }}</span>
                        <span class="tracker-receipt-no">{{ payment.reference_no || `#${payment.receipt_id}` }}</span>
                      </div>
                    </div>
                    <div class="tracker-card-bottom">
                      <span class="tracker-amount">{{ formatCurrency(payment.amount) }}</span>
                      <v-chip
                        :color="getStatusColor(payment.status)"
                        variant="flat"
                        size="x-small"
                      >
                        {{ payment.status }}
                      </v-chip>
                    </div>
                    <div class="tracker-card-footer">
                      <span class="tracker-collector">
                        <v-icon size="12" class="mr-1">mdi-account</v-icon>
                        {{ payment.collector_name }}
                      </span>
                      <div class="tracker-actions">
                        <v-btn
                          icon
                          variant="text"
                          size="x-small"
                          color="#002181"
                          @click.stop="openEditModal(payment)"
                          title="Edit"
                        >
                          <v-icon size="14">mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          variant="text"
                          size="x-small"
                          color="error"
                          @click.stop="confirmDelete(payment)"
                          title="Delete"
                        >
                          <v-icon size="14">mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ============================================ -->
    <!-- ADD PAYMENT MODAL                           -->
    <!-- ============================================ -->
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

    <!-- ============================================ -->
    <!-- EDIT PAYMENT MODAL                          -->
    <!-- ============================================ -->
    <v-dialog v-model="showEditModal" max-width="700px" persistent>
      <v-card>
        <v-card-title class="modal-header">
          <span class="modal-title">Edit Daily Payment</span>
          <v-btn icon variant="text" @click="closeEditModal">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="editForm" v-model="editFormValid">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="editForm.collectorId"
                  :items="collectors"
                  item-title="collector_name"
                  item-value="collector_id"
                  label="Collector"
                  variant="outlined"
                  density="comfortable"
                  :rules="[(v) => !!v || 'Please select a collector']"
                  prepend-inner-icon="mdi-account"
                  :loading="loadingCollectors"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editForm.amount"
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
                  v-model="editForm.referenceNo"
                  label="Reference Number"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-barcode"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editForm.status"
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
          <v-btn variant="outlined" @click="closeEditModal">Cancel</v-btn>
          <v-btn
            color="#002181"
            variant="flat"
            :disabled="!editFormValid || editing"
            :loading="editing"
            @click="submitEdit"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ============================================ -->
    <!-- DELETE CONFIRMATION DIALOG                   -->
    <!-- ============================================ -->
    <v-dialog v-model="showDeleteConfirm" max-width="400px">
      <v-card>
        <v-card-title class="modal-header">
          <span class="modal-title">Confirm Delete</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <p>Are you sure you want to delete this payment?</p>
          <p class="text-error mt-2 font-weight-medium">This action cannot be undone.</p>
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
