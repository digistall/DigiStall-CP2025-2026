export default {
  name: 'CollectorDetailsDialog',
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
    photo: {
      type: String,
      default: 'https://i.pravatar.cc/200?img=14',
    },
  },
  computed: {
    visibleModel: {
      get() {
        return this.modelValue || this.isVisible
      },
      set(val) {
        this.$emit('update:modelValue', val)
      },
    },
  },
  methods: {
    closeDialog() {
      this.visibleModel = false
    },
    formatDate(date) {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
  },
}
