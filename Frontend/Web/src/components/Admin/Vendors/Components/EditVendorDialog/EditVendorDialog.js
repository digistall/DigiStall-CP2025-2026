import { computed, reactive, watch, ref } from 'vue'

export default {
  setup(props, { emit }) {
    // Support both v-model (modelValue) and :isVisible + @close API
    const visible = computed({
      get: () => (props.isVisible === undefined ? props.modelValue : props.isVisible),
      set: (v) => {
        emit('update:modelValue', v)
        if (props.isVisible !== undefined && !v) emit('close')
      },
    })

    // Replace step with activeTab for tabs navigation
    const activeTab = ref(0)
    const formValid = ref(false)
    const genderOptions = ['Male', 'Female', 'Other']
    const emailRules = [
      (v) => !!v || 'Email is required',
      (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
    ]

    // initialize form from props.data (keep File objects)
    const form = reactive(makeInitialForm(props.data))
    watch(
      () => props.data,
      (val) => {
        Object.assign(form, makeInitialForm(val))
        activeTab.value = 0
      },
      { deep: true },
    )

    function makeInitialForm(src) {
      // shallow copy is enough for primitives + File refs
      const f = {
        // Vendor personal info
        lastName: '',
        firstName: '',
        middleName: '',
        suffix: '',
        birthdate: '',
        gender: 'Male',
        phone: '',
        email: '',
        vendorId: '',
        address: '',

        // Spouse info
        spouseFullName: '',
        spouseAge: null,
        spouseBirthdate: '',
        spouseEducation: '',
        spouseContact: '',
        spouseOccupation: '',

        // Child info
        childFullName: '',
        childAge: null,
        childBirthdate: '',

        // Business info
        businessName: '',
        businessType: '',
        businessDescription: '',
        vendStart: '',
        vendEnd: '',

        // Location info
        locationName: '',

        // files
        files: {
          clearance: null,
          votersId: null,
          cedula: null,
          picture: null,
          association: null,
          healthcard: null,
        },
      }
      // merge incoming data if present
      if (src && typeof src === 'object') {
        // Map database fields to form fields
        f.firstName = src.first_name || src.firstName || ''
        f.lastName = src.last_name || src.lastName || ''
        f.middleName = src.middle_name || src.middleName || ''
        f.suffix = src.suffix || ''
        f.birthdate = src.birthdate || ''
        f.gender = src.gender || 'Male'
        f.phone = src.contact_number || src.phone || ''
        f.email = src.email || ''
        f.vendorId = src.vendor_identifier || src.vendorId || src.vendor_id || ''
        f.address = src.address || ''

        // Spouse fields from database
        f.spouseFullName = src.spouse_full_name || src.spouseFullName || ''
        f.spouseAge = src.spouse_age || src.spouseAge || null
        f.spouseBirthdate = src.spouse_birthdate || src.spouseBirthdate || ''
        f.spouseEducation = src.spouse_education || src.spouseEducation || ''
        f.spouseContact = src.spouse_contact || src.spouseContact || ''
        f.spouseOccupation = src.spouse_occupation || src.spouseOccupation || ''

        // Child fields from database
        f.childFullName = src.child_full_name || src.childFullName || ''
        f.childAge = src.child_age || src.childAge || null
        f.childBirthdate = src.child_birthdate || src.childBirthdate || ''

        // Business fields from database
        f.businessName = src.business_name || src.businessName || ''
        f.businessType = src.business_type || src.businessType || ''
        f.businessDescription =
          src.business_description || src.productsSold || src.businessDescription || ''
        f.vendStart = src.vending_time_start || src.vendStart || ''
        f.vendEnd = src.vending_time_end || src.vendEnd || ''

        // Location field from database
        f.locationName = src.location_name || src.locationName || ''

        f.files = { ...f.files, ...(src.files || {}) }
      }
      return f
    }

    function submit() {
      // return complete payload with all relations
      const payload = {
        // Vendor personal info
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName,
        suffix: form.suffix,
        contactNumber: form.phone,
        email: form.email,
        birthdate: form.birthdate,
        gender: form.gender,
        address: form.address,
        vendorIdentifier: form.vendorId,
        status: form.status || 'Active',

        // Spouse info
        spouseFullName: form.spouseFullName,
        spouseAge: form.spouseAge,
        spouseBirthdate: form.spouseBirthdate,
        spouseEducation: form.spouseEducation,
        spouseContact: form.spouseContact,
        spouseOccupation: form.spouseOccupation,

        // Child info
        childFullName: form.childFullName,
        childAge: form.childAge,
        childBirthdate: form.childBirthdate,

        // Business info
        businessName: form.businessName,
        businessType: form.businessType,
        businessDescription: form.businessDescription,
        vendingTimeStart: form.vendStart,
        vendingTimeEnd: form.vendEnd,

        // Location info
        locationName: form.locationName,
      }
      emit('update', payload)
      visible.value = false
    }

    function cancel() {
      visible.value = false
      activeTab.value = 0
    }

    return {
      model: visible,
      activeTab,
      formValid,
      genderOptions,
      emailRules,
      form,
      submit,
      cancel,
    }
  },
  props: {
    modelValue: { type: Boolean, default: false },
    isVisible: { type: Boolean, required: false },
    /** pass the full vendor payload (what you stored in item.raw) */
    data: { type: Object, default: () => ({}) },
  },
  emits: ['update:modelValue', 'update', 'close'],
}
