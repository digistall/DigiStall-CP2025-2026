import axios from 'axios'
import ReportCards from './Components/Cards/ReportCards.vue'
import PlanDistributionTable from './Components/Table/PlanDistributionTable.vue'
import ExpiringSubscriptionsTable from './Components/Table/ExpiringSubscriptionsTable.vue'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '')

export default {
  name: 'SystemAdminReports',
  components: {
    ReportCards,
    PlanDistributionTable,
    ExpiringSubscriptionsTable
  },
  data() {
    return {
      loading: false,
      monthlyRevenue: 0,
      lastMonthRevenue: 0,
      statusCounts: {},
      planDistribution: [],
      expiringSubscriptions: [],
      planHeaders: [
        { title: 'Plan Name', value: 'plan_name' },
        { title: 'Subscribers', value: 'subscriber_count' },
        { title: 'Monthly Fee', value: 'monthly_fee' },
        { title: 'Revenue', value: 'revenue' }
      ],
      expiringHeaders: [
        { title: 'Business Owner', value: 'full_name' },
        { title: 'Email', value: 'email' },
        { title: 'Plan', value: 'plan_name' },
        { title: 'Expiry Date', value: 'subscription_expiry_date' },
        { title: 'Days Until Expiry', value: 'days_until_expiry' }
      ]
    }
  },
  mounted() {
    this.loadReportData()
  },
  methods: {
    async loadReportData() {
      this.loading = true
      try {
        const token = sessionStorage.getItem('authToken')
        
        // Get dashboard stats
        const statsResponse = await axios.get(`${API_BASE_URL}/api/subscriptions/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (statsResponse.data.success) {
          const stats = statsResponse.data.data
          this.monthlyRevenue = stats.revenueThisMonth || 0
          // For demo, set last month to 80% of this month
          this.lastMonthRevenue = this.monthlyRevenue * 0.8
        }
        
        // Get all business owners
        const ownersResponse = await axios.get(`${API_BASE_URL}/api/subscriptions/business-owners`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (ownersResponse.data.success) {
          const owners = ownersResponse.data.data
          
          // Calculate status distribution
          this.statusCounts = owners.reduce((acc, owner) => {
            const status = owner.subscription_status
            acc[status] = (acc[status] || 0) + 1
            return acc
          }, {})
          
          // Calculate plan distribution
          const planMap = owners.reduce((acc, owner) => {
            const planName = owner.plan_name
            if (!acc[planName]) {
              acc[planName] = {
                plan_name: planName,
                subscriber_count: 0,
                monthly_fee: owner.monthly_fee,
                revenue: 0
              }
            }
            acc[planName].subscriber_count++
            if (owner.subscription_status === 'Active') {
              acc[planName].revenue += parseFloat(owner.monthly_fee || 0)
            }
            return acc
          }, {})
          
          this.planDistribution = Object.values(planMap)
          
          // Get expiring subscriptions (within 30 days)
          this.expiringSubscriptions = owners
            .filter(owner => owner.days_until_expiry !== null && owner.days_until_expiry >= 0 && owner.days_until_expiry <= 30)
            .sort((a, b) => a.days_until_expiry - b.days_until_expiry)
        }
      } catch (error) {
        console.error('Failed to load report data:', error)
      } finally {
        this.loading = false
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    }
  }
}
