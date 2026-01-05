<template>
  <div class="penalty-payments">
    <!-- Header with search and refresh -->
    <div class="penalty-payments-header">
      <div class="header-left">
        <h3 class="section-title">
          <v-icon class="mr-2" color="warning">mdi-alert-circle</v-icon>
          Penalty Payments
        </h3>
        <span class="payment-count">{{ filteredPayments.length }} record(s)</span>
      </div>
      <div class="header-right">
        <v-text-field
          v-model="searchQuery"
          placeholder="Search payments..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          class="search-input"
          clearable
        />
        <v-btn
          icon
          variant="text"
          @click="refresh"
          :loading="loading"
          title="Refresh"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <v-progress-circular indeterminate color="warning" />
      <span>Loading penalty payments...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <v-icon color="error" size="48">mdi-alert-circle-outline</v-icon>
      <p>{{ error }}</p>
      <v-btn color="primary" @click="fetchPenaltyPayments">Try Again</v-btn>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredPayments.length === 0" class="empty-state">
      <v-icon color="grey" size="64">mdi-cash-remove</v-icon>
      <h4>No Penalty Payments Found</h4>
      <p>There are no penalty payment records to display.</p>
    </div>

    <!-- Payments Table -->
    <div v-else class="table-container">
      <v-table class="payments-table" fixed-header>
        <thead>
          <tr>
            <th class="text-left">Reference #</th>
            <th class="text-left">Stallholder</th>
            <th class="text-left">Violation</th>
            <th class="text-left">Offense #</th>
            <th class="text-right">Amount</th>
            <th class="text-center">Date</th>
            <th class="text-center">Time</th>
            <th class="text-left">Collected By</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in filteredPayments" :key="payment.penaltyPaymentId">
            <td class="reference-cell">
              <span class="reference-number">{{ payment.referenceNumber || '-' }}</span>
            </td>
            <td>
              <div class="stallholder-info">
                <span class="stallholder-name">{{ payment.stallholderName || 'Unknown' }}</span>
                <span v-if="payment.branchName" class="branch-name">{{ payment.branchName }}</span>
              </div>
            </td>
            <td>
              <div class="violation-info">
                <span class="violation-type">{{ payment.violationType || 'N/A' }}</span>
                <span v-if="payment.ordinanceNo" class="ordinance-no">{{ payment.ordinanceNo }}</span>
              </div>
            </td>
            <td class="text-center">
              <v-chip size="small" color="warning" variant="tonal">
                #{{ payment.offenseNo || 1 }}
              </v-chip>
            </td>
            <td class="text-right amount-cell">
              <span class="amount">{{ formatAmount(payment.amount) }}</span>
            </td>
            <td class="text-center">{{ formatDate(payment.paymentDate) }}</td>
            <td class="text-center">{{ formatTime(payment.paymentTime) }}</td>
            <td>{{ payment.collectedBy || '-' }}</td>
            <td class="text-center">
              <v-chip
                :color="getStatusColor(payment.paymentStatus)"
                size="small"
                variant="tonal"
              >
                {{ payment.paymentStatus || 'completed' }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-container">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="5"
        @update:model-value="changePage"
        rounded
        density="comfortable"
      />
    </div>
  </div>
</template>

<script src="./PenaltyPayments.js"></script>

<style scoped>
.penalty-payments {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.penalty-payments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #fefce8;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.payment-count {
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 250px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  text-align: center;
}

.error-state p,
.empty-state p {
  color: #6b7280;
  margin: 0;
}

.empty-state h4 {
  margin: 0;
  color: #374151;
}

.table-container {
  flex: 1;
  overflow: auto;
}

.payments-table {
  width: 100%;
}

.payments-table th {
  background: #f9fafb !important;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payments-table td {
  padding: 12px 16px;
  vertical-align: middle;
}

.reference-cell {
  font-family: 'Monaco', 'Consolas', monospace;
}

.reference-number {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.stallholder-info,
.violation-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stallholder-name,
.violation-type {
  font-weight: 500;
  color: #1f2937;
}

.branch-name,
.ordinance-no {
  font-size: 12px;
  color: #6b7280;
}

.amount-cell .amount {
  font-weight: 600;
  color: #dc2626;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}
</style>
