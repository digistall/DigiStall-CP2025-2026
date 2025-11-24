export default {
  name: 'AddVendorDialog',
  data() {
    return {
      activeTab: 0,
      formValid: false,
      saving: false,
      showSuccess: false,
      showError: false,
      errorMessage: '',
      
      // Form fields
      form: {
        lastName: '',
        firstName: '',
        middleName: '',
        phone: '',
        email: '',
        birthdate: '',
        gender: '',
        address: '',
        businessName: '',
        businessType: '',
        businessDescription: '',
        vendorId: '',
        assignedCollector: '',
      },
      
      // Options
      genderOptions: ['Male', 'Female', 'Other'],
      collectors: ['John Smith', 'Jane Garcia', 'Marco Reyes', 'Ava Santos'],
      
      // Validation rules
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid',
      ],
    }
  },
  
  computed: {
    visibleModel() {
      return this.isVisible !== undefined ? this.isVisible : this.modelValue
    },
  },

  watch: {
    visibleModel(newVal) {
      if (!newVal) {
        this.resetForm()
      }
    },
  },

  methods: {
    closeDialog() {
      this.$emit('update:modelValue', false)
      if (this.isVisible !== undefined) {
        this.$emit('close')
      }
    },

    resetForm() {
      this.$refs.vendorForm?.reset()
      this.activeTab = 0
      this.formValid = false
    },

    save() {
      if (!this.$refs.vendorForm.validate()) {
        this.errorMessage = 'Please fill out all required fields'
        this.showError = true
        return
      }

      this.saving = true

      // Simulate API call
      setTimeout(() => {
        const newRow = {
          id: this.form.vendorId || Math.floor(Math.random() * 1000000),
          name: `${this.form.firstName} ${this.form.lastName}`,
          business: this.form.businessName,
          collector: this.form.assignedCollector || 'John Smith',
          status: 'Active',
          raw: JSON.parse(JSON.stringify(this.form)),
        }

        this.$emit('save', newRow)
        this.saving = false
        this.showSuccess = true
        this.$emit('update:modelValue', false)
        if (this.isVisible !== undefined) {
          this.$emit('close')
        }
      }, 500)
    },
  },

  props: {
    modelValue: { type: Boolean, default: false },
    isVisible: { type: Boolean, required: false },
  },

  emits: ['update:modelValue', 'save', 'close'],
}
