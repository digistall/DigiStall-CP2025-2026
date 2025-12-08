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
      // Applicant documents from htdocs
      applicantDocuments: {
        signature: null,
        house_location: null,
        valid_id: null
      },
      documentPreview: {
        show: false,
        url: '',
        title: ''
      }
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
    // Fetch documents from htdocs for the selected applicant
    async fetchApplicantDocuments(applicant) {
      this.resetApplicantDocuments()
      
      if (!applicant) return
      
      const applicantId = applicant.applicant_id || applicant.id
      const branchId = applicant.branch_id || applicant.stall_info?.branch_id || '1'
      
      console.log(`📄 Fetching documents for applicant ${applicantId}, branch ${branchId}`)
      
      // Base URL for applicant documents in htdocs
      const baseUrl = `http://localhost/digistall_uploads/applicants/${branchId}/${applicantId}`
      
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
