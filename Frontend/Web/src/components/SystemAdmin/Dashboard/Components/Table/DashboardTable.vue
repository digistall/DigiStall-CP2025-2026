<template>
  <v-card class="data-table-card" elevation="3">
    <v-card-title class="table-header">
      <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
      Recent Business Owners
    </v-card-title>
    <v-card-text class="pa-0">
      <v-data-table
        :headers="headers"
        :items="recentOwners"
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
  name: 'DashboardTable',
  props: {
    recentOwners: {
      type: Array,
      required: true,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      headers: [
        { title: 'ID', value: 'business_owner_id' },
        { title: 'Name', value: 'full_name' },
        { title: 'Email', value: 'email' },
        { title: 'Plan', value: 'plan_name' },
        { title: 'Status', value: 'subscription_status' },
        { title: 'Expiry Date', value: 'subscription_expiry_date' },
        { title: 'Days Until Expiry', value: 'days_until_expiry' },
      ]
    }
  },
  methods: {
    getStatusColor(status) {
      const colors = {
        Active: 'green',
        Expired: 'red',
        Suspended: 'grey',
        Pending: 'orange'
      }
      return colors[status] || 'grey'
    }
  }
}
</script>

<style scoped src="./DashboardTable.css"></style>
