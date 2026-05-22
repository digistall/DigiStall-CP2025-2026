import { useAvatar } from '@utils/avatarHelper.js'

export default {
  name: 'PenaltyPayments',
  setup() {
    const { getAvatarUrl, handleAvatarError, getInitials } = useAvatar();
    return { getAvatarUrl, handleAvatarError, getInitials };
  },
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
      selectedPayment: null,
      // Stallholder details modal
      showStallholderModal: false,
      loadingStallholderDetails: false,
      stallholderDetails: null,
      avatarBuster: Date.now(),
      // Zoom Lightbox states
      showZoomModal: false,
      zoomScale: 1.0,
      panX: 0,
      panY: 0,
      isDragging: false
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
      if (!dateString || dateString === '0000-00-00') return '—';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch (err) {
        return '—';
      }
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
    },

    async showStallholderDetails(stallholderId) {
      if (!stallholderId) return;
      this.showStallholderModal = true;
      this.loadingStallholderDetails = true;
      this.stallholderDetails = null;
      this.avatarBuster = Date.now();
      
      try {
        const token = sessionStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`/api/stallholders/${stallholderId}`, { headers });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            this.stallholderDetails = result.data;
          }
        }
      } catch (error) {
        console.error('Error fetching stallholder details:', error);
      } finally {
        this.loadingStallholderDetails = false;
      }
    },

    // Zoom Lightbox handlers
    openZoomModal() {
      if (!this.stallholderDetails || !(this.stallholderDetails.stallholder_id || this.stallholderDetails.id)) return;
      this.zoomScale = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.isDragging = false;
      this.showZoomModal = true;
    },
    closeZoomModal() {
      this.showZoomModal = false;
    },
    zoomIn() {
      this.zoomScale = Math.min(this.zoomScale + 0.25, 4.0);
    },
    zoomOut() {
      this.zoomScale = Math.max(this.zoomScale - 0.25, 0.5);
      if (this.zoomScale < 1.0) {
        this.panX = 0;
        this.panY = 0;
      }
    },
    resetZoom() {
      this.zoomScale = 1.0;
      this.panX = 0;
      this.panY = 0;
    },
    startDrag(e) {
      if (this.zoomScale <= 1.0) return;
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    },
    onDrag(e) {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
    },
    endDrag() {
      this.isDragging = false;
    },
    onWheel(e) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(this.zoomScale + delta, 0.5), 4.0);
      this.zoomScale = newScale;
      if (newScale <= 1.0) {
        this.panX = 0;
        this.panY = 0;
      }
    }
  }
}

