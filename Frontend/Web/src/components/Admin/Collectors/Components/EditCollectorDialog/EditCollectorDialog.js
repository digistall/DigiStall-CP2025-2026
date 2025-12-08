import ToastNotification from '../../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'EditCollectorDialog',
  components: {
    ToastNotification
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Object,
      default: () => ({}),
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
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
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
        this.$emit('update:isVisible', val)
      },
    },
  },
  watch: {
    data: {
      handler(newData) {
        if (newData && Object.keys(newData).length > 0) {
          this.form = {
            ...this.form,
            ...newData,
          }
        }
      },
      deep: true,
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

        this.$emit('update', {
          id: this.form.id,
          name: `${this.form.firstName} ${this.form.lastName}`,
          contact: this.form.phone,
          location: this.form.location,
          raw: { ...this.form },
        })

        this.showToast('📝 Collector updated successfully!', 'update')
        this.closeDialog()
      } catch (error) {
        console.error('Error updating collector:', error)
        this.showToast('❌ Error updating collector. Please try again.', 'error')
      } finally {
        this.saving = false
      }
    },

    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message: message,
        type: type
      }
    }
  },
}
