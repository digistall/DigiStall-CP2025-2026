import StallholderDropdown from '../StallholderDropdown/StallholderDropdown.vue'
import ToastNotification from '../../../../Common/ToastNotification/ToastNotification.vue'

// Discount and fee constants
const ADVANCE_DISCOUNT = 0.25     // 25% off when paid 5+ days early
const LATE_FEE_RATE   = 0.10     // 10% additional fee when overdue
const ADVANCE_DAYS    = 5        // days before due to qualify for discount

export default {
  name: 'OnsitePayments',
  emits: ['payment-added', 'delete-payment', 'count-updated', 'loading'],
  components: { StallholderDropdown, ToastNotification },

  data() {
    return {
      searchQuery: '',
      showFilterPanel: false,

      // Filters
      filters: {
        stallNumberSort: null,  // 'asc', 'desc', or null
        section: null,
        floor: null,
        status: null  // 'Paid', 'Overdue', 'Pending'
      },

      // Main stall list (replaces payment history list)
      stallList: [],
      loading: false,

      // Tracker modal
      showTrackerModal: false,
      selectedStall: null,
      paymentTracker: [],
      trackerLoading: false,
      latestReceiptNo: null,
      latestPaymentDate: null,

      // Entry detail modal
      showEntryDetail: false,
      selectedEntry: null,

      // Add payment modal
      showAddModal: false,
      formValid: false,

      toast: { show: false, message: '', type: 'success' },

      form: {
        stallholderId: null,
        stallholderName: '',
        stallNo: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        paymentForMonth: new Date().toISOString().substring(0, 7),
        paymentType: 'rental',
        collectedBy: '',
        receiptNo: '',
        notes: '',
        selectedViolation: null
      },

      stallholders: [],
      unpaidViolations: [],
      loadingViolations: false
    }
  },

  computed: {
    filteredStalls() {
      let results = [...this.stallList]

      // 1. Search filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        results = results.filter(s =>
          (s.stallNo || '').toLowerCase().includes(q) ||
          (s.name || '').toLowerCase().includes(q) ||
          (s.stallLocation || '').toLowerCase().includes(q) ||
          (s.sectionName || '').toLowerCase().includes(q) ||
          (s.floorName || '').toLowerCase().includes(q)
        )
      }

      // 2. Section filter
      if (this.filters.section) {
        results = results.filter(s => s.sectionName === this.filters.section)
      }

      // 3. Floor filter
      if (this.filters.floor) {
        results = results.filter(s => s.floorName === this.filters.floor)
      }

      // 4. Status filter
      if (this.filters.status) {
        results = results.filter(s => this.getStatusConfig(s).label === this.filters.status)
      }

      // 5. Stall Number sort
      if (this.filters.stallNumberSort === 'asc') {
        results.sort((a, b) => {
          const numA = parseInt((a.stallNo || '0').replace(/\D/g, '')) || 0
          const numB = parseInt((b.stallNo || '0').replace(/\D/g, '')) || 0
          return numA - numB
        })
      } else if (this.filters.stallNumberSort === 'desc') {
        results.sort((a, b) => {
          const numA = parseInt((a.stallNo || '0').replace(/\D/g, '')) || 0
          const numB = parseInt((b.stallNo || '0').replace(/\D/g, '')) || 0
          return numB - numA
        })
      }

      return results
    },

    stallNumberSortOptions() {
      return [
        { title: 'Low to High', value: 'asc' },
        { title: 'High to Low', value: 'desc' }
      ]
    },

    sectionFilterOptions() {
      const sections = [...new Set(this.stallList.map(s => s.sectionName).filter(Boolean))]
      return sections.sort()
    },

    floorFilterOptions() {
      const floors = [...new Set(this.stallList.map(s => s.floorName).filter(Boolean))]
      return floors.sort()
    },

    statusFilterOptions() {
      return ['Paid', 'Overdue', 'Pending']
    },

    isPenaltyPayment() {
      return this.form.paymentType === 'penalty'
    },

    violationItems() {
      return this.unpaidViolations.map(v => ({
        title: `${v.violationType} - \u20B1${v.penaltyAmount.toLocaleString()} (${v.severity}) - ${this.formatDate(v.dateReported)}`,
        value: v.violationId,
        violation: v
      }))
    }
  },

  watch: {
    stallList: {
      handler() { this.$emit('count-updated', this.stallList.length) },
      immediate: true
    },
    'form.paymentType': {
      handler(newType) {
        if (newType === 'penalty' && this.form.stallholderId) {
          this.loadUnpaidViolations(this.form.stallholderId)
        } else {
          this.unpaidViolations = []
          this.form.selectedViolation = null
        }
      }
    },
    'form.selectedViolation': {
      handler(newViolation) {
        if (newViolation) {
          const v = this.unpaidViolations.find(x => x.violationId === newViolation)
          if (v) this.form.amount = v.penaltyAmount.toString()
        }
      }
    }
  },

  mounted() {
    this.fetchStallList()
    this.setCurrentUser()
    // Close filter dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick)
    document.addEventListener('keydown', this.handleKeyDown)
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick)
    document.removeEventListener('keydown', this.handleKeyDown)
  },

  methods: {
    // =========================================================
    // STALL LIST (main table)
    // =========================================================
    async fetchStallList() {
      try {
        this.loading = true
        this.$emit('loading', true)
        const token = sessionStorage.getItem('authToken')
        if (!token) {
          this.loading = false
          this.$emit('loading', false)
          return
        }

        const response = await fetch('/api/payments/stallholders', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const result = await response.json()
          this.stallList = (result.data || []).map(s => ({
            id: s.id || s.stallholder_id,
            name: s.name || s.stallholder_name,
            stallNo: s.stallNo || s.stall_number,
            stallLocation: s.stallLocation || s.stall_location,
            sectionName: s.sectionName || s.section_name || null,
            floorName: s.floorName || s.floor_name || null,
            floorNumber: s.floorNumber || s.floor_number || null,
            monthlyRental: parseFloat(s.monthlyRental || s.rental_price || 0),
            moveInDate: s.contract_start_date || s.move_in_date || null,
            paymentStatus: s.payment_status || 'unpaid'
          }))
        } else {
          this.showToast('Failed to load stall list', 'error')
        }
      } catch (e) {
        console.error('âŒ fetchStallList error:', e)
        this.showToast('Error loading stall list', 'error')
      } finally {
        this.loading = false
        this.$emit('loading', false)
      }
    },

    // =========================================================
    // STATUS CONFIG (for main table Status column)
    // =========================================================
    getStatusConfig(stall) {
      const now = new Date()
      const moveIn = stall.moveInDate ? new Date(stall.moveInDate) : null
      const dueDay = moveIn ? moveIn.getDate() : 1

      // Current month due date
      const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay)

      // If due day doesn't exist in month (e.g. 31 in Feb), use last day
      if (dueDate.getMonth() !== now.getMonth()) {
        dueDate.setDate(0) // last day of prev month â†’ correct to last day of current month
      }

      const isPaid = (stall.paymentStatus || '').toLowerCase() === 'paid'

      if (isPaid) {
        // We don't know advance vs on-time from just payment_status; show Paid
        return { label: 'Paid', color: '#10b981' }
      }

      if (now > dueDate) {
        return { label: 'Overdue', color: '#ef4444' }
      }

      const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24))
      if (daysUntilDue >= ADVANCE_DAYS) {
        return { label: 'Pending', color: '#9ca3af' }
      }

      return { label: 'Pending', color: '#9ca3af' }
    },

    // =========================================================
    // FILTER MANAGEMENT
    // =========================================================
    toggleFilter() {
      this.showFilterPanel = !this.showFilterPanel
    },

    clearFilters() {
      this.filters.stallNumberSort = null
      this.filters.section = null
      this.filters.floor = null
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
      if (event.key === 'Escape' && this.showFilterPanel) {
        this.showFilterPanel = false
      }
    },

    // =========================================================
    // TRACKER MODAL
    // =========================================================
    async viewStallTracker(stall) {
      this.selectedStall = stall
      this.latestReceiptNo = null
      this.latestPaymentDate = null
      this.paymentTracker = []
      this.showTrackerModal = true
      await this.fetchPaymentTracker(stall.id)
    },

    async fetchPaymentTracker(stallholderId) {
      try {
        this.trackerLoading = true
        const token = sessionStorage.getItem('authToken')
        if (!token) return

        const response = await fetch(`/api/payments/tracker/${stallholderId}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const result = await response.json()
          const { stallholder, payments } = result.data

          // Update selectedStall with fresh moveInDate from tracker endpoint
          if (stallholder.moveInDate) {
            this.selectedStall = { ...this.selectedStall, moveInDate: stallholder.moveInDate }
          }

          // Set latest payment info (most recent payment)
          if (payments && payments.length > 0) {
            const latest = payments[payments.length - 1]
            this.latestReceiptNo = latest.receiptNo || null
            this.latestPaymentDate = latest.paymentDate ? this.formatDate(latest.paymentDate) : null
          }

          // Build monthly tracker
          this.paymentTracker = this.buildPaymentTracker(
            stallholder,
            payments || []
          )
        } else {
          console.error('âŒ Tracker fetch failed:', response.status)
          this.showToast('Failed to load payment tracker', 'error')
        }
      } catch (e) {
        console.error('âŒ fetchPaymentTracker error:', e)
        this.showToast('Error loading tracker', 'error')
      } finally {
        this.trackerLoading = false
      }
    },

    /**
     * Build the monthly payment timeline from moveInDate to today.
     *
     * Status rules:
     *   Paid     â€“ payment on time (within advance window)
     *   Advance  â€“ payment 5+ days before due date  â†’ 25% discount applied
     *   Overdue  â€“ past due date, no payment         â†’ 10% late fee added
     *   Pending  â€“ due date not yet reached           â†’ show discounted amount
     */
    buildPaymentTracker(stallholder, payments) {
      const rental = parseFloat(stallholder.monthlyRental) || 0
      const moveInRaw = stallholder.moveInDate
      if (!moveInRaw) return []

      const moveIn = new Date(moveInRaw)
      const now = new Date()
      const dueDay = moveIn.getDate()

      const tracker = []
      let year = moveIn.getFullYear()
      let month = moveIn.getMonth()

      // Show all months through December of current year
      const maxYear = now.getFullYear()
      const maxMonth = 11 // December

      while (year < maxYear || (year === maxYear && month <= maxMonth)) {
        // Build due date for this month
        let dueDate = new Date(year, month, dueDay)
        // If dueDay overflows (e.g., Jan 31 â†’ Feb 31 doesn't exist), roll back
        if (dueDate.getMonth() !== month) {
          dueDate = new Date(year, month + 1, 0) // last day of intended month
        }

        // Find actual payment for this month
        const monthPayment = payments.find(p => {
          if (p.paymentForMonth) {
            const [pY, pM] = p.paymentForMonth.split('-').map(Number)
            return pY === year && pM === month + 1
          }
          // Fallback: check if payment_date is within this calendar month
          const pd = new Date(p.paymentDate)
          return pd.getFullYear() === year && pd.getMonth() === month
        })

        let status, amount

        if (monthPayment) {
          const payDate = new Date(monthPayment.paymentDate)
          const daysEarly = Math.floor((dueDate - payDate) / (1000 * 60 * 60 * 24))
          if (daysEarly >= ADVANCE_DAYS) {
            status = 'Advance'
            amount = parseFloat(monthPayment.amount) // already discounted when collected
          } else {
            status = 'Paid'
            amount = parseFloat(monthPayment.amount)
          }
        } else if (now > dueDate) {
          status = 'Overdue'
          amount = rental * (1 + LATE_FEE_RATE) // +10%
        } else {
          status = 'Pending'
          amount = rental * (1 - ADVANCE_DISCOUNT) // show discounted (incentive to pay early)
        }

        tracker.push({
          year,
          month,
          dueDate,
          dueDateFormatted: dueDate.toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
          }),
          amount,
          status,
          receiptNo: monthPayment?.receiptNo || null,
          // Store full payment record for detail modal
          paymentId: monthPayment?.id || null,
          paymentDate: monthPayment?.paymentDate || null,
          paymentTime: monthPayment?.paymentTime || null,
          paymentForMonth: monthPayment?.paymentForMonth || null,
          collectedBy: monthPayment?.collectedBy || null,
          paymentStatus: monthPayment?.status || null,
          notes: monthPayment?.notes || null,
          monthlyRental: rental,
          hasPaid: !!monthPayment
        })

        month++
        if (month > 11) { month = 0; year++ }
      }

      return tracker
    },

    getTrackerStatusConfig(status) {
      const map = {
        'Paid':    { color: '#10b981', iconColor: '#10b981', icon: 'mdi-check-circle' },
        'Advance': { color: '#1e88e5', iconColor: '#1e88e5', icon: 'mdi-clock-fast' },
        'Overdue': { color: '#ef4444', iconColor: '#ef4444', icon: 'mdi-alert-circle' },
        'Pending': { color: '#9ca3af', iconColor: '#9ca3af', icon: 'mdi-clock-outline' }
      }
      return map[status] || { color: '#9ca3af', iconColor: '#9ca3af', icon: 'mdi-help-circle' }
    },

    // =========================================================
    // ENTRY DETAIL MODAL
    // =========================================================
    openEntryDetail(entry) {
      this.selectedEntry = entry
      this.showEntryDetail = true
    },

    getEntryMonthLabel(entry) {
      if (!entry) return ''
      const date = new Date(entry.year, entry.month)
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    },

    formatDateTime(dateStr, timeStr) {
      if (!dateStr) return '\u2014'
      const d = new Date(dateStr)
      const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      if (timeStr) {
        return `${datePart} at ${timeStr}`
      }
      return datePart
    },

    getEntryBreakdown(entry) {
      if (!entry) return []
      const rental = entry.monthlyRental || 0
      const items = []
      items.push({ label: 'Base Monthly Rental', value: this.formatCurrency(rental) })

      if (entry.status === 'Advance') {
        const discount = rental * ADVANCE_DISCOUNT
        items.push({ label: `Advance Discount (${ADVANCE_DISCOUNT * 100}%)`, value: `- ${this.formatCurrency(discount)}`, isDiscount: true })
        items.push({ label: 'Total Paid', value: this.formatCurrency(entry.amount), isTotal: true })
      } else if (entry.status === 'Overdue') {
        const fee = rental * LATE_FEE_RATE
        items.push({ label: `Late Fee (${LATE_FEE_RATE * 100}%)`, value: `+ ${this.formatCurrency(fee)}`, isFee: true })
        items.push({ label: 'Total Due', value: this.formatCurrency(entry.amount), isTotal: true })
      } else if (entry.status === 'Paid') {
        items.push({ label: 'Total Paid', value: this.formatCurrency(entry.amount), isTotal: true })
      } else {
        const discount = rental * ADVANCE_DISCOUNT
        items.push({ label: `Early Payment Discount (${ADVANCE_DISCOUNT * 100}%)`, value: `- ${this.formatCurrency(discount)}`, isDiscount: true })
        items.push({ label: 'Amount if Paid Early', value: this.formatCurrency(entry.amount), isTotal: true })
      }
      return items
    },

    // =========================================================
    // ADD PAYMENT FORM LOGIC (unchanged)
    // =========================================================
    async loadStallholders() {
      try {
        const token = sessionStorage.getItem('authToken')
        if (!token) return
        const response = await fetch('/api/payments/stallholders', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        if (response.ok) {
          const result = await response.json()
          this.stallholders = result.data || []
        }
      } catch (e) {
        console.error('âŒ loadStallholders error:', e)
      }
    },

    setCurrentUser() {
      try {
        const token = sessionStorage.getItem('authToken')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          this.form.collectedBy = `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || 'System'
        }
      } catch (e) {
        this.form.collectedBy = 'System'
      }
    },

    async onStallholderSelected(stallholder) {
      if (!stallholder) { this.clearForm(); this.unpaidViolations = []; return }
      if (this.form.paymentType === 'penalty') this.loadUnpaidViolations(stallholder.id)

      try {
        const token = sessionStorage.getItem('authToken')
        const response = await fetch(`/api/payments/stallholders/${stallholder.id}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const result = await response.json()
          const details = result.data
          this.form.stallholderId = details.id
          this.form.stallholderName = details.name
          this.form.stallNo = details.stallNo || details.stall_no

          const monthlyRent = parseFloat(details.monthlyRental || details.rental_price || 0)
          const contractStart = details.contract_start_date ? new Date(details.contract_start_date) : null
          const lastPayment = details.last_payment_date ? new Date(details.last_payment_date) : null
          const today = new Date()
          let dueDate

          if (lastPayment) {
            dueDate = new Date(lastPayment); dueDate.setDate(dueDate.getDate() + 30)
          } else if (contractStart) {
            dueDate = new Date(contractStart); dueDate.setDate(dueDate.getDate() + 30)
          } else {
            dueDate = new Date(today); dueDate.setDate(dueDate.getDate() + 30)
          }

          const daysEarly = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24))
          this.form.amount = (daysEarly >= ADVANCE_DAYS
            ? (monthlyRent * (1 - ADVANCE_DISCOUNT))
            : monthlyRent
          ).toFixed(2)

          this.form.paymentDate = today.toISOString().split('T')[0]
          this.form.paymentTime = today.toTimeString().split(' ')[0].substring(0, 5)
          this.form.paymentForMonth = today.toISOString().substring(0, 7)
          this.setCurrentUser()
        } else {
          this.form.stallholderId = stallholder.id
          this.form.stallholderName = stallholder.name
          this.form.stallNo = stallholder.stallNo
          this.form.amount = stallholder.monthlyRental || ''
          this.form.paymentDate = new Date().toISOString().split('T')[0]
          this.form.paymentTime = new Date().toTimeString().split(' ')[0].substring(0, 5)
          this.form.paymentForMonth = new Date().toISOString().substring(0, 7)
          this.setCurrentUser()
        }
      } catch (e) {
        console.error('âŒ onStallholderSelected error:', e)
        this.form.stallholderId = stallholder.id
        this.form.stallholderName = stallholder.name
        this.form.stallNo = stallholder.stallNo
        this.form.amount = stallholder.monthlyRental || ''
        this.setCurrentUser()
      }
    },

    async generateReceiptNumber() {
      try {
        const token = sessionStorage.getItem('authToken')
        const response = await fetch('/api/payments/generate-receipt-number', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        if (response.ok) {
          const result = await response.json()
          this.form.receiptNo = result.receiptNumber
        }
      } catch (e) {
        console.error('âŒ generateReceiptNumber error:', e)
      }
    },

    clearForm() {
      this.form = {
        stallholderId: null, stallholderName: '', stallNo: '', amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        paymentForMonth: new Date().toISOString().substring(0, 7),
        paymentType: 'rental', collectedBy: this.form.collectedBy,
        receiptNo: '', notes: '', selectedViolation: null
      }
      this.unpaidViolations = []
    },

    async loadUnpaidViolations(stallholderId) {
      try {
        this.loadingViolations = true
        const token = sessionStorage.getItem('authToken')
        if (!token) return
        const response = await fetch(`/api/payments/violations/unpaid/${stallholderId}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        if (response.ok) {
          const result = await response.json()
          this.unpaidViolations = result.data || []
          if (this.unpaidViolations.length === 0) this.showToast('No unpaid violations for this stallholder', 'info')
        } else {
          this.unpaidViolations = []
        }
      } catch (e) {
        console.error('âŒ loadUnpaidViolations error:', e)
        this.unpaidViolations = []
      } finally {
        this.loadingViolations = false
      }
    },

    async processViolationPayment() {
      if (!this.$refs.addForm.validate()) return
      if (!this.form.selectedViolation) { this.showToast('Please select a violation to pay', 'error'); return }

      try {
        this.loading = true
        const token = sessionStorage.getItem('authToken')
        const response = await fetch('/api/payments/violations/pay', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            violationId: this.form.selectedViolation,
            paymentReference: this.form.receiptNo,
            paidAmount: parseFloat(this.form.amount),
            notes: this.form.notes
          })
        })
        const result = await response.json()
        if (response.ok && result.success) {
          this.showToast(`Violation payment processed! \u20B1${result.data.paidAmount.toLocaleString()}`, 'success')
          this.closeAddModal()
          this.$emit('payment-added', result)
          await this.fetchStallList()
        } else {
          this.showToast(result.message || 'Failed to process payment', 'error')
        }
      } catch (e) {
        console.error('âŒ processViolationPayment error:', e)
        this.showToast('Error processing payment', 'error')
      } finally {
        this.loading = false
      }
    },

    async addPayment() {
      if (!this.$refs.addForm.validate()) return
      if (this.form.paymentType === 'penalty') { await this.processViolationPayment(); return }

      try {
        this.loading = true
        const token = sessionStorage.getItem('authToken')
        if (!token) return

        const response = await fetch('/api/payments/onsite', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stallholderId: this.form.stallholderId,
            amount: parseFloat(this.form.amount),
            paymentDate: this.form.paymentDate,
            paymentTime: this.form.paymentTime,
            paymentForMonth: this.form.paymentForMonth,
            paymentType: this.form.paymentType,
            referenceNumber: this.form.receiptNo,
            collectedBy: this.form.collectedBy,
            notes: this.form.notes
          })
        })

        const result = await response.json()
        if (response.ok && result.success) {
          this.showToast('Payment added successfully!', 'success')
          await this.fetchStallList()
          this.closeAddModal()
          this.$emit('payment-added', result)
        } else {
          this.showToast(result.message || 'Failed to add payment', 'error')
        }
      } catch (e) {
        console.error('âŒ addPayment error:', e)
        this.showToast('Error adding payment', 'error')
      } finally {
        this.loading = false
      }
    },

    closeAddModal() { this.showAddModal = false; this.resetForm() },

    resetForm() {
      this.clearForm()
      if (this.$refs.addForm) this.$refs.addForm.reset()
    },

    getSeverityColor(severity) {
      const c = { minor: 'green', moderate: 'orange', major: 'deep-orange', critical: 'red' }
      return c[severity?.toLowerCase()] || 'grey'
    },

    showToast(message, type = 'success') {
      this.toast = { show: true, message, type }
    },

    formatCurrency(amount) {
      const n = parseFloat(amount) || 0
      return `\u20B1${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    },

    formatDate(dateString) {
      if (!dateString) return 'â€”'
      const d = new Date(dateString)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }
}

