import OnlinePayments from '../OnlinePayments/OnlinePayments.vue'
import OnsitePayments from '../OnsitePayments/OnsitePayments.vue'

export default {
  name: 'StallPayments',
  components: {
    OnlinePayments,
    OnsitePayments
  },
  data() {
    return {
      activeTab: 'online',
      onlineCount: 0,
      onsiteCount: 0,
      showSnackbar: false,
      snackbarMessage: '',
      snackbarColor: 'success',
      snackbarIcon: 'mdi-check-circle'
    }
  },
  mounted() {
    this.fetchPaymentCounts();
  },
  methods: {
    async fetchPaymentCounts() {
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
          const stats = result.data || {};
          
          // Calculate onsite payments (cash)
          this.onsiteCount = stats.methodBreakdown?.onsite?.count || 0;
          
          // Calculate online payments (gcash + maya + bank_transfer)
          const gcashCount = stats.methodBreakdown?.gcash?.count || 0;
          const mayaCount = stats.methodBreakdown?.maya?.count || 0;
          const bankTransferCount = stats.methodBreakdown?.bank_transfer?.count || 0;
          const onlineCount = stats.methodBreakdown?.online?.count || 0;
          
          this.onlineCount = gcashCount + mayaCount + bankTransferCount + onlineCount;
          
          console.log('📊 Payment counts updated:', {
            onsite: this.onsiteCount,
            online: this.onlineCount,
            breakdown: stats.methodBreakdown
          });
        } else {
          console.error('Failed to fetch payment stats');
        }
      } catch (error) {
        console.error('Error fetching payment counts:', error);
      }
    },
    handleAcceptPayment(payment) {
      console.log('Accepting payment:', payment)
      this.showNotification('Payment accepted successfully!', 'success', 'mdi-check-circle')
      // Refresh counts after payment status change
      this.fetchPaymentCounts();
    },
    handleDeclinePayment(payment) {
      console.log('Declining payment:', payment)
      this.showNotification('Payment declined', 'error', 'mdi-close-circle')
      // Refresh counts after payment status change
      this.fetchPaymentCounts();
    },
    handlePaymentAdded(payment) {
      console.log('Payment added:', payment)
      this.showNotification('Onsite payment added successfully!', 'success', 'mdi-check-circle')
      // Refresh counts after new payment
      this.fetchPaymentCounts();
    },
    handleDeletePayment(payment) {
      console.log('Deleting payment:', payment)
      this.showNotification('Payment deleted', 'info', 'mdi-information')
      // Refresh counts after payment deletion
      this.fetchPaymentCounts();
    },
    showNotification(message, color, icon) {
      this.snackbarMessage = message
      this.snackbarColor = color
      this.snackbarIcon = icon
      this.showSnackbar = true
    }
  }
}
