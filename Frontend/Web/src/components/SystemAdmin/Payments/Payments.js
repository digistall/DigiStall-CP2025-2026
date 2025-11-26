import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default {
  name: 'SubscriptionPayments',
  data() {
    return {
      payments: [],
      businessOwners: [],
      loading: false,
      filter: {
        businessOwnerId: null,
        status: null,
        paymentMethod: null
      },
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
  computed: {
    totalAmount() {
      return this.payments
        .filter(p => p.payment_status === 'Completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    },
    completedCount() {
      return this.payments.filter(p => p.payment_status === 'Completed').length
    },
    pendingCount() {
      return this.payments.filter(p => p.payment_status === 'Pending').length
    }
  },
  mounted() {
    this.loadBusinessOwners()
    this.loadPayments()
    
    // Check if coming from Business Owners page with filter
    const urlParams = new URLSearchParams(window.location.search)
    const businessOwnerId = urlParams.get('businessOwnerId')
    if (businessOwnerId) {
      this.filter.businessOwnerId = parseInt(businessOwnerId)
    }
  },
  methods: {
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
        
        // If specific owner is selected, get their payment history
        if (this.filter.businessOwnerId) {
          const response = await axios.get(
            `${API_BASE_URL}/api/subscriptions/payment-history/${this.filter.businessOwnerId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          
          if (response.data.success) {
            let payments = response.data.data.map(p => ({
              ...p,
              payment_period: `${p.payment_period_start} to ${p.payment_period_end}`,
              owner_name: this.businessOwners.find(o => o.business_owner_id === this.filter.businessOwnerId)?.full_name || 'Unknown'
            }))
            
            // Apply filters
            if (this.filter.status) {
              payments = payments.filter(p => p.payment_status === this.filter.status)
            }
            if (this.filter.paymentMethod) {
              payments = payments.filter(p => p.payment_method === this.filter.paymentMethod)
            }
            
            this.payments = payments
          }
        } else {
          // Get all payments for all owners
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
            
            let filteredPayments = allPayments
            
            // Apply filters
            if (this.filter.status) {
              filteredPayments = filteredPayments.filter(p => p.payment_status === this.filter.status)
            }
            if (this.filter.paymentMethod) {
              filteredPayments = filteredPayments.filter(p => p.payment_method === this.filter.paymentMethod)
            }
            
            this.payments = filteredPayments
          }
        }
      } catch (error) {
        console.error('Failed to load payments:', error)
      } finally {
        this.loading = false
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
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
