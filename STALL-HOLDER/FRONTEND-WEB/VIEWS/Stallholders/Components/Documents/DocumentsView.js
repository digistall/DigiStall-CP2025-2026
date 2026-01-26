export default {
  name: 'DocumentsView',
  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
    stallholder: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      documents: [],  // Start with empty array
      loading: false,
      error: null,
    }
  },
  
  watch: {
    // Fetch documents when modal opens or stallholder changes
    isVisible(newValue) {
      if (newValue && this.stallholder?.stallholder_id) {
        this.fetchStallholderDocuments();
      }
    },
    'stallholder.stallholder_id'(newValue) {
      if (newValue && this.isVisible) {
        this.fetchStallholderDocuments();
      }
    }
  },
  
  methods: {
    async fetchStallholderDocuments() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await this.$http.get(
          `/api/documents/stallholder/${this.stallholder.stallholder_id}/submissions`
        );
        
        if (response.data.success) {
          // Map the documents to your display format
          this.documents = response.data.data.map(doc => ({
            id: doc.document_id,
            submission_id: doc.submission_id,
            name: doc.document_name || doc.file_name || doc.document_type,
            status: this.mapStatus(doc.status || doc.verification_status),
            type: this.getFileType(doc.document_mime_type || doc.file_name),
            uploadDate: this.formatDate(doc.uploaded_at || doc.created_at),
            verifiedBy: doc.verified_by,
            verifiedAt: doc.verified_at,
            remarks: doc.remarks || doc.rejection_reason,
          }));
        }
      } catch (error) {
        console.error('❌ Error fetching stallholder documents:', error);
        this.error = 'Failed to load documents';
        this.$notify({
          type: 'error',
          title: 'Error',
          message: 'Failed to load stallholder documents'
        });
      } finally {
        this.loading = false;
      }
    },
    
    mapStatus(status) {
      const statusMap = {
        'Approved': 'approved',
        'approved': 'approved',
        'verified': 'approved',
        'Rejected': 'rejected',
        'rejected': 'rejected',
        'Pending': 'pending',
        'pending': 'pending',
      };
      return statusMap[status] || 'pending';
    },
    
    getFileType(mimeTypeOrFilename) {
      if (!mimeTypeOrFilename) return 'file';
      
      const str = mimeTypeOrFilename.toLowerCase();
      if (str.includes('pdf')) return 'pdf';
      if (str.includes('image') || str.includes('jpg') || str.includes('jpeg') || str.includes('png')) return 'image';
      if (str.includes('word') || str.includes('doc')) return 'doc';
      return 'file';
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    },
    
    closeModal() {
      this.$emit('close');
    },

    viewDocument(document) {
      console.log('View document:', document);
      this.$emit('view-document', document);
    },

    getStatusClass(status) {
      const statusClasses = {
        complete: 'status-complete',
        approved: 'status-approved',
        pending: 'status-pending',
        rejected: 'status-rejected',
      };
      return statusClasses[status] || 'status-default';
    },

    handleEscKey(event) {
      if (event.key === 'Escape' && this.isVisible) {
        this.closeModal();
      }
    },
  },

  mounted() {
    document.addEventListener('keydown', this.handleEscKey);
    
    // Fetch documents if modal is already open on mount
    if (this.isVisible && this.stallholder?.stallholder_id) {
      this.fetchStallholderDocuments();
    }
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.handleEscKey);
  },
}