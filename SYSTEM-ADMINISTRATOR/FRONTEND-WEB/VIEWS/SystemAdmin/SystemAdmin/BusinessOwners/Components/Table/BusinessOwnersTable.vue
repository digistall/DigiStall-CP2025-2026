<template>
  <v-card class="data-table-card" elevation="3">
    <v-card-title class="table-header">
      All Business Owners
    </v-card-title>
    <v-card-text class="pa-0">
      <v-data-table
        :headers="headers"
        :items="businessOwners"
        :loading="loading"
        class="professional-table"
        :items-per-page="10"
      >
        <template #[`item.subscription_status`]="{ item }">
          <v-chip
            :color="getStatusColor(item.subscription_status)"
            variant="flat"
            size="small"
            class="font-weight-bold"
          >
            {{ item.subscription_status }}
          </v-chip>
        </template>
        <template #[`item.days_until_expiry`]="{ item }">
          <span :class="{ 'text-error font-weight-bold': item.days_until_expiry < 7 && item.days_until_expiry >= 0, 'text-warning font-weight-medium': item.days_until_expiry >= 7 && item.days_until_expiry < 14 }">
            {{ item.days_until_expiry !== null ? `${item.days_until_expiry} days` : 'N/A' }}
          </span>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn size="small" color="primary" variant="flat" @click="$emit('view-history', item)" class="mr-2">
            <v-icon size="small">mdi-history</v-icon>
            History
          </v-btn>
          <v-btn size="small" color="success" variant="flat" @click="$emit('record-payment', item)">
            <v-icon size="small">mdi-cash-plus</v-icon>
            Payment
          </v-btn>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'BusinessOwnersTable',
  props: {
    businessOwners: {
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
  emits: ['view-history', 'record-payment'],
  methods: {
    getStatusColor(status) {
      const colors = {
        'Active': 'success',
        'Expired': 'error',
        'Expiring Soon': 'warning'
      }
      return colors[status] || 'default'
    }
  }
}
</script>

<style scoped src="./BusinessOwnersTable.css"></style>
