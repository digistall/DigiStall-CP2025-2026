import apiClient from '@/services/apiClient'

export default {
  name: 'DocumentCustomization',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // Document data
      availableDocumentTypes: [], // All predefined document types
      branchRequirements: [], // Currently required types for this branch
      userBranchId: null,
      
      // UI state
      loading: false,
      saving: false,
      savingDocType: false,
      deleting: false,
      expandedPanels: [],
      
      // Add document type dialog
      showDocTypeDialog: false,
      selectedDocumentTypeId: null,
      selectedRequiredStatus: true,
      selectedInstructions: '',
      docTypeFormValid: false,
      
      // Delete confirmation
      showDeleteDialog: false,
      docTypeToDelete: null,
      
      // Feedback
      showSuccess: false,
      successMessage: '',
      showError: false,
      errorMessage: '',
      
      // Change tracking
      hasChanges: false,
      originalRequirements: []
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.loadBranchRequirements()
        this.resetForm()
      }
    }
  },
  methods: {
    async loadBranchRequirements() {
      this.loading = true
      try {
        // Load both the available document types and current branch requirements
        const [typesResponse, requirementsResponse] = await Promise.all([
          apiClient.get('/stallholders/documents/types'),
          apiClient.get('/stallholders/documents/requirements')
        ])

        this.availableDocumentTypes = typesResponse.data?.data || typesResponse.data || []
        this.branchRequirements = requirementsResponse.data?.data || requirementsResponse.data || []
        
        // Map requirements to include document type info
        this.documentTypes = this.branchRequirements.map(req => ({
          ...req,
          document_name: req.document_name || 'Unknown Document',
          description: req.description || ''
        }))

        this.originalRequirements = JSON.parse(JSON.stringify(this.branchRequirements))
        this.hasChanges = false
        
        // Expand all panels by default
        this.expandedPanels = this.documentTypes.map((_, index) => index)
      } catch (error) {
        console.error('Error loading document requirements:', error)
        this.showErrorMessage('Failed to load document requirements')
      } finally {
        this.loading = false
      }
    },

    addNewDocumentType() {
      // Show available document types that aren't already required
      const availableTypes = this.availableDocumentTypes.filter(type => 
        !this.branchRequirements.find(req => req.document_type_id === type.document_type_id)
      )

      if (availableTypes.length === 0) {
        this.showErrorMessage('All document types are already configured for this branch')
        return
      }

      this.selectedDocumentTypeId = availableTypes[0]?.document_type_id
      this.selectedRequiredStatus = true
      this.selectedInstructions = ''
      this.showDocTypeDialog = true
    },

    async saveDocumentType() {
      if (!this.$refs.docTypeForm.validate()) return

      this.savingDocType = true
      try {
        const payload = {
          document_type_id: this.selectedDocumentTypeId,
          is_required: this.selectedRequiredStatus ? 1 : 0,
          instructions: this.selectedInstructions
        }

        // Create new document requirement
        await apiClient.post('/stallholders/documents/requirements', payload)
        this.showSuccessMessage('Document requirement created successfully')

        this.showDocTypeDialog = false
        await this.loadBranchRequirements() // Reload the list
      } catch (error) {
        console.error('Error saving document requirement:', error)
        this.showErrorMessage(error.response?.data?.message || 'Failed to save document requirement')
      } finally {
        this.savingDocType = false
      }
    },

    cancelDocTypeDialog() {
      this.showDocTypeDialog = false
      this.selectedDocumentTypeId = null
      this.selectedRequiredStatus = true
      this.selectedInstructions = ''
    },

    confirmDeleteDocumentType(docType) {
      this.docTypeToDelete = docType
      this.showDeleteDialog = true
    },

    async deleteDocumentType() {
      if (!this.docTypeToDelete) return

      this.deleting = true
      try {
        await apiClient.delete(`/stallholders/documents/requirements/${this.docTypeToDelete.requirement_id}`)
        this.showSuccessMessage('Document requirement removed successfully')
        this.showDeleteDialog = false
        this.docTypeToDelete = null
        await this.loadBranchRequirements() // Reload the list
      } catch (error) {
        console.error('Error deleting document requirement:', error)
        this.showErrorMessage('Failed to remove document requirement')
      } finally {
        this.deleting = false
      }
    },

    async updateDocumentRequirement(docType) {
      try {
        const payload = {
          is_required: docType.is_required ? 1 : 0,
          instructions: docType.instructions
        }
        
        await apiClient.put(`/stallholders/documents/requirements/${docType.requirement_id}`, payload)
        this.markAsChanged()
        this.showSuccessMessage('Document requirement updated')
      } catch (error) {
        console.error('Error updating document requirement:', error)
        this.showErrorMessage('Failed to update document requirement')
      }
    },

    resetForm() {
      this.availableDocumentTypes = []
      this.branchRequirements = []
      this.documentTypes = []
      this.originalRequirements = []
      this.hasChanges = false
      this.expandedPanels = []
    },

    getAvailableDocumentTypesForSelect() {
      return this.availableDocumentTypes.filter(type => 
        !this.branchRequirements.find(req => req.document_type_id === type.document_type_id)
      )
    },

    async saveAllChanges() {
      this.saving = true
      try {
        // All changes are saved in real-time, so just show success
        this.showSuccessMessage('All changes saved successfully')
        this.hasChanges = false
        this.originalRequirements = JSON.parse(JSON.stringify(this.branchRequirements))
      } catch (error) {
        console.error('Error saving changes:', error)
        this.showErrorMessage('Failed to save some changes')
      } finally {
        this.saving = false
      }
    },

    markAsChanged() {
      this.hasChanges = true
    },

    closeDialog() {
      if (this.hasChanges) {
        if (confirm('You have unsaved changes. Are you sure you want to close?')) {
          this.$emit('close')
          this.resetForm()
        }
      } else {
        this.$emit('close')
        this.resetForm()
      }
    },

    showSuccessMessage(message) {
      this.successMessage = message
      this.showSuccess = true
    },

    showErrorMessage(message) {
      this.errorMessage = message
      this.showError = true
    }
  }
}