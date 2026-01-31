export default {
  name: 'ResetPasswordDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    employee: {
      type: Object,
      default: null,
    },
    saving: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    dialogModel: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      },
    },
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
    confirmReset() {
      this.$emit('confirm')
    },
    closeDialog() {
      if (!this.saving) {
        this.$emit('close')
      }
    },
  },
}
