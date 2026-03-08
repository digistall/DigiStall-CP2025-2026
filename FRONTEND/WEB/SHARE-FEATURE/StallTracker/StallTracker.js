export default {
  name: 'StallTracker',
  data() {
    return {
      activeTab: 'pending',
      loading: false,
      importing: false,
      searchQueryPending: '',
      searchQueryHistory: '',
      searchTimeoutPending: null,
      searchTimeoutHistory: null,
      excelFile: null,
      
      pendingRequests: [],
      historyLogs: [],
      
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      
      pendingHeaders: [
        { title: 'Stall', key: 'stall_number', align: 'center' },
        { title: 'Stallholder', key: 'stallholder_name', align: 'center' },
        { title: 'Reason', key: 'reason', align: 'center' },
        { title: 'Requested Move Out', key: 'move_out_date', align: 'center' },
        { title: 'Status', key: 'status', align: 'center' },
        { title: 'Actions', key: 'action', sortable: false, align: 'center' }
      ],
      historyHeaders: [
        { title: 'Stall', key: 'stall_number', align: 'center' },
        { title: 'Previous Tenant', key: 'user_fullname', align: 'center' },
        { title: 'Lease Start', key: 'lease_start_date', align: 'center' },
        { title: 'Lease End', key: 'lease_end_date', align: 'center' },
        { title: 'Surrender Reason', key: 'surrender_reason', align: 'center' }
      ],

      snackbar: {
        show: false,
        message: '',
        color: 'success'
      },

      confirmDialog: {
        show: false,
        title: '',
        message: '',
        color: 'primary',
        action: null,
        item: null
      }
    }
  },

  watch: {
    // No longer need to fetch on every watch change, local computed properties handle it
  },

  computed: {
    filteredPendingRequests() {
      if (!this.searchQueryPending) return this.pendingRequests;
      const query = this.searchQueryPending.toLowerCase().trim();
      return this.pendingRequests.filter(req => 
        (req.stallholder_name && req.stallholder_name.toLowerCase().includes(query)) ||
        (req.stall_number && String(req.stall_number).toLowerCase().includes(query)) ||
        (req.reason && req.reason.toLowerCase().includes(query))
      );
    },
    filteredHistoryLogs() {
      if (!this.searchQueryHistory) return this.historyLogs;
      const query = this.searchQueryHistory.toLowerCase().trim();
      return this.historyLogs.filter(log => 
        (log.user_fullname && log.user_fullname.toLowerCase().includes(query)) ||
        (log.stall_number && String(log.stall_number).toLowerCase().includes(query)) ||
        (log.surrender_reason && log.surrender_reason.toLowerCase().includes(query))
      );
    },
    snackbarIcon() {
      switch (this.snackbar.color) {
        case 'success': return 'mdi-check-circle';
        case 'error': return 'mdi-alert-circle';
        case 'warning': return 'mdi-alert';
        default: return 'mdi-information';
      }
    }
  },

  mounted() {
    this.fetchPendingRequests();
    this.fetchHistory();
  },

  methods: {
    getHeaders() {
      const token = sessionStorage.getItem('authToken');
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    },

    showSnackbar(message, color = 'success') {
      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.show = true;
    },

    async fetchPendingRequests() {
      this.loading = true;
      try {
        let url = `${this.apiBaseUrl}/surrender/requests`;
        const res = await fetch(url, {
          headers: this.getHeaders()
        });
        const json = await res.json();
        if (json.success) {
          this.pendingRequests = json.data.map(req => ({
            ...req,
            move_out_date: req.move_out_date 
              ? new Date(req.move_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
              : 'N/A'
          }));
        } else {
          this.showSnackbar(json.message || 'Error fetching requests', 'error');
        }
      } catch (err) {
        this.showSnackbar('Connection error', 'error');
      } finally {
        this.loading = false;
      }
    },

    async fetchHistory() {
      this.loading = true;
      try {
        let url = `${this.apiBaseUrl}/surrender/history`;
        const res = await fetch(url, { headers: this.getHeaders() });
        const json = await res.json();
        if (json.success) {
          // format dates
          this.historyLogs = json.data.map(log => ({
            ...log,
            lease_start_date: log.lease_start_date ? new Date(log.lease_start_date).toLocaleDateString() : 'N/A',
            lease_end_date: log.lease_end_date ? new Date(log.lease_end_date).toLocaleDateString() : 'N/A'
          }));
        } else {
          this.showSnackbar(json.message || 'Error fetching history', 'error');
        }
      } catch (err) {
        this.showSnackbar('Connection error', 'error');
      } finally {
        this.loading = false;
      }
    },

    async updateRequestStatus(requestId, status) {
      this.loading = true;
      try {
        const res = await fetch(`${this.apiBaseUrl}/surrender/requests/${requestId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ status })
        });
        const json = await res.json();
        if (json.success) {
          this.showSnackbar(`Request ${status} successfully`, status === 'Rejected' ? 'warning' : 'success');
          this.fetchPendingRequests();
        } else {
          this.showSnackbar(json.message || 'Error updating request', 'error');
        }
      } catch (err) {
        this.showSnackbar('Connection error', 'error');
      } finally {
        this.loading = false;
      }
    },

    approveRequest(item) {
      this.confirmDialog = {
        show: true,
        title: 'Approve Surrender',
        message: `Are you sure you want to approve the surrender request for ${item.stallholder_name} (Stall: ${item.stall_number})?`,
        color: 'success',
        action: 'Approved',
        item: item
      };
    },

    rejectRequest(item) {
      this.confirmDialog = {
        show: true,
        title: 'Reject Surrender',
        message: `Are you sure you want to reject the surrender request for ${item.stallholder_name} (Stall: ${item.stall_number})?`,
        color: 'error',
        action: 'Rejected',
        item: item
      };
    },

    async executeConfirmAction() {
      if (!this.confirmDialog.item || !this.confirmDialog.action) return;
      
      const { item, action } = this.confirmDialog;
      this.confirmDialog.show = false;
      await this.updateRequestStatus(item.request_id, action);
    },

    async importExcel() {
      if (!this.excelFile) return;
      this.importing = true;
      const formData = new FormData();
      formData.append('file', this.excelFile);

      const token = sessionStorage.getItem('authToken');
      try {
        const res = await fetch(`${this.apiBaseUrl}/surrender/import-legacy`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }, // Content-Type omitted for FormData
          body: formData
        });
        const json = await res.json();
        if (json.success) {
          this.showSnackbar(json.message, 'success');
          this.excelFile = null;
          this.fetchHistory();
        } else {
          this.showSnackbar(json.message || 'Import failed', 'error');
        }
      } catch (err) {
        this.showSnackbar('Connection error during upload', 'error');
      } finally {
        this.importing = false;
      }
    }
  }
}
