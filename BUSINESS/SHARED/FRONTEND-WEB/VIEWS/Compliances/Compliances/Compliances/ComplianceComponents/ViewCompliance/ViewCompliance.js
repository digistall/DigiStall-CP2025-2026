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
  data() {
    return {
      showPhotoViewer: false,
      imageLoadError: false,
      imageLoaded: false,
    }
  },
  computed: {
    // Build the image src URL - fetch directly from database endpoint
    evidenceImageSrc() {
      if (!this.compliance || !this.compliance.compliance_id) return null
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      return `${apiBaseUrl}/compliances/${this.compliance.compliance_id}/evidence/image`
    },
    // Whether to show the evidence section
    showEvidenceSection() {
      return this.compliance && this.compliance.compliance_id && !this.imageLoadError
    }
  },
  watch: {
    compliance() {
      this.imageLoadError = false
      this.imageLoaded = false
    }
  },
  methods: {
    closeModal() {
      this.showPhotoViewer = false
      this.imageLoadError = false
      this.imageLoaded = false
      this.$emit("close");
    },

    handlePhotoError() {
      this.imageLoadError = true
      this.imageLoaded = false
    },

    handlePhotoLoad() {
      this.imageLoaded = true
      this.imageLoadError = false
    },

    openPhotoViewer() {
      if (this.imageLoaded) {
        this.showPhotoViewer = true
      }
    },

    closePhotoViewer() {
      this.showPhotoViewer = false
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


