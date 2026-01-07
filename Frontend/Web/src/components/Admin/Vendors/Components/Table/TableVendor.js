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
}
