<template>
  <v-card class="data-table-card mb-6" elevation="3">
    <v-card-title class="table-header">
      <v-icon color="white" class="mr-2">mdi-chart-bar</v-icon>
      Subscription Plan Distribution
    </v-card-title>
    <v-card-text class="pa-0">
      <v-data-table
        :headers="headers"
        :items="planDistribution"
        :loading="loading"
        class="professional-table"
        :items-per-page="10"
      >
        <template #[`item.revenue`]="{ item }">
          <span class="font-weight-bold text-primary">₱{{ formatCurrency(item.revenue) }}</span>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'PlanDistributionTable',
  props: {
    planDistribution: {
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
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    }
  }
}
</script>

<style scoped src="./PlanDistributionTable.css"></style>
