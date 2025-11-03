<template>
  <div class="online-payments">
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
            <span class="tab-count">{{ onlinePayments.length }}</span>
          </div>
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
                <th>ID</th>
                <th>Stallholder Name</th>
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
              <tr 
                v-for="payment in filteredPayments" 
                :key="payment.id"
                class="clickable-row"
              >
                <td class="id-cell" @click="viewPaymentDetails(payment)">{{ payment.id }}</td>
                <td class="name-cell" @click="viewPaymentDetails(payment)">
                  <div class="stallholder-info">
                    <div class="avatar">{{ payment.stallholderName.charAt(0) }}</div>
                    <div class="name-details">
                      <span class="name">{{ payment.stallholderName }}</span>
                      <span class="stall-no">Stall #{{ payment.stallNo }}</span>
                    </div>
                  </div>
                </td>
                <td @click="viewPaymentDetails(payment)">
                  <v-chip
                    :color="getMethodColor(payment.method)"
                    variant="flat"
                    size="small"
                  >
                    {{ payment.method }}
                  </v-chip>
                </td>
                <td class="amount-cell" @click="viewPaymentDetails(payment)">{{ formatCurrency(payment.amount) }}</td>
                <td class="reference-cell" @click="viewPaymentDetails(payment)">{{ payment.referenceNo }}</td>
                <td class="date-cell" @click="viewPaymentDetails(payment)">{{ formatDate(payment.date) }}</td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button class="table-action-btn accept-btn" @click.stop="acceptPayment(payment)">
                      ACCEPT
                    </button>
                    <button class="table-action-btn decline-btn" @click.stop="declinePayment(payment)">
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
                    <div class="info-item">
                      <span class="info-label">Stallholder Name:</span>
                      <span class="info-value">{{ selectedPayment.stallholderName }}</span>
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
                      <span class="info-value amount-highlight">{{ formatCurrency(selectedPayment.amount) }}</span>
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
  </div>
</template>

<script src="./OnlinePayments.js"></script>
<style scoped src="./OnlinePayments.css"></style>
          stallholderName: 'Juan Dela Cruz',
