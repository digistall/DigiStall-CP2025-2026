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
  data() {
    return {
      showResolveModal: false,
      isResolving: false,
      resolveError: '',
      resolveData: {
        status: 'resolved',
        resolution_notes: ''
      }
    }
  },
  computed: {
    isResolved() {
      return this.complaints?.status?.toLowerCase() === 'resolved';
    },
    isRejected() {
      return this.complaints?.status?.toLowerCase() === 'rejected';
    }
  },
  methods: {
    closeModal() {
      this.$emit("close");
    },
    editComplaints() {
      this.$emit("edit-complaints", this.complaints);
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
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    openResolveModal() {
      this.showResolveModal = true;
      this.resolveData = {
        status: 'resolved',
        resolution_notes: ''
      };
      this.resolveError = '';
    },
    closeResolveModal() {
      this.showResolveModal = false;
      this.resolveData = {
        status: 'resolved',
        resolution_notes: ''
      };
      this.resolveError = '';
    },
    async submitResolve() {
      // Validation
      if (!this.resolveData.resolution_notes.trim()) {
        this.resolveError = 'Resolution notes are required';
        return;
      }

      this.isResolving = true;
      this.resolveError = '';

      try {
        this.$emit('resolve-complaint', {
          complaint_id: this.complaints.complaint_id,
          status: this.resolveData.status,
          resolution_notes: this.resolveData.resolution_notes
        });
      } catch (error) {
        console.error('Error resolving complaint:', error);
        this.resolveError = 'Failed to resolve complaint. Please try again.';
      } finally {
        this.isResolving = false;
      }
    }
  },
  watch: {
    isVisible(newVal) {
      if (!newVal) {
        this.showResolveModal = false;
        this.resolveData = {
          status: 'resolved',
          resolution_notes: ''
        };
        this.resolveError = '';
      }
    }
  }
};


