import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default {
  name: 'SystemAdminDashboard',
  data() {
    return {
      dashboardStats: {},
      recentOwners: [],
      loading: false,
      headers: [
        { title: 'ID', value: 'business_owner_id' },
        { title: 'Name', value: 'full_name' },
        { title: 'Email', value: 'email' },
        { title: 'Plan', value: 'plan_name' },
        { title: 'Status', value: 'subscription_status' },
        { title: 'Expiry Date', value: 'subscription_expiry_date' },
        { title: 'Days Until Expiry', value: 'days_until_expiry' },
      ],
    }
  },
  mounted() {
    this.loadDashboardData()
  },
  methods: {
    async loadDashboardData() {
      this.loading = true
      try {
        const token = sessionStorage.getItem('authToken')
        
        // Get dashboard statistics
        const statsResponse = await axios.get(`${API_BASE_URL}/api/subscriptions/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (statsResponse.data.success) {
          this.dashboardStats = statsResponse.data.data
        }
        
        // Get all business owners (we'll show top 10 recent)
        const ownersResponse = await axios.get(`${API_BASE_URL}/api/subscriptions/business-owners`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (ownersResponse.data.success) {
          this.recentOwners = ownersResponse.data.data.slice(0, 10)
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        this.$emit('show-snackbar', {
          message: 'Failed to load dashboard data',
          color: 'error'
        })
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
