import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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
      selectingPlanId: null,
      showConfirmDialog: false,
      selectedPlanForConfirm: null,
      headers: [
        { title: 'Payment ID', value: 'payment_id', sortable: true },
        { title: 'Receipt #', value: 'receipt_number', sortable: true },
        { title: 'Amount', value: 'amount', sortable: true },
        { title: 'Payment Date', value: 'payment_date', sortable: true },
        { title: 'Method', value: 'payment_method', sortable: true },
        { title: 'Status', value: 'payment_status', sortable: true },
        { title: 'Period', value: 'payment_period', sortable: false }
      ]
    }
  },
  mounted() {
    this.loadSubscriptionData()
    this.loadAvailablePlans()
    this.loadPaymentHistory()
  },
  methods: {
    async loadSubscriptionData() {
      this.loading = true
      
      try {
        const token = sessionStorage.getItem('authToken')
        
        // Get subscription details
        const subResponse = await axios.get(
          `${API_BASE_URL}/subscriptions/my-subscription`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        if (subResponse.data.success) {
          const data = subResponse.data.data
          this.subscription = {
            ...data,
            features: typeof data.features === 'string' ? JSON.parse(data.features) : data.features
          }
        }
      } catch (error) {
        console.error('Failed to load subscription data:', error)
        if (error.response?.status === 404) {
          console.log('No subscription found for this user')
        }
      } finally {
        this.loading = false
      }
    },

    async loadPaymentHistory() {
      this.loadingPayments = true
      
      try {
        const token = sessionStorage.getItem('authToken')
        
        // Get payment history
        const paymentsResponse = await axios.get(
          `${API_BASE_URL}/subscriptions/my-payment-history`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        if (paymentsResponse.data.success) {
          this.payments = paymentsResponse.data.data.map(p => ({
            ...p,
            payment_period: `${p.payment_period_start} to ${p.payment_period_end}`
          }))
        }
      } catch (error) {
        console.error('Failed to load payment history:', error)
      } finally {
        this.loadingPayments = false
      }
    },
    
    async loadAvailablePlans() {
      this.loadingPlans = true
      
      try {
        const token = sessionStorage.getItem('authToken')
        
        const response = await axios.get(
          `${API_BASE_URL}/subscriptions/plans`,
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
      // Show confirmation dialog instead of browser confirm
      this.selectedPlanForConfirm = plan
      this.showConfirmDialog = true
    },

    async confirmPlanSelection() {
      const plan = this.selectedPlanForConfirm
      
      this.selectingPlanId = plan.plan_id
      
      try {
        const token = sessionStorage.getItem('authToken')
        
        const response = await axios.post(
          `${API_BASE_URL}/subscriptions/change-plan`,
          { planId: plan.plan_id },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        if (response.data.success) {
          this.showConfirmDialog = false
          
          // Show success message
          alert(`✅ Success! Your subscription has been updated to ${plan.plan_name}.`)
          
          // Reload data
          await this.loadSubscriptionData()
          await this.loadPaymentHistory()
        } else {
          alert('❌ Failed to update subscription plan: ' + response.data.message)
        }
      } catch (error) {
        console.error('Failed to update subscription plan:', error)
        alert('❌ Error updating subscription plan. Please contact support.')
      } finally {
        this.selectingPlanId = null
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
