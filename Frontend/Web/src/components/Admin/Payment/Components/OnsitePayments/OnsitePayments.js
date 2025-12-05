import StallholderDropdown from '../StallholderDropdown/StallholderDropdown.vue'
import ToastNotification from '../../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'OnsitePayments',
  emits: ['payment-added', 'delete-payment', 'count-updated'],
  components: {
    StallholderDropdown,
    ToastNotification
  },
  data() {
    return {
      searchQuery: '',
      showAddModal: false,
      showViewModal: false,
      formValid: false,
      selectedPayment: null,
      loading: false,
      // Toast notification
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      form: {
        stallholderId: null,
        stallholderName: '',
        stallNo: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        paymentForMonth: new Date().toISOString().substring(0, 7), // YYYY-MM format
        paymentType: 'rental',
        collectedBy: '',
        receiptNo: '',
        notes: ''
      },
      onsitePayments: [],
      stallholders: []
    }
  },
  computed: {
    filteredPayments() {
      if (!this.searchQuery) {
        return this.onsitePayments;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.onsitePayments.filter(payment => 
        (payment.id || '').toString().toLowerCase().includes(query) ||
        (payment.stallholderName || '').toLowerCase().includes(query) ||
        (payment.stallNo || '').toLowerCase().includes(query) ||
        (payment.receiptNo || '').toLowerCase().includes(query) ||
        (payment.collectedBy || '').toLowerCase().includes(query)
      );
    }
  },
  
  watch: {
    onsitePayments: {
      handler() {
        this.$emit('count-updated', this.onsitePayments.length);
      },
      immediate: true
    }
  },
  mounted() {
    this.loadStallholders();
    this.fetchOnsitePayments();
    this.setCurrentUser();
  },
  methods: {
    /**
     * Load stallholders for dropdown
     */
    async loadStallholders() {
      try {
        const token = sessionStorage.getItem('authToken');
        
        if (!token) {
          console.warn('🔐 No auth token found');
          return;
        }

        const response = await fetch('/api/payments/stallholders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Stallholders loaded:', result.data?.length || 0);
          this.stallholders = result.data || [];
        } else {
          console.error('❌ Failed to load stallholders:', response.status);
        }
      } catch (error) {
        console.error('❌ Error loading stallholders:', error);
      }
    },

    /**
     * Set current user info for collected_by field
     */
    setCurrentUser() {
      try {
        const token = sessionStorage.getItem('authToken');
        if (token) {
          // Decode JWT token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.form.collectedBy = `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || 'System';
        }
      } catch (error) {
        console.warn('Could not get user info from token:', error);
        this.form.collectedBy = 'System';
      }
    },

    /**
     * Handle stallholder selection and auto-fill form
     */
    async onStallholderSelected(stallholder) {
      if (!stallholder) {
        this.clearForm();
        return;
      }

      console.log('🏪 Stallholder selected:', stallholder);
      
      try {
        // Get detailed stallholder information using stored procedure
        const token = sessionStorage.getItem('authToken');
        const response = await fetch(`/api/payments/stallholders/${stallholder.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const details = result.data;
          
          // Auto-fill form fields with all required data
          this.form.stallholderId = details.id;
          this.form.stallholderName = details.name;
          this.form.stallNo = details.stallNo || details.stall_no;
          this.form.amount = details.monthlyRental || details.rental_price || details.monthly_rental || '';
          
          // Set payment date to today
          this.form.paymentDate = new Date().toISOString().split('T')[0];
          
          // Set payment time to current time
          this.form.paymentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
          
          // Set payment for month to current month
          this.form.paymentForMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
          
          // Auto-fill collected by from JWT token
          this.setCurrentUser();
          
          console.log('📋 Form auto-filled with:', {
            name: details.name,
            stallNo: details.stallNo || details.stall_no,
            amount: details.monthlyRental || details.rental_price,
            paymentDate: this.form.paymentDate,
            paymentTime: this.form.paymentTime,
            paymentForMonth: this.form.paymentForMonth,
            collectedBy: this.form.collectedBy
          });
          
          // Generate receipt number after all other fields are set
          await this.generateReceiptNumber();
        } else {
          console.error('❌ Failed to get stallholder details:', response.status);
          // Still auto-fill basic info from dropdown data
          this.form.stallholderId = stallholder.id;
          this.form.stallholderName = stallholder.name;
          this.form.stallNo = stallholder.stallNo;
          this.form.amount = stallholder.monthlyRental || '';
          
          // Set dates and generate receipt
          this.form.paymentDate = new Date().toISOString().split('T')[0];
          this.form.paymentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
          this.form.paymentForMonth = new Date().toISOString().substring(0, 7);
          this.setCurrentUser();
          await this.generateReceiptNumber();
        }
      } catch (error) {
        console.error('❌ Error getting stallholder details:', error);
        
        // Fallback: use data from dropdown selection
        this.form.stallholderId = stallholder.id;
        this.form.stallholderName = stallholder.name;
        this.form.stallNo = stallholder.stallNo;
        this.form.amount = stallholder.monthlyRental || '';
        
        // Set dates and generate receipt
        this.form.paymentDate = new Date().toISOString().split('T')[0];
        this.form.paymentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
        this.form.paymentForMonth = new Date().toISOString().substring(0, 7);
        this.setCurrentUser();
        await this.generateReceiptNumber();
      }
    },

    /**
     * Generate receipt number
     */
    async generateReceiptNumber() {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await fetch('/api/payments/generate-receipt-number', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          this.form.receiptNo = result.receiptNumber;
          console.log('🔢 Generated receipt number:', result.receiptNumber);
        }
      } catch (error) {
        console.error('❌ Error generating receipt number:', error);
      }
    },

    /**
     * Clear form fields
     */
    clearForm() {
      this.form = {
        stallholderId: null,
        stallholderName: '',
        stallNo: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        paymentForMonth: new Date().toISOString().substring(0, 7),
        paymentType: 'rental',
        collectedBy: this.form.collectedBy, // Keep collected by
        receiptNo: '',
        notes: ''
      };
    },

    async fetchOnsitePayments() {
      try {
        this.loading = true;
        const token = sessionStorage.getItem('authToken');

        if (!token) {
          console.log('🔒 No auth token found');
          this.loadSampleData();
          return;
        }

        const params = new URLSearchParams({
          limit: 100,
          offset: 0,
        });

        if (this.searchQuery && this.searchQuery.toString().trim() !== '') {
          params.append('search', this.searchQuery.toString().trim());
        }

        console.log('📡 Fetching onsite payments with params:', params.toString());

        const response = await fetch(`/api/payments/onsite?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Onsite payments loaded:', result.data?.length || 0);

          this.onsitePayments = (result.data || []).map((payment) => ({
            id: payment.id,
            stallholderId: payment.stallholderId,
            stallholderName: payment.stallholderName,
            stallNo: payment.stallNo,
            amount: payment.amountPaid || payment.amount,
            paymentDate: payment.paymentDate,
            paymentTime: payment.paymentTime,
            paymentForMonth: payment.paymentForMonth,
            paymentType: payment.paymentType,
            method: payment.method || 'cash',
            collectedBy: payment.collectedBy,
            receiptNo: payment.referenceNo,
            notes: payment.notes,
            status: payment.status,
            statusColor: payment.status === 'ACTIVE' ? 'red' : 'green',
            createdAt: payment.createdAt,
            branchName: payment.branchName,
          }));
        } else {
          console.error('❌ Failed to fetch onsite payments:', response.status);
          this.showToast('❌ Failed to fetch onsite payments. Please try again.', 'error');
        }
      } catch (error) {
        console.error('❌ Error fetching onsite payments:', error);
        this.showToast('❌ An error occurred while fetching payments.', 'error');
      } finally {
        this.loading = false;
      }
    },

    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message: message,
        type: type
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
      // Handle undefined, null, or invalid amounts
      const numericAmount = parseFloat(amount) || 0;
      return `₱${numericAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
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
      this.clearForm()
      if (this.$refs.addForm) {
        this.$refs.addForm.reset()
      }
    },

    /**
     * Submit payment form
     */
    async addPayment() {
      if (!this.$refs.addForm.validate()) {
        return;
      }

      try {
        this.loading = true;
        const token = sessionStorage.getItem('authToken');

        if (!token) {
          console.error('🔐 No auth token found');
          return;
        }

        const paymentData = {
          stallholderId: this.form.stallholderId,
          amount: parseFloat(this.form.amount),
          paymentDate: this.form.paymentDate,
          paymentTime: this.form.paymentTime,
          paymentForMonth: this.form.paymentForMonth,
          paymentType: this.form.paymentType,
          referenceNumber: this.form.receiptNo,
          collectedBy: this.form.collectedBy,
          notes: this.form.notes
        };

        console.log('💳 Submitting payment:', paymentData);

        const response = await fetch('/api/payments/onsite', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log('✅ Payment added successfully:', result);
          
          // Show late fee information if applicable
          if (result.lateFee && result.lateFee > 0) {
            console.log(`⚠️ Late fee applied: ₱${result.lateFee} (${result.daysOverdue} days overdue)`);
          }
          
          // Refresh payments list
          await this.fetchOnsitePayments();
          
          // Close modal and reset form
          this.closeAddModal();
          
          // Emit event to parent
          this.$emit('payment-added', result);
          
          // Show success message with toast
          const successMsg = result.lateFee > 0 
            ? `✅ Payment added successfully! (Including ₱${result.lateFee} late fee)`
            : '✅ Payment added successfully!';
          this.showToast(successMsg, 'success');
        } else {
          console.error('❌ Failed to add payment:', result.message);
          // Show error with toast
          this.showToast(`❌ ${result.message || 'Failed to add payment'}`, 'error');
        }
      } catch (error) {
        console.error('❌ Error adding payment:', error);
      } finally {
        this.loading = false;
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
