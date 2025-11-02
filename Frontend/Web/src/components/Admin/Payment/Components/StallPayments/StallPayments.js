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
      onlineCount: 5,
      onsiteCount: 3,
      showSnackbar: false,
      snackbarMessage: '',
      snackbarColor: 'success',
      snackbarIcon: 'mdi-check-circle'
    }
  },
  methods: {
    handleAcceptPayment(payment) {
      console.log('Accepting payment:', payment)
      this.showNotification('Payment accepted successfully!', 'success', 'mdi-check-circle')
      this.onlineCount--
      // Here you would typically make an API call to update the payment status
    },
    handleDeclinePayment(payment) {
      console.log('Declining payment:', payment)
      this.showNotification('Payment declined', 'error', 'mdi-close-circle')
      this.onlineCount--
      // Here you would typically make an API call to update the payment status
    },
    handlePaymentAdded(payment) {
      console.log('Payment added:', payment)
      this.showNotification('Onsite payment added successfully!', 'success', 'mdi-check-circle')
      this.onsiteCount++
      // Here you would typically make an API call to save the payment
    },
    handleDeletePayment(payment) {
      console.log('Deleting payment:', payment)
      this.showNotification('Payment deleted', 'info', 'mdi-information')
      this.onsiteCount--
      // Here you would typically make an API call to delete the payment
    },
    showNotification(message, color, icon) {
      this.snackbarMessage = message
      this.snackbarColor = color
      this.snackbarIcon = icon
      this.showSnackbar = true
    }
  }
}
