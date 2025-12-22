import axios from 'axios';

export default {
  name: 'ActivityLogDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    staffId: {
      type: [Number, String],
      default: null
    },
    staffType: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue', 'close'],
  data() {
    return {
      loading: false,
      activityLogs: [],
      filteredLogs: [],
      summary: null,
      searchQuery: '',
      showFilterPanel: false,
      startDateMenu: false,
      endDateMenu: false,
      startDatePicker: null,
      endDatePicker: null,
      filters: {
        staffType: null,
        actionType: null,
        startDate: null,
        endDate: null
      },
      staffTypeOptions: [
        { title: 'All Types', value: null },
        { title: 'Business Employee', value: 'business_employee' },
        { title: 'Business Manager', value: 'business_manager' },
        { title: 'Business Owner', value: 'business_owner' },
        { title: 'System Administrator', value: 'system_administrator' },
        { title: 'Inspector', value: 'inspector' },
        { title: 'Collector', value: 'collector' }
      ],
      actionTypeOptions: [
        { title: 'All Actions', value: null },
        { title: 'Login', value: 'LOGIN' },
        { title: 'Logout', value: 'LOGOUT' },
        { title: 'View', value: 'VIEW' },
        { title: 'Create', value: 'CREATE' },
        { title: 'Update', value: 'UPDATE' },
        { title: 'Delete', value: 'DELETE' },
        { title: 'Payment', value: 'PAYMENT' },
        { title: 'Approve', value: 'APPROVE' },
        { title: 'Reject', value: 'REJECT' }
      ],
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    };
  },
  computed: {
    show: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },
    formattedStartDate() {
      if (!this.filters.startDate) return '';
      const date = new Date(this.filters.startDate);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    formattedEndDate() {
      if (!this.filters.endDate) return '';
      const date = new Date(this.filters.endDate);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  },
  watch: {
    modelValue(newVal) {
      if (newVal) {
        if (this.staffType) {
          this.filters.staffType = this.staffType;
        }
        this.fetchLogs();
        this.fetchSummary();
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleFilter() {
      this.showFilterPanel = !this.showFilterPanel;
    },

    handleClickOutside(event) {
      const filterContainer = this.$refs.filterContainer;
      if (filterContainer && !filterContainer.contains(event.target)) {
        this.showFilterPanel = false;
      }
    },

    resetFilters() {
      this.filters = {
        staffType: null,
        actionType: null,
        startDate: null,
        endDate: null
      };
      this.startDatePicker = null;
      this.endDatePicker = null;
      this.searchQuery = '';
      this.fetchLogs();
    },

    updateStartDate(date) {
      if (date) {
        this.filters.startDate = new Date(date).toISOString().split('T')[0];
        this.startDateMenu = false;
        this.fetchLogs();
      }
    },

    updateEndDate(date) {
      if (date) {
        this.filters.endDate = new Date(date).toISOString().split('T')[0];
        this.endDateMenu = false;
        this.fetchLogs();
      }
    },

    clearStartDate() {
      this.filters.startDate = null;
      this.startDatePicker = null;
      this.fetchLogs();
    },

    clearEndDate() {
      this.filters.endDate = null;
      this.endDatePicker = null;
      this.fetchLogs();
    },

    filterLogs() {
      let logs = [...this.activityLogs];
      
      // Filter by action type
      if (this.filters.actionType) {
        logs = logs.filter(log => 
          log.action_type?.toUpperCase() === this.filters.actionType
        );
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        logs = logs.filter(log => 
          log.staff_name?.toLowerCase().includes(query) ||
          log.action_type?.toLowerCase().includes(query) ||
          log.action_description?.toLowerCase().includes(query) ||
          log.module?.toLowerCase().includes(query) ||
          log.staff_type?.toLowerCase().includes(query)
        );
      }
      
      this.filteredLogs = logs;
    },

    async fetchLogs() {
      this.loading = true;
      try {
        const token = sessionStorage.getItem('authToken');
        const params = new URLSearchParams();
        
        if (this.filters.staffType) params.append('staffType', this.filters.staffType);
        if (this.filters.startDate) params.append('startDate', this.filters.startDate);
        if (this.filters.endDate) params.append('endDate', this.filters.endDate);
        if (this.staffId) params.append('staffId', this.staffId);
        params.append('limit', '500');

        const response = await axios.get(
          `${this.apiBaseUrl}/activity-logs?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          this.activityLogs = response.data.data;
          this.filterLogs();
        }
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        this.activityLogs = [];
        this.filteredLogs = [];
      } finally {
        this.loading = false;
      }
    },

    async fetchSummary() {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(
          `${this.apiBaseUrl}/activity-logs/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          this.summary = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching activity summary:', error);
        this.summary = null;
      }
    },

    closeDialog() {
      this.show = false;
      this.$emit('close');
    },

    formatStaffType(type) {
      const types = {
        'business_employee': 'Employee',
        'business_manager': 'Manager',
        'business_owner': 'Owner',
        'system_administrator': 'Admin',
        'inspector': 'Inspector',
        'collector': 'Collector'
      };
      return types[type] || type;
    },

    getStaffTypeColor(type) {
      const colors = {
        'business_employee': 'primary',
        'business_manager': 'purple',
        'business_owner': 'indigo',
        'system_administrator': 'deep-purple',
        'inspector': 'info',
        'collector': 'success'
      };
      return colors[type] || 'grey';
    },

    getStaffTypeIcon(type) {
      const icons = {
        'business_employee': 'mdi-account-tie',
        'business_manager': 'mdi-account-supervisor',
        'business_owner': 'mdi-account-star',
        'system_administrator': 'mdi-shield-account',
        'inspector': 'mdi-clipboard-check',
        'collector': 'mdi-cash-multiple'
      };
      return icons[type] || 'mdi-account';
    },

    getActionColor(action) {
      const colors = {
        'LOGIN': 'success',
        'LOGOUT': 'grey',
        'CREATE': 'primary',
        'UPDATE': 'info',
        'DELETE': 'error',
        'VIEW': 'secondary',
        'APPROVE': 'success',
        'REJECT': 'warning',
        'PAYMENT': 'teal',
        'login': 'success'
      };
      return colors[action] || colors[action?.toUpperCase()] || 'grey';
    },

    getActionIcon(action) {
      const icons = {
        'LOGIN': 'mdi-login',
        'LOGOUT': 'mdi-logout',
        'CREATE': 'mdi-plus-circle',
        'UPDATE': 'mdi-pencil',
        'DELETE': 'mdi-delete',
        'VIEW': 'mdi-eye',
        'APPROVE': 'mdi-check',
        'REJECT': 'mdi-close',
        'PAYMENT': 'mdi-cash',
        'login': 'mdi-login'
      };
      return icons[action] || icons[action?.toUpperCase()] || 'mdi-information';
    },

    formatDateTime(dateStr) {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    formatRelativeTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hr ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return '';
    },

    getTotalActivities() {
      return this.filteredLogs.length;
    },

    getActiveStaff() {
      const uniqueStaff = new Set(this.filteredLogs.map(log => `${log.staff_type}-${log.staff_id}`));
      return uniqueStaff.size;
    },

    getFailedActions() {
      return this.filteredLogs.filter(log => log.status !== 'success').length;
    }
  }
};
