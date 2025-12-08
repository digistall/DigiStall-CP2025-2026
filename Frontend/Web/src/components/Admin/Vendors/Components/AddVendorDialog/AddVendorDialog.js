import ToastNotification from '../../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'AddVendorDialog',
  components: {
    ToastNotification
  },
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

      // Validation rules
      emailRules: [
        (v) => !!v || 'Email is required',
        (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
      ],
    }
  },

  computed: {
    visibleModel() {
      return this.isVisible !== undefined ? this.isVisible : this.modelValue
    },
    collectorItems() {
      // If parent passed collectors as objects with id/name, use them.
      const c =
        this.collectors && this.collectors.length && typeof this.collectors[0] === 'object'
          ? this.collectors
          : (this.collectors || []).map((s, i) => ({ id: i, name: s }))
      return c
    },
    collectorItemText() {
      return 'name'
    },
    collectorItemValue() {
      return 'id'
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
      this.$emit('update:isVisible', false)
      if (this.isVisible !== undefined) {
        this.$emit('close')
      }
    },

    resetForm() {
      this.$refs.vendorForm?.reset()
      this.activeTab = 0
      this.formValid = false
    },

    async save() {
      if (!this.$refs.vendorForm.validate()) {
        this.errorMessage = 'Please fill out all required fields'
        this.showError = true
        return
      }

      this.saving = true

      try {
        const payload = {
          first_name: this.form.firstName,
          last_name: this.form.lastName,
          middle_name: this.form.middleName || null,
          phone: this.form.phone || null,
          email: this.form.email || null,
          birthdate: this.form.birthdate || null,
          gender: this.form.gender || null,
          address: this.form.address || null,
          business_name: this.form.businessName || null,
          business_type: this.form.businessType || null,
          business_description: this.form.businessDescription || null,
          vendor_identifier: this.form.vendorId || null,
          collector_id: null,
        }

        // Resolve assigned collector -> collector_id
        try {
          const ac = this.form.assignedCollector
          let resolvedId = null
          if (ac == null || ac === '') resolvedId = null
          else if (typeof ac === 'object') resolvedId = ac.id || ac.collector_id || null
          else {
            // ac is primitive (likely id or name). If collectors list contains objects, try to match by id or name
            if (
              this.collectors &&
              this.collectors.length &&
              typeof this.collectors[0] === 'object'
            ) {
              const found = this.collectors.find(
                (c) => String(c.id) === String(ac) || `${c.name}` === `${ac}`,
              )
              resolvedId = found ? found.id || found.collector_id : null
            } else {
              // fallback: ac might be numeric id
              resolvedId = ac
            }
          }
          payload.collector_id = resolvedId
        } catch (e) {
          payload.collector_id = null
        }

        const vendorsService = await import('../../../../../services/vendorsService.js')
        const resp = await vendorsService.default.createVendor(payload)

        // resp is { success, data } where data is the full vendor row with collector info
        const createdInfo = resp?.data ?? resp

        // Extract the full row (stored procedure now returns SELECT * FROM vendor with collector join)
        let newVendor = null
        if (Array.isArray(createdInfo) && createdInfo.length > 0) {
          newVendor = createdInfo[0]
        } else if (createdInfo && typeof createdInfo === 'object') {
          newVendor = createdInfo
        } else {
          newVendor = {}
        }

        // Determine collector display name for the new row
        let collectorDisplay = null
        const ac = this.form.assignedCollector
        if (ac == null || ac === '') collectorDisplay = null
        else if (typeof ac === 'object')
          collectorDisplay = ac.name || ac.first_name || ac.last_name || null
        else if (
          this.collectors &&
          this.collectors.length &&
          typeof this.collectors[0] === 'object'
        ) {
          const found = this.collectors.find(
            (c) => String(c.id) === String(ac) || `${c.name}` === `${ac}`,
          )
          collectorDisplay = found ? found.name : ac
        } else collectorDisplay = ac

        const newRow = {
          id:
            newVendor?.vendor_id ||
            newVendor?.vendorId ||
            newVendor?.id ||
            Math.floor(Math.random() * 1000000),
          name: `${newVendor?.first_name || this.form.firstName} ${newVendor?.last_name || this.form.lastName}`.trim(),
          business: newVendor?.business_name || this.form.businessName,
          collector: collectorDisplay,
          status: newVendor?.status || 'Active',
          raw: newVendor,
        }

        this.$emit('save', newRow)
        this.showSuccess = true
        this.$emit('update:modelValue', false)
        this.$emit('update:isVisible', false)
        if (this.isVisible !== undefined) {
          this.$emit('close')
        }
      } catch (error) {
        console.error('Error creating vendor:', error)
        this.errorMessage =
          error?.response?.data?.message || error.message || 'Failed to create vendor'
        this.showError = true
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

  props: {
    modelValue: { type: Boolean, default: false },
    isVisible: { type: Boolean, required: false },
    collectors: { type: Array, default: () => [] },
  },

  emits: ['update:modelValue', 'save', 'close'],
}
