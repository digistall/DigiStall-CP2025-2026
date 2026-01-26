import { apiClient } from '@/services/apiClient.js'
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
      showDocumentCustomization: false,

      // Document review state
      stallholderDocuments: [],
      loadingDocuments: false,
      processingDocId: null,
      showDocPreviewDialog: false,
      previewingDocument: null,
      documentPreviewUrl: '',
      documentPreviewError: false,
      imageZoom: 1,
      showDocRejectDialog: false,
      documentToReject: null,
      docRejectionReason: '',
      docSnackbar: {
        show: false,
        message: '',
        color: 'success'
      }
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
    },

    // Document Stats Computed Property
    documentStats() {
      const docs = this.stallholderDocuments || []
      return {
        pending: docs.filter(d => (d.status || '').toLowerCase() === 'pending').length,
        approved: docs.filter(d => (d.status || '').toLowerCase() === 'approved').length,
        rejected: docs.filter(d => (d.status || '').toLowerCase() === 'rejected').length,
        total: docs.length
      }
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
      this.stallholderDocuments = [] // Reset documents
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
      this.stallholderDocuments = []
      this.loadingDocuments = false
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
    },

    // === Document Review Methods ===
    async fetchStallholderDocuments(stallholderId) {
      this.loadingDocuments = true
      this.stallholderDocuments = []
      try {
        const response = await apiClient.get(`/documents/stallholder/${stallholderId}/submissions`)
        console.log('Document submissions response:', response)

        if (response.data && Array.isArray(response.data.data)) {
          this.stallholderDocuments = response.data.data
        } else if (Array.isArray(response.data)) {
          this.stallholderDocuments = response.data
        } else {
          this.stallholderDocuments = []
        }

        console.log(`Found ${this.stallholderDocuments.length} documents for stallholder ${stallholderId}`)
      } catch (error) {
        console.error('Error fetching stallholder documents:', error)
        this.stallholderDocuments = []
        this.showDocSnackbar('Failed to load documents', 'error')
      } finally {
        this.loadingDocuments = false
      }
    },

    getDocStatusColor(status) {
      switch ((status || '').toLowerCase()) {
        case 'approved': return 'success'
        case 'rejected': return 'error'
        case 'pending': return 'warning'
        default: return 'grey'
      }
    },

    getDocStatusIcon(status) {
      switch ((status || '').toLowerCase()) {
        case 'approved': return 'mdi-check-circle'
        case 'rejected': return 'mdi-close-circle'
        case 'pending': return 'mdi-clock-outline'
        default: return 'mdi-file-document'
      }
    },

    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    async previewDocument(doc) {
      this.previewingDocument = doc
      this.documentPreviewUrl = ''
      this.documentPreviewError = false
      this.imageZoom = 1
      this.showDocPreviewDialog = true

      try {
        // Documents are stored as BLOB in database
        // Use the public endpoint under /api/documents (no auth required for direct img src access)
        const documentId = doc.document_id
        if (documentId) {
          // Public blob endpoint at /api/documents/blob/:documentId
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
          this.documentPreviewUrl = `${baseUrl}/documents/blob/${documentId}`
          console.log('Document preview URL:', this.documentPreviewUrl)
        } else {
          console.error('No document_id available for preview')
          this.documentPreviewError = true
        }
      } catch (error) {
        console.error('Error setting up document preview:', error)
        this.documentPreviewError = true
      }
    },

    closeDocPreview() {
      if (this.documentPreviewUrl && this.documentPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.documentPreviewUrl)
      }
      this.showDocPreviewDialog = false
      this.previewingDocument = null
      this.documentPreviewUrl = ''
      this.documentPreviewError = false
      this.imageZoom = 1
    },

    // Zoom controls for image preview
    zoomIn() {
      if (this.imageZoom < 3) {
        this.imageZoom = Math.min(3, this.imageZoom + 0.25)
      }
    },

    zoomOut() {
      if (this.imageZoom > 0.5) {
        this.imageZoom = Math.max(0.5, this.imageZoom - 0.25)
      }
    },

    resetZoom() {
      this.imageZoom = 1
    },

    isPreviewableImage(doc) {
      if (!doc) return false
      const fileName = (doc.file_name || doc.original_filename || '').toLowerCase()
      const fileType = (doc.file_type || '').toLowerCase()
      return fileType.startsWith('image/') || 
             fileName.endsWith('.jpg') || 
             fileName.endsWith('.jpeg') || 
             fileName.endsWith('.png') || 
             fileName.endsWith('.gif') ||
             fileName.endsWith('.webp')
    },

    isPreviewablePdf(doc) {
      if (!doc) return false
      const fileName = (doc.file_name || doc.original_filename || '').toLowerCase()
      const fileType = (doc.file_type || '').toLowerCase()
      return fileType === 'application/pdf' || fileName.endsWith('.pdf')
    },

    async downloadDocument(doc) {
      try {
        const filePath = doc.file_path || doc.file_url
        if (filePath) {
          let downloadUrl
          if (filePath.startsWith('http')) {
            downloadUrl = filePath
          } else {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
            downloadUrl = `${baseUrl.replace('/api', '')}${filePath}`
          }
          
          // Open in new tab to trigger download
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = doc.file_name || doc.original_filename || `document_${doc.document_id}`
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } else {
          this.showDocSnackbar('Document file not available', 'error')
        }
      } catch (error) {
        console.error('Error downloading document:', error)
        this.showDocSnackbar('Failed to download document', 'error')
      }
    },

    async approveDocument(doc) {
      const docId = doc.document_id || doc.submission_id
      this.processingDocId = docId
      try {
        await apiClient.put(`/documents/${docId}/review`, {
          status: 'approved',
          rejection_reason: null
        })
        
        // Update local state
        const index = this.stallholderDocuments.findIndex(d => (d.document_id || d.submission_id) === docId)
        if (index !== -1) {
          this.stallholderDocuments[index].status = 'approved'
          this.stallholderDocuments[index].rejection_reason = null
        }
        
        this.showDocSnackbar('Document approved successfully', 'success')
      } catch (error) {
        console.error('Error approving document:', error)
        this.showDocSnackbar('Failed to approve document', 'error')
      } finally {
        this.processingDocId = null
      }
    },

    openRejectDialog(doc) {
      this.documentToReject = doc
      this.docRejectionReason = ''
      this.showDocRejectDialog = true
    },

    closeRejectDialog() {
      this.showDocRejectDialog = false
      this.documentToReject = null
      this.docRejectionReason = ''
    },

    async confirmRejectDocument() {
      if (!this.documentToReject) return
      
      const docId = this.documentToReject.document_id || this.documentToReject.submission_id
      this.processingDocId = docId
      try {
        await apiClient.put(`/documents/${docId}/review`, {
          status: 'rejected',
          rejection_reason: this.docRejectionReason || 'Document rejected by branch manager'
        })
        
        // Update local state
        const index = this.stallholderDocuments.findIndex(d => (d.document_id || d.submission_id) === docId)
        if (index !== -1) {
          this.stallholderDocuments[index].status = 'rejected'
          this.stallholderDocuments[index].rejection_reason = this.docRejectionReason
        }
        
        this.showDocSnackbar('Document rejected', 'warning')
        this.closeRejectDialog()
      } catch (error) {
        console.error('Error rejecting document:', error)
        this.showDocSnackbar('Failed to reject document', 'error')
      } finally {
        this.processingDocId = null
      }
    },

    showDocSnackbar(message, color = 'success') {
      this.docSnackbar = {
        show: true,
        message,
        color
      }
    },

    refreshStallholderDocuments() {
      if (this.selectedStallholder) {
        this.fetchStallholderDocuments(this.selectedStallholder.stallholder_id)
      }
    },

    getDocFileTypeColor(fileType) {
      if (!fileType) return 'grey'
      const type = fileType.toLowerCase()
      if (type.includes('pdf')) return 'red'
      if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) return 'green'
      if (type.includes('word') || type.includes('doc')) return 'blue'
      if (type.includes('excel') || type.includes('sheet') || type.includes('xls')) return 'teal'
      return 'grey'
    },

    getDocFileTypeIcon(fileType) {
      if (!fileType) return 'mdi-file'
      const type = fileType.toLowerCase()
      if (type.includes('pdf')) return 'mdi-file-pdf-box'
      if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) return 'mdi-file-image'
      if (type.includes('word') || type.includes('doc')) return 'mdi-file-word'
      if (type.includes('excel') || type.includes('sheet') || type.includes('xls')) return 'mdi-file-excel'
      return 'mdi-file-document'
    },

    // Check if document is an image (for preview) - checks both file_type and file_name
    isImageDocument(fileTypeOrDoc) {
      // If passed a document object, check multiple fields
      if (fileTypeOrDoc && typeof fileTypeOrDoc === 'object') {
        const fileType = (fileTypeOrDoc.file_type || '').toLowerCase()
        const fileName = (fileTypeOrDoc.file_name || fileTypeOrDoc.original_filename || '').toLowerCase()
        return fileType.includes('image') || 
               fileType.startsWith('image/') ||
               fileName.endsWith('.jpg') || 
               fileName.endsWith('.jpeg') || 
               fileName.endsWith('.png') || 
               fileName.endsWith('.gif') ||
               fileName.endsWith('.webp')
      }
      // If passed a string (file_type or file_name)
      if (!fileTypeOrDoc) return false
      const type = fileTypeOrDoc.toLowerCase()
      return type.includes('image') || 
             type.startsWith('image/') ||
             type.endsWith('.jpg') || 
             type.endsWith('.jpeg') || 
             type.endsWith('.png') || 
             type.endsWith('.gif') ||
             type.endsWith('.webp')
    },

    // Check if document is a PDF (for preview) - checks both file_type and file_name
    isPdfDocument(fileTypeOrDoc) {
      // If passed a document object, check multiple fields
      if (fileTypeOrDoc && typeof fileTypeOrDoc === 'object') {
        const fileType = (fileTypeOrDoc.file_type || '').toLowerCase()
        const fileName = (fileTypeOrDoc.file_name || fileTypeOrDoc.original_filename || '').toLowerCase()
        return fileType.includes('pdf') || fileName.endsWith('.pdf')
      }
      // If passed a string (file_type or file_name)
      if (!fileTypeOrDoc) return false
      const type = fileTypeOrDoc.toLowerCase()
      return type.includes('pdf') || type.endsWith('.pdf')
    },

    // Alias for backward compatibility
    isPreviewableImage(doc) {
      if (!doc) return false
      return this.isImageDocument(doc.file_type || doc.file_name)
    },

    // Alias for backward compatibility
    isPreviewablePdf(doc) {
      if (!doc) return false
      return this.isPdfDocument(doc.file_type || doc.file_name)
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
    },

    activeTab(newTab) {
      // Fetch documents when the documents tab is selected
      if (newTab === 'documents' && this.selectedStallholder && this.stallholderDocuments.length === 0) {
        this.fetchStallholderDocuments(this.selectedStallholder.stallholder_id)
      }
    }
  },

  mounted() {
    this.fetchStallholders()
  }
}
