export default {
  name: 'TableCollector',
  props: {
    collectors: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 10,
    }
  },
  computed: {
    paginatedCollectors() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.collectors.slice(start, end)
    },
    totalPages() {
      return Math.ceil(this.collectors.length / this.itemsPerPage)
    },
  },
  watch: {
    collectors() {
      // Reset to first page when collectors change
      this.currentPage = 1
    },
  },
}
