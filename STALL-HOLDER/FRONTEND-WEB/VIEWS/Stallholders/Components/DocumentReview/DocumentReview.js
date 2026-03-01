import { apiClient } from '../../../../../services/apiClient.js'

export default {
  name: 'DocumentReview',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // Data
      submissions: [],
      counts: {
        total: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0
      },
      
      // UI State
      loading: false,
      activeFilter: 'pending',
      searchQuery: '',
      
      // Document Preview
      showPreviewDialog: false,
      selectedDocument: null,
      documentPreviewUrl: '',
      previewError: false,
      
      // Rejection Dialog
      showRejectDialog: false,
      documentToReject: null,
      rejectionReason: '',
      
      // Processing
      processingId: null,
      
      // Snackbar
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      }
    }
  },
  computed: {
    filteredSubmissions() {
      let filtered = [...this.submissions]
      
      // Apply status filter
      if (this.activeFilter && this.activeFilter !== 'all') {
        filtered = filtered.filter(s => s.status === this.activeFilter)
      }
      
      // Apply search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(s => 
          s.stallholder_name?.toLowerCase().includes(query) ||
          s.business_name?.toLowerCase().includes(query) ||
          s.document_name?.toLowerCase().includes(query) ||
          s.file_name?.toLowerCase().includes(query) ||
          s.stall_no?.toLowerCase().includes(query)
        )
      }
      
      return filtered
    }
  },
  methods: {
    // Data Fetching
    async fetchSubmissions() {
      this.loading = true
      try {
        const response = await apiClient.get('/documents/submissions', {
          params: {
            status: 'all',
            limit: 100
          }
        })
        
        if (response.data.success) {
          this.submissions = response.data.data || []
        } else {
          throw new Error(response.data.message || 'Failed to fetch submissions')
        }
      } catch (error) {
        console.error('Error fetching document submissions:', error)
        this.showNotification('Failed to load document submissions', 'error')
        this.submissions = []
      } finally {
        this.loading = false
      }
    },
    
    async fetchCounts() {
      try {
        const response = await apiClient.get('/documents/submissions/counts')
        
        if (response.data.success) {
          this.counts = response.data.data
        }
      } catch (error) {
        console.error('Error fetching submission counts:', error)
      }
    },
    
    async refreshData() {
      await Promise.all([
        this.fetchSubmissions(),
        this.fetchCounts()
      ])
    },
    
    // Filter
    setFilter(filter) {
      this.activeFilter = filter
    },
    
    // Document Actions
    async approveDocument(submission) {
      this.processingId = submission.submission_id
      try {
        const response = await apiClient.put(
          `/documents/submissions/${submission.submission_id}/review`,
          { status: 'approved' }
        )
        
        if (response.data.success) {
          this.showNotification('Document approved successfully', 'success')
          
          // Update local state
          const index = this.submissions.findIndex(s => s.submission_id === submission.submission_id)
          if (index !== -1) {
            this.submissions[index].status = 'approved'
          }
          
          // Refresh counts
          await this.fetchCounts()
          
          // Close preview dialog if open
          if (this.showPreviewDialog && this.selectedDocument?.submission_id === submission.submission_id) {
            this.showPreviewDialog = false
          }
        } else {
          throw new Error(response.data.message || 'Failed to approve document')
        }
      } catch (error) {
        console.error('Error approving document:', error)
        this.showNotification(error.message || 'Failed to approve document', 'error')
      } finally {
        this.processingId = null
      }
    },
    
    openRejectDialog(submission) {
      this.documentToReject = submission
      this.rejectionReason = ''
      this.showRejectDialog = true
    },
    
    async rejectDocument() {
      if (!this.documentToReject || !this.rejectionReason) return
      
      this.processingId = this.documentToReject.submission_id
      try {
        const response = await apiClient.put(
          `/documents/submissions/${this.documentToReject.submission_id}/review`,
          { 
            status: 'rejected',
            rejection_reason: this.rejectionReason
          }
        )
        
        if (response.data.success) {
          this.showNotification('Document rejected', 'warning')
          
          // Update local state
          const index = this.submissions.findIndex(s => s.submission_id === this.documentToReject.submission_id)
          if (index !== -1) {
            this.submissions[index].status = 'rejected'
            this.submissions[index].rejection_reason = this.rejectionReason
          }
          
          // Refresh counts
          await this.fetchCounts()
          
          // Close dialogs
          this.showRejectDialog = false
          if (this.showPreviewDialog && this.selectedDocument?.submission_id === this.documentToReject.submission_id) {
            this.showPreviewDialog = false
          }
          
          this.documentToReject = null
          this.rejectionReason = ''
        } else {
          throw new Error(response.data.message || 'Failed to reject document')
        }
      } catch (error) {
        console.error('Error rejecting document:', error)
        this.showNotification(error.message || 'Failed to reject document', 'error')
      } finally {
        this.processingId = null
      }
    },
    
    // Document Preview
    async openDocumentPreview(submission) {
      this.selectedDocument = submission
      this.previewError = false
      
      // Build preview URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      this.documentPreviewUrl = `${baseUrl}/api/stallholders/documents/submissions/${submission.submission_id}/blob`
      
      this.showPreviewDialog = true
    },
    
    downloadDocument() {
      if (!this.selectedDocument) return
      
      const link = document.createElement('a')
      link.href = this.documentPreviewUrl
      link.download = this.selectedDocument.file_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    
    // Utility Methods
    getStatusColor(status) {
      const colors = {
        pending: 'warning',
        approved: 'success',
        rejected: 'error'
      }
      return colors[status] || 'grey'
    },
    
    getFileTypeIcon(mimeType) {
      if (!mimeType) return 'mdi-file-document-outline'
      
      if (mimeType.includes('image')) return 'mdi-file-image'
      if (mimeType.includes('pdf')) return 'mdi-file-pdf-box'
      if (mimeType.includes('word') || mimeType.includes('document')) return 'mdi-file-word'
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'mdi-file-excel'
      
      return 'mdi-file-document-outline'
    },
    
    getFileTypeColor(mimeType) {
      if (!mimeType) return 'grey'
      
      if (mimeType.includes('image')) return 'green'
      if (mimeType.includes('pdf')) return 'red'
      if (mimeType.includes('word')) return 'blue'
      if (mimeType.includes('excel')) return 'green'
      
      return 'grey'
    },
    
    isImageFile(mimeType) {
      return mimeType && mimeType.includes('image')
    },
    
    isPdfFile(mimeType) {
      return mimeType && mimeType.includes('pdf')
    },
    
    getInitials(name) {
      if (!name) return '?'
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    
    formatDateTime(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    formatFileSize(bytes) {
      if (!bytes) return 'Unknown'
      
      const units = ['B', 'KB', 'MB', 'GB']
      let size = bytes
      let unitIndex = 0
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }
      
      return `${size.toFixed(1)} ${units[unitIndex]}`
    },
    
    showNotification(message, color = 'success') {
      this.snackbar = {
        show: true,
        message,
        color
      }
    }
  },
  
  mounted() {
    this.refreshData()
  },
  
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.refreshData()
      }
    }
  }
}
