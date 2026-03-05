<template>
  <div class="daily-payments">
    <!-- Search Bar -->
    <div class="search-container">
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

    <!-- Payments Table -->
    <div class="payments-table-container">
      <v-card class="payments-card" elevation="0">
        <div class="table-wrapper">
          <table class="payments-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Collector's Name</th>
                <th>Vendor's Name</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Reference No.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredPayments.length === 0">
                <td colspan="7" class="empty-state">
                  <v-icon size="48" color="grey">mdi-inbox</v-icon>
                  <p>No daily payments recorded</p>
                </td>
              </tr>
              <tr
                v-for="payment in filteredPayments"
                :key="payment.receipt_id"
                class="clickable-row"
                @click="viewPayment(payment)"
              >
                <td class="id-cell">{{ payment.receipt_id }}</td>
                <td class="name-cell">
                  <div class="collector-info">
                    <div class="avatar">
                      {{ (payment.collector_name || 'N/A').charAt(0) }}
                    </div>
                    <span class="name">{{ payment.collector_name || 'N/A' }}</span>
                  </div>
                </td>
                <td class="name-cell">
                  <div class="vendor-info">
                    <div class="avatar vendor-avatar">
                      {{ (payment.vendor_name || 'N/A').charAt(0) }}
                    </div>
                    <span class="name">{{ payment.vendor_name || 'N/A' }}</span>
                  </div>
                </td>
                <td class="amount-cell">{{ formatCurrency(payment.amount) }}</td>
                <td class="date-cell">{{ formatDateTime(payment.time_date) }}</td>
                <td class="reference-cell">{{ payment.reference_no || 'N/A' }}</td>
                <td class="status-cell">
                  <v-chip :color="payment.statusColor" variant="flat" size="small">
                    {{ payment.status }}
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
                <span class="detail-value">{{ selectedPayment.vendor_name }}</span>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-item">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">{{
                  formatCurrency(selectedPayment.amount)
                }}</span>
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
