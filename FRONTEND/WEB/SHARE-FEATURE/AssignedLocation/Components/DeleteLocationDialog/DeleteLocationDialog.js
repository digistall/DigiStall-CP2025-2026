export default {
  name: 'DeleteLocationDialog',
  props: {
    isVisible: { type: Boolean, default: false },
    location: { type: Object, default: null },
    deleting: { type: Boolean, default: false }
  },
  emits: ['close', 'confirm']
}
