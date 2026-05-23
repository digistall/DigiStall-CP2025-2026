import AddVendorChoiceModal from '../ChoicesModal/AddVendorChoiceModal.vue'

export default {
  name: 'TableVendor',
  components: {
    AddVendorChoiceModal,
  },
  props: {
    vendors: { type: Array, default: () => [] },
    searchQuery: { type: String, default: '' },
    activeFilter: { type: String, default: 'all' },
  },
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 12,
      showChoiceModal: false,
    }
  },
  computed: {
    filteredVendors() {
      let list = Array.isArray(this.vendors) ? this.vendors.slice() : []
      const q = (this.searchQuery || '').toLowerCase().trim()
      if (q) {
        list = list.filter(
          (v) =>
            String(v.id).includes(q) ||
            v.name.toLowerCase().includes(q) ||
            v.business.toLowerCase().includes(q) ||
            v.collector.toLowerCase().includes(q),
        )
      }
      if (this.activeFilter && this.activeFilter !== 'all') {
        list = list.filter((v) => v.status === this.activeFilter)
      }
      return list
    },
    paginatedVendors() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      return this.filteredVendors.slice(start, start + this.itemsPerPage)
    },
    totalPages() {
      return Math.ceil(this.filteredVendors.length / this.itemsPerPage) || 0
    },
  },
  watch: {
    searchQuery() {
      this.currentPage = 1
    },
    activeFilter() {
      this.currentPage = 1
    },
  },
  methods: {
    openAddVendor() {
      this.showChoiceModal = true
    },
    closeChoiceModal() {
      this.showChoiceModal = false
    },
    handleVendorAdded(vendorData) {
      this.$emit('vendor-added', vendorData)
    },
    handleImportCompleted(importData) {
      this.$emit('import-completed', importData)
    },
    handleShowMessage(messageData) {
      this.$emit('show-message', messageData)
    },
    handleRefreshVendors() {
      this.$emit('refresh-vendors')
    },
    getInitials(name) {
      if (!name) return '??'
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
      }
      return name.charAt(0).toUpperCase()
    },
    // Compliance status helpers - consistent with Stallholder module
    getComplianceColor(compliance) {
      // Handle undefined, null, empty string, or 'Compliant' as compliant (green)
      if (!compliance || compliance === 'Compliant') {
        return 'green'
      }
      // Non-Compliant or any other status shows as red
      return 'red'
    },
    getComplianceIcon(compliance) {
      // Handle undefined, null, empty string, or 'Compliant' as compliant
      if (!compliance || compliance === 'Compliant') {
        return 'mdi-check-circle'
      }
      return 'mdi-alert-circle'
    },
  },
}
