export default {
  name: 'TableVendor',
  props: {
    vendors: { type: Array, default: () => [] },
    searchQuery: { type: String, default: '' },
    activeFilter: { type: String, default: 'all' },
  },
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 12,
    }
  },
  methods: {
    getStatusClass(status) {
      if (!status) return 'status-default'
      const s = status.toString().toLowerCase()
      if (s === 'active' || s === 'current') return 'status-active'
      if (s === 'inactive' || s === 'terminated') return 'status-terminated'
      if (s === 'pending' || s === 'on hold' || s === 'on_hold') return 'status-grace'
      if (s === 'expired' || s === 'overdue') return 'status-overdue'
      return 'status-default'
    },
    onView(row) {
      this.$emit('view', row.raw || row)
    },
    onEdit(row) {
      this.$emit('edit', row.raw || row)
    },
    onDelete(row) {
      this.$emit('delete', row.raw || row)
    },
  },
  computed: {
    filteredVendors() {
      let list = Array.isArray(this.vendors) ? this.vendors.slice() : []
      const q = (this.searchQuery || '').toLowerCase().trim()
      if (q) {
        list = list.filter((v) => {
          const collectorText = (v.business_location || v.collector || '').toString().toLowerCase()
          return (
            String(v.id).includes(q) ||
            (v.name || '').toString().toLowerCase().includes(q) ||
            (v.business || '').toString().toLowerCase().includes(q) ||
            collectorText.includes(q)
          )
        })
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
}
