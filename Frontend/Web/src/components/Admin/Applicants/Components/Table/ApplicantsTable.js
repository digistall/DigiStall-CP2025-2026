export default {
  name: 'VendorApplicantsTable',
  props: {
    applicants: {
      type: Array,
      default: () => [],
    },
    applicantType: {
      type: String,
      default: 'Vendor Applicants',
    },
  },
  emits: ['accept', 'decline', 'recheck', 'refresh'],
  data() {
    return {
      showConfirmDialog: false,
      showInfoDialog: false,
      confirmAction: '',
      selectedApplicant: null,
      activeTab: 'personal',
      // Applicant documents - now from BLOB API
      applicantDocuments: {
        signature: null,
        house_location: null,
        valid_id: null
      },
      // Loading state for documents
      loadingDocuments: true,
      documentPreview: {
        show: false,
        url: '',
        title: ''
      },
      // Flag to toggle between BLOB API and legacy file system
      useBlobStorage: true
    }
  },
  watch: {
    // When selectedApplicant changes, fetch documents
    selectedApplicant: {
      handler(newApplicant) {
        if (newApplicant) {
          this.fetchApplicantDocuments(newApplicant)
        } else {
          this.resetApplicantDocuments()
        }
      },
      immediate: true
    }
  },
  methods: {
    // Fetch documents for the selected applicant
    async fetchApplicantDocuments(applicant) {
      this.loadingDocuments = true
      this.resetApplicantDocuments()
      
      if (!applicant) {
        this.loadingDocuments = false
        return
      }
      
      const applicantId = applicant.applicant_id || applicant.id
      const businessOwnerId = applicant.business_owner_id || applicant.stall_info?.business_owner_id
      
      console.log(`📄 Fetching documents for applicant ${applicantId}`)
      
      try {
        if (this.useBlobStorage) {
          // Use BLOB API for cloud storage
          await this.fetchDocumentsFromBlobApi(applicantId, businessOwnerId)
        } else {
          // Fallback to legacy file system
          await this.fetchDocumentsFromFileSystem(applicant)
        }
      } finally {
        this.loadingDocuments = false
      }
    },
    
    // Fetch documents from BLOB API (cloud storage)
    async fetchDocumentsFromBlobApi(applicantId, businessOwnerId) {
      try {
        // API base URL - remove /api suffix if present to avoid double /api/api/
        let apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        apiBase = apiBase.replace(/\/api\/?$/, '') // Remove trailing /api if present
        
        // Get token for authenticated requests (stored as 'authToken' by authStore)
        const token = localStorage.getItem('authToken') || localStorage.getItem('token')
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        
        console.log('🔐 Auth token present:', !!token)
        
        // Try to fetch all documents for this applicant with base64 data
        let url = `${apiBase}/api/applicants/${applicantId}/documents/blob?include_data=true`
        if (businessOwnerId) {
          url += `&business_owner_id=${businessOwnerId}`
        }
        
        const response = await fetch(url, { headers })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // Map document types to our display
            const documentTypeMap = {
              1: 'signature',
              2: 'house_location',
              3: 'valid_id'
            }
            
            // Also map by document name
            const documentNameMap = {
              'signature': 'signature',
              'house location': 'house_location',
              'house_location': 'house_location',
              'valid id': 'valid_id',
              'valid_id': 'valid_id',
              'government id': 'valid_id'
            }
            
            for (const doc of result.data) {
              // Determine document type from type_id or name
              let docType = documentTypeMap[doc.document_type_id]
              if (!docType && doc.document_name) {
                docType = documentNameMap[doc.document_name.toLowerCase()]
              }
              
              if (docType && this.applicantDocuments.hasOwnProperty(docType)) {
                // Use base64 data if available, otherwise use BLOB URL
                if (doc.document_data_base64) {
                  this.applicantDocuments[docType] = doc.document_data_base64
                  console.log(`✅ Found ${docType} from BLOB API (base64)`)
                } else if (doc.blob_url) {
                  // Use the BLOB API endpoint directly
                  this.applicantDocuments[docType] = `${apiBase}${doc.blob_url}`
                  console.log(`✅ Found ${docType} from BLOB API (URL)`)
                }
              }
            }
          }
        } else {
          console.warn('📄 BLOB API returned non-OK, trying legacy file system...')
          // Fallback to file system if BLOB API fails
          await this.fetchDocumentsFromFileSystem({ applicant_id: applicantId })
        }
      } catch (error) {
        console.error('❌ Error fetching documents from BLOB API:', error)
        // Fallback to file system on error
        await this.fetchDocumentsFromFileSystem({ applicant_id: applicantId })
      }
    },
    
    // Legacy: Fetch documents from htdocs file system
    async fetchDocumentsFromFileSystem(applicant) {
      const applicantId = applicant.applicant_id || applicant.id
      const branchId = applicant.branch_id || applicant.stall_info?.branch_id || '1'
      
      console.log(`📄 Fetching documents from file system for applicant ${applicantId}, branch ${branchId}`)
      
      // Base URL for applicant documents - use API server to serve files
      let apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      apiBase = apiBase.replace(/\/api\/?$/, '') // Remove trailing /api if present
      const baseUrl = `${apiBase}/uploads/applicants/${branchId}/${applicantId}`
      
      // Check for each document type with common extensions
      const documentTypes = ['signature', 'house_location', 'valid_id']
      const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
      
      for (const docType of documentTypes) {
        for (const ext of extensions) {
          const imageUrl = `${baseUrl}/${docType}${ext}`
          const exists = await this.checkImageExists(imageUrl)
          if (exists) {
            this.applicantDocuments[docType] = imageUrl
            console.log(`✅ Found ${docType}: ${imageUrl}`)
            break // Found the image, stop checking extensions
          }
        }
      }
    },
    
    // Check if an image exists at the given URL
    async checkImageExists(url) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = url
      })
    },
    
    // Reset document URLs
    resetApplicantDocuments() {
      this.applicantDocuments = {
        signature: null,
        house_location: null,
        valid_id: null
      }
    },
    
    // Handle document image load error
    handleDocumentError(docType) {
      console.warn(`⚠️ Failed to load ${docType} document`)
      this.applicantDocuments[docType] = null
    },
    
    // Open document preview
    openDocumentPreview(url, title) {
      if (url) {
        window.open(url, '_blank')
      }
    },

    acceptApplicant(applicant) {
      console.log('📋 Accept clicked - Full applicant object:', applicant)
      console.log('📋 Accept - applicant_id:', applicant.applicant_id)
      console.log('📋 Accept - application_id:', applicant.application_id)
      console.log('📋 Accept - id:', applicant.id)
      this.selectedApplicant = applicant
      this.confirmAction = 'accept'
      this.showConfirmDialog = true
    },
    declineApplicant(applicant) {
      console.log('📋 Decline clicked - Full applicant object:', applicant)
      console.log('📋 Decline - applicant_id:', applicant.applicant_id)
      console.log('📋 Decline - application_id:', applicant.application_id)
      console.log('📋 Decline - id:', applicant.id)
      this.selectedApplicant = applicant
      this.confirmAction = 'decline'
      this.showConfirmDialog = true
    },
    viewMoreInfo(applicant) {
      this.selectedApplicant = applicant
      this.activeTab = 'personal'
      this.showInfoDialog = true
    },
    confirmActionHandler() {
      console.log('✅ Confirm action - selectedApplicant:', this.selectedApplicant)
      console.log('✅ Confirm action - applicant_id to use:', this.selectedApplicant?.applicant_id)
      if (this.confirmAction === 'accept') {
        this.$emit('accept', this.selectedApplicant)
      } else {
        this.$emit('decline', this.selectedApplicant)
      }
      this.showConfirmDialog = false
      this.selectedApplicant = null
      this.confirmAction = ''
    },
    formatDate(date) {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
    formatCurrency(amount) {
      if (!amount) return '0.00'
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    },
    getStallTypeColor(priceType) {
      switch (priceType) {
        case 'Fixed Price':
          return 'primary'
        case 'Raffle':
          return 'primary'
        case 'Auction':
          return 'primary'
        default:
          return 'primary'
      }
    },
    getApplicationStatusColor(status) {
      switch (status) {
        case 'Approved':
          return 'success'
        case 'Pending':
          return 'warning'
        case 'Under Review':
          return 'info'
        case 'Rejected':
          return 'error'
        case 'Cancelled':
          return 'gray'
        default:
          return 'gray'
      }
    },

    formatStatusDate(date) {
      if (!date) return ''
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
      return new Date(date).toLocaleDateString('en-US', options)
    },

    getStatusIcon(status) {
      switch (status) {
        case 'Approved':
          return 'mdi-check-circle'
        case 'Rejected':
          return 'mdi-close-circle'
        case 'Under Review':
          return 'mdi-clock-alert-outline'
        case 'Cancelled':
          return 'mdi-cancel'
        case 'Pending':
        default:
          return 'mdi-clock-outline'
      }
    },

    getStatusColor(status) {
      switch (status) {
        case 'Approved':
          return 'success'
        case 'Rejected':
          return 'error'
        case 'Under Review':
          return 'info'
        case 'Cancelled':
          return 'warning'
        case 'Pending':
        default:
          return 'warning'
      }
    },

    getStatusText(status) {
      switch (status) {
        case 'Approved':
          return 'APPROVED'
        case 'Rejected':
          return 'REJECTED'
        case 'Under Review':
          return 'UNDER REVIEW'
        case 'Cancelled':
          return 'CANCELLED'
        case 'Pending':
        default:
          return 'PENDING'
      }
    },

    // Check if application status is processed (not pending)
    isProcessedStatus(status) {
      const processedStatuses = ['Approved', 'Rejected', 'Under Review', 'Cancelled']
      return processedStatuses.includes(status)
    },

    // Handle status badge click for re-check or approve
    handleStatusClick(applicant) {
      if (applicant.application_status === 'Rejected') {
        // Re-check functionality for rejected applicants
        this.$emit('recheck', applicant)
      } else if (applicant.application_status === 'Under Review') {
        // Approve functionality for under review applicants
        this.$emit('accept', applicant)
      }
    },
  },
}
