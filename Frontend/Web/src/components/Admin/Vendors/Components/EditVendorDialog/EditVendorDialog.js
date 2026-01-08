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
        Object.assign(f, src)
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
