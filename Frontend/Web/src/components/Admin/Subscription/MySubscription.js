import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default {
  name: 'MySubscription',
  data() {
    return {
      subscription: null,
      payments: [],
      availablePlans: [],
      loading: false,
      loadingPayments: false,
      loadingPlans: false,
      showUpgradeDialog: false,
      selectingPlanId: null,
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
    this.loadAvailablePlans()
  },
  methods: {
    async loadSubscriptionData() {
      this.loading = true
      this.loadingPayments = true
      
      try {
        const token = sessionStorage.getItem('authToken')
        
        // Get subscription details using simplified endpoint
        const subResponse = await axios.get(
          `${API_BASE_URL}/api/subscriptions/my-subscription`,
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
        
        // Get payment history using simplified endpoint
        const paymentsResponse = await axios.get(
          `${API_BASE_URL}/api/subscriptions/my-payment-history`,
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
        if (error.response?.status === 404) {
          console.log('No subscription found for this user')
        }
      } finally {
        this.loading = false
        this.loadingPayments = false
      }
    },
    
    async loadAvailablePlans() {
      this.loadingPlans = true
      
      try {
        const token = sessionStorage.getItem('authToken')
        
        const response = await axios.get(
          `${API_BASE_URL}/api/subscriptions/plans`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        if (response.data.success) {
          this.availablePlans = response.data.data.map(plan => ({
            ...plan,
            features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
          }))
        }
      } catch (error) {
        console.error('Failed to load subscription plans:', error)
      } finally {
        this.loadingPlans = false
      }
    },
    
    async selectPlan(plan) {
      if (confirm(`Are you sure you want to change to ${plan.plan_name} plan? Monthly fee: ₱${this.formatCurrency(plan.monthly_fee)}`)) {
        this.selectingPlanId = plan.plan_id
        
        try {
          const token = sessionStorage.getItem('authToken')
          
          const response = await axios.post(
            `${API_BASE_URL}/api/subscriptions/change-plan`,
            { planId: plan.plan_id },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          
          if (response.data.success) {
            alert('Subscription plan updated successfully! Your new plan is now active.')
            this.showUpgradeDialog = false
            await this.loadSubscriptionData() // Reload subscription data
          } else {
            alert('Failed to update subscription plan: ' + response.data.message)
          }
        } catch (error) {
          console.error('Failed to update subscription plan:', error)
          alert('Error updating subscription plan. Please contact support.')
        } finally {
          this.selectingPlanId = null
        }
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
