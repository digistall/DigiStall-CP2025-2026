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
        // Emit both so parent can control via either `v-model` (modelValue)
        // or `isVisible` prop. This keeps components interoperable.
        this.$emit('update:modelValue', val)
        this.$emit('update:isVisible', val)
      },
    },
    // Normalized view of incoming collector data to support both
    // snake_case (API) and camelCase (UI) field names.
    normalizedData() {
      const d = this.data || {}
      return {
        firstName: d.first_name || d.firstName || d.first || '',
        lastName: d.last_name || d.lastName || d.last || '',
        middleName: d.middle_name || d.middleName || d.middle || '',
        birthdate: d.birthdate || d.birth_date || d.birthday || null,
        gender: d.gender || d.sex || '',
        phone: d.contact_number || d.phone || d.contact || '',
        email: d.email || d.email_address || '',
        collectorId: d.collector_id || d.id || d.collectorId || '',
        address: d.address || d.home_address || '',
        location: d.location || d.branch || d.branch_id || '',
        notes: d.notes || d.memo || '',
      }
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
