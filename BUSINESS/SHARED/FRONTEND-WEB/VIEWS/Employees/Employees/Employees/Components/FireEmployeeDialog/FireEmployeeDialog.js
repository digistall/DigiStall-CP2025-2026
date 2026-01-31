export default {
  name: 'FireEmployeeDialog',
  
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    employee: {
      type: Object,
      default: null
    },
    saving: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      terminationReason: '',
      reasonError: ''
    }
  },

  computed: {
    dialogModel: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },

  watch: {
    modelValue(newVal) {
      if (newVal) {
        this.resetForm()
      }
    }
  },

  methods: {
    getInitials(firstName, lastName) {
      if (!firstName && !lastName) return 'NA'
      const first = firstName?.charAt(0) || ''
      const last = lastName?.charAt(0) || ''
      return `${first}${last}`.toUpperCase()
    },

    getRoleText(employee) {
      if (!employee) return 'Employee'
      if (employee.employee_type === 'mobile') {
        return employee.mobile_role === 'inspector' ? 'Inspector' : 'Collector'
      }
      return 'Web Employee'
    },

    getRoleColor(employee) {
      if (!employee) return 'primary'
      if (employee.employee_type === 'mobile') {
        return employee.mobile_role === 'inspector' ? 'purple' : 'orange'
      }
      return 'primary'
    },

    getRoleIcon(employee) {
      if (!employee) return 'mdi-account'
      if (employee.employee_type === 'mobile') {
        return employee.mobile_role === 'inspector' ? 'mdi-clipboard-check' : 'mdi-account-cash'
      }
      return 'mdi-account'
    },

    clearError() {
      this.reasonError = ''
    },

    resetForm() {
      this.terminationReason = ''
      this.reasonError = ''
    },

    validateForm() {
      if (!this.terminationReason.trim()) {
        this.reasonError = 'Termination reason is required'
        return false
      }
      if (this.terminationReason.trim().length < 10) {
        this.reasonError = 'Please provide a more detailed reason (minimum 10 characters)'
        return false
      }
      return true
    },

    confirmTermination() {
      if (!this.validateForm()) {
        return
      }

      this.$emit('confirm', {
        employee: this.employee,
        reason: this.terminationReason.trim()
      })
    },

    closeDialog() {
      if (!this.saving) {
        this.$emit('close')
      }
    }
  }
}
