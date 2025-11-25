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
        this.$emit('update:isVisible', val)
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
        // Build payload expected by backend stored procedure: first_name, last_name, email, contact_number, branch_id
        const payload = {
          first_name: this.form.firstName,
          last_name: this.form.lastName,
          email: this.form.email || null,
          contact_number: this.form.phone || null,
          branch_id: null, // UI uses location string; backend expects branch_id. Set null for now.
        }

        const collectorsService = await import('../../../../../services/collectorsService.js')
        const resp = await collectorsService.default.createCollector(payload)

        // resp is { success, data } where data is the full collector row from stored procedure
        const createdCollector = resp?.data ?? resp

        // Extract the full row (stored procedure now returns SELECT * FROM collector)
        let collectorData = null
        if (Array.isArray(createdCollector) && createdCollector.length > 0) {
          collectorData = createdCollector[0]
        } else if (createdCollector && typeof createdCollector === 'object') {
          collectorData = createdCollector
        } else {
          collectorData = {
            first_name: this.form.firstName,
            last_name: this.form.lastName,
            contact_number: this.form.phone,
          }
        }

        const newCollector = {
          id: collectorData?.collector_id || collectorData?.id || Date.now(),
          name: `${collectorData?.first_name || this.form.firstName} ${collectorData?.last_name || this.form.lastName}`.trim(),
          contact: collectorData?.contact_number || this.form.phone,
          location: this.form.location,
          raw: collectorData,
        }

        this.$emit('save', newCollector)

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
