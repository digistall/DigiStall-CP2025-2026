export default {
  name: 'TableLocation',
  props: {
    locations: { type: Array, default: () => [] },
    searchQuery: { type: String, default: '' },
    sortBy: { type: String, default: 'created_at' },
    sortDir: { type: String, default: 'DESC' }
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return ''
      return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
