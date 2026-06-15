export default {
  name: 'LocationFormDialog',
  props: {
    isVisible: { type: Boolean, default: false },
    isEditing: { type: Boolean, default: false },
    form: { type: Object, default: () => ({ location_name: '' }) },
    formErrors: { type: String, default: '' },
    saving: { type: Boolean, default: false }
  },
  emits: ['close', 'save', 'update:form'],
  methods: {
    updateForm(value) {
      this.$emit('update:form', { ...this.form, location_name: value })
    }
  }
}
