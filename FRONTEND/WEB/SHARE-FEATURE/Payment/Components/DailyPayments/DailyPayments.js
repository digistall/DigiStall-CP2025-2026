import ToastNotification from '@SHARED_COMPONENTS/ToastNotification/ToastNotification.vue'
import { useAvatar } from '@utils/avatarHelper.js'

export default {
  name: 'DailyPayments',
  setup() {
    const { getAvatarUrl, handleAvatarError, getInitials } = useAvatar()
    return { getAvatarUrl, handleAvatarError, getInitials }
  },
  emits: ['loading', 'count-updated'],
  components: {
    ToastNotification,
  },
  data() {
    return {
      searchQuery: '',
      // Main vendor list (one row per vendor)
      vendorList: [],
      loading: false,

      // Filter panel
      showFilterPanel: false,
      filters: {
        status: null, // 'active' (has recent payments) or 'inactive'
      },

      // Dropdowns for add/edit forms
      collectors: [],
      vendors: [],
      loadingCollectors: false,
      loadingVendors: false,

      // Payment History Modal (opened when clicking a vendor)
      showTrackerModal: false,
      selectedVendor: null,
      vendorPayments: [],
      vendorSummary: null,
      trackerLoading: false,

      // Add Payment Modal
      showAddModal: false,
      formValid: false,
      submitting: false,
      form: {
        collectorId: null,
        vendorId: null,
        amount: '',
        referenceNo: '',
        status: 'completed',
      },

      // Edit Payment Modal
      showEditModal: false,
      editFormValid: false,
      editing: false,
      selectedPayment: null,
      editForm: {
        collectorId: null,
        vendorId: null,
        amount: '',
        referenceNo: '',
        status: '',
      },

      // Delete confirmation
      showDeleteConfirm: false,
      deleting: false,
      paymentToDelete: null,

      // Toast
      toast: {
        show: false,
        message: '',
        type: 'success',
      },
    }
  },
  computed: {
    filteredVendors() {
      let results = [...this.vendorList]

      // Search filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        results = results.filter(
          (v) => (v.vendor_name || '').toLowerCase().includes(q)
        )
      }

      // Status filter
      if (this.filters.status === 'active') {
        results = results.filter((v) => v.total_payments > 0)
      } else if (this.filters.status === 'inactive') {
        results = results.filter((v) => v.total_payments === 0)
      }

      return results
    },

    statusFilterOptions() {
      return [
        { title: 'With Payments', value: 'active' },
        { title: 'No Payments', value: 'inactive' },
      ]
    },
  },
  mounted() {
    this.fetchVendorList()
    this.fetchCollectors()
    this.fetchVendors()
    document.addEventListener('click', this.handleOutsideClick)
    document.addEventListener('keydown', this.handleKeyDown)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick)
    document.removeEventListener('keydown', this.handleKeyDown)
  },
  methods: {
    // =========================================================
    // VENDOR LIST (main table - one row per vendor)
    // =========================================================
    async fetchVendorList() {
      try {
        this.loading = true
        this.$emit('loading', true)
        const token = sessionStorage.getItem('authToken')
        if (!token) return

        const response = await fetch('/api/payments/daily/vendor-list', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            this.vendorList = result.data
            this.$emit('count-updated', this.vendorList.length)
          }
        } else {
          this.showToast('Failed to load vendor list', 'error')
        }
      } catch (error) {
        console.error('Error fetching vendor list:', error)
        this.showToast('Error loading vendor list', 'error')
      } finally {
        this.loading = false
        this.$emit('loading', false)
      }
    },

    // =========================================================
    // VENDOR PAYMENT HISTORY MODAL
    // =========================================================
    async viewVendorTracker(vendor) {
      this.selectedVendor = vendor
      this.vendorPayments = []
      this.vendorSummary = null
      this.showTrackerModal = true
      await this.fetchVendorPaymentHistory(vendor.vendor_id)
    },

    async fetchVendorPaymentHistory(vendorId) {
      try {
        this.trackerLoading = true
        const token = sessionStorage.getItem('authToken')
        if (!token) return

        const response = await fetch(`/api/payments/daily/vendor/${vendorId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            this.vendorPayments = result.data.payments
            this.vendorSummary = result.data.summary
            // Update vendor name from server if available
            if (result.data.vendor) {
              this.selectedVendor = {
                ...this.selectedVendor,
                vendor_name: result.data.vendor.vendor_name,
              }
            }
          }
        } else {
          this.showToast('Failed to load payment history', 'error')
        }
      } catch (error) {
        console.error('Error fetching vendor payment history:', error)
        this.showToast('Error loading payment history', 'error')
      } finally {
        this.trackerLoading = false
      }
    },

    // =========================================================
    // DROPDOWN DATA
    // =========================================================
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
          }
        }
      } catch (error) {
        console.error('Error fetching vendors:', error)
      } finally {
        this.loadingVendors = false
      }
    },

    // =========================================================
    // FILTER MANAGEMENT
    // =========================================================
    toggleFilter() {
      this.showFilterPanel = !this.showFilterPanel
    },

    clearFilters() {
      this.filters.status = null
      this.searchQuery = ''
    },

    applyFilters() {
      this.showFilterPanel = false
    },

    handleOutsideClick(event) {
      if (this.$refs.filterContainer && !this.$refs.filterContainer.contains(event.target)) {
        this.showFilterPanel = false
      }
    },

    handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (this.showFilterPanel) this.showFilterPanel = false
      }
    },

    // =========================================================
    // ADD PAYMENT MODAL
    // =========================================================
    openAddModal() {
      this.resetForm()
      // If opened from a vendor's tracker, pre-select that vendor
      if (this.selectedVendor) {
        this.form.vendorId = this.selectedVendor.vendor_id
      }
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
      const { valid } = await this.$refs.addForm.validate()
      if (!valid) return

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
            // Refresh data
            await this.fetchVendorList()
            // Refresh tracker modal if open
            if (this.showTrackerModal && this.selectedVendor) {
              await this.fetchVendorPaymentHistory(this.selectedVendor.vendor_id)
            }
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

    // =========================================================
    // EDIT PAYMENT MODAL
    // =========================================================
    openEditModal(payment) {
      this.selectedPayment = payment
      this.editForm = {
        collectorId: payment.collector_id,
        vendorId: this.selectedVendor?.vendor_id || null,
        amount: payment.amount.toString(),
        referenceNo: payment.reference_no || '',
        status: payment.status,
      }
      this.showEditModal = true
    },

    closeEditModal() {
      this.showEditModal = false
      this.selectedPayment = null
    },

    async submitEdit() {
      const { valid } = await this.$refs.editForm.validate()
      if (!valid) return

      try {
        this.editing = true
        const token = sessionStorage.getItem('authToken')
        if (!token) {
          this.showToast('Please login to continue', 'error')
          return
        }

        const paymentData = {
          collectorId: this.editForm.collectorId,
          vendorId: this.editForm.vendorId,
          amount: parseFloat(this.editForm.amount),
          referenceNo: this.editForm.referenceNo || null,
          status: this.editForm.status,
        }

        const response = await fetch(`/api/payments/daily/${this.selectedPayment.receipt_id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            this.showToast('Payment updated successfully', 'success')
            this.closeEditModal()
            // Refresh tracker
            if (this.selectedVendor) {
              await this.fetchVendorPaymentHistory(this.selectedVendor.vendor_id)
            }
            await this.fetchVendorList()
          } else {
            this.showToast(result.message || 'Failed to update payment', 'error')
          }
        } else {
          const errorData = await response.json()
          this.showToast(errorData.message || 'Failed to update payment', 'error')
        }
      } catch (error) {
        console.error('Error updating payment:', error)
        this.showToast('An error occurred while updating payment', 'error')
      } finally {
        this.editing = false
      }
    },

    // =========================================================
    // DELETE PAYMENT
    // =========================================================
    confirmDelete(payment) {
      this.paymentToDelete = payment
      this.showDeleteConfirm = true
    },

    async deletePayment() {
      if (!this.paymentToDelete) return

      try {
        this.deleting = true
        const token = sessionStorage.getItem('authToken')
        if (!token) {
          this.showToast('Please login to continue', 'error')
          return
        }

        const response = await fetch(`/api/payments/daily/${this.paymentToDelete.receipt_id}`, {
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
            this.paymentToDelete = null
            // Refresh tracker
            if (this.selectedVendor) {
              await this.fetchVendorPaymentHistory(this.selectedVendor.vendor_id)
            }
            await this.fetchVendorList()
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

    // =========================================================
    // STATUS HELPERS
    // =========================================================
    getStatusColor(status) {
      const statusMap = {
        completed: '#10b981',
        pending: '#f59e0b',
        failed: '#ef4444',
        cancelled: '#9ca3af',
      }
      return statusMap[status?.toLowerCase()] || '#9ca3af'
    },

    getLastPaymentStatusLabel(vendor) {
      if (!vendor.last_payment_status) return { label: 'No Payments', color: '#9ca3af' }
      const map = {
        completed: { label: 'Completed', color: '#10b981' },
        pending: { label: 'Pending', color: '#f59e0b' },
        failed: { label: 'Failed', color: '#ef4444' },
        cancelled: { label: 'Cancelled', color: '#9ca3af' },
      }
      return map[vendor.last_payment_status.toLowerCase()] || { label: 'Unknown', color: '#9ca3af' }
    },

    // =========================================================
    // FORMATTING HELPERS
    // =========================================================
    formatCurrency(amount) {
      return `₱${parseFloat(amount || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    },

    formatDate(dateString) {
      if (!dateString || dateString === '0000-00-00') return '—'
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      } catch {
        return '—'
      }
    },

    formatDateTime(dateString) {
      if (!dateString) return '—'
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '—'
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' }
        const timeOptions = { hour: '2-digit', minute: '2-digit' }
        return `${date.toLocaleDateString('en-US', dateOptions)} ${date.toLocaleTimeString('en-US', timeOptions)}`
      } catch {
        return '—'
      }
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
