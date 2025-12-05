//ViewComplaints.js
export default {
  props: {
    isVisible: {
      type: Boolean,
      required: true,
    },
    complaints: {
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
        case "resolved":
          return "status-complete";
        case "pending":
          return "status-pending";
        case "rejected":
          return "status-incomplete";
        case "in-progress":
          return "status-active";
        default:
          return "";
      }
    },
    getPriorityClass(priority) {
      switch (priority.toLowerCase()) {
        case "urgent":
          return "priority-urgent";
        case "high":
          return "priority-high";
        case "medium":
          return "priority-medium";
        case "low":
          return "priority-low";
        default:
          return "priority-medium";
      }
    },
  },
};


