import ComplianceTable from './ComplianceComponents/ComplianceTable/ComplianceTable.vue'
import ComplianceSearch from './ComplianceComponents/ComplianceSearch/ComplianceSearch.vue'
import ViewCompliance from './ComplianceComponents/ViewCompliance/ViewCompliance.vue'
import LoadingOverlay from '../../Common/LoadingOverlay/LoadingOverlay.vue'
import apiClient from '../../../services/apiClient'

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

        console.log("🔄 Fetching compliance data")
        console.log("📋 Query params:", params)

        const response = await apiClient.get('/compliances', {
          params
        })

        console.log("📥 Response received:", response.status, response.data)

        if (response.data.success) {
          // Debug: Log raw data from API
          console.log("📊 Raw compliance data from API:", response.data.data)
          if (response.data.data.length > 0) {
            console.log("📊 First record fields:", Object.keys(response.data.data[0]))
            console.log("📊 First record values:", response.data.data[0])
          }

          // Map backend data to frontend format
          // Support both old field names (from view_compliance_records) and new field names (from compliance_record table)
          this.complianceList = response.data.data.map(item => ({
            id: `CMP-${String(item.compliance_id || item.compliance_record_id).padStart(4, '0')}`,
            compliance_id: item.compliance_id || item.compliance_record_id,
            date: this.formatDate(item.date || item.inspection_date),
            type: item.type || item.compliance_type || 'General Compliance',
            inspector: item.inspector || item.inspector_name || 'N/A',
            inspector_id: item.inspector_id || null,
            stallholder: item.stallholder || item.stallholder_name || 'N/A',
            stallholder_id: item.stallholder_id || null,
            status: item.status || item.compliance_status || 'pending',
            severity: item.severity || 'moderate',
            notes: item.notes || '',
            branch_name: item.branch_name || '',
            branch_id: item.branch_id || null,
            stall_no: item.stall_no || '',
            stall_id: item.stall_id || null,
            offense_no: item.offense_no || 1,
            penalty_amount: item.penalty_amount || 0,
            receipt_number: item.receipt_number || null,
            evidence: item.evidence || '',
            resolved_date: item.resolved_date ? this.formatDate(item.resolved_date) : null,
            violation_id: item.violation_id || null,
            // Payment info (new fields)
            payment_date: item.payment_date ? this.formatDate(item.payment_date) : null,
            payment_reference: item.payment_reference || null,
            paid_amount: item.paid_amount || 0,
            collected_by: item.collected_by || null,
            // Additional violation details
            ordinance_no: item.ordinance_no || null,
            violation_details: item.violation_details || null,
            penalty_remarks: item.penalty_remarks || null,
            // Stallholder additional info
            stallholder_compliance_status: item.stallholder_compliance_status || 'Compliant',
            stallholder_contact: item.stallholder_contact || null,
            stallholder_email: item.stallholder_email || null,
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
