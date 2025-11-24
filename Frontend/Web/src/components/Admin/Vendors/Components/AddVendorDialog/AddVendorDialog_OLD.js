import { computed, reactive, watch, ref } from 'vue'

export default {
  setup(props, { emit }) {
    // Support both v-model (modelValue) and :isVisible + @close API
    const visible = computed({
      get: () => (props.isVisible === undefined ? props.modelValue : props.isVisible),
      set: (v) => {
        // keep v-model compatibility
        emit('update:modelValue', v)
        // if parent passed isVisible, inform it via close event when hiding
        if (props.isVisible !== undefined && !v) emit('close')
      },
    })

    /** Step control */
    const step = ref(1)

    /** Form state */
    const form = reactive({
      // page 1
      lastName: 'Dela Cruz',
      firstName: 'Juan',
      middleName: 'Perez',
      suffix: 'Jr.',
      birthdate: '1990-10-05',
      gender: 'Male',
      phone: '09123456789',
      email: 'juan.delacruz@email.com',
      vendorId: '123456',
      address: 'Block 6 Lot 15 Maharlika Village Barangay Rosario Naga City',
      spouseLast: 'Dela Cruz',
      spouseFirst: 'Jessa',
      spouseMiddle: 'Caceres',
      childLast: 'Dela Cruz',
      childFirst: 'Pedro',
      childMiddle: 'Caceres',

      // page 2
      businessName: "Juan's Street Foods",
      businessType: 'Street Foods',
      productsSold: 'Street Foods',
      vendStart: '09:00',
      vendEnd: '13:00',
      businessAddress: 'Panganiban Naga City',

      // files
      files: {
        clearance: null,
        votersId: null,
        cedula: null,
        picture: null,
        association: null,
        healthcard: null,
      },
    })

    function importSampleData() {
      // already seeded above to match your mock; this function can pull from OCR/CSV in the future
    }

    function goNext() {
      // simple front-end validation for required fields on page 1
      const required = [
        'lastName',
        'firstName',
        'birthdate',
        'gender',
        'phone',
        'email',
        'vendorId',
        'address',
      ]
      const missing = required.filter((k) => !String(form[k] || '').trim())
      if (missing.length) {
        // Emit error message to parent component to handle with proper popup
        emit('show-error', 'Please fill out all required personal fields.')
        return
      }
      step.value = 2
    }

    function submit() {
      // front-end only: emit a compact object back to parent to add to table
      const newRow = {
        id: form.vendorId,
        name: `${form.firstName} ${form.lastName}`,
        business: form.businessName,
        collector: 'John Smith', // default; parent can change or show another input
        status: 'Active',
        raw: JSON.parse(JSON.stringify(form)), // keep whole payload if parent needs it
      }
      emit('save', newRow)
      visible.value = false
    }

    function cancel() {
      visible.value = false
      step.value = 1
    }

    watch(visible, (v) => {
      if (!v) step.value = 1
    })

    return {
      model: visible,
      step,
      form,
      importSampleData,
      goNext,
      submit,
      cancel,
    }
  },
  props: {
    modelValue: { type: Boolean, default: false },
    // alternative API used by Stallholders components
    isVisible: { type: Boolean, required: false },
  },
  emits: ['update:modelValue', 'save', 'close'],
}
