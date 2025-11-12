import AddStallholder from '../AddStallholder/AddStallholder.vue'
import ExcelImport from '../ExcelImport/ExcelImport.vue'
import DocumentCustomization from '../DocumentCustomization/DocumentCustomization.vue'

export default {
  name: 'AddStallholderChoiceModal',
  components: {
    AddStallholder,
    ExcelImport,
    DocumentCustomization,
  },
  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      showAddStallholderModal: false,
      showExcelImportModal: false,
      showDocumentModal: false,
    }
  },
  methods: {
    // Close the choice modal
    closeModal() {
      this.$emit('close-modal')
    },

    // Handle selection of Add Stallholder
    selectAddStallholder() {
      this.closeModal()
      this.showAddStallholderModal = true
    },

    // Handle selection of Import Excel
    selectImportExcel() {
      this.closeModal()
      this.showExcelImportModal = true
    },

    // Handle selection of Document Settings
    selectDocumentSettings() {
      this.closeModal()
      this.showDocumentModal = true
    },

    // Close Add Stallholder Modal
    closeAddStallholderModal() {
      this.showAddStallholderModal = false
    },

    // Close Excel Import Modal
    closeExcelImportModal() {
      this.showExcelImportModal = false
    },

    // Close Document Modal
    closeDocumentModal() {
      this.showDocumentModal = false
    },

    // Handle stallholder added event
    handleStallholderAdded(stallholderData) {
      this.$emit('stallholder-added', stallholderData)
    },

    // Handle import completed event
    handleImportCompleted(importData) {
      this.$emit('import-completed', importData)
    },

    // Handle document updated event
    handleDocumentUpdated(documentData) {
      this.$emit('document-updated', documentData)
    },

    // Handle show message event
    handleShowMessage(messageData) {
      this.$emit('show-message', messageData)
    },

    // Handle refresh stallholders event
    handleRefreshStallholders() {
      this.$emit('refresh-stallholders')
    },
  },
}