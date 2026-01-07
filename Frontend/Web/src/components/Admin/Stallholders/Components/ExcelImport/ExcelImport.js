import apiClient from '@/services/apiClient'
import ToastNotification from '../../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'ExcelImport',
  components: {
    ToastNotification
  },
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
      importSummary: null,
      
      // Import results
      importSuccess: false,
      importMessage: '',
      
      // Toast notification
      toast: {
        show: false,
        message: '',
        type: 'error'
      },
      
      // File validation rules
      fileRules: [
        v => !v || v.size <= 10485760 || 'File size must be less than 10MB',
        v => !v || ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(v.type) || 'File must be an Excel file (.xlsx or .xls)'
      ],

      // Preview table headers - Updated to match new template format
      previewHeaders: [
        { text: 'Stall No.', value: 'stall_no', sortable: false, width: '100px' },
        { text: 'Stallholder Name', value: 'stallholder_name', sortable: false },
        { text: 'Business Type', value: 'business_type', sortable: false },
        { text: 'Area (sqm)', value: 'area_occupied', sortable: false, width: '100px' },
        { text: 'Monthly Rent', value: 'monthly_rent', sortable: false, width: '120px' },
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
    },
    newStallsCount() {
      return this.previewData.filter(record => !record._stallExists && record._isValid).length
    },
    existingStallsCount() {
      return this.previewData.filter(record => record._stallExists && record._isValid).length
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
        
        this.showToast('✅ Template downloaded successfully', 'success')
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
        this.importSummary = response.data.summary || null
        
        // Extract validation errors from response
        this.validationErrors = []
        if (response.data.errors && response.data.errors.length > 0) {
          response.data.errors.forEach(err => {
            if (err.errors && err.errors.length > 0) {
              err.errors.forEach(e => {
                this.validationErrors.push(`Row ${err.row}: ${e}`)
              })
            }
          })
        }

        // Also gather row-level errors
        this.previewData.forEach(record => {
          if (record._rowErrors && record._rowErrors.length > 0) {
            record._rowErrors.forEach(e => {
              if (!this.validationErrors.includes(`Row ${record.row_number}: ${e}`)) {
                this.validationErrors.push(`Row ${record.row_number}: ${e}`)
              }
            })
          }
        })

        this.currentStep = 2
      } catch (error) {
        console.error('Error previewing file:', error)
        this.showErrorMessage(
          error.response?.data?.message || error.response?.data?.error || 'Failed to preview Excel file'
        )
      } finally {
        this.uploading = false
      }
    },

    validateRecord(record) {
      // Basic validation - check required fields based on new format
      return record._isValid !== false && record.stall_no && record.stallholder_name && record.monthly_rent
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
        
        const result = response.data.data || response.data
        let message = `Successfully imported ${result.imported || response.data.imported || this.validRecords} stallholders.`
        
        if (result.stallsCreated > 0) {
          message += ` ${result.stallsCreated} new stalls were created.`
        }
        if (result.accountsCreated > 0) {
          message += ` 🔐 ${result.accountsCreated} accounts auto-created.`
        }
        if (result.emailsSent > 0) {
          message += ` 📧 ${result.emailsSent} welcome emails sent.`
        }
        if (result.skipped > 0) {
          message += ` ${result.skipped} records were skipped.`
        }

        this.importMessage = message
        this.currentStep = 3
      } catch (error) {
        console.error('Error importing data:', error)
        this.importSuccess = false
        this.importMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to import stallholder data'
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

    formatCurrency(value) {
      if (!value) return '₱0.00'
      return '₱' + parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },

    resetForm() {
      this.currentStep = 1
      this.selectedFile = null
      this.previewData = []
      this.validationErrors = []
      this.importSummary = null
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
      this.showToast(`❌ ${message}`, 'error')
    },

    showToast(message, type = 'error') {
      this.toast = {
        show: true,
        message: message,
        type: type
      }
    }
  }
}