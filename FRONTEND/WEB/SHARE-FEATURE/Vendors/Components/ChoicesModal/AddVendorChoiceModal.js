import AddVendorDialog from '../AddVendorDialog/AddVendorDialog.vue'
import ExcelImport from '../ExcelImport/ExcelImport.vue'

export default {
  name: 'AddVendorChoiceModal',
  components: {
    AddVendorDialog,
    ExcelImport,
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
      showAddVendorModal: false,
      showExcelImportModal: false,
    }
  },
  methods: {
    // Close the choice modal
    closeModal() {
      this.$emit('close-modal')
    },

    // Handle selection of Add Vendor
    selectAddVendor() {
      this.closeModal()
      this.showAddVendorModal = true
    },

    // Handle selection of Import Excel
    selectImportExcel() {
      this.closeModal()
      this.showExcelImportModal = true
    },

    // Close Add Vendor Modal
    closeAddVendorModal() {
      this.showAddVendorModal = false
    },

    // Close Excel Import Modal
    closeExcelImportModal() {
      this.showExcelImportModal = false
    },

    // Handle vendor added event
    handleVendorAdded(vendorData) {
      this.showAddVendorModal = false
      this.$emit('vendor-added', vendorData)
      this.$emit('show-message', {
        message: 'Vendor added successfully!',
        type: 'success',
      })
      this.$emit('refresh-vendors')
    },

    // Handle import completed event
    handleImportCompleted(importData) {
      this.showExcelImportModal = false
      this.$emit('import-completed', importData)
      this.$emit('show-message', {
        message: `Successfully imported ${importData.count || 0} vendors!`,
        type: 'success',
      })
      this.$emit('refresh-vendors')
    },

    // Handle show message event
    handleShowMessage(messageData) {
      this.$emit('show-message', messageData)
    },
  },
}
