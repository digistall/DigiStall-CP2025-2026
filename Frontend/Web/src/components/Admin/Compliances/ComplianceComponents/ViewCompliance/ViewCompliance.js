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
    // Check if this compliance has evidence - either from base64 data or by checking if we have a compliance_id
    hasEvidence() {
      // If the image loaded successfully, evidence exists
      if (this.imageLoaded) return true
      // If there was an error loading, no evidence
      if (this.imageLoadError) return false
      // Otherwise check if evidence data exists (base64 string)
      return this.compliance && this.compliance.evidence && this.compliance.evidence.length > 0
    },
    // Build the image src URL - like stalls page, use the dedicated image endpoint
    evidenceImageSrc() {
      if (!this.compliance || !this.compliance.compliance_id) return null

      // Use the dedicated binary image endpoint (like stalls does)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
      return `${apiBaseUrl}/compliances/${this.compliance.compliance_id}/evidence/image`
    },
    // Whether to show the evidence section (always show if we have a compliance_id, let image handle errors)
    showEvidenceSection() {
      return this.compliance && this.compliance.compliance_id && !this.imageLoadError
    }
  },
  watch: {
    // Reset image states when compliance changes
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
      console.warn('Failed to load evidence image')
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


