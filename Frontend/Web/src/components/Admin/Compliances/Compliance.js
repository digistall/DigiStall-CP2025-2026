import ComplianceTable from './ComplianceComponents/ComplianceTable/ComplianceTable.vue'
import ComplianceSearch from './ComplianceComponents/ComplianceSearch/ComplianceSearch.vue'
import ViewCompliance from './ComplianceComponents/ViewCompliance/ViewCompliance.vue'
import LoadingOverlay from '../../Common/LoadingOverlay/LoadingOverlay.vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

export default {
  name: "Compliance",
  components: {
    ComplianceTable,
    ComplianceSearch,
    ViewCompliance,
    LoadingOverlay,
  },
  data() {
    return {
      searchQuery: "",
      activeFilter: "all",
      selectedCompliance: {},
      showViewComplianceModal: false,
      complianceList: [], // Compliance data from backend
      isLoading: false,
      error: null,
    }
  },
  mounted() {
    this.initializeCompliance()
  },
  mounted() {
    this.initializeCompliance()
  },
  methods: {
    // Search
    handleSearch(searchData) {
      this.searchQuery = searchData.query
      this.activeFilter = searchData.filter
      console.log("Search data:", searchData)
      // Reload data with new filters
      this.loadComplianceData()
    },

    // Table actions
    handleViewCompliance(compliance) {
      console.log("View compliance:", compliance)
      this.selectedCompliance = compliance
      this.showViewComplianceModal = true
    },

    handleEditCompliance(compliance) {
      console.log("Edit compliance:", compliance)
      this.selectedCompliance = compliance
      // Open edit modal or navigate to edit page
    },

    async handleDeleteCompliance(compliance) {
      console.log("Delete compliance:", compliance)
      if (confirm(`Are you sure you want to delete compliance record ${compliance.id}?`)) {
        try {
          const token = sessionStorage.getItem('authToken')
          await axios.delete(`${API_BASE_URL}/compliances/${compliance.compliance_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          // Reload data after deletion
          await this.loadComplianceData()
          console.log("Compliance record deleted successfully!")
          alert("Compliance record deleted successfully!")
        } catch (error) {
          console.error("Error deleting compliance:", error)
          alert(error.response?.data?.message || "Failed to delete compliance record")
        }
      }
    },

    closeViewComplianceModal() {
      this.showViewComplianceModal = false
      this.selectedCompliance = {}
    },

    // Init
    initializeCompliance() {
      console.log("Compliance page initialized")
      this.loadComplianceData()
    },

    async loadComplianceData() {
      try {
        this.isLoading = true
        this.error = null

        const token = sessionStorage.getItem('authToken')

        if (!token) {
          console.error("❌ No auth token found")
          this.error = "Please login to view compliance records"
          this.isLoading = false
          return
        }

        // Build query parameters
        const params = {}
        if (this.activeFilter && this.activeFilter !== 'all') {
          params.status = this.activeFilter
        }
        if (this.searchQuery) {
          params.search = this.searchQuery
        }

        console.log("🔄 Fetching compliance data from:", `${API_BASE_URL}/compliances`)
        console.log("📋 Query params:", params)
        console.log("🔑 Token present:", !!token)

        const response = await axios.get(`${API_BASE_URL}/compliances`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params
        })

        console.log("📥 Response received:", response.status, response.data)

        if (response.data.success) {
          // Map backend data to frontend format
          this.complianceList = response.data.data.map(item => ({
            id: `CMP-${String(item.compliance_id).padStart(4, '0')}`,
            compliance_id: item.compliance_id,
            date: this.formatDate(item.date),
            type: item.type || 'General Compliance',
            inspector: item.inspector || 'N/A',
            stallholder: item.stallholder || 'N/A',
            status: item.status || 'pending',
            severity: item.severity || 'moderate',
            notes: item.notes || '',
            branch_name: item.branch_name || '',
            stall_no: item.stall_no || '',
            offense_no: item.offense_no || 1,
            penalty_amount: item.penalty_amount || 0,
            resolved_date: item.resolved_date,
            // Keep original data for API calls
            _original: item
          }))

          console.log(`✅ Loaded ${this.complianceList.length} compliance records`)
        } else {
          throw new Error(response.data.message || 'Failed to load compliance data')
        }
      } catch (error) {
        console.error("❌ Error loading compliance data:", error)
        console.error("❌ Error details:", {
          status: error.response?.status,
          message: error.response?.data?.message,
          url: error.config?.url,
          baseURL: API_BASE_URL
        })

        this.error = error.response?.data?.message || error.message || "Failed to load compliance records"

        // Show user-friendly error
        if (error.response?.status === 401) {
          this.error = "Session expired. Please login again."
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        } else if (error.response?.status === 403) {
          this.error = "You don't have permission to view compliance records. Please contact your administrator."
        } else if (error.code === 'ERR_NETWORK' || !error.response) {
          this.error = "Cannot connect to server. Please make sure the backend is running on port 3001."
        }
      } finally {
        this.isLoading = false
      }
    },

    // Helper function to format date
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },
  },
}
