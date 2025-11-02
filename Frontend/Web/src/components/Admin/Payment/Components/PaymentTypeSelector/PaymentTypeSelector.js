export default {
  name: 'PaymentTypeSelector',
  props: {
    selectedType: {
      type: String,
      default: 'stall'
    }
  },
  data() {
    return {
      showDropdown: false,
      paymentTypes: [
        { value: 'stall', label: 'Stall Applicants', icon: 'mdi-store' },
        { value: 'vendor', label: 'Vendor Applicants', icon: 'mdi-account-tie' }
      ]
    }
  },
  computed: {
    selectedTypeLabel() {
      const type = this.paymentTypes.find(t => t.value === this.selectedType)
      return type ? type.label : 'Stall Applicants'
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown
    },
    selectType(type) {
      this.$emit('update:selectedType', type.value)
      this.showDropdown = false
    },
    handleClickOutside(event) {
      const dropdown = this.$refs.dropdownRef
      if (dropdown && !dropdown.contains(event.target)) {
        this.showDropdown = false
      }
    }
  }
}
