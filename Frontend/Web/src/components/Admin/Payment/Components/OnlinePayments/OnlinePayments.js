export default {
  name: 'OnlinePayments',
  emits: ['accept-payment', 'decline-payment', 'count-updated'],
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
      // Success snackbar
      showSuccessSnackbar: false,
      successMessage: '',
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
        const token = sessionStorage.getItem('authToken');
        
        if (!token) {
          console.log('🔐 No auth token found');
          this.loadSampleData();
          return;
        }

        const params = new URLSearchParams({
          limit: 100,
          offset: 0
        });

        if (this.searchQuery && this.searchQuery.toString().trim() !== '') {
          params.append('search', this.searchQuery.toString().trim());
        }

        console.log('📡 Fetching online payments with params:', params.toString());

        const response = await fetch(`/api/payments/online?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            // Transform and ensure all properties exist
            this.onlinePayments = (result.data || [])
              .filter(payment => {
                // Filter for online payment methods based on the formatted paymentMethod field
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
            console.warn('API returned no data, using fallback');
            this.loadSampleData();
          }
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
      // Use the same data transformation as API response
      const sampleData = [
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
      
      // Transform sample data using same logic as API response
      this.onlinePayments = sampleData.map(payment => ({
        id: payment.payment_id || '',
        stallholderId: payment.stallholder_id || '',
        stallholderName: payment.stallholder_name || 'Unknown',
        stallNo: payment.stall_no || 'N/A',
        amount: parseFloat(payment.amount) || 0,
        paymentDate: payment.payment_date || '',
        paymentTime: payment.payment_time || '',
        paymentForMonth: payment.payment_for_month || '',
        paymentType: payment.payment_type || 'rental',
        method: payment.payment_method || 'online',
        referenceNo: payment.reference_number || '',
        notes: payment.notes || '',
        status: payment.payment_status || 'pending',
        createdAt: payment.created_at || '',
        branchName: payment.branch_name || ''
      }));
      
      console.log('🧪 Loaded sample online payments:', this.onlinePayments.length, 'records');
    },
    
    getMethodCount(methodId) {
      if (methodId === 'all') {
        return this.onlinePayments.length;
      }
      
      return this.onlinePayments.filter(payment => {
        // Defensive checks for undefined/null values
        if (!payment || !payment.method || !methodId) return false;
        
        const methodLower = payment.method.toString().toLowerCase().trim();
        const selectedLower = methodId.toString().toLowerCase().trim();
        
        // Handle formatted method names from database
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
      this.pendingPayment = payment;
      this.showAcceptDialog = true;
    },
    
    confirmAcceptPayment() {
      if (!this.pendingPayment) return;
      
      console.log('Approving payment:', this.pendingPayment.payment_id);
      // Update payment status in database
      this.$emit('payment-approved', this.pendingPayment);
      
      // Show success message
      this.successMessage = `Payment #${this.pendingPayment.id} has been accepted successfully!`;
      this.showSuccessSnackbar = true;
      
      // Close dialog and reset
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
      // Update payment status in database
      this.$emit('payment-declined', {
        ...this.pendingPayment,
        declineReason: this.declineReason
      });
      
      // Show success message
      this.successMessage = `Payment #${this.pendingPayment.id} has been declined.`;
      this.showSuccessSnackbar = true;
      
      // Close dialog and reset
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
    }
  }
};