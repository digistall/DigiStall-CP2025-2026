import StallholderDropdown from '../StallholderDropdown/StallholderDropdown.vue'
import ToastNotification from '@common/ToastNotification/ToastNotification.vue'
import LoadingOverlay from '@common/LoadingOverlay/LoadingOverlay.vue'
import { useAvatar } from '@utils/avatarHelper.js'

// Discount and fee constants
const ADVANCE_DISCOUNT = 0.25     // 25% off when paid 5+ days early
const LATE_FEE_RATE   = 0.10     // 10% additional fee when overdue
const ADVANCE_DAYS    = 5        // days before due to qualify for discount

export default {
  name: 'OnsitePayments',
  emits: ['payment-added', 'delete-payment', 'count-updated', 'loading'],
  components: { StallholderDropdown, ToastNotification, LoadingOverlay },

  setup() {
    const { getAvatarUrl, handleAvatarError, getInitials } = useAvatar();
    return { getAvatarUrl, handleAvatarError, getInitials };
  },

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

      // Stallholder details modal
      showStallholderModal: false,
      loadingStallholderDetails: false,
      stallholderDetails: null,
      avatarBuster: Date.now(),
      // Zoom Lightbox states
      showZoomModal: false,
      zoomScale: 1.0,
      panX: 0,
      panY: 0,
      isDragging: false,

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
        paymentForMonth: [new Date().toISOString().substring(0, 7)],
        paymentType: 'rental',
        collectedBy: '',
        receiptNo: '',
        notes: '',
        selectedViolation: null,
        promiseToPayDate: ''
      },

      stallholders: [],
      unpaidViolations: [],
      loadingViolations: false,
      unpaidMonthsOptions: [],
      loadingUnpaidMonths: false
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
      return ['Paid', 'Discount', 'Due Soon', 'Overdue', 'Pending']
    },

    isPenaltyPayment() {
      return this.form.paymentType === 'penalty'
    },

    isPartialPayment() {
      if (this.form.paymentType === 'partial_payment') return true
      if (this.form.paymentType === 'rental' && this.form.amount) {
        let sumAmount = 0
        const months = Array.isArray(this.form.paymentForMonth) ? this.form.paymentForMonth : [this.form.paymentForMonth]
        for (const m of months) {
          const opt = this.unpaidMonthsOptions.find(o => o.value === m)
          if (opt) {
            sumAmount += opt.amount
          }
        }
        return sumAmount > 0 && parseFloat(this.form.amount) < sumAmount * 0.99
      }
      return false
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
        
        // Auto-calculate 30% if partial_payment
        if (newType === 'partial_payment' && Array.isArray(this.form.paymentForMonth) && this.form.paymentForMonth.length > 0) {
          let sum = 0;
          for (const m of this.form.paymentForMonth) {
            const selectedMonth = this.unpaidMonthsOptions.find(opt => opt.value === m);
            if (selectedMonth && selectedMonth.monthlyRental) {
              sum += selectedMonth.monthlyRental;
            }
          }
          if (sum > 0) {
            this.form.amount = (sum * 0.3).toFixed(2);
          } else if (this.stallholderDetails && this.stallholderDetails.monthly_rent) {
            this.form.amount = (this.stallholderDetails.monthly_rent * 0.3).toFixed(2);
          } else if (this.stallList) {
            const stall = this.stallList.find(s => s.id === this.form.stallholderId);
            if (stall && stall.monthlyRental) {
              this.form.amount = (stall.monthlyRental * 0.3).toFixed(2);
            }
          }
        }
      }
    },
    'form.paymentForMonth': {
      handler(newMonths) {
        if (Array.isArray(newMonths) && newMonths.length > 0) {
          let sumAmount = 0;
          let sumRental = 0;
          for (const m of newMonths) {
            const opt = this.unpaidMonthsOptions.find(o => o.value === m);
            if (opt) {
               sumAmount += opt.amount;
               sumRental += opt.monthlyRental || opt.amount;
            }
          }
          if (sumAmount > 0) {
            if (this.form.paymentType === 'partial_payment') {
              this.form.amount = (sumRental * 0.3).toFixed(2);
            } else {
              this.form.amount = sumAmount.toFixed(2);
            }
          }
        }
      },
      deep: true
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
            paymentStatus: s.payment_status || 'unpaid',
            unpaidViolations: parseInt(s.unpaid_violations_count) || 0
          }))
        } else {
          this.showToast('Failed to load stall list', 'error')
        }
      } catch (e) {
        console.error('❌ fetchStallList error:', e)
        this.showToast('Error loading stall list', 'error')
      } finally {
        this.loading = false
        this.$emit('loading', false)
      }
    },



    // =========================================================
    // STATUS CONFIG (for main table Status column)
    // =========================================================
    // Uses backend-computed real-time payment status based on actual payment records
    getStatusConfig(stall) {
      const status = (stall.paymentStatus || '').toLowerCase()

      switch (status) {
        case 'paid':
          return { label: 'Paid', color: '#10b981' }
        case 'partial':
          return { label: 'Partial', color: '#3b82f6' }
        case 'overdue':
          return { label: 'Overdue', color: '#ef4444' }
        case 'discount':
          return { label: 'Discount', color: '#1e88e5' }
        case 'due_soon':
          return { label: 'Due Soon', color: '#f59e0b' }
        default:
          return { label: 'Pending', color: '#9ca3af' }
      }
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
          console.error('❌ Tracker fetch failed:', response.status)
          this.showToast('Failed to load payment tracker', 'error')
        }
      } catch (e) {
        console.error('❌ fetchPaymentTracker error:', e)
        this.showToast('Error loading tracker', 'error')
      } finally {
        this.trackerLoading = false
      }
    },



    /**
     * Build the monthly payment timeline from moveInDate to today.
     *
     * 3-tier status rules:
     *   Paid     - payment completed on time
     *   Advance  - payment 5+ days before due date (25% discount applied)
     *   Overdue  - past due date, no payment (+10% late fee)
     *   Normal   - within 5 days of due, normal price (partial payments allowed)
     *   Pending  - far from due date, discount available
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
        if (dueDate.getMonth() !== month) {
          dueDate = new Date(year, month + 1, 0) // last day of intended month
        }

        // Find ALL valid payments for this month
        const monthPayments = payments.filter(p => {
          const pStatus = (p.paymentStatus || p.status || '').toLowerCase()
          const isValidStatus = ['completed', 'paid', 'partial'].includes(pStatus)
          if (p.paymentForMonth) {
            const [pY, pM] = p.paymentForMonth.split('-').map(Number)
            return pY === year && pM === month + 1 && isValidStatus
          }
          const pd = new Date(p.paymentDate)
          return pd.getFullYear() === year && pd.getMonth() === month && isValidStatus
        })

        const totalPaidForMonth = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

        let status, amount

        // Check if this is the move-in month (first month)
        const isFirstMonth = moveIn.getFullYear() === year && moveIn.getMonth() === month

        // Calculate expected amount
        let expectedAmount = rental;
        const graceDate = new Date(moveIn)
        graceDate.setDate(graceDate.getDate() + ADVANCE_DAYS)
        graceDate.setHours(23, 59, 59, 999)

        if (isFirstMonth) {
          expectedAmount = rental * (1 - ADVANCE_DISCOUNT)
        } else if (now > dueDate) {
          expectedAmount = rental * (1 + LATE_FEE_RATE)
        } else {
          const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24))
          if (daysUntilDue >= ADVANCE_DAYS) {
            expectedAmount = rental * (1 - ADVANCE_DISCOUNT)
          } else {
            expectedAmount = rental
          }
        }

        const hasCompletedPayment = monthPayments.some(p => {
          const pStatus = (p.paymentStatus || p.status || '').toLowerCase();
          return pStatus === 'completed' || pStatus === 'paid' || pStatus === 'discount';
        });

        const isFullyPaid = totalPaidForMonth >= rental * 0.99 || totalPaidForMonth >= expectedAmount * 0.99 || hasCompletedPayment;
        
        if (isFullyPaid) {
           const firstPayment = monthPayments[0];
           const payDate = firstPayment ? new Date(firstPayment.paymentDate) : now;
           const daysEarly = Math.floor((dueDate - payDate) / (1000 * 60 * 60 * 24))
           const daysSinceMoveIn = Math.floor((payDate - moveIn) / (1000 * 60 * 60 * 24));
           const gotFirstMonthDiscount = isFirstMonth && daysSinceMoveIn <= ADVANCE_DAYS;

           if (daysEarly >= ADVANCE_DAYS || gotFirstMonthDiscount) {
             status = 'Advance'
           } else {
             status = 'Paid'
           }
           amount = totalPaidForMonth
        } else if (totalPaidForMonth > 0) {
           status = 'Partial'
           amount = Math.max(0, rental - totalPaidForMonth)
        } else {
           amount = expectedAmount
           if (isFirstMonth) {
             status = now > graceDate ? 'Overdue' : 'Advance'
           } else if (now > dueDate) {
             status = 'Overdue'
           } else {
             const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24))
             status = daysUntilDue >= ADVANCE_DAYS ? 'Pending' : 'Normal'
           }
        }

        const lastPayment = monthPayments.length > 0 ? monthPayments[monthPayments.length - 1] : null

        let dueDateFormatted = `${new Date(year, month).toLocaleString('en-US', {month: 'long'})} 5, ${year}`;

        let promiseDateStr = null;
        if (lastPayment?.promiseDate) {
          const d = new Date(lastPayment.promiseDate);
          promiseDateStr = `${d.toLocaleString('en-US', {month: 'long'})} ${d.getDate()}, ${d.getFullYear()}`;
        }

        tracker.push({
          year,
          month,
          monthName: new Date(year, month).toLocaleString('default', { month: 'long' }) + ' ' + year,
          dueDate,
          dueDateFormatted,
          amount,
          status,
          receiptNo: lastPayment?.receiptNo || null,
          paymentId: lastPayment?.id || null,
          paymentDate: lastPayment?.paymentDate || null,
          paymentTime: lastPayment?.paymentTime || null,
          paymentForMonth: lastPayment?.paymentForMonth || null,
          collectedBy: lastPayment?.collectedBy || null,
          paymentStatus: lastPayment?.status || null,
          promiseDate: promiseDateStr,
          notes: lastPayment?.notes || null,
          monthlyRental: rental,
          hasPaid: isFullyPaid
        })

        month++
        if (month > 11) { month = 0; year++ }
      }

      return tracker
    },

    
    getTrackerStatusConfig(status) {
      const map = {
        'Paid':    { color: '#10b981', iconColor: '#10b981', icon: 'mdi-check-circle' },
        'Advance': { color: '#3b82f6', iconColor: '#3b82f6', icon: 'mdi-star-circle' },
        'Normal':  { color: '#f59e0b', iconColor: '#f59e0b', icon: 'mdi-clock-outline' },
        'Overdue': { color: '#ef4444', iconColor: '#ef4444', icon: 'mdi-alert-circle' },
        'Pending': { color: '#8b5cf6', iconColor: '#8b5cf6', icon: 'mdi-calendar-clock' },
        'Partial': { color: '#3b82f6', iconColor: '#3b82f6', icon: 'mdi-chart-pie' }
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
      } else if (entry.status === 'Partial') {
        items.push({ label: 'Remaining Balance', value: this.formatCurrency(entry.amount), isTotal: true })
      } else if (entry.status === 'Normal') {
        items.push({ label: 'Normal Price (Due Soon)', value: this.formatCurrency(rental) })
        items.push({ label: 'Partial payments accepted', value: '', isNote: true })
        items.push({ label: 'Total Due', value: this.formatCurrency(entry.amount), isTotal: true })
      } else {
        const discount = rental * ADVANCE_DISCOUNT
        items.push({ label: `Early Payment Discount (${ADVANCE_DISCOUNT * 100}%)`, value: `- ${this.formatCurrency(discount)}`, isDiscount: true })
        items.push({ label: 'Total Due', value: this.formatCurrency(entry.amount), isTotal: true })
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
        console.error('❌ loadStallholders error:', e)
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
          const today = new Date()
          let dueDate

          if (contractStart) {
            // Due date = same day of month as contract start
            dueDate = new Date(today.getFullYear(), today.getMonth(), contractStart.getDate())
            if (dueDate.getMonth() !== today.getMonth()) {
              dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            }
          } else {
            dueDate = new Date(today); dueDate.setDate(dueDate.getDate() + 30)
          }

          // Check if this is the first month (move-in month)
          const isFirstMonth = contractStart && contractStart.getFullYear() === today.getFullYear() && contractStart.getMonth() === today.getMonth()

          let computedAmount
          if (isFirstMonth) {
            // First month: within 5 days of move-in = discount
            const daysSinceMoveIn = Math.floor((today - contractStart) / (1000 * 60 * 60 * 24))
            if (daysSinceMoveIn <= ADVANCE_DAYS) {
              computedAmount = monthlyRent * (1 - ADVANCE_DISCOUNT)
            } else {
              // Past grace period - overdue with late fee
              computedAmount = monthlyRent * (1 + LATE_FEE_RATE)
            }
          } else if (today > dueDate) {
            // Past due date = overdue (+10%)
            computedAmount = monthlyRent * (1 + LATE_FEE_RATE)
          } else {
            const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24))
            if (daysUntilDue >= ADVANCE_DAYS) {
              computedAmount = monthlyRent * (1 - ADVANCE_DISCOUNT)
            } else {
              // Within 5 days of due = normal price (partial payments allowed)
              computedAmount = monthlyRent
            }
          }

          this.form.amount = computedAmount.toFixed(2)
          this.form.paymentDate = today.toISOString().split('T')[0]
          this.form.paymentTime = today.toTimeString().split(' ')[0].substring(0, 5)
          this.form.paymentForMonth = [today.toISOString().substring(0, 7)]
          this.setCurrentUser()
          await this.loadUnpaidMonths(stallholder.id)
        } else {
          this.form.stallholderId = stallholder.id
          this.form.stallholderName = stallholder.name
          this.form.stallNo = stallholder.stallNo
          this.form.amount = stallholder.monthlyRental || ''
          this.form.paymentDate = new Date().toISOString().split('T')[0]
          this.form.paymentTime = new Date().toTimeString().split(' ')[0].substring(0, 5)
          this.form.paymentForMonth = [new Date().toISOString().substring(0, 7)]
          this.setCurrentUser()
          await this.loadUnpaidMonths(stallholder.id)
        }
      } catch (e) {
        console.error('❌ onStallholderSelected error:', e)
        this.form.stallholderId = stallholder.id
        this.form.stallholderName = stallholder.name
        this.form.stallNo = stallholder.stallNo
        this.form.amount = stallholder.monthlyRental || ''
        this.setCurrentUser()
        await this.loadUnpaidMonths(stallholder.id)
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
        console.error('❌ generateReceiptNumber error:', e)
      }
    },

    clearForm() {
      this.form = {
        stallholderId: null, stallholderName: '', stallNo: '', amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        paymentForMonth: [new Date().toISOString().substring(0, 7)],
        paymentType: 'rental', collectedBy: this.form.collectedBy,
        receiptNo: '', notes: '', selectedViolation: null, promiseToPayDate: ''
      }
      this.unpaidViolations = []
      this.unpaidMonthsOptions = []
    },

    async loadUnpaidMonths(stallholderId) {
      try {
        this.loadingUnpaidMonths = true
        const token = sessionStorage.getItem('authToken')
        if (!token) return
        const response = await fetch(`/api/payments/tracker/${stallholderId}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        if (response.ok) {
          const result = await response.json()
          const { stallholder, payments } = result.data
          const tracker = this.buildPaymentTracker(stallholder, payments || [])
          this.unpaidMonthsOptions = tracker.filter(t => !t.hasPaid).map(t => {
            const date = new Date(t.year, t.month);
            const monthName = date.toLocaleDateString('en-US', { month: 'long' });
            return {
              title: `${monthName} ${t.year} - ${t.status} (\u20B1${t.amount.toLocaleString()})`,
              value: `${t.year}-${String(t.month + 1).padStart(2, '0')}`,
              amount: t.amount,
              monthlyRental: t.monthlyRental
            }
          })
          // If there are unpaid months, default to the oldest unpaid month
          if (this.unpaidMonthsOptions.length > 0) {
            this.form.paymentForMonth = [this.unpaidMonthsOptions[0].value]
            // Note: form.amount will be set by the watcher
          }
        }
      } catch (e) {
        console.error('Error loading unpaid months:', e)
        this.unpaidMonthsOptions = []
      } finally {
        this.loadingUnpaidMonths = false
      }
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
        console.error('❌ loadUnpaidViolations error:', e)
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
          this.clearCache(this.form.stallholderId)
          this.closeAddModal()
          this.showTrackerModal = false
          this.showToast(`Violation payment processed! \u20B1${result.data.paidAmount.toLocaleString()}`, 'success')
          this.$emit('payment-added', result)
          await this.fetchStallList()
        } else {
          this.showToast(result.message || 'Failed to process payment', 'error')
        }
      } catch (e) {
        console.error('❌ processViolationPayment error:', e)
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

        let monthsToPay = Array.isArray(this.form.paymentForMonth) ? [...this.form.paymentForMonth] : [this.form.paymentForMonth];
        if (monthsToPay.length === 0) {
          this.showToast('Please select at least one month', 'error');
          this.loading = false;
          return;
        }

        monthsToPay.sort(); // Sort chronologically (oldest first)
        let remainingAmountToDistribute = parseFloat(this.form.amount);

        for (let i = 0; i < monthsToPay.length; i++) {
          const monthVal = monthsToPay[i];
          if (remainingAmountToDistribute <= 0) break;
          
          let amountForThisMonth = 0;
          let isPartialForThisMonth = false;
          
          const opt = this.unpaidMonthsOptions.find(o => o.value === monthVal);
          if (opt) {
            if (this.form.paymentType === 'rental') {
              amountForThisMonth = Math.min(remainingAmountToDistribute, opt.amount);
              remainingAmountToDistribute -= amountForThisMonth;
              isPartialForThisMonth = false;
            } else {
              if (remainingAmountToDistribute >= opt.amount * 0.99) {
                amountForThisMonth = opt.amount;
                remainingAmountToDistribute -= opt.amount;
                isPartialForThisMonth = false;
              } else {
                amountForThisMonth = remainingAmountToDistribute;
                remainingAmountToDistribute = 0;
                isPartialForThisMonth = true;
              }
            }
          } else {
            amountForThisMonth = remainingAmountToDistribute;
            remainingAmountToDistribute = 0;
          }

          // If this is the last selected month, put all remaining extra amount into it
          if (i === monthsToPay.length - 1 && remainingAmountToDistribute > 0) {
             amountForThisMonth += remainingAmountToDistribute;
             remainingAmountToDistribute = 0;
          }

          const currentPaymentType = this.form.paymentType === 'partial_payment' ? 'partial_payment' : 'rental';
          
          const refArray = this.form.receiptNo ? this.form.receiptNo.split(',').map(r => r.trim()).filter(Boolean) : [];
          let refNo = this.form.receiptNo;
          if (refArray.length > 1) {
            refNo = refArray[i] || refArray[refArray.length - 1]; // Use matching ref or repeat the last one
          } else if (monthsToPay.length > 1 && refArray.length === 1) {
            refNo = `${refArray[0]}-${i+1}`; // Fallback to hyphenated if only one provided for multiple months
          }

          const response = await fetch('/api/payments/onsite', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stallholderId: this.form.stallholderId,
              amount: parseFloat(amountForThisMonth.toFixed(2)),
              paymentDate: this.form.paymentDate,
              paymentTime: this.form.paymentTime,
              paymentForMonth: monthVal,
              paymentType: currentPaymentType,
              referenceNumber: refNo,
              collectedBy: this.form.collectedBy,
              notes: this.form.notes,
              promiseToPayDate: currentPaymentType === 'partial_payment' ? this.form.promiseToPayDate : null,
              isDistributed: monthsToPay.length > 1
            })
          })

          const result = await response.json()
          if (!response.ok || !result.success) {
            throw new Error(result.message || `Failed to add payment for ${monthVal}`);
          }
        }

        this.clearCache(this.form.stallholderId)
        this.closeAddModal()
        this.showTrackerModal = false
        this.showToast('Payment(s) added successfully!', 'success')
        this.$emit('payment-added')
        await this.fetchStallList()
      } catch (e) {
        console.error('❌ addPayment error:', e)
        this.showToast(e.message || 'Error adding payment', 'error')
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
      if (!dateString || dateString === '0000-00-00') return '—';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch (err) {
        return '—';
      }
    },

    async showStallholderDetails(stallholderId) {
      if (!stallholderId) return;
      this.showStallholderModal = true;
      this.loadingStallholderDetails = true;
      this.stallholderDetails = null;
      this.avatarBuster = Date.now();
      
      try {
        const token = sessionStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`/api/stallholders/${stallholderId}`, { headers });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            this.stallholderDetails = result.data;
          }
        }
      } catch (error) {
        console.error('Error fetching stallholder details:', error);
      } finally {
        this.loadingStallholderDetails = false;
      }
    },

    // Zoom Lightbox handlers
    openZoomModal() {
      if (!this.stallholderDetails || !(this.stallholderDetails.stallholder_id || this.stallholderDetails.id)) return;
      this.zoomScale = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.isDragging = false;
      this.showZoomModal = true;
    },
    closeZoomModal() {
      this.showZoomModal = false;
    },
    zoomIn() {
      this.zoomScale = Math.min(this.zoomScale + 0.25, 4.0);
    },
    zoomOut() {
      this.zoomScale = Math.max(this.zoomScale - 0.25, 0.5);
      if (this.zoomScale < 1.0) {
        this.panX = 0;
        this.panY = 0;
      }
    },
    resetZoom() {
      this.zoomScale = 1.0;
      this.panX = 0;
      this.panY = 0;
    },
    startDrag(e) {
      if (this.zoomScale <= 1.0) return;
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    },
    onDrag(e) {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
    },
    endDrag() {
      this.isDragging = false;
    },
    onWheel(e) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(this.zoomScale + delta, 0.5), 4.0);
      this.zoomScale = newScale;
      if (newScale <= 1.0) {
        this.panX = 0;
        this.panY = 0;
      }
    },
    clearCache() {
      // No-op: caching removed, data is always fetched fresh from backend
    }
  }
}
