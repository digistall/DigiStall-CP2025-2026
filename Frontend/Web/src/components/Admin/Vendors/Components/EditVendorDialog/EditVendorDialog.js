import { computed, reactive, watch, ref } from 'vue'

export default {
  setup(props, { emit }) {
    // Support both v-model (modelValue) and :isVisible + @close API
    const visible = computed({
      get: () => (props.isVisible === undefined ? props.modelValue : props.isVisible),
      set: (v) => {
        emit('update:modelValue', v)
        emit('update:isVisible', v)
        if (props.isVisible !== undefined && !v) emit('close')
      },
    })

    const step = ref(1)

    // initialize form from props.data (keep File objects)
    const form = reactive(makeInitialForm(props.data))
    watch(
      () => props.data,
      (val) => {
        Object.assign(form, makeInitialForm(val))
        step.value = 1
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
        assignedCollector: null,
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
        // normalize assignedCollector from incoming raw payloads
        if (src.collector_id) f.assignedCollector = src.collector_id
        else if (src.collector) f.assignedCollector = src.collector
      }
      return f
    }

    const collectorItems = computed(() => {
      if (props.collectors && props.collectors.length && typeof props.collectors[0] === 'object') {
        return props.collectors
      }
      return (props.collectors || []).map((s, i) => ({ id: i, name: s }))
    })

    const collectorItemText = 'name'
    const collectorItemValue = 'id'

    function goNext() {
      // very light check
      if (!form.firstName || !form.lastName || !form.vendorId) {
        emit('show-error', 'Please complete required fields.')
        return
      }
      step.value = 2
    }

    function submit() {
      // return both compact row and full raw payload
      // resolve collector display name
      let collectorDisplay = null
      const ac = form.assignedCollector
      if (ac == null || ac === '') collectorDisplay = null
      else if (typeof ac === 'object')
        collectorDisplay = ac.name || ac.first_name || ac.last_name || null
      else if (
        props.collectors &&
        props.collectors.length &&
        typeof props.collectors[0] === 'object'
      ) {
        const found = props.collectors.find(
          (c) => String(c.id) === String(ac) || `${c.name}` === `${ac}`,
        )
        collectorDisplay = found ? found.name : ac
      } else collectorDisplay = ac

      const updatedRow = {
        id: form.vendorId,
        name: [form.firstName, form.lastName].filter(Boolean).join(' '),
        business: form.businessName,
        collector: collectorDisplay || 'John Smith',
        status: 'Active',
        raw: { ...form, files: { ...form.files } }, // keep File refs
      }
      emit('update', updatedRow)
      visible.value = false
    }

    function cancel() {
      visible.value = false
      step.value = 1
    }

    return {
      model: visible,
      step,
      form,
      goNext,
      submit,
      cancel,
      collectorItems,
      collectorItemText,
      collectorItemValue,
    }
  },
  props: {
    modelValue: { type: Boolean, default: false },
    isVisible: { type: Boolean, required: false },
    collectors: { type: Array, default: () => [] },
    /** pass the full vendor payload (what you stored in item.raw) */
    data: { type: Object, default: () => ({}) },
  },
  emits: ['update:modelValue', 'update', 'close'],
}
