import ToastNotification from '../../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'DailyPayments',
  emits: ['loading', 'count-updated'],
  components: {
    ToastNotification,
  },
  data() {
    return {
      searchQuery: '',
      payments: [],
      collectors: [],
      vendors: [],
      loadingCollectors: false,
      loadingVendors: false,
      showAddModal: false,
      showViewModal: false,
      showDeleteConfirm: false,
      selectedPayment: null,
      formValid: false,
      submitting: false,
      deleting: false,
      form: {
        collectorId: null,
        vendorId: null,
        amount: '',
        referenceNo: '',
        status: 'completed',
      },
      toast: {
        show: false,
        message: '',
        type: 'success',
      },
    }
  },
  computed: {
    filteredPayments() {
      if (!this.searchQuery) {
        return this.payments
      }

      const query = this.searchQuery.toLowerCase()
      return this.payments.filter((payment) => {
        return (
          payment.receipt_id.toString().includes(query) ||
          (payment.collector_name || '').toLowerCase().includes(query) ||
          (payment.vendor_name || '').toLowerCase().includes(query) ||
          (payment.reference_no || '').toLowerCase().includes(query) ||
          (payment.status || '').toLowerCase().includes(query)
        )
      })
    },
  },
  mounted() {
    this.fetchPayments()
    this.fetchCollectors()
    this.fetchVendors()
  },
  methods: {
    async fetchPayments() {
      try {
        this.$emit('loading', true)
        const token = sessionStorage.getItem('authToken')

        if (!token) {
          console.log('🔐 No auth token found')
          return
        }

        console.log('🔍 Fetching daily payments from API')
        const response = await fetch('/api/payments/daily', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()

          if (result.success && result.data) {
            this.payments = result.data.map((payment) => ({
              receipt_id: payment.receipt_id,
              collector_id: payment.collector_id,
              collector_name: payment.collector_name || 'N/A',
              vendor_id: payment.vendor_id,
              vendor_name: payment.vendor_name || 'N/A',
              amount: parseFloat(payment.amount || 0),
              reference_no: payment.reference_no || '',
              status: payment.status || 'completed',
              statusColor: this.getStatusColor(payment.status),
              time_date: payment.time_date,
            }))

            this.$emit('count-updated', this.payments.length)
            console.log('📊 Daily payments loaded:', this.payments.length)
          }
        } else {
          console.error('Failed to fetch daily payments:', response.statusText)
          this.showToast('Failed to load daily payments', 'error')
        }
      } catch (error) {
        console.error('Error fetching daily payments:', error)
        this.showToast('An error occurred while loading payments', 'error')
      } finally {
        this.$emit('loading', false)
      }
    },

    async fetchCollectors() {
      try {
        this.loadingCollectors = true
        const token = sessionStorage.getItem('authToken')

        if (!token) return

        const response = await fetch('/api/payments/daily/collectors', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            this.collectors = result.data
            console.log('📊 Collectors loaded:', this.collectors.length)
            console.log('👥 Collector data:', this.collectors)
          }
        }
      } catch (error) {
        console.error('Error fetching collectors:', error)
      } finally {
        this.loadingCollectors = false
      }
    },

    async fetchVendors() {
      try {
        this.loadingVendors = true
        const token = sessionStorage.getItem('authToken')

        if (!token) return

        const response = await fetch('/api/payments/daily/vendors', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            this.vendors = result.data
            console.log('📊 Vendors loaded:', this.vendors.length)
            console.log('🏪 Vendor data:', this.vendors)
          }
        }
      } catch (error) {
        console.error('Error fetching vendors:', error)
      } finally {
        this.loadingVendors = false
      }
    },

    getStatusColor(status) {
      const statusMap = {
        completed: 'success',
        pending: 'warning',
        failed: 'error',
        cancelled: 'grey',
      }
      return statusMap[status?.toLowerCase()] || 'grey'
    },

    openAddModal() {
      this.resetForm()
      this.showAddModal = true
    },

    closeAddModal() {
      this.showAddModal = false
      this.resetForm()
    },

    resetForm() {
      this.form = {
        collectorId: null,
        vendorId: null,
        amount: '',
        referenceNo: '',
        status: 'completed',
      }
      if (this.$refs.addForm) {
        this.$refs.addForm.resetValidation()
      }
    },

    async submitPayment() {
      if (!this.$refs.addForm.validate()) {
        return
      }

      try {
        this.submitting = true
        const token = sessionStorage.getItem('authToken')

        if (!token) {
          this.showToast('Please login to continue', 'error')
          return
        }

        const paymentData = {
          collectorId: this.form.collectorId,
          vendorId: this.form.vendorId,
          amount: parseFloat(this.form.amount),
          referenceNo: this.form.referenceNo || null,
          status: this.form.status,
        }

        console.log('➕ Adding daily payment:', paymentData)

        const response = await fetch('/api/payments/daily', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        })

        if (response.ok) {
          const result = await response.json()

          if (result.success) {
            this.showToast('Payment added successfully', 'success')
            this.closeAddModal()
            await this.fetchPayments()
          } else {
            this.showToast(result.message || 'Failed to add payment', 'error')
          }
        } else {
          const errorData = await response.json()
          this.showToast(errorData.message || 'Failed to add payment', 'error')
        }
      } catch (error) {
        console.error('Error adding payment:', error)
        this.showToast('An error occurred while adding payment', 'error')
      } finally {
        this.submitting = false
      }
    },

    viewPayment(payment) {
      this.selectedPayment = payment
      this.showViewModal = true
    },

    closeViewModal() {
      this.showViewModal = false
      this.selectedPayment = null
    },

    confirmDelete() {
      this.showDeleteConfirm = true
    },

    async deletePayment() {
      if (!this.selectedPayment) return

      try {
        this.deleting = true
        const token = sessionStorage.getItem('authToken')

        if (!token) {
          this.showToast('Please login to continue', 'error')
          return
        }

        console.log('🗑️ Deleting daily payment:', this.selectedPayment.receipt_id)

        const response = await fetch(`/api/payments/daily/${this.selectedPayment.receipt_id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()

          if (result.success) {
            this.showToast('Payment deleted successfully', 'success')
            this.showDeleteConfirm = false
            this.closeViewModal()
            await this.fetchPayments()
          } else {
            this.showToast(result.message || 'Failed to delete payment', 'error')
          }
        } else {
          const errorData = await response.json()
          this.showToast(errorData.message || 'Failed to delete payment', 'error')
        }
      } catch (error) {
        console.error('Error deleting payment:', error)
        this.showToast('An error occurred while deleting payment', 'error')
      } finally {
        this.deleting = false
      }
    },

    formatCurrency(amount) {
      return `₱${parseFloat(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    },

    formatDateTime(dateString) {
      if (!dateString) return 'N/A'

      const date = new Date(dateString)
      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' }
      const timeOptions = { hour: '2-digit', minute: '2-digit' }

      return `${date.toLocaleDateString('en-US', dateOptions)} ${date.toLocaleTimeString('en-US', timeOptions)}`
    },

    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message,
        type,
      }
    },
  },
}
