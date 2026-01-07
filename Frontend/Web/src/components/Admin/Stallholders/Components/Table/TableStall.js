import { apiClient } from '../../../../../services/apiClient.js'
import AddStallholder from '../AddStallholder/AddStallholder.vue'
import ExcelImport from '../ExcelImport/ExcelImport.vue'
import DocumentCustomization from '../DocumentCustomization/DocumentCustomization.vue'
import AddStallholderChoiceModal from '../ChoicesModal/AddStallholderChoiceModal.vue'
import '@/assets/css/scrollable-tables.css'

export default {
  name: 'TableStall',
  components: {
    AddStallholder,
    ExcelImport,
    DocumentCustomization,
    AddStallholderChoiceModal
  },
  props: {
    searchQuery: {
      type: String,
      default: ''
    },
    activeFilter: {
      type: String,
      default: 'all'
    },
    branchId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 10,
      stallholders: [], // Always initialize as array
      loading: false,
      dataReady: false, // Track if initial data load is complete
      showInfoDialog: false,
      selectedStallholder: null,
      activeTab: 'personal',

      // Violation history state
      violationHistory: [],
      loadingViolations: false,

      // Choice modal state
      showChoiceModal: false,

      // Individual modal states (kept for backward compatibility)
      showAddStallholder: false,
      showExcelImport: false,
      showDocumentCustomization: false
    }
  },
  computed: {
    filteredStallholders() {
      // Don't process until data is ready
      if (!this.dataReady) {
        return []
      }

      // Ensure stallholders is always an array, with multiple safety checks
      const stallholdersArray = Array.isArray(this.stallholders) ? this.stallholders : []
      let filtered = [...stallholdersArray] // Create a copy to avoid mutations

      // Apply search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(stallholder =>
          stallholder.fullName?.toLowerCase().includes(query) ||
          stallholder.email?.toLowerCase().includes(query) ||
          stallholder.phoneNumber?.toLowerCase().includes(query) ||
          stallholder.stallNumber?.toLowerCase().includes(query) ||
          stallholder.businessName?.toLowerCase().includes(query)
        )
      }

      // Apply status filter
      if (this.activeFilter && this.activeFilter !== 'all') {
        switch (this.activeFilter) {
          case 'active':
            filtered = filtered.filter(s => s.status === 'Active')
            break
          case 'pending':
            filtered = filtered.filter(s => s.status === 'Pending')
            break
          case 'suspended':
            filtered = filtered.filter(s => s.status === 'Suspended')
            break
          case 'compliant':
            filtered = filtered.filter(s => s.compliance_status === 'Compliant')
            break
          case 'non-compliant':
            filtered = filtered.filter(s => s.compliance_status === 'Non-Compliant')
            break
        }
      }

      return filtered
    },

    paginatedStallholders() {
      if (!Array.isArray(this.filteredStallholders)) {
        return []
      }
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredStallholders.slice(start, end)
    },

    totalPages() {
      if (!Array.isArray(this.filteredStallholders)) {
        return 0
      }
      return Math.ceil(this.filteredStallholders.length / this.itemsPerPage)
    },

    // Violation Summary Computed Properties
    totalPenaltyAmount() {
      if (!Array.isArray(this.violationHistory)) return 0
      return this.violationHistory.reduce((sum, v) => sum + Number(v.penalty_amount || 0), 0)
    },

    unpaidPenaltyAmount() {
      if (!Array.isArray(this.violationHistory)) return 0
      return this.violationHistory
        .filter(v => v.status !== 'complete')
        .reduce((sum, v) => sum + Number(v.penalty_amount || 0), 0)
    },

    pendingViolationsCount() {
      if (!Array.isArray(this.violationHistory)) return 0
      return this.violationHistory.filter(v => v.status === 'pending' || v.status === 'in-progress').length
    },

    resolvedViolationsCount() {
      if (!Array.isArray(this.violationHistory)) return 0
      return this.violationHistory.filter(v => v.status === 'complete' || v.resolved_date).length
    }
  },
  methods: {
    async fetchStallholders() {
      this.loading = true
      this.dataReady = false // Reset data ready state
      this.$emit('loading-change', true) // Notify parent
      try {
        const params = {}
        if (this.branchId) {
          params.branchId = this.branchId
        }

        const response = await apiClient.get('/stallholders', { params })
        console.log('Stallholders API response:', response)

        // Ensure we have valid data
        const data = response.data
        if (Array.isArray(data)) {
          this.stallholders = data
          console.log('Stallholders set to:', this.stallholders)
        } else if (data && Array.isArray(data.data)) {
          this.stallholders = data.data
          console.log('Stallholders set to (nested):', this.stallholders)
        } else {
          console.warn('Unexpected response format:', data)
          this.stallholders = []
        }

        this.dataReady = true // Mark data as ready
        this.$emit('data-ready') // Notify parent that data is ready
      } catch (error) {
        console.error('Error fetching stallholders:', error)
        this.$emit('error', 'Failed to load stallholders')
        this.stallholders = []
        this.dataReady = true // Still mark as ready, even with empty data
        this.$emit('data-ready') // Notify parent
      } finally {
        this.loading = false
        this.$emit('loading-change', false) // Notify parent
      }
    },

    viewMoreInfo(stallholder) {
      this.selectedStallholder = stallholder
      this.showInfoDialog = true
      this.activeTab = 'personal'
      this.violationHistory = [] // Reset violations
      this.fetchViolationHistory(stallholder.stallholder_id)
    },

    async fetchViolationHistory(stallholderId) {
      this.loadingViolations = true
      try {
        const response = await apiClient.get(`/stallholders/${stallholderId}/violations`)
        console.log('Violation history response:', response)

        if (response.data && Array.isArray(response.data.data)) {
          this.violationHistory = response.data.data
        } else if (Array.isArray(response.data)) {
          this.violationHistory = response.data
        } else {
          this.violationHistory = []
        }

        console.log(`Found ${this.violationHistory.length} violations for stallholder ${stallholderId}`)
      } catch (error) {
        console.error('Error fetching violation history:', error)
        this.violationHistory = []
      } finally {
        this.loadingViolations = false
      }
    },

    closeDialog() {
      this.showInfoDialog = false
      this.selectedStallholder = null
    },

    getStatusIcon(contractStatus, paymentStatus) {
      if (paymentStatus === 'overdue') return 'mdi-alert-circle'
      if (contractStatus === 'Expired') return 'mdi-calendar-remove'
      if (contractStatus === 'Terminated') return 'mdi-close-circle'
      if (paymentStatus === 'grace_period') return 'mdi-clock-alert'
      return 'mdi-check-circle'
    },

    getStatusColor(contractStatus, paymentStatus) {
      if (paymentStatus === 'overdue') return 'red'
      if (contractStatus === 'Expired') return 'orange'
      if (contractStatus === 'Terminated') return 'red'
      if (paymentStatus === 'grace_period') return 'yellow'
      return 'green'
    },

    getStatusText(contractStatus, paymentStatus) {
      if (paymentStatus === 'overdue') return 'Payment Overdue'
      if (contractStatus === 'Expired') return 'Contract Expired'
      if (contractStatus === 'Terminated') return 'Terminated'
      if (paymentStatus === 'grace_period') return 'Grace Period'
      return contractStatus
    },

    getContractStatusColor(status) {
      switch (status) {
        case 'Active': return 'green'
        case 'Expired': return 'orange'
        case 'Terminated': return 'red'
        default: return 'grey'
      }
    },

    getPaymentStatusColor(status) {
      switch (status) {
        case 'current': return 'green'
        case 'overdue': return 'red'
        case 'grace_period': return 'yellow'
        default: return 'grey'
      }
    },

    getSeverityColor(severity) {
      switch ((severity || '').toLowerCase()) {
        case 'minor': return 'info'
        case 'moderate': return 'warning'
        case 'major': return 'orange'
        case 'critical': return 'error'
        default: return 'warning'
      }
    },

    getViolationStatusColor(status) {
      switch ((status || '').toLowerCase()) {
        case 'complete': return 'success'
        case 'pending': return 'warning'
        case 'incomplete': return 'error'
        case 'in-progress': return 'info'
        default: return 'grey'
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return dateString
      }
    },

    editStallholder(stallholder) {
      console.log('Edit stallholder:', stallholder)
      this.$emit('edit-stallholder', stallholder)
      this.closeDialog()
    },

    async deleteStallholder(stallholder) {
      if (confirm(`Are you sure you want to delete ${stallholder.stallholder_name}?`)) {
        try {
          await apiClient.delete(`/stallholders/${stallholder.stallholder_id}`)
          this.fetchStallholders() // Reload the list
          this.$emit('stallholder-deleted', stallholder)
          this.closeDialog()
        } catch (error) {
          console.error('Error deleting stallholder:', error)
          alert('Failed to delete stallholder. Please try again.')
        }
      }
    },

    addStallholder() {
      this.fab = false
      this.showAddStallholder = true
    },

    importFromExcel() {
      this.fab = false
      this.showExcelImport = true
    },

    openDocumentCustomization() {
      this.fab = false
      this.showDocumentCustomization = true
    },

    // Modal close handlers
    closeAddStallholder() {
      this.showAddStallholder = false
    },

    closeExcelImport() {
      this.showExcelImport = false
    },

    closeDocumentCustomization() {
      this.showDocumentCustomization = false
    },

    // Event handlers
    handleStallholderAdded() {
      this.fetchStallholders() // Refresh the list
    },

    handleImportComplete() {
      this.fetchStallholders() // Refresh the list
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },

    // === Choice Modal Methods ===
    openChoiceModal() {
      this.showChoiceModal = true
    },

    closeChoiceModal() {
      this.showChoiceModal = false
    },

    // === Event Handlers for Choice Modal ===
    handleShowMessage(messageData) {
      this.$emit('show-message', messageData)
    },

    handleImportCompleted(importData) {
      console.log('Import completed:', importData)
      this.fetchStallholders() // Refresh the table
      this.$emit('show-message', {
        type: 'success',
        text: `Successfully imported ${importData.count || 0} stallholders`
      })
    },

    handleDocumentUpdated(documentData) {
      console.log('Document updated:', documentData)
      this.$emit('show-message', {
        type: 'success',
        text: 'Document requirements updated successfully'
      })
    }
  },

  watch: {
    searchQuery() {
      this.currentPage = 1 // Reset to first page when search changes
    },

    activeFilter() {
      this.currentPage = 1 // Reset to first page when filter changes
    },

    branchId() {
      this.fetchStallholders()
    }
  },

  mounted() {
    this.fetchStallholders()
  }
}
