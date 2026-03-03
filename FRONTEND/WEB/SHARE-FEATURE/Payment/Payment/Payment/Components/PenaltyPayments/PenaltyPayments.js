export default {
  name: 'PenaltyPayments',
  emits: ['loading'],
  data() {
    return {
      penaltyPayments: [],
      loading: false,
      error: null,
      pagination: {
        total: 0,
        limit: 50,
        offset: 0
      },
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      showViewModal: false,
      selectedPayment: null
    }
  },
  computed: {
    filteredPayments() {
      if (!this.searchQuery) return this.penaltyPayments;

      const query = this.searchQuery.toLowerCase();
      return this.penaltyPayments.filter(payment => {
        return (
          (payment.stallholderName || '').toLowerCase().includes(query) ||
          (payment.referenceNumber || '').toLowerCase().includes(query) ||
          (payment.violationType || '').toLowerCase().includes(query) ||
          (payment.collectedBy || '').toLowerCase().includes(query)
        );
      });
    },
    totalPages() {
      return Math.ceil(this.pagination.total / this.pagination.limit);
    },
    currentPage() {
      return Math.floor(this.pagination.offset / this.pagination.limit) + 1;
    }
  },
  mounted() {
    this.fetchPenaltyPayments();
  },
  methods: {
    async fetchPenaltyPayments() {
      this.loading = true;
      this.$emit('loading', true);
      this.error = null;

      try {
        const token = sessionStorage.getItem('authToken');

        if (!token) {
          console.log('🔐 No auth token found');
          this.error = 'Please log in to view penalty payments';
          return;
        }

        const params = new URLSearchParams({
          limit: this.pagination.limit,
          offset: this.pagination.offset
        });

        const response = await fetch(`/api/payments/penalty?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            this.penaltyPayments = result.data || [];
            this.pagination.total = result.pagination?.total || this.penaltyPayments.length;
            console.log('📊 Penalty payments loaded:', this.penaltyPayments.length);
          } else {
            this.error = result.message || 'Failed to load penalty payments';
          }
        } else {
          const errorData = await response.json();
          this.error = errorData.message || 'Failed to fetch penalty payments';
        }
      } catch (error) {
        console.error('Error fetching penalty payments:', error);
        this.error = 'Network error occurred while loading penalty payments';
      } finally {
        this.loading = false;
        this.$emit('loading', false);
      }
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    formatTime(timeString) {
      if (!timeString) return '-';
      try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch {
        return timeString;
      }
    },

    formatAmount(amount) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(amount || 0);
    },

    getStatusColor(status) {
      switch (status?.toLowerCase()) {
        case 'completed':
          return 'success';
        case 'pending':
          return 'warning';
        case 'failed':
        case 'cancelled':
          return 'error';
        default:
          return 'default';
      }
    },

    handleSearch(query) {
      this.searchQuery = query;
    },

    async changePage(page) {
      this.pagination.offset = (page - 1) * this.pagination.limit;
      await this.fetchPenaltyPayments();
    },

    async refresh() {
      this.pagination.offset = 0;
      await this.fetchPenaltyPayments();
    },

    viewPayment(payment) {
      this.selectedPayment = payment;
      this.showViewModal = true;
    }
  }
}
