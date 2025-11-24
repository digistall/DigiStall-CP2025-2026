// InspectorTable.js
const InspectorTable = {
  name: 'InspectorTable',
  props: {
    searchQuery: {
      type: String,
      default: ''
    },
    activeFilter: {
      type: String,
      default: ''
    },
    inspectorList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 10,
    }
  },
  computed: {
    filteredInspectors() {
      let filtered = this.inspectorList

      // Apply universal search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(inspector =>
          inspector.id.toLowerCase().includes(query) ||
          inspector.name.toLowerCase().includes(query) ||
          inspector.email.toLowerCase().includes(query) ||
          inspector.contact_no.toLowerCase().includes(query) ||
          inspector.status.toLowerCase().includes(query) ||
          (inspector.first_name && inspector.first_name.toLowerCase().includes(query)) ||
          (inspector.last_name && inspector.last_name.toLowerCase().includes(query))
        )
      }

      // Apply status filter
      if (this.activeFilter && this.activeFilter !== 'all') {
        filtered = filtered.filter(inspector =>
          inspector.status === this.activeFilter
        )
      }

      return filtered
    },

    paginatedInspectors() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredInspectors.slice(start, end)
    },

    totalPages() {
      return Math.ceil(this.filteredInspectors.length / this.itemsPerPage) || 1
    }
  },
  methods: {
    getInitials(name) {
      return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase()
    },

    getStatusClass(status) {
      const statusClasses = {
        'active': 'inspector-status-active',
        'inactive': 'inspector-status-inactive',
        'suspended': 'inspector-status-suspended',
        'on-leave': 'inspector-status-leave'
      }
      return statusClasses[status] || 'inspector-status-default'
    },

    viewInspector(inspector) {
      this.$emit('view-inspector', inspector)
    },

    editInspector(inspector) {
      this.$emit('edit-inspector', inspector)
    },

    deleteInspector(inspector) {
      this.$emit('delete-inspector', inspector)
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    }
  },

  watch: {
    searchQuery() {
      this.currentPage = 1
    },
    activeFilter() {
      this.currentPage = 1
    }
  }
}

export default InspectorTable
