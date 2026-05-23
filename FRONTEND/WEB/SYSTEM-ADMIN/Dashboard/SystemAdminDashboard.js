import axios from 'axios'
import { markRaw } from 'vue'
import DashboardStats from './Components/Stats/DashboardStats.vue'
import DashboardTable from './Components/Table/DashboardTable.vue'
import RevenueChart from './Components/Charts/RevenueChart.vue'
import SubscriptionChart from './Components/Charts/SubscriptionChart.vue'
import AISuggestions from './Components/AI/AISuggestions.vue'
import QuickActions from './Components/QuickActions/QuickActions.vue'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '')

export default {
  name: 'SystemAdminDashboard',
  components: {
    DashboardStats,
    DashboardTable,
    RevenueChart,
    SubscriptionChart,
    AISuggestions,
    QuickActions
  },
  data() {
    return {
      dashboardStats: {},
      recentOwners: [],
      loading: false,
      revenueData: {
        totalRevenue: 0,
        monthly: []
      },
      subscriptionData: {
        planBreakdown: {
          basic: 0,
          standard: 0,
          premium: 0,
          trial: 0
        }
      },
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
          this.dashboardStats = { ...statsResponse.data.data }
          
          // Update revenue data for charts - use plain object
          this.revenueData = Object.freeze({
            totalRevenue: statsResponse.data.data.totalRevenue || 0,
            monthly: this.generateMonthlyData(statsResponse.data.data.totalRevenue || 0)
          })
        }
        
        // Get all business owners (we'll show top 10 recent)
        const ownersResponse = await axios.get(`${API_BASE_URL}/api/subscriptions/business-owners`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (ownersResponse.data.success) {
          this.recentOwners = ownersResponse.data.data.slice(0, 10)
          
          // Calculate subscription breakdown from owners data
          this.calculateSubscriptionBreakdown(ownersResponse.data.data)
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
    generateMonthlyData(totalRevenue) {
      // Generate realistic monthly distribution
      const months = 6
      const data = []
      let remaining = totalRevenue
      
      for (let i = 0; i < months - 1; i++) {
        const portion = Math.random() * 0.3 + 0.1 // 10-40% of remaining
        const value = Math.round(remaining * portion)
        data.push(value)
        remaining -= value
      }
      data.push(Math.round(remaining)) // Last month gets the rest
      
      return data
    },
    calculateSubscriptionBreakdown(owners) {
      const breakdown = {
        basic: 0,
        standard: 0,
        premium: 0,
        trial: 0
      }
      
      owners.forEach(owner => {
        const planName = (owner.plan_name || '').toLowerCase()
        if (planName.includes('basic')) breakdown.basic++
        else if (planName.includes('standard')) breakdown.standard++
        else if (planName.includes('premium')) breakdown.premium++
        else if (planName.includes('trial') || planName.includes('free')) breakdown.trial++
        else breakdown.basic++ // Default to basic
      })
      
      this.subscriptionData = Object.freeze({ planBreakdown: breakdown })
    },
    handleQuickAction(action) {
      switch (action) {
        case 'add-owner':
          this.$router.push('/system-admin/business-owners/add')
          break
        case 'manage-subscriptions':
          this.$router.push('/system-admin/subscriptions')
          break
        case 'send-notifications':
          this.showNotificationDialog()
          break
        case 'export-reports':
          this.exportReport()
          break
        case 'view-analytics':
          this.$router.push('/system-admin/analytics')
          break
        case 'system-settings':
          this.$router.push('/system-admin/settings')
          break
        default:
          console.log('Unknown action:', action)
      }
    },
    showNotificationDialog() {
      // TODO: Implement notification dialog
      alert('Notification feature coming soon!')
    },
    exportReport() {
      // Generate simple CSV export
      const headers = ['ID', 'Name', 'Email', 'Plan', 'Status', 'Expiry Date']
      const rows = this.recentOwners.map(owner => [
        owner.business_owner_id,
        owner.full_name,
        owner.email,
        owner.plan_name,
        owner.subscription_status,
        owner.subscription_expiry_date
      ])
      
      const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `business-owners-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
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
