export default {
  name: 'TableCollector',
  props: {
    collectors: { type: Array, default: () => [] },
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
    filteredCollectors() {
      let list = Array.isArray(this.collectors) ? this.collectors.slice() : []
      const q = (this.searchQuery || '').toLowerCase().trim()
      if (q) {
        list = list.filter(
          (c) =>
            String(c.id).includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.contact.toLowerCase().includes(q) ||
            c.location.toLowerCase().includes(q),
        )
      }
      if (this.activeFilter && this.activeFilter !== 'all') {
        list = list.filter((c) => c.location === this.activeFilter)
      }
      return list
    },
    paginatedCollectors() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      return this.filteredCollectors.slice(start, start + this.itemsPerPage)
    },
    totalPages() {
      return Math.ceil(this.filteredCollectors.length / this.itemsPerPage) || 0
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
