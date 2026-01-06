//ViewInspector.js
export default {
  props: {
    isVisible: {
      type: Boolean,
      required: true,
    },
    inspector: {
      type: Object,
      default: null,
    },
  },
  methods: {
    closeModal() {
      this.$emit("close");
    },
    getStatusClass(status) {
      switch (status.toLowerCase()) {
        case "active":
          return "status-active";
        case "inactive":
          return "status-inactive";
        case "suspended":
          return "status-suspended";
        case "on-leave":
          return "status-leave";
        default:
          return "";
      }
    },
  },
};
