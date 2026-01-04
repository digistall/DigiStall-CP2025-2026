//ViewCompliance.js
export default {
  props: {
    isVisible: {
      type: Boolean,
      required: true,
    },
    compliance: {
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
        case "complete":
          return "status-complete";
        case "pending":
          return "status-pending";
        case "incomplete":
          return "status-incomplete";
        case "in-progress":
          return "status-in-progress";
        default:
          return "";
      }
    },
    getSeverityClass(severity) {
      switch ((severity || '').toLowerCase()) {
        case "minor":
          return "severity-minor";
        case "moderate":
          return "severity-moderate";
        case "major":
          return "severity-major";
        case "critical":
          return "severity-critical";
        default:
          return "severity-moderate";
      }
    },
  },
};


