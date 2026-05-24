import StallPayments from './Components/StallPayments/StallPayments.vue'
import DailyPayments from './Components/DailyPayments/DailyPayments.vue'
import PenaltyPayments from './Components/PenaltyPayments/PenaltyPayments.vue'
import LoadingOverlay from '@common/LoadingOverlay/LoadingOverlay.vue'

export default {
  name: 'Payment',
  components: {
    StallPayments,
    DailyPayments,
    PenaltyPayments,
    LoadingOverlay,
  },
  data() {
    return {
      pageTitle: 'Payment',
      selectedPaymentType: 'stall', // Default to stall applicants
      loading: false,
    }
  },
  mounted() {
    this.initializePayment()
  },
  beforeUnmount() {
    try {
      document.body.classList.remove('no-page-scroll')
      document.documentElement.classList.remove('no-page-scroll')
      try {
        // restore previous inline overflow values
        const prevHtml = document.documentElement.dataset._prevOverflow || ''
        const prevBody = document.body.dataset._prevOverflow || ''
        document.documentElement.style.overflow = prevHtml
        document.body.style.overflow = prevBody
        delete document.documentElement.dataset._prevOverflow
        delete document.body.dataset._prevOverflow
      } catch { /* empty */ }
    } catch { /* empty */ }
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
    },

    // Handle loading state from child components
    handleLoading(isLoading) {
      this.loading = isLoading
    },
  },
}
