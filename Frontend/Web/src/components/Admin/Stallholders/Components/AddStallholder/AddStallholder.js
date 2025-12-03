import apiClient from '@/services/apiClient'
import ToastNotification from '../../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'AddStallholder',
  components: {
    ToastNotification
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      formValid: false,
      saving: false,
      activeTab: 0,
      
      // Form data
      stallholder: {
        stallholder_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        gender: '',
        civil_status: '',
        business_name: '',
        business_type: '',
        business_description: '',
        branch_id: null,
        stall_id: null,
        contract_start_date: '',
        contract_end_date: '',
        monthly_rental: '',
        payment_status: 'Current',
        compliance_status: 'Compliant',
        last_payment_date: '',
        notes: ''
      },

      // Options
      genderOptions: ['Male', 'Female', 'Other'],
      civilStatusOptions: ['Single', 'Married', 'Divorced', 'Widowed'],
      businessTypeOptions: [
        'Food & Beverages',
        'Retail',
        'Services',
        'Clothing & Apparel',
        'Electronics',
        'Home & Garden',
        'Health & Beauty',
        'Books & Media',
        'Sports & Recreation',
        'Other'
      ],
      paymentStatusOptions: [
        { text: 'Current', value: 'Current' },
        { text: 'Overdue', value: 'Overdue' },
        { text: 'Grace Period', value: 'Grace' }
      ],
      complianceStatusOptions: [
        { text: 'Compliant', value: 'Compliant' },
        { text: 'Non-Compliant', value: 'Non-Compliant' }
      ],

      // Data from API
      branches: [],
      stalls: [],
      availableStalls: [],

      // Validation rules
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid'
      ],
      
      // Toast notification
      toast: {
        show: false,
        message: '',
        type: 'success'
      }
    }
  },
  computed: {
    contractEndDateRules() {
      return [
        v => !!v || 'Contract end date is required',
        v => {
          if (!this.stallholder.contract_start_date) return true
          return new Date(v) > new Date(this.stallholder.contract_start_date) || 'End date must be after start date'
        }
      ]
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.loadInitialData()
        this.resetForm()
      }
    },
    'stallholder.branch_id'(newVal) {
      if (newVal) {
        this.loadAvailableStalls()
      } else {
        this.availableStalls = []
        this.stallholder.stall_id = null
      }
    }
  },
  methods: {
    async loadInitialData() {
      try {
        // Load branches
        const branchResponse = await apiClient.get('/branches')
        this.branches = branchResponse.data || []

        // Load all stalls
        const stallResponse = await apiClient.get('/stalls')
        this.stalls = stallResponse.data || []
      } catch (error) {
        console.error('Error loading initial data:', error)
        this.showToast('❌ Failed to load form data', 'error')
      }
    },

    async loadAvailableStalls() {
      if (!this.stallholder.branch_id) return

      try {
        // Filter stalls for the selected branch that are available (no active stallholder)
        this.availableStalls = this.stalls
          .filter(stall => stall.branch_id === this.stallholder.branch_id && !stall.current_stallholder)
          .map(stall => ({
            ...stall,
            stall_display: `${stall.stall_number} - ${stall.stall_location || 'Location TBD'}`
          }))
      } catch (error) {
        console.error('Error loading available stalls:', error)
        this.availableStalls = []
      }
    },

    onStallChange() {
      if (this.stallholder.stall_id) {
        const selectedStall = this.stalls.find(s => s.stall_id === this.stallholder.stall_id)
        if (selectedStall && selectedStall.monthly_rent) {
          this.stallholder.monthly_rental = selectedStall.monthly_rent.toString()
        }
      }
    },

    async saveStallholder() {
      if (!this.$refs.stallholderForm.validate()) {
        this.activeTab = 0 // Go to first tab if validation fails
        return
      }

      this.saving = true
      try {
        const stallholderData = {
          ...this.stallholder,
          monthly_rental: parseFloat(this.stallholder.monthly_rental) || 0,
          contract_start_date: this.stallholder.contract_start_date || null,
          contract_end_date: this.stallholder.contract_end_date || null,
          date_of_birth: this.stallholder.date_of_birth || null,
          last_payment_date: this.stallholder.last_payment_date || null,
          stall_id: this.stallholder.stall_id || null
        }

        await apiClient.post('/stallholders', stallholderData)
        
        this.showToast('✅ Stallholder added successfully!', 'success')
        this.$emit('stallholder-added')
        
        // Close dialog after a short delay
        setTimeout(() => {
          this.closeDialog()
        }, 1500)
      } catch (error) {
        console.error('Error saving stallholder:', error)
        this.showToast(
          `❌ ${error.response?.data?.error || 'Failed to add stallholder. Please try again.'}`,
          'error'
        )
      } finally {
        this.saving = false
      }
    },

    resetForm() {
      this.stallholder = {
        stallholder_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        gender: '',
        civil_status: '',
        business_name: '',
        business_type: '',
        business_description: '',
        branch_id: null,
        stall_id: null,
        contract_start_date: '',
        contract_end_date: '',
        monthly_rental: '',
        payment_status: 'Current',
        compliance_status: 'Compliant',
        last_payment_date: '',
        notes: ''
      }
      this.activeTab = 0
      this.formValid = false
      this.availableStalls = []
      
      if (this.$refs.stallholderForm) {
        this.$refs.stallholderForm.resetValidation()
      }
    },

    closeDialog() {
      this.$emit('close')
      this.resetForm()
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