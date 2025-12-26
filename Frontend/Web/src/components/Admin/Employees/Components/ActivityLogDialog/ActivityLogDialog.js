import axios from 'axios';
import * as XLSX from 'xlsx';

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
      showClearConfirmDialog: false,
      clearingData: false,
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
      snackbar: {
        show: false,
        title: '',
        message: '',
        color: 'success'
      },
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

    // Device and IP helper functions
    getDeviceIcon(userAgent) {
      if (!userAgent) return { icon: 'mdi-help-circle', color: 'grey' };
      const ua = userAgent.toLowerCase();
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return { icon: 'mdi-cellphone', color: 'success' };
      }
      if (ua.includes('tablet') || ua.includes('ipad')) {
        return { icon: 'mdi-tablet', color: 'info' };
      }
      return { icon: 'mdi-monitor', color: 'primary' };
    },

    getDeviceType(userAgent) {
      if (!userAgent) return 'Unknown';
      const ua = userAgent.toLowerCase();
      if (ua.includes('iphone')) return 'iPhone';
      if (ua.includes('android') && ua.includes('mobile')) return 'Android Phone';
      if (ua.includes('android')) return 'Android';
      if (ua.includes('ipad')) return 'iPad';
      if (ua.includes('tablet')) return 'Tablet';
      if (ua.includes('windows')) return 'Windows PC';
      if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac';
      if (ua.includes('linux')) return 'Linux PC';
      return 'Desktop';
    },

    getBrowserName(userAgent) {
      if (!userAgent) return 'Unknown';
      const ua = userAgent.toLowerCase();
      if (ua.includes('edg/')) return 'Microsoft Edge';
      if (ua.includes('chrome')) return 'Google Chrome';
      if (ua.includes('firefox')) return 'Mozilla Firefox';
      if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
      if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
      return 'Unknown Browser';
    },

    getOSName(userAgent) {
      if (!userAgent) return 'Unknown';
      const ua = userAgent.toLowerCase();
      if (ua.includes('windows nt 10')) return 'Windows 10/11';
      if (ua.includes('windows nt')) return 'Windows';
      if (ua.includes('mac os x')) return 'macOS';
      if (ua.includes('iphone os') || ua.includes('ios')) return 'iOS';
      if (ua.includes('android')) return 'Android';
      if (ua.includes('linux')) return 'Linux';
      return 'Unknown OS';
    },

    formatIP(ip) {
      if (!ip || ip === 'unknown') return '-';
      // Remove ::ffff: prefix from IPv4-mapped IPv6 addresses
      if (ip.startsWith('::ffff:')) {
        return ip.replace('::ffff:', '');
      }
      // Shorten localhost
      if (ip === '::1' || ip === '127.0.0.1') return 'Localhost';
      return ip;
    },

    formatDateTime(dateStr) {
      if (!dateStr) return 'N/A';
      // Database stores UTC, add 8 hours to get Philippine time
      const utcDate = new Date(dateStr);
      const phDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
      return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(phDate);
    },

    formatRelativeTime(dateStr) {
      if (!dateStr) return '';
      
      const now = new Date();
      // Database stores UTC, add 8 hours to get Philippine time
      const utcDate = new Date(dateStr);
      const phDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
      
      // Calculate difference in milliseconds
      const diffMs = now - phDate;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return '';
    },

    openClearConfirmDialog() {
      this.showClearConfirmDialog = true;
    },

    closeClearConfirmDialog() {
      this.showClearConfirmDialog = false;
    },

    async clearAllActivities() {
      this.clearingData = true;
      try {
        // First, export all data to Excel as backup
        await this.exportAllActivitiesToExcel();
        
        // Wait a moment for the download to start
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Then clear the activity logs
        const token = sessionStorage.getItem('authToken');
        const response = await axios.delete(
          `${this.apiBaseUrl}/activity-logs/clear-all`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          // Refresh the logs
          await this.fetchLogs();
          this.closeClearConfirmDialog();
          
          // Show success snackbar
          this.snackbar = {
            show: true,
            title: 'Activity History Cleared Successfully!',
            message: 'Excel backup has been downloaded for your records.',
            color: 'success'
          };
        }
      } catch (error) {
        console.error('Error clearing activities:', error);
        this.snackbar = {
          show: true,
          title: 'Failed to Clear Activity History',
          message: error.response?.data?.message || 'An error occurred while clearing the logs.',
          color: 'error'
        };
      } finally {
        this.clearingData = false;
      }
    },

    async exportAllActivitiesToExcel() {
      try {
        // Fetch ALL activity logs without limit for backup
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(
          `${this.apiBaseUrl}/activity-logs?limit=10000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success && response.data.data.length > 0) {
          const allLogs = response.data.data;
          
          // Create Excel workbook
          const wb = XLSX.utils.book_new();
          
          // Prepare data for Excel
          const wsData = [];
          
          // Title row
          wsData.push(['ACTIVITY LOG HISTORY - BACKUP']);
          wsData.push([`Exported on: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`]);
          wsData.push([`Total Records: ${allLogs.length}`]);
          wsData.push([]);
          
          // Headers
          wsData.push([
            'Log ID',
            'Staff Type',
            'Staff Name',
            'Staff ID',
            'Action',
            'Description',
            'Module',
            'Status',
            'IP Address',
            'User Agent',
            'Date & Time (PH Time)'
          ]);
          
          // Data rows
          allLogs.forEach(log => {
            wsData.push([
              log.log_id,
              this.formatStaffType(log.staff_type),
              log.staff_name || 'Unknown',
              log.staff_id || '-',
              log.action_type || '-',
              log.action_description || '-',
              log.module || '-',
              log.status || 'success',
              log.ip_address || '-',
              log.user_agent || '-',
              this.formatDateTime(log.created_at)
            ]);
          });
          
          // Create worksheet
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          
          // Set column widths
          ws['!cols'] = [
            { wch: 10 },  // Log ID
            { wch: 18 },  // Staff Type
            { wch: 25 },  // Staff Name
            { wch: 12 },  // Staff ID
            { wch: 12 },  // Action
            { wch: 40 },  // Description
            { wch: 15 },  // Module
            { wch: 10 },  // Status
            { wch: 15 },  // IP Address
            { wch: 30 },  // User Agent
            { wch: 25 }   // Date & Time
          ];
          
          // Merge title cells
          ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }
          ];
          
          XLSX.utils.book_append_sheet(wb, ws, 'Activity Log Backup');
          
          // Download Excel file
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const timestamp = new Date().toISOString().split('T')[0];
          a.download = `activity-log-backup-${timestamp}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          console.log('✅ Activity log backup exported to Excel');
        }
      } catch (error) {
        console.error('Error exporting activities to Excel:', error);
        throw error;
      }
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
