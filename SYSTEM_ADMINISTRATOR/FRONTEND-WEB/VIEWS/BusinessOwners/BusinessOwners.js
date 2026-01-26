import axios from 'axios'
import BusinessOwnersTable from './Components/Table/BusinessOwnersTable.vue'
import CreateBusinessOwnerDialog from './Components/Dialogs/CreateBusinessOwnerDialog.vue'
import RecordPaymentDialog from './Components/Dialogs/RecordPaymentDialog.vue'
import UniversalPopup from '@SHARED_COMPONENTS/UniversalPopup/UniversalPopup.vue'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '')

export default {
  name: 'BusinessOwners',
  components: {
    BusinessOwnersTable,
    CreateBusinessOwnerDialog,
    RecordPaymentDialog,
    UniversalPopup
  },
  data() {
    return {
      businessOwners: [],
      subscriptionPlans: [],
      loading: false,
      creating: false,
      recording: false,
      showCreateDialog: false,
      showPaymentDialog: false,
      selectedOwner: null,
      newOwner: {
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        planId: null
      },
      payment: {
        amount: null,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        referenceNumber: '',
        periodStart: '',
        periodEnd: '',
        notes: ''
      },
      paymentMethods: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Online Payment', 'Check'],
      headers: [
        { title: 'ID', value: 'business_owner_id' },
        { title: 'Name', value: 'full_name' },
        { title: 'Email', value: 'email' },
        { title: 'Contact', value: 'contact_number' },
        { title: 'Plan', value: 'plan_name' },
        { title: 'Status', value: 'subscription_status' },
        { title: 'Expiry Date', value: 'subscription_expiry_date' },
        { title: 'Days Until Expiry', value: 'days_until_expiry' },
        { title: 'Actions', value: 'actions', sortable: false }
      ],
      popup: {
        show: false,
        message: '',
        type: 'success',
        operation: '',
        operationType: 'Business Owner'
      }
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const token = sessionStorage.getItem('authToken')
        
        // Load subscription plans
        const plansResponse = await axios.get(`${API_BASE_URL}/api/subscriptions/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (plansResponse.data.success) {
          this.subscriptionPlans = plansResponse.data.data.map(plan => ({
            ...plan,
            plan_display: `${plan.plan_name} - ₱${this.formatCurrency(plan.monthly_fee)}/month`
          }))
        }
        
        // Load business owners
        const ownersResponse = await axios.get(`${API_BASE_URL}/api/subscriptions/business-owners`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (ownersResponse.data.success) {
          this.businessOwners = ownersResponse.data.data
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        this.showPopup('Failed to load data. Please try again.', 'error')
      } finally {
        this.loading = false
      }
    },
    async createBusinessOwner() {
      this.creating = true
      try {
        const token = sessionStorage.getItem('authToken')
        
        const response = await axios.post(`${API_BASE_URL}/api/subscriptions/business-owner`, this.newOwner, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          this.showPopup('Business owner created successfully! Awaiting first payment.', 'success', 'add')
          this.closeCreateDialog()
          this.loadData()
        }
      } catch (error) {
        console.error('Failed to create business owner:', error)
        this.showPopup(error.response?.data?.message || 'Failed to create business owner', 'error')
      } finally {
        this.creating = false
      }
    },
    showRecordPayment(owner) {
      this.selectedOwner = owner
      const today = new Date().toISOString().split('T')[0]
      
      // Calculate period end based on plan duration_months
      const duration = owner.duration_months || 1
      const periodEndDate = new Date()
      periodEndDate.setMonth(periodEndDate.getMonth() + duration)
      const periodEnd = periodEndDate.toISOString().split('T')[0]
      
      this.payment = {
        amount: owner.monthly_fee || owner.plan_price || 0,
        paymentDate: today,
        paymentMethod: '',
        referenceNumber: '',
        periodStart: today,
        periodEnd: periodEnd,
        notes: ''
      }
      this.showPaymentDialog = true
    },
    async recordPayment() {
      this.recording = true
      try {
        const token = sessionStorage.getItem('authToken')
        
        const paymentData = {
          subscriptionId: this.selectedOwner.subscription_id,
          businessOwnerId: this.selectedOwner.business_owner_id,
          ...this.payment
        }
        
        const response = await axios.post(`${API_BASE_URL}/api/subscriptions/payment`, paymentData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          this.showPopup(`Payment recorded successfully! Receipt: ${response.data.data.receipt_number}`, 'success', 'add')
          this.closePaymentDialog()
          this.loadData()
        }
      } catch (error) {
        console.error('Failed to record payment:', error)
        this.showPopup(error.response?.data?.message || 'Failed to record payment', 'error')
      } finally {
        this.recording = false
      }
    },
    viewPaymentHistory(owner) {
      this.$router.push(`/system-admin/payments?businessOwnerId=${owner.business_owner_id}`)
    },
    handleCreateBusinessOwner(formData) {
      // Update newOwner with formData and call createBusinessOwner
      this.newOwner = formData
      this.createBusinessOwner()
    },
    handleRecordPayment(formData) {
      // Update payment data from dialog
      this.payment = formData
      this.recordPayment()
    },
    closeCreateDialog() {
      this.showCreateDialog = false
      this.newOwner = {
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        planId: null
      }
      this.$refs.createForm?.resetValidation()
    },
    closePaymentDialog() {
      this.showPaymentDialog = false
      this.selectedOwner = null
      this.$refs.paymentForm?.resetValidation()
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    },
    getStatusColor(status) {
      const colors = {
        Active: 'green',
        Expired: 'red',
        Suspended: 'grey',
        Pending: 'orange'
      }
      return colors[status] || 'grey'
    },
    showPopup(message, type = 'success', operation = '') {
      this.popup = {
        show: true,
        message,
        type,
        operation,
        operationType: operation === 'add' && message.includes('Payment') ? 'Payment' : 'Business Owner'
      }
    }
  }
}
