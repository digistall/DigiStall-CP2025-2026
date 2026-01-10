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
        // page 1
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
        spouseLast: '',
        spouseFirst: '',
        spouseMiddle: '',
        childLast: '',
        childFirst: '',
        childMiddle: '',
        // page 2
        businessName: '',
        businessType: '',
        productsSold: '',
        vendStart: '',
        vendEnd: '',
        businessAddress: '',
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
        f.phone = src.phone || ''
        f.email = src.email || ''
        f.vendorId = src.vendor_identifier || src.vendorId || src.vendor_id || ''
        f.address = src.address || ''
        f.spouseLast = src.spouse_last || src.spouseLast || ''
        f.spouseFirst = src.spouse_first || src.spouseFirst || ''
        f.spouseMiddle = src.spouse_middle || src.spouseMiddle || ''
        f.childLast = src.child_last || src.childLast || ''
        f.childFirst = src.child_first || src.childFirst || ''
        f.childMiddle = src.child_middle || src.childMiddle || ''
        f.businessName = src.business_name || src.businessName || ''
        f.businessType = src.business_type || src.businessType || ''
        f.productsSold = src.business_description || src.productsSold || ''
        f.vendStart = src.vend_start || src.vendStart || ''
        f.vendEnd = src.vend_end || src.vendEnd || ''
        f.businessAddress = src.business_address || src.businessAddress || ''
        f.files = { ...f.files, ...(src.files || {}) }
      }
      return f
    }

    function submit() {
      // return both compact row and full raw payload
      const updatedRow = {
        id: form.vendorId,
        name: [form.firstName, form.lastName].filter(Boolean).join(' '),
        business: form.businessName,
        collector: 'John Smith',
        status: 'Active',
        raw: { ...form, files: { ...form.files } }, // keep File refs
      }
      emit('update', updatedRow)
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
