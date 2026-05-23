<template>
  <v-card class="data-table-card" elevation="3">
    <v-card-title class="table-header">
      <v-icon color="white" class="mr-2">mdi-receipt-text</v-icon>
      Payment Transactions
    </v-card-title>
    <v-card-text class="pa-0">
      <v-data-table
        :headers="headers"
        :items="payments"
        :loading="loading"
        class="professional-table"
        :items-per-page="10"
      >
        <template #[`item.payment_status`]="{ item }">
          <v-chip
            :color="getPaymentStatusColor(item.payment_status)"
            variant="flat"
            size="small"
            class="font-weight-bold"
          >
            {{ item.payment_status }}
          </v-chip>
        </template>
        <template #[`item.amount`]="{ item }">
          <span class="font-weight-bold">₱{{ formatCurrency(item.amount) }}</span>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'PaymentsTable',
  props: {
    payments: {
      type: Array,
      default: () => []
    },
    headers: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    formatCurrency(amount) {
      return parseFloat(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    getPaymentStatusColor(status) {
      const colors = {
        'Completed': 'success',
        'Pending': 'warning',
        'Failed': 'error',
        'Refunded': 'info'
      }
      return colors[status] || 'default'
    }
  }
}
</script>

<style scoped src="./PaymentsTable.css"></style>
