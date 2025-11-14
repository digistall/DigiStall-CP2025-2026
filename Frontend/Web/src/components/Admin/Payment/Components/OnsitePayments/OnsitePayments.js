import StallholderDropdown from '../StallholderDropdown/StallholderDropdown.vue'

export default {
  name: 'OnsitePayments',
  components: {
    StallholderDropdown
  },
  data() {
    return {
      searchQuery: '',
      showAddModal: false,
      showViewModal: false,
      formValid: false,
      selectedPayment: null,
      loading: false,
      form: {
        stallholderId: null,
        stallholderName: '',
        stallNo: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        collectedBy: '',
        receiptNo: '',
        notes: ''
      },
      onsitePayments: []
    }
  },
  computed: {
    filteredPayments() {
      if (!this.searchQuery) {
        return this.onsitePayments;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.onsitePayments.filter(payment => 
        payment.id.toLowerCase().includes(query) ||
        payment.stallholderName.toLowerCase().includes(query) ||
        payment.stallNo.toLowerCase().includes(query) ||
        payment.receiptNo.toLowerCase().includes(query) ||
        payment.collectedBy.toLowerCase().includes(query)
      );
    }
  },
  mounted() {
    this.fetchOnsitePayments()
  },
  methods: {
    async fetchOnsitePayments() {
      try {
        this.loading = true
        const token = sessionStorage.getItem('authToken')
        
        if (!token) {
          console.log('🔐 No auth token found - using sample data')
          this.loadSampleData()
          return
        }

        const params = new URLSearchParams({
          paymentMethod: 'onsite',
          limit: 100
        })

        if (this.searchQuery && this.searchQuery.trim() !== '') {
          params.append('search', this.searchQuery.trim())
        }

        const response = await fetch(`/api/payments/onsite?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Onsite payments loaded:', result.data?.length || 0)
          this.onsitePayments = result.data || []
        } else {
          console.error('❌ Failed to fetch onsite payments:', response.status)
          this.loadSampleData()
        }
      } catch (error) {
        console.error('❌ Error fetching onsite payments:', error)
        this.loadSampleData()
      } finally {
        this.loading = false
      }
    },

    loadSampleData() {
      console.log('🧪 Loading sample onsite payment data')
      this.onsitePayments = [
        {
          id: 'OS-001',
          stallholderName: 'Roberto Cruz',
          stallNo: 'NPM-008',
          amount: 5000,
          paymentDate: '2024-11-02',
          collectedBy: 'Admin Staff',
          receiptNo: 'RCP-2024110201',
          notes: 'Monthly rental payment'
        },
        {
          id: 'OS-002',
          stallholderName: 'Maria Santos',
          stallNo: 'NPM-005',
          amount: 4500,
          paymentDate: '2024-11-01',
          collectedBy: 'Admin Staff',
          receiptNo: 'RCP-2024110102',
          notes: 'Corner Market Area payment'
        },
        {
          id: 'OS-003',
          stallholderName: 'Carlos Mendoza',
          stallNo: 'NPM-008',
          amount: 6000,
          paymentDate: '2024-10-31',
          collectedBy: 'Finance Officer',
          receiptNo: 'RCP-2024103103',
          notes: 'Food Court Central payment'
        }
      ]
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
    closeAddModal() {
      this.showAddModal = false
      this.resetForm()
    },
    resetForm() {
      this.form = {
        stallholderId: null,
        stallholderName: '',
        stallNo: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        collectedBy: '',
        receiptNo: '',
        notes: ''
      }
      if (this.$refs.addForm) {
        this.$refs.addForm.reset()
      }
    },
    onStallholderSelected(stallholder) {
      console.log('🎯 Stallholder selected:', stallholder)
      if (stallholder) {
        this.form.stallholderId = stallholder.stallholder_id
        this.form.stallholderName = stallholder.stallholder_name
        this.form.stallNo = stallholder.stall_no || stallholder.stall_number || 'N/A'
      } else {
        this.form.stallholderId = null
        this.form.stallholderName = ''
        this.form.stallNo = ''
      }
    },
    addPayment() {
      if (this.$refs.addForm.validate()) {
        const newPayment = {
          id: `OS-${String(this.onsitePayments.length + 1).padStart(3, '0')}`,
          stallholderName: this.form.stallholderName,
          stallNo: this.form.stallNo,
          amount: parseFloat(this.form.amount),
          paymentDate: this.form.paymentDate,
          collectedBy: this.form.collectedBy,
          receiptNo: this.form.receiptNo,
          notes: this.form.notes
        }
        this.onsitePayments.unshift(newPayment)
        this.$emit('payment-added', newPayment)
        this.closeAddModal()
      }
    },
    viewPayment(payment) {
      this.selectedPayment = payment
      this.showViewModal = true
    },
    deletePayment(payment) {
      this.$emit('delete-payment', payment)
    }
  }
}
