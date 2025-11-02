import PaymentTypeSelector from './Components/PaymentTypeSelector/PaymentTypeSelector.vue'
import StallPayments from './Components/StallPayments/StallPayments.vue'

export default {
  name: 'Payment',
  components: {
    PaymentTypeSelector,
    StallPayments
  },
  data() {
    return {
      pageTitle: 'Payment',
      selectedPaymentType: 'stall' // Default to stall applicants
    }
  },
  mounted() {
    this.initializePayment()
  },
  methods: {
    // Initialize payment page
    initializePayment() {
      console.log('Payment page initialized')
      console.log('Default payment type:', this.selectedPaymentType)
    },
    
    // Handle payment type change
    handleTypeChange(type) {
      this.selectedPaymentType = type
      console.log('Payment type changed to:', type)
    }
  }
}
