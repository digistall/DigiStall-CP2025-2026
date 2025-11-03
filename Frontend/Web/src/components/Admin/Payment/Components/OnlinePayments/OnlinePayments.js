export default {
  name: 'OnlinePayments',
  data() {
    return {
      searchQuery: '',
      selectedMethod: 'all',
      showDetailsModal: false,
      selectedPayment: null,
      paymentMethods: [
        { id: 'gcash', name: 'GCash', color: '#007DFE', icon: 'mdi-wallet' },
        { id: 'maya', name: 'Maya', color: '#00D632', icon: 'mdi-credit-card' },
        { id: 'bank', name: 'Bank Transfer', color: '#FF6B35', icon: 'mdi-bank' }
      ],
      onlinePayments: [
        {
          id: 'OP-001',
          stallholderName: 'Juan Dela Cruz',
          stallNo: 'A-15',
          method: 'GCash',
          amount: 5000,
          referenceNo: 'GC2024110201',
          date: '2024-11-02',
          screenshot: 'https://via.placeholder.com/400x600/007DFE/FFFFFF?text=GCash+Receipt'
        },
        {
          id: 'OP-002',
          stallholderName: 'Maria Santos',
          stallNo: 'B-23',
          method: 'Maya',
          amount: 4500,
          referenceNo: 'MY2024110202',
          date: '2024-11-02',
          screenshot: 'https://via.placeholder.com/400x600/00D632/FFFFFF?text=Maya+Receipt'
        },
        {
          id: 'OP-003',
          stallholderName: 'Pedro Reyes',
          stallNo: 'C-08',
          method: 'Bank Transfer',
          amount: 6000,
          referenceNo: 'BT2024110203',
          date: '2024-11-01',
          screenshot: 'https://via.placeholder.com/400x600/FF6B35/FFFFFF?text=Bank+Receipt'
        },
        {
          id: 'OP-004',
          stallholderName: 'Ana Garcia',
          stallNo: 'A-42',
          method: 'GCash',
          amount: 5500,
          referenceNo: 'GC2024110204',
          date: '2024-11-01',
          screenshot: 'https://via.placeholder.com/400x600/007DFE/FFFFFF?text=GCash+Receipt'
        },
        {
          id: 'OP-005',
          stallholderName: 'Carlos Mendoza',
          stallNo: 'D-17',
          method: 'Maya',
          amount: 4800,
          referenceNo: 'MY2024110205',
          date: '2024-10-31',
          screenshot: 'https://via.placeholder.com/400x600/00D632/FFFFFF?text=Maya+Receipt'
        }
      ]
    }
  },
  computed: {
    filteredPayments() {
      let payments = this.onlinePayments;
      
      // Filter by payment method
      if (this.selectedMethod !== 'all') {
        payments = payments.filter(payment => {
          const method = payment.method.toLowerCase().replace(/\s+/g, '');
          const selectedMethodNormalized = this.selectedMethod.toLowerCase().replace(/\s+/g, '');
          return method === selectedMethodNormalized || method.includes(selectedMethodNormalized);
        });
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        payments = payments.filter(payment => 
          payment.id.toLowerCase().includes(query) ||
          payment.stallholderName.toLowerCase().includes(query) ||
          payment.referenceNo.toLowerCase().includes(query) ||
          payment.stallNo.toLowerCase().includes(query) ||
          payment.method.toLowerCase().includes(query)
        );
      }
      
      return payments;
    }
  },
  methods: {
    getMethodCount(methodId) {
      return this.onlinePayments.filter(payment => {
        const method = payment.method.toLowerCase().replace(/\s+/g, '');
        const selectedMethodNormalized = methodId.toLowerCase().replace(/\s+/g, '');
        return method === selectedMethodNormalized || method.includes(selectedMethodNormalized);
      }).length;
    },
    getMethodColor(method) {
      const colors = {
        'GCash': '#007DFE',
        'Maya': '#00D632',
        'Bank Transfer': '#FF6B35'
      }
      return colors[method] || '#002181'
    },
    formatCurrency(amount) {
      return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    },
    viewPaymentDetails(payment) {
      this.selectedPayment = payment
      this.showDetailsModal = true
    },
    acceptPayment(payment) {
      this.$emit('accept-payment', payment)
      this.showDetailsModal = false
    },
    declinePayment(payment) {
      this.$emit('decline-payment', payment)
      this.showDetailsModal = false
    }
  }
}
