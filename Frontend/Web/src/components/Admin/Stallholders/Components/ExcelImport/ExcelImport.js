import apiClient from '@/services/apiClient'

export default {
  name: 'ExcelImport',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentStep: 1,
      selectedFile: null,
      uploading: false,
      importing: false,
      
      // Preview data
      previewData: [],
      validationErrors: [],
      
      // Import results
      importSuccess: false,
      importMessage: '',
      
      // Feedback
      showError: false,
      errorMessage: '',
      
      // File validation rules
      fileRules: [
        v => !v || v.size <= 10485760 || 'File size must be less than 10MB',
        v => !v || ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(v.type) || 'File must be an Excel file (.xlsx or .xls)'
      ],

      // Preview table headers
      previewHeaders: [
        { text: 'Name', value: 'stallholder_name', sortable: false },
        { text: 'Email', value: 'email', sortable: false },
        { text: 'Phone', value: 'phone', sortable: false },
        { text: 'Business', value: 'business_name', sortable: false },
        { text: 'Type', value: 'business_type', sortable: false },
        { text: 'Status', value: '_isValid', sortable: false, align: 'center', width: '80px' }
      ]
    }
  },
  computed: {
    validRecords() {
      return this.previewData.filter(record => record._isValid).length
    },
    invalidRecords() {
      return this.previewData.length - this.validRecords
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.resetForm()
      }
    }
  },
  methods: {
    onFileSelected() {
      // File validation will be handled by the file input rules
    },

    async downloadTemplate() {
      try {
        const response = await apiClient.get('/stallholders/excel/template', {
          responseType: 'blob'
        })
        
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'stallholder_import_template.xlsx'
        link.click()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading template:', error)
        this.showErrorMessage('Failed to download template')
      }
    },

    async uploadAndPreview() {
      if (!this.selectedFile) return

      this.uploading = true
      try {
        const formData = new FormData()
        formData.append('file', this.selectedFile)

        const response = await apiClient.post('/stallholders/excel/preview', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        this.previewData = response.data.data || []
        this.validationErrors = response.data.errors || []
        
        // Mark each record as valid or invalid based on validation
        this.previewData.forEach(record => {
          record._isValid = this.validateRecord(record)
        })

        this.currentStep = 2
      } catch (error) {
        console.error('Error previewing file:', error)
        this.showErrorMessage(
          error.response?.data?.error || 'Failed to preview Excel file'
        )
      } finally {
        this.uploading = false
      }
    },

    validateRecord(record) {
      // Basic validation - check required fields
      const required = ['stallholder_name', 'email', 'phone', 'business_name', 'business_type']
      return required.every(field => record[field] && record[field].toString().trim())
    },

    async importData() {
      if (this.validRecords === 0) return

      this.importing = true
      try {
        const validData = this.previewData.filter(record => record._isValid)
        
        const response = await apiClient.post('/stallholders/excel/import', {
          data: validData
        })

        this.importSuccess = true
        this.importMessage = `Successfully imported ${response.data.imported} of ${validData.length} records.`
        
        if (response.data.skipped > 0) {
          this.importMessage += ` ${response.data.skipped} records were skipped due to duplicates.`
        }

        this.currentStep = 3
      } catch (error) {
        console.error('Error importing data:', error)
        this.importSuccess = false
        this.importMessage = error.response?.data?.error || 'Failed to import stallholder data'
        this.currentStep = 3
      } finally {
        this.importing = false
      }
    },

    closeAndRefresh() {
      this.$emit('import-complete')
      this.closeDialog()
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    resetForm() {
      this.currentStep = 1
      this.selectedFile = null
      this.previewData = []
      this.validationErrors = []
      this.importSuccess = false
      this.importMessage = ''
      this.uploading = false
      this.importing = false
    },

    closeDialog() {
      this.$emit('close')
      this.resetForm()
    },

    showErrorMessage(message) {
      this.errorMessage = message
      this.showError = true
    }
  }
}