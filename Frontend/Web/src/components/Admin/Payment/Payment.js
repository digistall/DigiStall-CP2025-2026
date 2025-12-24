import PaymentTypeSelector from './Components/PaymentTypeSelector/PaymentTypeSelector.vue'
import StallPayments from './Components/StallPayments/StallPayments.vue'
import LoadingOverlay from '../../Common/LoadingOverlay/LoadingOverlay.vue'

export default {
  name: 'Payment',
  components: {
    PaymentTypeSelector,
    StallPayments,
    LoadingOverlay
  },
  data() {
    return {
      pageTitle: 'Payment',
      selectedPaymentType: 'stall', // Default to stall applicants
      loading: false
    }
  },
  mounted() {
    this.initializePayment()
    // Opt-in: use table scrolling inside page instead of page scrollbar
    try {
      document.body.classList.add('no-page-scroll')
      // also add to html element to cover cases where CSS targets html/no-page-scroll
      document.documentElement.classList.add('no-page-scroll')
      // force inline overflow hidden as a stronger fallback and save previous values
      try {
        const prevHtmlOverflow = document.documentElement.style.overflow
        const prevBodyOverflow = document.body.style.overflow
        document.documentElement.dataset._prevOverflow = prevHtmlOverflow || ''
        document.body.dataset._prevOverflow = prevBodyOverflow || ''
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
      } catch (e) {
        /* ignore style set errors */
      }
    } catch (e) {
      /* ignore in non-browser environments */
    }
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
      } catch (e) {}
    } catch (e) {
      /* ignore */
    }
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
