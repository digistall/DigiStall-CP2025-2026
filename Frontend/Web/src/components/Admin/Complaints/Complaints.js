import ComplaintsTable from './ComplaintsComponents/ComplaintsTable/ComplaintsTable.vue'
import ComplaintsSearch from './ComplaintsComponents/ComplaintsSearch/ComplaintsSearch.vue'
import ViewComplaints from './ComplaintsComponents/ViewComplaints/ViewComplaints.vue'
import LoadingOverlay from '../../Common/LoadingOverlay/LoadingOverlay.vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

export default {
  name: 'Complaints',
  components: {
    ComplaintsTable,
    ComplaintsSearch,
    ViewComplaints,
    LoadingOverlay,
  },
  data() {
    return {
      searchQuery: '',
      activeFilter: 'all',
      selectedComplaints: {},
      showViewComplaintsModal: false,
      complaintsList: [], // Complaints data
      isLoading: false,
      error: null,
    }
  },
  mounted() {
    this.initializeComplaints()
  },
  methods: {
    // Search
    handleSearch(searchData) {
      this.searchQuery = searchData.query
      this.activeFilter = searchData.filter
      console.log('Search data:', searchData)
      this.loadComplaintsData()
    },

    // Table actions
    handleViewComplaints(complaints) {
      console.log('View complaints:', complaints)
      this.selectedComplaints = complaints
      this.showViewComplaintsModal = true
    },

    handleEditComplaints(complaints) {
      console.log('Edit complaints:', complaints)
      this.selectedComplaints = complaints
      // Open edit modal or navigate to edit page
    },

    async handleDeleteComplaints(complaints) {
      console.log('Delete complaints:', complaints)
      if (confirm(`Are you sure you want to delete complaint record ${complaints.id}?`)) {
        try {
          const token = sessionStorage.getItem('authToken')

          await axios.delete(`${API_BASE_URL}/complaints/${complaints.complaint_id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          console.log('Complaint record deleted successfully!')
          await this.loadComplaintsData() // Reload data
        } catch (error) {
          console.error('Failed to delete complaint:', error)
          alert('Failed to delete complaint: ' + (error.response?.data?.message || error.message))
        }
      }
    },

    closeViewComplaintsModal() {
      this.showViewComplaintsModal = false
      this.selectedComplaints = {}
    },

    // Init
    initializeComplaints() {
      console.log('Complaints page initialized')
      this.loadComplaintsData()
    },

    async loadComplaintsData() {
      try {
        this.isLoading = true
        this.error = null

        const token = sessionStorage.getItem('authToken')

        if (!token) {
          console.error('❌ No auth token found')
          this.error = 'Please login to view complaint records'
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

        console.log('🔄 Fetching complaints data from:', `${API_BASE_URL}/complaints`)
        console.log('📋 Query params:', params)
        console.log('🔑 Token present:', !!token)

        const response = await axios.get(`${API_BASE_URL}/complaints`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        })

        console.log('📥 Response received:', response.status, response.data)

        if (response.data.success) {
          // Map backend data to frontend format
          this.complaintsList = response.data.data.map((item) => ({
            id: `CMPT-${String(item.complaint_id).padStart(4, '0')}`,
            complaint_id: item.complaint_id,
            date: item.date_submitted ? new Date(item.date_submitted).toISOString().split('T')[0] : 'N/A',
            type: item.complaint_type,
            sender: item.sender_name,
            sender_contact: item.sender_contact,
            sender_email: item.sender_email,
            stallholder: item.stallholder_name || 'N/A',
            stallholder_id: item.stallholder_id,
            stall_no: item.stall_no,
            stall_id: item.stall_id,
            branch: item.branch_name,
            branch_id: item.branch_id,
            subject: item.subject,
            description: item.description,
            evidence: item.evidence,
            status: item.status,
            priority: item.priority,
            resolution_notes: item.resolution_notes,
            date_resolved: item.date_resolved,
          }))

          console.log('✅ Complaints loaded:', this.complaintsList.length, 'records')
        } else {
          throw new Error('Failed to load complaints')
        }
      } catch (error) {
        console.error('❌ Error loading complaints:', error)
        this.error = error.response?.data?.message || error.message || 'Failed to load complaints'

        // Show user-friendly error
        if (error.response?.status === 401) {
          this.error = 'Session expired. Please login again.'
        } else if (error.response?.status === 403) {
          this.error = 'You do not have permission to view complaints'
        } else if (error.response?.status === 404) {
          this.error = 'Complaints endpoint not found. Please contact administrator.'
        }
      } finally {
        this.isLoading = false
      }
    },
  },
}
