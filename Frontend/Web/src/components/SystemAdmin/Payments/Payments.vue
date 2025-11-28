<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-app>
    <v-main>
      <v-container fluid class="payments-page">
        
        <!-- Search and Filter Component -->
        <PaymentsSearch
          :businessOwners="businessOwners"
          :paymentMethods="paymentMethods"
          @search="handleSearch"
          @filter="handleFilter"
        />

        <!-- Payments Table -->
        <PaymentsTable
          :payments="payments"
          :loading="loading"
          :headers="headers"
          @format-currency="formatCurrency"
          @get-payment-status-color="getPaymentStatusColor"
        />

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import PaymentsSearch from './Components/Search/PaymentsSearch.vue'
import PaymentsTable from './Components/Table/PaymentsTable.vue'
import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '')

export default {
  name: 'SubscriptionPayments',
  components: {
    PaymentsSearch,
    PaymentsTable
  },
  data() {
    return {
      payments: [],
      allPayments: [],
      businessOwners: [],
      loading: false,
      filter: {
        businessOwnerId: null,
        status: null,
        paymentMethod: null
      },
      searchQuery: '',
      paymentMethods: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Online Payment', 'Check'],
      headers: [
        { title: 'Payment ID', value: 'payment_id' },
        { title: 'Receipt #', value: 'receipt_number' },
        { title: 'Business Owner', value: 'owner_name' },
        { title: 'Amount', value: 'amount' },
        { title: 'Payment Date', value: 'payment_date' },
        { title: 'Method', value: 'payment_method' },
        { title: 'Status', value: 'payment_status' },
        { title: 'Reference', value: 'reference_number' },
        { title: 'Period', value: 'payment_period' }
      ]
    }
  },
  mounted() {
    this.loadBusinessOwners()
    this.loadPayments()
  },
  methods: {
    handleSearch(query) {
      this.searchQuery = query
      this.applySearchAndFilters()
    },
    handleFilter(filterData) {
      this.filter = filterData
      this.loadPayments()
    },
    async loadBusinessOwners() {
      try {
        const token = sessionStorage.getItem('authToken')
        const response = await axios.get(`${API_BASE_URL}/api/subscriptions/business-owners`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data.success) {
          this.businessOwners = response.data.data
        }
      } catch (error) {
        console.error('Failed to load business owners:', error)
      }
    },
    async loadPayments() {
      this.loading = true
      try {
        const token = sessionStorage.getItem('authToken')
        const ownersResponse = await axios.get(`${API_BASE_URL}/api/subscriptions/business-owners`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (ownersResponse.data.success) {
          const allPayments = []
          
          for (const owner of ownersResponse.data.data) {
            const paymentResponse = await axios.get(
              `${API_BASE_URL}/api/subscriptions/payment-history/${owner.business_owner_id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (paymentResponse.data.success) {
              const ownerPayments = paymentResponse.data.data.map(p => ({
                ...p,
                payment_period: `${p.payment_period_start} to ${p.payment_period_end}`,
                owner_name: owner.full_name
              }))
              allPayments.push(...ownerPayments)
            }
          }
          
          this.allPayments = allPayments
          this.applySearchAndFilters()
        }
      } catch (error) {
        console.error('Failed to load payments:', error)
      } finally {
        this.loading = false
      }
    },
    applySearchAndFilters() {
      let filtered = [...this.allPayments]
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(p =>
          p.owner_name?.toLowerCase().includes(query) ||
          p.receipt_number?.toLowerCase().includes(query) ||
          p.payment_method?.toLowerCase().includes(query)
        )
      }
      
      if (this.filter.businessOwnerId) {
        filtered = filtered.filter(p => p.business_owner_id === this.filter.businessOwnerId)
      }
      if (this.filter.status) {
        filtered = filtered.filter(p => p.payment_status === this.filter.status)
      }
      if (this.filter.paymentMethod) {
        filtered = filtered.filter(p => p.payment_method === this.filter.paymentMethod)
      }
      
      this.payments = filtered
    },
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

<style scoped>
.payments-page {
  background-color: #fafafa;
  min-height: calc(100vh - 64px);
  padding: 24px;
}
</style>
