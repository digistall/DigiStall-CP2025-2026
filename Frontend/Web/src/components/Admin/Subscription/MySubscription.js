import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default {
  name: 'MySubscription',
  data() {
    return {
      subscription: null,
      payments: [],
      loading: false,
      loadingPayments: false,
      headers: [
        { title: 'Payment ID', value: 'payment_id' },
        { title: 'Receipt #', value: 'receipt_number' },
        { title: 'Amount', value: 'amount' },
        { title: 'Payment Date', value: 'payment_date' },
        { title: 'Method', value: 'payment_method' },
        { title: 'Status', value: 'payment_status' },
        { title: 'Period', value: 'payment_period' }
      ]
    }
  },
  mounted() {
    this.loadSubscriptionData()
  },
  methods: {
    async loadSubscriptionData() {
      this.loading = true
      this.loadingPayments = true
      
      try {
        const token = sessionStorage.getItem('authToken')
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
        const businessOwnerId = currentUser.id || currentUser.business_owner_id || currentUser.adminId
        
        if (!businessOwnerId) {
          console.error('No business owner ID found')
          return
        }
        
        // Get subscription details
        const subResponse = await axios.get(
          `${API_BASE_URL}/api/subscriptions/business-owner/${businessOwnerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        if (subResponse.data.success) {
          const data = subResponse.data.data
          this.subscription = {
            ...data,
            features: typeof data.features === 'string' ? JSON.parse(data.features) : data.features
          }
        }
        
        this.loading = false
        
        // Get payment history
        const paymentsResponse = await axios.get(
          `${API_BASE_URL}/api/subscriptions/payment-history/${businessOwnerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        if (paymentsResponse.data.success) {
          this.payments = paymentsResponse.data.data.map(p => ({
            ...p,
            payment_period: `${p.payment_period_start} to ${p.payment_period_end}`
          }))
        }
      } catch (error) {
        console.error('Failed to load subscription data:', error)
      } finally {
        this.loading = false
        this.loadingPayments = false
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    },
    getStatusColor(status) {
      const colors = {
        Active: 'green',
        Expired: 'red',
        Suspended: 'grey',
        Pending: 'orange'
      }
      return colors[status] || 'grey'
    },
    getPaymentStatusColor(status) {
      const colors = {
        Completed: 'green',
        Pending: 'orange',
        Failed: 'red',
        Refunded: 'grey'
      }
      return colors[status] || 'grey'
    }
  }
}
