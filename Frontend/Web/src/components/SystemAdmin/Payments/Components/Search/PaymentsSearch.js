export default {
  name: 'PaymentsSearch',
  props: {
    businessOwners: {
      type: Array,
      default: () => []
    },
    paymentMethods: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      searchQuery: '',
      showFilterPanel: false,
      filter: {
        businessOwnerId: null,
        status: null,
        paymentMethod: null
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    handleSearch() {
      this.$emit('search', this.searchQuery)
    },
    toggleFilter() {
      this.showFilterPanel = !this.showFilterPanel
    },
    handleClickOutside(event) {
      const filterContainer = this.$refs.filterContainer
      if (filterContainer && !filterContainer.contains(event.target)) {
        this.showFilterPanel = false
      }
    },
    selectStatus(status) {
      this.filter.status = status === 'All' ? null : status
    },
    clearFilters() {
      this.filter = {
        businessOwnerId: null,
        status: null,
        paymentMethod: null
      }
      this.searchQuery = ''
      this.$emit('filter', this.filter)
      this.$emit('search', '')
    },
    applyFilters() {
      this.$emit('filter', this.filter)
      this.showFilterPanel = false
    }
  }
}
