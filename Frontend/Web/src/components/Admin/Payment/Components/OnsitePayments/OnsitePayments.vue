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
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredPayments.length === 0">
                <td colspan="7" class="empty-state">
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
                    <div class="avatar">{{ payment.stallholderName.charAt(0) }}</div>
                    <span class="name">{{ payment.stallholderName }}</span>
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
                  :rules="[v => !!v || 'Please select a stallholder']"
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
                  :rules="[v => !!v || 'Required', v => v > 0 || 'Must be greater than 0']"
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
                  :rules="[v => !!v || 'Required']"
                  prepend-inner-icon="mdi-calendar"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.collectedBy"
                  label="Collected By"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Required']"
                  prepend-inner-icon="mdi-account-tie"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.receiptNo"
                  label="Receipt Number"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Required']"
                  prepend-inner-icon="mdi-receipt"
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
            :disabled="!formValid"
            @click="addPayment"
          >
            <v-icon class="mr-1">mdi-check</v-icon>
            Add Payment
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
                <span class="detail-value amount">{{ formatCurrency(selectedPayment.amount) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">{{ formatDate(selectedPayment.paymentDate) }}</span>
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
  </div>
</template>

<script src="./OnsitePayments.js"></script>
<style scoped src="./OnsitePayments.css"></style>
  data() {
