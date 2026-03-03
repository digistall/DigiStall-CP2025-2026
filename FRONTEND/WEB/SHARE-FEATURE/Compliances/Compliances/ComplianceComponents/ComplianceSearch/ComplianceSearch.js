export default {
  name: 'ComplianceSearch',
  data() {
    return {
      searchQuery: '',
      activeFilter: 'all',
      showFilterPanel: false,
      searchTimeout: null,
      filters: {
        status: 'all',
        severity: 'all',
        type: 'All Types',
        dateFrom: '',
        dateTo: ''
      },
      typeOptions: [
        'All Types',
        'Health & Sanitation',
        'Safety',
        'Documentation',
        'Payment',
        'Structural',
        'Operational',
        'Environmental',
        'Other'
      ]
    }
  },
  computed: {
    hasActiveFilters() {
      return (
        this.filters.status !== 'all' ||
        this.filters.severity !== 'all' ||
        this.filters.type !== 'All Types' ||
        this.filters.dateFrom !== '' ||
        this.filters.dateTo !== '' ||
        this.searchQuery.trim() !== ''
      );
    }
  },
  mounted() {
    // Close dropdown when clicking outside
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
        severity: 'all',
        type: 'All Types',
        dateFrom: '',
        dateTo: ''
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
      // Close on Escape key
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
      // Debounce search to avoid too many API calls
      this.debouncedSearch();
    },
  },
};


