<template>
  <div class="penalty-payments">
    <!-- Search Bar -->
    <div class="search-container">
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

    <!-- Payments Table -->
    <div class="payments-table-container">
      <v-card class="payments-card" elevation="0">
        <div class="table-wrapper">
          <table class="payments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Stallholder Name</th>
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
                <td colspan="9" class="empty-state">
                  <v-progress-circular indeterminate color="primary" size="48" />
                  <p>Loading penalty payments...</p>
                </td>
              </tr>
              <tr v-else-if="error">
                <td colspan="9" class="empty-state">
                  <v-icon size="48" color="error">mdi-alert-circle-outline</v-icon>
                  <p>{{ error }}</p>
                  <v-btn color="primary" size="small" @click="fetchPenaltyPayments">Try Again</v-btn>
                </td>
              </tr>
              <tr v-else-if="filteredPayments.length === 0">
                <td colspan="9" class="empty-state">
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
                <td class="id-cell">{{ payment.penaltyPaymentId }}</td>
                <td class="name-cell">
                  <div class="stallholder-info">
                    <div class="avatar">
                      {{ (payment.stallholderName || "N/A").charAt(0) }}
                    </div>
                    <div class="name-details">
                      <span class="name">{{ payment.stallholderName || "N/A" }}</span>
                      <span v-if="payment.branchName" class="branch-name">{{ payment.branchName }}</span>
                    </div>
                  </div>
                </td>
                <td class="violation-cell">
                  <div class="violation-info">
                    <span class="violation-type">{{ payment.violationType || 'N/A' }}</span>
                    <span v-if="payment.ordinanceNo" class="ordinance-no">{{ payment.ordinanceNo }}</span>
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
                  <v-chip :color="getStatusColor(payment.paymentStatus)" variant="flat" size="small">
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
              <div class="detail-item">
                <span class="detail-label">Stallholder Name:</span>
                <span class="detail-value">{{ selectedPayment.stallholderName }}</span>
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
                <span class="detail-value amount">{{
                  formatAmount(selectedPayment.amount)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">{{
                  formatDate(selectedPayment.paymentDate)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Payment Time:</span>
                <span class="detail-value">{{
                  formatTime(selectedPayment.paymentTime)
                }}</span>
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
                <v-chip :color="getStatusColor(selectedPayment.paymentStatus)" variant="flat" size="small">
                  {{ selectedPayment.paymentStatus || 'completed' }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script src="./PenaltyPayments.js"></script>
<style scoped src="./PenaltyPayments.css"></style>
