export default {
  name: 'OnsitePayments',
  data() {
    return {
      searchQuery: '',
      showAddModal: false,
      showViewModal: false,
      formValid: false,
      selectedPayment: null,
      form: {
        stallholderName: '',
        stallNo: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        collectedBy: '',
        receiptNo: '',
        notes: ''
      },
      onsitePayments: [
        {
          id: 'OS-001',
          stallholderName: 'Roberto Cruz',
          stallNo: 'E-12',
          amount: 5000,
          paymentDate: '2024-11-02',
          collectedBy: 'Admin Staff',
          receiptNo: 'RCP-2024110201',
          notes: 'Monthly rental payment'
        },
        {
          id: 'OS-002',
          stallholderName: 'Linda Aquino',
          stallNo: 'F-28',
          amount: 4500,
          paymentDate: '2024-11-01',
          collectedBy: 'Admin Staff',
          receiptNo: 'RCP-2024110102',
          notes: ''
        },
        {
          id: 'OS-003',
          stallholderName: 'Miguel Torres',
          stallNo: 'G-05',
          amount: 6000,
          paymentDate: '2024-10-31',
          collectedBy: 'Finance Officer',
          receiptNo: 'RCP-2024103103',
          notes: 'Advance payment for 2 months'
        }
      ]
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
  methods: {
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
