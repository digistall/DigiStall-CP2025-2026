export default {
  name: 'InspectorSearch',
  data() {
    return {
      searchQuery: '',
      activeFilter: 'all',
      showFilterPanel: false,
      searchTimeout: null,
      filters: {
        status: 'all',
        dateFrom: '',
        dateTo: '',
        sortBy: 'Name (A-Z)'
      },
      sortOptions: [
        'Name (A-Z)',
        'Name (Z-A)',
        'Date Hired (Newest)',
        'Date Hired (Oldest)',
        'Status (Active First)',
        'Status (Inactive First)'
      ]
    }
  },
  computed: {
    hasActiveFilters() {
      return (
        this.filters.status !== 'all' ||
        this.filters.dateFrom !== '' ||
        this.filters.dateTo !== '' ||
        this.filters.sortBy !== 'Name (A-Z)' ||
        this.searchQuery.trim() !== ''
      );
    }
  },
  mounted() {
    document.addEventListener('click', this.handleOutsideClick);
    document.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleKeyDown);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
  methods: {
    handleSearch() {
      this.$emit('search', {
        query: this.searchQuery.trim(),
        filter: this.filters.status,
        filters: { ...this.filters }
      });
    },

    setFilter(filter) {
      this.filters.status = filter;
      this.handleSearch();
    },

    clearSearch() {
      this.searchQuery = '';
      this.handleSearch();
    },

    clearAllFilters() {
      this.searchQuery = '';
      this.filters = {
        status: 'all',
        dateFrom: '',
        dateTo: '',
        sortBy: 'Name (A-Z)'
      };
      this.handleSearch();
      this.showFilterPanel = false;
    },

    toggleFilter() {
      this.showFilterPanel = !this.showFilterPanel;
    },

    applyFilters() {
      this.handleSearch();
      this.showFilterPanel = false;
    },

    handleOutsideClick(event) {
      if (this.$refs.filterContainer && !this.$refs.filterContainer.contains(event.target)) {
        this.showFilterPanel = false;
      }
    },

    handleKeyDown(event) {
      if (event.key === 'Escape' && this.showFilterPanel) {
        this.showFilterPanel = false;
      }
    },

    debouncedSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(() => {
        this.handleSearch();
      }, 300);
    }
  },

  watch: {
    searchQuery() {
      this.debouncedSearch();
    },
  },
};
