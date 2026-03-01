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
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      
      // Form fields
      form: {
        lastName: '',
        firstName: '',
        middleName: '',
        suffix: '',
        phone: '',
        email: '',
        birthdate: '',
        gender: '',
        address: '',
        vendorId: '',

        // Spouse Info
        spouseFullName: '',
        spouseAge: null,
        spouseBirthdate: '',
        spouseEducation: '',
        spouseContact: '',
        spouseOccupation: '',

        // Child Info
        childFullName: '',
        childAge: null,
        childBirthdate: '',

        // Business Info
        businessName: '',
        businessType: '',
        businessDescription: '',
        vendStart: '',
        vendEnd: '',

        // Location Info
        locationName: '',

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
        const payload = {
          // Vendor personal info
          firstName: this.form.firstName,
          lastName: this.form.lastName,
          middleName: this.form.middleName,
          suffix: this.form.suffix,
          contactNumber: this.form.phone,
          email: this.form.email,
          birthdate: this.form.birthdate,
          gender: this.form.gender,
          address: this.form.address,
          vendorIdentifier: this.form.vendorId,
          status: 'Active',

          // Spouse info
          spouseFullName: this.form.spouseFullName,
          spouseAge: this.form.spouseAge,
          spouseBirthdate: this.form.spouseBirthdate,
          spouseEducation: this.form.spouseEducation,
          spouseContact: this.form.spouseContact,
          spouseOccupation: this.form.spouseOccupation,

          // Child info
          childFullName: this.form.childFullName,
          childAge: this.form.childAge,
          childBirthdate: this.form.childBirthdate,

          // Business info
          businessName: this.form.businessName,
          businessType: this.form.businessType,
          businessDescription: this.form.businessDescription,
          vendingTimeStart: this.form.vendStart,
          vendingTimeEnd: this.form.vendEnd,

          // Location info
          locationName: this.form.locationName,
        }

        this.$emit('save', payload)
        this.saving = false
        this.showToast('✅ Vendor added successfully!', 'success')
        this.$emit('update:modelValue', false)
        if (this.isVisible !== undefined) {
          this.$emit('close')
        }
      }, 500)
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
  },

  emits: ['update:modelValue', 'save', 'close'],
}
