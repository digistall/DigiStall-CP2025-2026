<template>
  <v-card class="data-table-card" elevation="3">
    <v-card-title class="table-header">
      <v-icon color="white" class="mr-2">mdi-clock-alert-outline</v-icon>
      Expiring Subscriptions (Next 30 Days)
    </v-card-title>
    <v-card-text class="pa-0">
      <v-data-table
        :headers="headers"
        :items="expiringSubscriptions"
        :loading="loading"
        class="professional-table"
        :items-per-page="10"
      >
        <template #[`item.days_until_expiry`]="{ item }">
          <span :class="{ 'text-error font-weight-bold': item.days_until_expiry < 7, 'text-warning font-weight-medium': item.days_until_expiry >= 7 && item.days_until_expiry < 14 }">
            {{ item.days_until_expiry }} days
          </span>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'ExpiringSubscriptionsTable',
  props: {
    expiringSubscriptions: {
      type: Array,
      default: () => []
    },
    headers: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped src="./ExpiringSubscriptionsTable.css"></style>
