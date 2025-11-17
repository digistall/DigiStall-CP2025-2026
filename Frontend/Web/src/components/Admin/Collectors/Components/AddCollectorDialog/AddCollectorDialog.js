export default {
  name: 'AddCollectorDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
    locations: {
      type: Array,
      default: () => ['Panganiban', 'Naga City Market', 'Triangulo', 'Concepcion Pequeña'],
    },
  },
  data() {
    return {
      activeTab: 0,
      formValid: false,
      saving: false,
      showSuccess: false,
      showError: false,
      form: {
        id: null,
        lastName: '',
        firstName: '',
        middleName: '',
        phone: '',
        email: '',
        birthdate: '',
        gender: 'Male',
        address: '',
        collectorId: '',
        location: 'Panganiban',
        notes: '',
      },
    }
  },
  computed: {
    visibleModel: {
      get() {
        return this.modelValue || this.isVisible
      },
      set(val) {
        this.$emit('update:modelValue', val)
      },
    },
  },
  methods: {
    closeDialog() {
      this.visibleModel = false
      this.resetForm()
    },
    resetForm() {
      this.activeTab = 0
      this.form = {
        id: null,
        lastName: '',
        firstName: '',
        middleName: '',
        phone: '',
        email: '',
        birthdate: '',
        gender: 'Male',
        address: '',
        collectorId: '',
        location: 'Panganiban',
        notes: '',
      }
      this.$refs.collectorForm?.resetValidation()
    },
    async save() {
      if (!this.$refs.collectorForm.validate()) {
        return
      }

      this.saving = true
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Generate ID if not present
        if (!this.form.id) {
          this.form.id = Date.now()
        }

        this.$emit('save', {
          id: this.form.id,
          name: `${this.form.firstName} ${this.form.lastName}`,
          contact: this.form.phone,
          location: this.form.location,
          raw: { ...this.form },
        })

        this.showSuccess = true
        this.closeDialog()
      } catch (error) {
        console.error('Error saving collector:', error)
        this.showError = true
      } finally {
        this.saving = false
      }
    },
  },
}
