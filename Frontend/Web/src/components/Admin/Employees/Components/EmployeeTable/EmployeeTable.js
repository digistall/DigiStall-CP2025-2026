export default {
  name: 'EmployeeTable',
  props: {
    employees: Array,
  },
  emits: ['edit-employee', 'manage-permissions', 'toggle-status', 'reset-password'],

  data() {
    return {
      showActionsDialog: false,
      selectedEmployee: null,
      permissionsPopupVisible: false,
      hoveredEmployee: null,
      permissionsPopupStyle: {
        top: '0px',
        left: '0px',
      },
      hideTimeout: null,
    }
  },

  methods: {
    openActionsPopup(employee) {
      this.selectedEmployee = employee
      this.showActionsDialog = true
    },

    closeActionsDialog() {
      this.showActionsDialog = false
      this.selectedEmployee = null
    },

    handleEdit() {
      this.$emit('edit-employee', this.selectedEmployee)
      this.closeActionsDialog()
    },

    handleManagePermissions() {
      this.$emit('manage-permissions', this.selectedEmployee)
      this.closeActionsDialog()
    },

    handleToggleStatus() {
      this.$emit('toggle-status', this.selectedEmployee)
      this.closeActionsDialog()
    },

    handleResetPassword() {
      this.$emit('reset-password', this.selectedEmployee)
      this.closeActionsDialog()
    },

    getStatusColor(status) {
      return status === 'active' ? 'success' : 'warning'
    },

    getPermissionText(permission) {
      const permissionLabels = {
        dashboard: 'Dashboard',
        payments: 'Payments',
        applicants: 'Applicants',
        complaints: 'Complaints',
        compliances: 'Compliances',
        vendors: 'Vendors',
        stallholders: 'Stallholders',
        collectors: 'Collectors',
        stalls: 'Stalls',
      }
      return permissionLabels[permission] || permission
    },

    formatDate(date) {
      if (!date) return 'Never'
      return new Date(date).toLocaleDateString()
    },

    formatTime(date) {
      if (!date) return 'Never'
      return new Date(date).toLocaleTimeString()
    },

    showPermissionsPopup(employee, event) {
      // Clear any existing timeout
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout)
        this.hideTimeout = null
      }

      // Set the employee data
      this.hoveredEmployee = employee

      // Calculate popup position
      const target = event.currentTarget
      const rect = target.getBoundingClientRect()
      const popupWidth = 250 // Approximate width of popup
      const popupHeight = Math.min(300, (employee.permissions?.length || 0) * 40 + 60) // Dynamic height

      // Position popup to the right of the permissions cell
      let left = rect.right + 10
      let top = rect.top

      // Check if popup would go off-screen to the right
      if (left + popupWidth > window.innerWidth) {
        // Position to the left of the cell instead
        left = rect.left - popupWidth - 10
      }

      // Check if popup would go off-screen at the bottom
      if (top + popupHeight > window.innerHeight) {
        top = window.innerHeight - popupHeight - 10
      }

      // Ensure popup doesn't go off-screen at the top
      if (top < 10) {
        top = 10
      }

      this.permissionsPopupStyle = {
        top: `${top}px`,
        left: `${left}px`,
      }

      // Small delay before showing to prevent flickering
      setTimeout(() => {
        if (this.hoveredEmployee === employee) {
          this.permissionsPopupVisible = true
        }
      }, 200)
    },

    hidePermissionsPopup() {
      // Delay hiding to allow mouse to move into popup
      this.hideTimeout = setTimeout(() => {
        this.permissionsPopupVisible = false
        this.hoveredEmployee = null
      }, 200)
    },

    keepPermissionsPopupOpen() {
      // Clear timeout if mouse enters popup
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout)
        this.hideTimeout = null
      }
    },

    togglePermissionsPopup(employee, event) {
      // For click interaction on mobile or if user prefers clicking
      if (this.permissionsPopupVisible && this.hoveredEmployee === employee) {
        this.permissionsPopupVisible = false
        this.hoveredEmployee = null
      } else {
        this.showPermissionsPopup(employee, event)
      }
    },
  },

  beforeUnmount() {
    // Clean up timeout when component is destroyed
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
    }
  },
}
