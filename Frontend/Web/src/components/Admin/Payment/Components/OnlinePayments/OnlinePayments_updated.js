export default {
  name: 'OnlinePayments',
  data() {
    return {
      searchQuery: '',
      selectedMethod: 'all',
      showDetailsModal: false,
      selectedPayment: null,
      loading: false,
      paymentMethods: [
        { id: 'online', name: 'Online Payment', color: '#007DFE', icon: 'mdi-credit-card' },
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
        payments = payments.filter(payment => 
          payment.payment_method === this.selectedMethod
        );
      }
      
      // Filter by search query
      if (this.searchQuery && this.searchQuery.trim() !== '') {
        const query = this.searchQuery.toLowerCase();
        payments = payments.filter(payment => 
          payment.payment_id?.toString().toLowerCase().includes(query) ||
          payment.stallholder_name?.toLowerCase().includes(query) ||
          payment.reference_number?.toLowerCase().includes(query) ||
          payment.stall_no?.toLowerCase().includes(query)
        );
      }
      
      return payments;
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
        const token = sessionStorage.getItem('authToken');
        
        // Fetch payments for current month by default
        const currentMonth = new Date().toISOString().slice(0, 7);
        const params = new URLSearchParams({
          paymentMethod: 'online',
          startDate: `${currentMonth}-01`,
          endDate: `${currentMonth}-31`,
          limit: 100
        });
        
        const response = await fetch(`/api/payments/branch?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          // Filter for online payment methods only
          this.onlinePayments = (result.data || []).filter(payment => 
            ['online', 'bank_transfer'].includes(payment.payment_method)
          );
        } else {
          console.error('Failed to fetch online payments');
          // Use sample data as fallback
          this.loadSampleData();
        }
      } catch (error) {
        console.error('Error fetching online payments:', error);
        // Use sample data as fallback
        this.loadSampleData();
      } finally {
        this.loading = false;
      }
    },
    
    async fetchPaymentStats() {
      try {
        const token = sessionStorage.getItem('authToken');
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        const response = await fetch(`/api/payments/stats?month=${currentMonth}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          this.paymentStats = result.data || {};
        }
      } catch (error) {
        console.error('Error fetching payment stats:', error);
      }
    },
    
    // Fallback sample data for demonstration
    loadSampleData() {
      this.onlinePayments = [
        {
          payment_id: 42,
          stallholder_name: 'Maria Santos',
          stall_no: 'NPM-005',
          payment_method: 'bank_transfer',
          amount: 3500,
          reference_number: 'BT-20251113-001',
          payment_date: '2025-11-13',
          payment_time: '14:30:00',
          notes: 'Bank transfer payment for stall rental'
        },
        {
          payment_id: 37,
          stallholder_name: 'Maria Santos',
          stall_no: 'NPM-005',
          payment_method: 'bank_transfer',
          amount: 3200,
          reference_number: 'TXN-20251106-001',
          payment_date: '2025-11-06',
          payment_time: '10:15:00',
          notes: 'Monthly stall rental payment'
        }
      ];
    },
    
    getMethodCount(methodId) {
      if (methodId === 'all') {
        return this.onlinePayments.length;
      }
      return this.onlinePayments.filter(payment => 
        payment.payment_method === methodId
      ).length;
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
      this.selectedPayment = {
        ...payment,
        // Map database fields to component expected format
        id: payment.payment_id,
        stallholderName: payment.stallholder_name,
        stallNo: payment.stall_no,
        method: payment.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Online Payment',
        referenceNo: payment.reference_number,
        date: payment.payment_date,
        time: payment.payment_time,
        screenshot: null // Online payments may not have screenshots in database
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
      // Implement payment approval logic
      console.log('Approving payment:', payment.payment_id);
      // Update payment status in database
      this.$emit('payment-approved', payment);
    },
    
    declinePayment(payment) {
      // Implement payment rejection logic  
      console.log('Rejecting payment:', payment.payment_id);
      // Update payment status in database
      this.$emit('payment-declined', payment);
    }
  }
};