import '@/assets/css/scrollable-tables.css'
import ToastNotification from '../../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'OnlinePayments',
  components: {
    ToastNotification
  },
  emits: ['accept-payment', 'decline-payment', 'count-updated', 'loading'],
  data() {
    return {
      searchQuery: '',
      selectedMethod: 'all',
      showDetailsModal: false,
      selectedPayment: null,
      loading: false,
      // Confirmation dialogs
      showAcceptDialog: false,
      showDeclineDialog: false,
      pendingPayment: null,
      declineReason: '',
      // Toast notification
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      paymentMethods: [
        { id: 'gcash', name: 'GCash', color: '#007DFE', icon: 'mdi-cellphone' },
        { id: 'maya', name: 'Maya', color: '#00D4FF', icon: 'mdi-credit-card' },
        { id: 'bank_transfer', name: 'Bank Transfer', color: '#FF6B35', icon: 'mdi-bank' }
      ],
      onlinePayments: [],
      paymentStats: {}
    }
  },
  
  computed: {
    filteredPayments() {
      let payments = this.onlinePayments;
      
      // Filter by payment method
      if (this.selectedMethod !== 'all') {
        payments = payments.filter(payment => {
          // Defensive checks for undefined/null values
          if (!payment || !payment.method || !this.selectedMethod) return false;
          
          const methodLower = payment.method.toString().toLowerCase().trim();
          const selectedLower = this.selectedMethod.toString().toLowerCase().trim();
          
          // Handle formatted method names from database  
          if (selectedLower === 'gcash') return methodLower.includes('gcash');
          if (selectedLower === 'maya') return methodLower.includes('maya');
          if (selectedLower === 'bank_transfer') return methodLower.includes('bank') || methodLower.includes('transfer');
          
          return methodLower === selectedLower;
        });
      }
      
      // Filter by search query
      if (this.searchQuery && this.searchQuery.toString().trim() !== '') {
        const query = this.searchQuery.toString().toLowerCase().trim();
        payments = payments.filter(payment => {
          if (!payment) return false;
          
          return (
            (payment.id && payment.id.toString().toLowerCase().includes(query)) ||
            (payment.stallholderName && payment.stallholderName.toString().toLowerCase().includes(query)) ||
            (payment.referenceNo && payment.referenceNo.toString().toLowerCase().includes(query)) ||
            (payment.stallNo && payment.stallNo.toString().toLowerCase().includes(query))
          );
        });
      }
      
      return payments;
    }
  },
  
  watch: {
    onlinePayments: {
      handler() {
        this.$emit('count-updated', this.onlinePayments.length);
      },
      immediate: true
    }
  },
  
  mounted() {
    this.fetchOnlinePayments();
    this.fetchPaymentStats();
  },
  
  methods: {
    async fetchOnlinePayments() {
      try {
        this.loading = true;
        this.$emit('loading', true);
        const token = sessionStorage.getItem('authToken');

        const params = new URLSearchParams({
          limit: 100,
          offset: 0
        });

        if (this.searchQuery && this.searchQuery.toString().trim() !== '') {
          params.append('search', this.searchQuery.toString().trim());
        }

        console.log('📡 Fetching online payments with params:', params.toString());

        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/payments/online?${params}`, { headers });

        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data) {
            this.onlinePayments = (result.data || [])
              .filter(payment => {
                const method = (payment.paymentMethod || payment.method || '').toLowerCase();
                return method.includes('gcash') || method.includes('maya') ||
                       method.includes('bank') || method.includes('transfer') ||
                       method === 'paymaya' || method === 'gcash' || method === 'maya';
              })
              .map(payment => ({
                id: payment.id || payment.payment_id || '',
                stallholderId: payment.stallholderId || payment.stallholder_id || '',
                stallholderName: payment.stallholderName || payment.stallholder_name || 'Unknown',
                stallNo: payment.stallNo || payment.stall_no || 'N/A',
                amount: parseFloat(payment.amountPaid || payment.amount) || 0,
                paymentDate: payment.paymentDate || payment.payment_date || '',
                paymentTime: payment.paymentTime || payment.payment_time || '',
                paymentForMonth: payment.paymentForMonth || payment.payment_for_month || '',
                paymentType: payment.paymentType || payment.payment_type || 'rental',
                method: payment.paymentMethod || payment.method || payment.specific_payment_method || 'online',
                referenceNo: payment.referenceNo || payment.reference_number || '',
                notes: payment.notes || '',
                status: payment.status || payment.payment_status || 'pending',
                createdAt: payment.createdAt || payment.created_at || '',
                branchName: payment.branchName || payment.branch_name || ''
              }));

            console.log('✅ Online payments loaded:', this.onlinePayments.length, 'records');
          } else {
            console.warn('API returned no data');
            this.onlinePayments = [];
          }
        } else {
          console.error('Failed to fetch online payments');
          this.onlinePayments = [];
        }
      } catch (error) {
        console.error('Error fetching online payments:', error);
        this.onlinePayments = [];
      } finally {
        this.loading = false;
        this.$emit('loading', false);
      }
    },

    async fetchPaymentStats() {
      try {
        const token = sessionStorage.getItem('authToken');
        const currentMonth = new Date().toISOString().slice(0, 7);

        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/payments/stats?month=${currentMonth}`, { headers });

        if (response.ok) {
          const result = await response.json();
          this.paymentStats = result.data || {};
        }
      } catch (error) {
        console.error('Error fetching payment stats:', error);
      }
    },

    // Note: No local fallback data — always use the API/database as source of truth.
    getMethodCount(methodId) {
      if (methodId === 'all') {
        return this.onlinePayments.length;
      }

      return this.onlinePayments.filter(payment => {
        if (!payment || !payment.method || !methodId) return false;

        const methodLower = payment.method.toString().toLowerCase().trim();
        const selectedLower = methodId.toString().toLowerCase().trim();

        if (selectedLower === 'gcash') return methodLower.includes('gcash');
        if (selectedLower === 'maya') return methodLower.includes('maya');
        if (selectedLower === 'paymaya') return methodLower.includes('paymaya') || methodLower.includes('maya');
        if (selectedLower === 'bank_transfer') return methodLower.includes('bank') || methodLower.includes('transfer');

        return methodLower === selectedLower;
      }).length;
    },

    formatCurrency(amount) {
      return `₱${parseFloat(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    },

    formatTime(timeString) {
      if (!timeString) return '';
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    },

    getMethodColor(method) {
      const methodConfig = this.paymentMethods.find(m => m.id === method);
      return methodConfig ? methodConfig.color : '#666666';
    },

    getMethodIcon(method) {
      const icons = {
        online: 'mdi-credit-card',
        bank_transfer: 'mdi-bank'
      };
      return icons[method] || 'mdi-payment';
    },

    viewDetails(payment) {
      const normalizedDate = payment.paymentDate || payment.payment_date || payment.date || '';
      const normalizedTime = payment.paymentTime || payment.payment_time || payment.time || '';

      this.selectedPayment = {
        ...payment,
        id: payment.payment_id || payment.id,
        stallholderName: payment.stallholder_name || payment.stallholderName,
        stallNo: payment.stall_no || payment.stallNo,
        method: payment.payment_method === 'bank_transfer' ? 'Bank Transfer' : (payment.method || payment.payment_method || 'Online Payment'),
        referenceNo: payment.reference_number || payment.referenceNo,
        date: normalizedDate,
        time: normalizedTime,
        screenshot: payment.screenshot || null
      };
      this.showDetailsModal = true;
    },

    closeDetails() {
      this.showDetailsModal = false;
      this.selectedPayment = null;
    },

    viewPaymentDetails(payment) {
      this.viewDetails(payment);
    },

    acceptPayment(payment) {
      this.pendingPayment = payment;
      this.showAcceptDialog = true;
    },

    confirmAcceptPayment() {
      if (!this.pendingPayment) return;

      console.log('Approving payment:', this.pendingPayment.payment_id);
      this.$emit('payment-approved', this.pendingPayment);

      this.showToast(`✅ Payment #${this.pendingPayment.id} has been accepted successfully!`, 'success');

      this.showAcceptDialog = false;
      this.pendingPayment = null;
    },

    declinePayment(payment) {
      this.pendingPayment = payment;
      this.declineReason = '';
      this.showDeclineDialog = true;
    },

    confirmDeclinePayment() {
      if (!this.pendingPayment) return;

      console.log('Rejecting payment:', this.pendingPayment.payment_id, 'Reason:', this.declineReason);
      this.$emit('payment-declined', {
        ...this.pendingPayment,
        declineReason: this.declineReason
      });

      this.showToast(`❌ Payment #${this.pendingPayment.id} has been declined.`, 'error');

      this.showDeclineDialog = false;
      this.pendingPayment = null;
      this.declineReason = '';
    },

    cancelAcceptDialog() {
      this.showAcceptDialog = false;
      this.pendingPayment = null;
    },

    cancelDeclineDialog() {
      this.showDeclineDialog = false;
      this.pendingPayment = null;
      this.declineReason = '';
    },

    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message: message,
        type: type
      }
    }
  }
};