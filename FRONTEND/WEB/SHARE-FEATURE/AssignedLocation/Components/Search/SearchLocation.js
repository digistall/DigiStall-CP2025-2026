export default {
  name: 'SearchLocation',
  data() {
    return {
      searchQuery: '',
      showSortPanel: false,
      activeSortBy: 'created_at',
      activeSortDir: 'DESC',
      searchTimeout: null
    }
  },
  mounted() {
    document.addEventListener('click', this.handleOutsideClick)
    document.addEventListener('keydown', this.handleKeyDown)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick)
    document.removeEventListener('keydown', this.handleKeyDown)
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
  },
  methods: {
    handleSearch() {
      this.$emit('search', {
        query: this.searchQuery?.trim() || ''
      })
    },

    toggleSort() {
      this.showSortPanel = !this.showSortPanel
    },

    applySort() {
      this.$emit('search', {
        query: this.searchQuery?.trim() || '',
        sortBy: this.activeSortBy,
        sortDir: this.activeSortDir
      })
      this.showSortPanel = false
    },

    clearSort() {
      this.activeSortBy = 'created_at'
      this.activeSortDir = 'DESC'
      this.$emit('search', {
        query: this.searchQuery?.trim() || '',
        sortBy: 'created_at',
        sortDir: 'DESC'
      })
      this.showSortPanel = false
    },

    handleOutsideClick(event) {
      if (this.$refs.sortContainer && !this.$refs.sortContainer.contains(event.target)) {
        this.showSortPanel = false
      }
    },

    handleKeyDown(event) {
      if (event.key === 'Escape' && this.showSortPanel) {
        this.showSortPanel = false
      }
    },

    debouncedSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      this.searchTimeout = setTimeout(() => {
        this.handleSearch()
      }, 350)
    }
  },
  watch: {
    searchQuery() {
      this.debouncedSearch()
    }
  }
}
