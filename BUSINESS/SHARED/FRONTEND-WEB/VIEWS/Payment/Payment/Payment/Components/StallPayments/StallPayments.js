import OnlinePayments from '../OnlinePayments/OnlinePayments.vue'
import OnsitePayments from '../OnsitePayments/OnsitePayments.vue'
import ToastNotification from '../../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'StallPayments',
  emits: ['loading'],
  components: {
    OnlinePayments,
    OnsitePayments,
    ToastNotification
  },
  data() {
    return {
      activeTab: 'onsite', // Default to onsite (online payment hidden per boss requirement)
      onlineCount: 0,
      onsiteCount: 0,
      toast: {
        show: false,
        message: '',
        type: 'success'
      }
    }
  },
  mounted() {
    // Fetch counts immediately for both tabs
    this.fetchOnlinePaymentsCount();
    this.fetchOnsitePaymentsCount();
  },
  methods: {
    async fetchOnlinePaymentsCount() {
      try {
        const token = sessionStorage.getItem('authToken');
        
        if (!token) {
          console.log('🔐 No auth token found');
          return;
        }

        const params = new URLSearchParams({
          limit: 1000,
          offset: 0
        });

        const response = await fetch(`/api/payments/online?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            // Filter for actual online payment methods
            const onlinePayments = (result.data || []).filter(payment => {
              const method = (payment.paymentMethod || payment.payment_method || payment.method || '').toLowerCase();
              return method.includes('gcash') || method.includes('maya') || 
                     method.includes('bank') || method.includes('transfer') ||
                     method === 'paymaya' || method === 'gcash' || method === 'maya';
            });
            
            this.onlineCount = onlinePayments.length;
            console.log('📊 Online payments count:', this.onlineCount);
          }
        }
      } catch (error) {
        console.error('Error fetching online payments count:', error);
      }
    },

    async fetchOnsitePaymentsCount() {
      try {
        const token = sessionStorage.getItem('authToken');
        
        if (!token) {
          console.log('🔐 No auth token found');
          return;
        }

        const params = new URLSearchParams({
          limit: 1000,
          offset: 0
        });

        const response = await fetch(`/api/payments/onsite?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            this.onsiteCount = result.data.length || 0;
            console.log('📊 Onsite payments count:', this.onsiteCount);
          }
        }
      } catch (error) {
        console.error('Error fetching onsite payments count:', error);
      }
    },

    handleOnlineCountUpdate(count) {
      this.onlineCount = count;
      console.log('📊 Online payment count updated:', count);
    },
    handleOnsiteCountUpdate(count) {
      this.onsiteCount = count;
      console.log('📊 Onsite payment count updated:', count);
    },
    handleAcceptPayment(payment) {
      console.log('Accepting payment:', payment)
      this.showToast('✅ Payment accepted successfully!', 'success')
      // Refresh online count after accepting payment
      setTimeout(() => this.fetchOnlinePaymentsCount(), 500);
    },
    handleDeclinePayment(payment) {
      console.log('Declining payment:', payment)
      this.showToast('❌ Payment declined', 'error')
      // Refresh online count after declining payment
      setTimeout(() => this.fetchOnlinePaymentsCount(), 500);
    },
    handlePaymentAdded(payment) {
      console.log('Payment added:', payment)
      // Don't show toast here - OnsitePayments already shows detailed success message with discount info
      // Refresh onsite count after adding payment
      setTimeout(() => this.fetchOnsitePaymentsCount(), 500);
    },
    handleDeletePayment(payment) {
      console.log('Deleting payment:', payment)
      this.showToast('🗑️ Payment deleted', 'delete')
      // Refresh onsite count after deleting payment
      setTimeout(() => this.fetchOnsitePaymentsCount(), 500);
    },
    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message: message,
        type: type
      }
    }
  }
}
