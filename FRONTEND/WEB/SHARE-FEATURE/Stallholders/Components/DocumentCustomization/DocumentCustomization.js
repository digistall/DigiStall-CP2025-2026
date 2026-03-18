import apiClient from '@/services/apiClient'
import { useAuthStore } from '@/stores/authStore.js'
import ToastNotification from '@common/ToastNotification/ToastNotification.vue'

export default {
  name: 'DocumentCustomization',
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
      // Document data
      availableDocumentTypes: [], // All predefined document types
      branchRequirements: [], // Currently required types for this branch
      documentTypes: [], // Mapped document types for display
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
      
      // Toast notification
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      
      // Change tracking
      hasChanges: false,
      originalRequirements: []
    }
  },
  computed: {
    authStore() {
      return useAuthStore()
    },
    isBusinessOwner() {
      return this.authStore.isStallBusinessOwner
    },
    isBusinessManager() {
      return this.authStore.isBusinessManager
    },
    isBusinessEmployee() {
      return this.authStore.isBusinessEmployee
    },
    // Check if user can customize documents (any of the three roles)
    canCustomizeDocuments() {
      return this.isBusinessOwner || this.isBusinessManager || this.isBusinessEmployee
    },
    currentUser() {
      return this.authStore.user.value || {}
    },
    userRole() {
      return this.currentUser.role || this.currentUser.userType
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
        // For business owners, don't pass branchId - they manage all branches
        // For branch managers, backend will use their assigned branchId from token
        console.log('[DocumentCustomization] 🔄 loadBranchRequirements() called')
        console.log('[DocumentCustomization] 👤 Current user:', JSON.stringify(this.authStore.user?.value || this.authStore.user || {}))
        console.log('[DocumentCustomization] 🎭 Role:', this.userRole)
        console.log('[DocumentCustomization] 📡 Fetching: GET /stallholders/documents/types')
        console.log('[DocumentCustomization] 📡 Fetching: GET /stallholders/documents/requirements')

        const [typesResponse, requirementsResponse] = await Promise.all([
          apiClient.get('/stallholders/documents/types'),
          apiClient.get('/stallholders/documents/requirements')
        ])

        console.log('[DocumentCustomization] ✅ Types response:', typesResponse.data)
        console.log('[DocumentCustomization] ✅ Requirements response:', requirementsResponse.data)

        this.availableDocumentTypes = typesResponse.data?.data || typesResponse.data || []
        this.branchRequirements = requirementsResponse.data?.data || requirementsResponse.data || []
        
        console.log('[DocumentCustomization] 📦 availableDocumentTypes count:', this.availableDocumentTypes.length)
        console.log('[DocumentCustomization] 📦 branchRequirements count:', this.branchRequirements.length)

        // Map requirements to include document type info
        this.documentTypes = this.branchRequirements.map(req => ({
          ...req,
          type_name: req.type_name || req.document_name || 'Unknown Document',
          description: req.description || '',
          category: req.category || 'General'
        }))

        this.originalRequirements = JSON.parse(JSON.stringify(this.branchRequirements))
        this.hasChanges = false
        
        // Expand all panels by default
        this.expandedPanels = this.documentTypes.map((_, index) => index)
      } catch (error) {
        console.error('[DocumentCustomization] ❌ Error loading document requirements:', error)
        console.error('[DocumentCustomization] ❌ Error status:', error.response?.status)
        console.error('[DocumentCustomization] ❌ Error URL:', error.config?.url)
        console.error('[DocumentCustomization] ❌ Error response data:', error.response?.data)
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

        console.log('[DocumentCustomization] 📡 POST /stallholders/documents/requirements — payload:', payload)
        // Create new document requirement
        const response = await apiClient.post('/stallholders/documents/requirements', payload)
        console.log('[DocumentCustomization] ✅ Create requirement response:', response.data)
        this.showSuccessMessage('Document requirement created successfully')

        this.showDocTypeDialog = false
        await this.loadBranchRequirements() // Reload the list
      } catch (error) {
        console.error('[DocumentCustomization] ❌ Error saving document requirement:', error)
        console.error('[DocumentCustomization] ❌ Error response data:', error.response?.data)
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
        console.log('[DocumentCustomization] 📡 DELETE /stallholders/documents/requirements/:id — id:', this.docTypeToDelete.requirement_id, '| doc:', this.docTypeToDelete)
        const response = await apiClient.delete(`/stallholders/documents/requirements/${this.docTypeToDelete.requirement_id}`)
        console.log('[DocumentCustomization] ✅ Delete requirement response:', response.data)
        this.showSuccessMessage('Document requirement removed successfully')
        this.showDeleteDialog = false
        this.docTypeToDelete = null
        await this.loadBranchRequirements() // Reload the list
      } catch (error) {
        console.error('[DocumentCustomization] ❌ Error deleting document requirement:', error)
        console.error('[DocumentCustomization] ❌ Error response data:', error.response?.data)
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
        
        console.log('[DocumentCustomization] 📡 PUT /stallholders/documents/requirements/:id — id:', docType.requirement_id, '| payload:', payload)
        const response = await apiClient.put(`/stallholders/documents/requirements/${docType.requirement_id}`, payload)
        console.log('[DocumentCustomization] ✅ Update requirement response:', response.data)
        this.markAsChanged()
        this.showSuccessMessage('Document requirement updated')
      } catch (error) {
        console.error('[DocumentCustomization] ❌ Error updating document requirement:', error)
        console.error('[DocumentCustomization] ❌ Error response data:', error.response?.data)
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
      this.showToast(`✅ ${message}`, 'success')
    },

    showErrorMessage(message) {
      this.showToast(`❌ ${message}`, 'error')
    },

    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message: message,
        type: type
      }
    }
  }
}