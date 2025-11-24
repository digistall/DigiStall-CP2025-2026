import InspectorTable from './InspectorComponents/InspectorTable/InspectorTable.vue'
import InspectorSearch from './InspectorComponents/InspectorSearch/InspectorSearch.vue'
import ViewInspector from './InspectorComponents/ViewInspector/ViewInspector.vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

export default {
  name: "Inspector",
  components: {
    InspectorTable,
    InspectorSearch,
    ViewInspector,
  },
  data() {
    return {
      searchQuery: "",
      activeFilter: "all",
      selectedInspector: {},
      showViewInspectorModal: false,
      inspectorList: [],
      isLoading: false,
      error: null,
    }
  },
  mounted() {
    this.initializeInspector()
  },
  methods: {
    // Search
    handleSearch(searchData) {
      this.searchQuery = searchData.query
      this.activeFilter = searchData.filter
      console.log("Search data:", searchData)
      // Reload data with new filters
      this.loadInspectorData()
    },

    // Table actions
    handleViewInspector(inspector) {
      console.log("View inspector:", inspector)
      this.selectedInspector = inspector
      this.showViewInspectorModal = true
    },

    handleEditInspector(inspector) {
      console.log("Edit inspector:", inspector)
      this.selectedInspector = inspector
      // Open edit modal or navigate to edit page
    },

    async handleDeleteInspector(inspector) {
      console.log("Delete inspector:", inspector)
      if (confirm(`Are you sure you want to delete inspector ${inspector.name}?`)) {
        try {
          const token = sessionStorage.getItem('authToken')

          // Note: This endpoint needs to be created in the backend
          await axios.delete(`${API_BASE_URL}/inspectors/${inspector.inspector_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          // Reload data after deletion
          await this.loadInspectorData()
          console.log("Inspector deleted successfully!")
          alert("Inspector deleted successfully!")
        } catch (error) {
          console.error("Error deleting inspector:", error)
          alert(error.response?.data?.message || "Failed to delete inspector")
        }
      }
    },

    closeViewInspectorModal() {
      this.showViewInspectorModal = false
      this.selectedInspector = {}
    },

    // Init
    initializeInspector() {
      console.log("Inspector page initialized")
      this.loadInspectorData()
    },

    async loadInspectorData() {
      try {
        this.isLoading = true
        this.error = null

        const token = sessionStorage.getItem('authToken')

        if (!token) {
          console.error("❌ No auth token found")
          this.error = "Please login to view inspectors"
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

        console.log("🔄 Fetching inspector data from:", `${API_BASE_URL}/compliances/helpers/inspectors`)
        console.log("📋 Query params:", params)
        console.log("🔑 Token present:", !!token)

        const response = await axios.get(`${API_BASE_URL}/compliances/helpers/inspectors`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params
        })

        console.log("📥 Response received:", response.status, response.data)

        if (response.data.success) {
          // Map backend data to frontend format
          this.inspectorList = response.data.data.map(item => ({
            id: `INS-${String(item.inspector_id).padStart(4, '0')}`,
            inspector_id: item.inspector_id,
            name: item.inspector_name || `${item.first_name} ${item.last_name}`,
            first_name: item.first_name || '',
            last_name: item.last_name || '',
            email: item.email || 'N/A',
            contact_no: item.contact_no || 'N/A',
            status: item.status || 'active',
            date_hired: this.formatDate(item.date_hired),
            // Keep original data for API calls
            _original: item
          }))

          console.log(`✅ Loaded ${this.inspectorList.length} inspectors`)
        } else {
          throw new Error(response.data.message || 'Failed to load inspector data')
        }
      } catch (error) {
        console.error("❌ Error loading inspector data:", error)
        console.error("❌ Error details:", {
          status: error.response?.status,
          message: error.response?.data?.message,
          url: error.config?.url,
          baseURL: API_BASE_URL
        })

        this.error = error.response?.data?.message || error.message || "Failed to load inspectors"

        // Show user-friendly error
        if (error.response?.status === 401) {
          this.error = "Session expired. Please login again."
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        } else if (error.response?.status === 403) {
          this.error = "You don't have permission to view inspectors. Please contact your administrator."
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
