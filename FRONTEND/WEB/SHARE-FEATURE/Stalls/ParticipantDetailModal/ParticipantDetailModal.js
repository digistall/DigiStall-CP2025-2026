import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default {
  name: 'ParticipantDetailModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    applicantId: {
      type: [Number, String],
      default: null
    }
  },
  emits: ['close'],
  data() {
    return {
      loading: false,
      error: null,
      detail: null,
      // Document viewer
      showDocViewer: false,
      docViewerUrl: '',
      docViewerTitle: '',
      docViewerLoading: false,
      docViewerError: false,
      // Inline document image previews
      documentImages: {},
      documentLoadingStates: {},
      // Track failed otherInfo images
      otherInfoImageFailed: {}
    }
  },
  watch: {
    show: {
      handler(newVal) {
        if (newVal && this.applicantId) {
          this.fetchDetail()
        }
      },
      immediate: true
    }
  },
  methods: {
    handleClose() {
      // Revoke all document image blob URLs to free memory
      Object.values(this.documentImages).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      this.documentImages = {}
      this.documentLoadingStates = {}
      this.otherInfoImageFailed = {}
      this.$emit('close')
    },

    async fetchDetail() {
      if (!this.applicantId) return

      this.loading = true
      this.error = null
      this.detail = null

      try {
        const token = sessionStorage.getItem('authToken')
        const response = await axios.get(
          `${API_BASE_URL}/stalls/participants/${this.applicantId}/detail`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        if (response.data.success) {
          this.detail = response.data.data
          console.log('📋 Participant detail loaded:', this.detail)
          // Pre-load document images for inline previews
          this.loadDocumentImages()
        } else {
          this.error = response.data.message || 'Failed to load details'
        }
      } catch (err) {
        console.error('Error fetching participant detail:', err)
        this.error = err.response?.data?.message || 'Failed to load participant details'
      } finally {
        this.loading = false
      }
    },

    async loadDocumentImages() {
      if (!this.detail || !this.detail.documents) return
      const token = sessionStorage.getItem('authToken')
      
      for (const doc of this.detail.documents) {
        this.documentLoadingStates = { ...this.documentLoadingStates, [doc.documentId]: true }
        try {
          const response = await axios.get(
            `${API_BASE_URL}/applicants/documents/blob/id/${doc.documentId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob'
            }
          )
          const blobUrl = URL.createObjectURL(response.data)
          this.documentImages = { ...this.documentImages, [doc.documentId]: blobUrl }
        } catch (err) {
          console.error(`Error loading document ${doc.documentId}:`, err)
        } finally {
          this.documentLoadingStates = { ...this.documentLoadingStates, [doc.documentId]: false }
        }
      }
    },

    getStaticFileUrl(filename) {
      if (!filename) return ''
      const baseUrl = API_BASE_URL.replace('/api', '')
      return `${baseUrl}/uploads/${filename}`
    },

    handleOtherInfoImageError(key) {
      this.otherInfoImageFailed = { ...this.otherInfoImageFailed, [key]: true }
    },

    getDocLabel(type) {
      if (!type) return 'DOCUMENT'
      const labels = {
        'signature': 'SIGNATURE',
        'valid_id': 'VALID ID',
        'house_location': 'HOUSE LOCATION SKETCH',
        'house_sketch': 'HOUSE LOCATION SKETCH'
      }
      return labels[type.toLowerCase()] || type.toUpperCase()
    },

    formatDate(date) {
      if (!date) return 'N/A'
      try {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch {
        return 'N/A'
      }
    },

    formatPrice(amount) {
      if (!amount) return '0.00'
      return parseFloat(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    capitalize(str) {
      if (!str) return 'N/A'
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    },

    getStatusColor(status) {
      const colors = {
        active: 'success',
        approved: 'success',
        pending: 'warning',
        under_review: 'info',
        rejected: 'error',
        inactive: 'grey'
      }
      return colors[status] || 'grey'
    },

    getVerificationColor(status) {
      const colors = {
        Approved: 'success',
        Pending: 'warning',
        Rejected: 'error'
      }
      return colors[status] || 'grey'
    },

    getDocIcon(type) {
      if (!type) return 'mdi-file-document'
      const lower = type.toLowerCase()
      if (lower.includes('id') || lower.includes('valid')) return 'mdi-card-account-details'
      if (lower.includes('signature')) return 'mdi-draw'
      if (lower.includes('house') || lower.includes('sketch')) return 'mdi-home-map-marker'
      if (lower.includes('permit') || lower.includes('business')) return 'mdi-briefcase'
      if (lower.includes('photo') || lower.includes('picture')) return 'mdi-camera'
      return 'mdi-file-document'
    },

    viewDocument(filePath, title) {
      if (!filePath) return
      // other_information files are just filenames, try static URL
      const baseUrl = API_BASE_URL.replace('/api', '')
      this.docViewerUrl = `${baseUrl}/uploads/${filePath}`
      this.docViewerTitle = title || 'Document'
      this.docViewerError = false
      this.showDocViewer = true
    },

    async viewUploadedDocument(doc) {
      if (!doc) return
      this.docViewerTitle = doc.type || doc.name || 'Document'
      this.docViewerUrl = ''
      this.docViewerLoading = true
      this.docViewerError = false
      this.showDocViewer = true

      try {
        const token = sessionStorage.getItem('authToken')
        const response = await axios.get(
          `${API_BASE_URL}/applicants/documents/blob/id/${doc.documentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          }
        )

        // Create object URL from the blob response
        const blobUrl = URL.createObjectURL(response.data)
        this.docViewerUrl = blobUrl
      } catch (err) {
        console.error('Error fetching document blob:', err)
        // Fallback: try direct file URL if filePath exists
        if (doc.filePath && !doc.filePath.startsWith('/api')) {
          const baseUrl = API_BASE_URL.replace('/api', '')
          this.docViewerUrl = `${baseUrl}/uploads/${doc.filePath}`
        } else {
          this.docViewerError = true
        }
      } finally {
        this.docViewerLoading = false
      }
    },

    closeDocViewer() {
      // Revoke object URL to free memory
      if (this.docViewerUrl && this.docViewerUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.docViewerUrl)
      }
      this.docViewerUrl = ''
      this.docViewerTitle = ''
      this.docViewerError = false
      this.showDocViewer = false
    }
  }
}
