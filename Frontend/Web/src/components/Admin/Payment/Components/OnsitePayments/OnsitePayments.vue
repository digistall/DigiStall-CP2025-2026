<template>
  <div class="onsite-payments">
    <!-- Search Bar -->
    <div class="search-container">
      <v-text-field
        v-model="searchQuery"
        placeholder="Search by ID, name, receipt number..."
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
                <th>ID</th>
                <th>Stallholder Name</th>
                <th>Stall Number</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Collected By</th>
                <th>Receipt No.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredPayments.length === 0">
                <td colspan="8" class="empty-state">
                  <v-icon size="48" color="grey">mdi-inbox</v-icon>
                  <p>No onsite payments recorded</p>
                </td>
              </tr>
              <tr
                v-for="payment in filteredPayments"
                :key="payment.id"
                class="clickable-row"
                @click="viewPayment(payment)"
              >
                <td class="id-cell">{{ payment.id }}</td>
                <td class="name-cell">
                  <div class="stallholder-info">
                    <div class="avatar">
                      {{ (payment.stallholderName || "N/A").charAt(0) }}
                    </div>
                    <span class="name">{{ payment.stallholderName || "N/A" }}</span>
                  </div>
                </td>
                <td class="stall-cell">
                  <v-chip color="#002181" variant="flat" size="small">
                    {{ payment.stallNo }}
                  </v-chip>
                </td>
                <td class="amount-cell">{{ formatCurrency(payment.amount) }}</td>
                <td class="date-cell">{{ formatDate(payment.paymentDate) }}</td>
                <td class="collector-cell">{{ payment.collectedBy }}</td>
                <td class="receipt-cell">{{ payment.receiptNo }}</td>
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

    <!-- Add Payment Modal -->
    <v-dialog v-model="showAddModal" max-width="700px" persistent>
      <v-card>
        <v-card-title class="modal-header">
          <span class="modal-title">Add Onsite Payment</span>
          <v-btn icon variant="text" @click="closeAddModal">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="addForm" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <StallholderDropdown
                  v-model="form.stallholderId"
                  :rules="[(v) => !!v || 'Please select a stallholder']"
                  @stallholder-selected="onStallholderSelected"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.stallNo"
                  label="Stall Number"
                  variant="outlined"
                  density="comfortable"
                  readonly
                  prepend-inner-icon="mdi-store"
                  placeholder="Auto-filled when stallholder is selected"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.amount"
                  label="Amount"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  :rules="[
                    (v) => !!v || 'Required',
                    (v) => v > 0 || 'Must be greater than 0',
                  ]"
                  prepend-inner-icon="mdi-currency-php"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.paymentDate"
                  label="Payment Date"
                  variant="outlined"
                  density="comfortable"
                  type="date"
                  :rules="[(v) => !!v || 'Required']"
                  prepend-inner-icon="mdi-calendar"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.paymentTime"
                  label="Payment Time"
                  variant="outlined"
                  density="comfortable"
                  type="time"
                  :rules="[(v) => !!v || 'Required']"
                  prepend-inner-icon="mdi-clock-outline"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.paymentForMonth"
                  label="Payment For Month"
                  variant="outlined"
                  density="comfortable"
                  type="month"
                  prepend-inner-icon="mdi-calendar-month"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.paymentType"
                  :items="['rental', 'utilities', 'maintenance', 'penalty', 'other']"
                  label="Payment Type"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-tag-outline"
                ></v-select>
              </v-col>

              <!-- Violation Dropdown - Only shown when penalty is selected -->
              <v-col cols="12" v-if="isPenaltyPayment">
                <v-select
                  v-model="form.selectedViolation"
                  :items="violationItems"
                  :loading="loadingViolations"
                  :disabled="!form.stallholderId || loadingViolations"
                  label="Select Violation to Pay"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-alert-circle"
                  :rules="[(v) => !!v || 'Please select a violation']"
                  :no-data-text="!form.stallholderId ? 'Select a stallholder first' : 'No unpaid violations found'"
                  return-object
                  item-title="title"
                  item-value="value"
                  @update:modelValue="(item) => form.selectedViolation = item?.value"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon :color="getSeverityColor(item.raw.violation?.severity)">
                          mdi-alert-circle
                        </v-icon>
                      </template>
                      <v-list-item-subtitle>
                        <v-chip
                          :color="getSeverityColor(item.raw.violation?.severity)"
                          size="x-small"
                          class="mr-2"
                        >
                          {{ item.raw.violation?.severity }}
                        </v-chip>
                        <span>Offense #{{ item.raw.violation?.offenseNo }} - ₱{{ item.raw.violation?.penaltyAmount?.toLocaleString() }}</span>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>

                <!-- Violation Details Card -->
                <v-card
                  v-if="form.selectedViolation"
                  class="mt-2 violation-details-card"
                  variant="outlined"
                  color="warning"
                >
                  <v-card-text class="pa-3">
                    <div class="d-flex align-center mb-2">
                      <v-icon color="warning" size="20" class="mr-2">mdi-alert</v-icon>
                      <span class="font-weight-bold">Selected Violation Details</span>
                    </div>
                    <div class="violation-info">
                      <div v-for="v in unpaidViolations.filter(x => x.violationId === form.selectedViolation)" :key="v.violationId">
                        <div class="d-flex justify-space-between mb-1">
                          <span class="text-caption">Type:</span>
                          <span class="font-weight-medium">{{ v.violationType }}</span>
                        </div>
                        <div class="d-flex justify-space-between mb-1">
                          <span class="text-caption">Offense #:</span>
                          <span class="font-weight-medium">{{ v.offenseNo }}</span>
                        </div>
                        <div class="d-flex justify-space-between mb-1">
                          <span class="text-caption">Penalty Amount:</span>
                          <span class="font-weight-bold text-error">₱{{ v.penaltyAmount?.toLocaleString() }}</span>
                        </div>
                        <div class="d-flex justify-space-between">
                          <span class="text-caption">Date Reported:</span>
                          <span>{{ formatDate(v.dateReported) }}</span>
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.collectedBy"
                  label="Collected By"
                  variant="outlined"
                  density="comfortable"
                  :rules="[(v) => !!v || 'Required']"
                  prepend-inner-icon="mdi-account-tie"
                  readonly
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.receiptNo"
                  :label="isPenaltyPayment ? 'Payment Reference Number' : 'Receipt Number'"
                  variant="outlined"
                  density="comfortable"
                  :rules="[(v) => !!v || 'Required']"
                  prepend-inner-icon="mdi-receipt"
                  :placeholder="isPenaltyPayment ? 'Enter payment reference (e.g., REF-001)' : 'Enter receipt number (e.g., RCP-001)'"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  label="Notes (Optional)"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  prepend-inner-icon="mdi-note-text"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeAddModal">Cancel</v-btn>
          <v-btn
            color="#002181"
            variant="flat"
            :disabled="!formValid || (isPenaltyPayment && !form.selectedViolation)"
            @click="addPayment"
          >
            <v-icon class="mr-1">mdi-check</v-icon>
            {{ isPenaltyPayment ? 'Process Violation Payment' : 'Add Payment' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Payment Modal -->
    <v-dialog v-model="showViewModal" max-width="600px">
      <v-card>
        <v-card-title class="modal-header">
          <span class="modal-title">Payment Details</span>
          <v-btn icon variant="text" @click="showViewModal = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <div v-if="selectedPayment" class="payment-details">
            <div class="detail-group">
              <div class="detail-item">
                <span class="detail-label">Payment ID:</span>
                <span class="detail-value">{{ selectedPayment.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Stallholder Name:</span>
                <span class="detail-value">{{ selectedPayment.stallholderName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Stall Number:</span>
                <span class="detail-value">{{ selectedPayment.stallNo }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount">{{
                  formatCurrency(selectedPayment.amount)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">{{
                  formatDate(selectedPayment.paymentDate)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Collected By:</span>
                <span class="detail-value">{{ selectedPayment.collectedBy }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Receipt Number:</span>
                <span class="detail-value">{{ selectedPayment.receiptNo }}</span>
              </div>
              <div v-if="selectedPayment.notes" class="detail-item full-width">
                <span class="detail-label">Notes:</span>
                <span class="detail-value">{{ selectedPayment.notes }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Floating Action Button -->
    <div class="fab-container">
      <button class="fab-button" @click="showAddModal = true">
        <div class="fab-icon">
          <v-icon color="white" size="28">mdi-plus</v-icon>
        </div>
        <div class="fab-ripple"></div>
        <div class="fab-ripple-2"></div>
      </button>
    </div>

    <!-- Toast Notification -->
    <ToastNotification
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>

<script src="./OnsitePayments.js"></script>
<style scoped src="./OnsitePayments.css"></style>
