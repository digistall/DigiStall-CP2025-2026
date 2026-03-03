import '@/assets/css/scrollable-tables.css'

export default {
  name: "BranchList",
  props: {
    branches: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["refresh", "assign-manager", "edit-branch", "delete-branch"],
  data() {
    return {
      showDetailsDialog: false,
      selectedBranch: null,
      activeTab: 'info',
    };
  },
  methods: {
    viewBranchDetails(branch) {
      this.selectedBranch = branch;
      this.activeTab = 'info';
      this.showDetailsDialog = true;
    },
    
    handleAssignManager() {
      this.$emit('assign-manager', this.selectedBranch);
      this.showDetailsDialog = false;
    },
    
    handleEditBranch() {
      this.$emit('edit-branch', this.selectedBranch);
      this.showDetailsDialog = false;
    },
    
    handleDeleteBranch() {
      this.$emit('delete-branch', this.selectedBranch);
      this.showDetailsDialog = false;
    },
    
    getStatusColor(status) {
      switch (status) {
        case "Active":
          return "success";
        case "Inactive":
          return "error";
        case "Under Construction":
          return "warning";
        case "Maintenance":
          return "info";
        default:
          return "grey";
      }
    },
    
    getStatusClass(status) {
      switch (status) {
        case "Active":
          return "status-active";
        case "Inactive":
          return "status-inactive";
        case "Under Construction":
          return "status-construction";
        case "Maintenance":
          return "status-maintenance";
        default:
          return "status-default";
      }
    },
    
    getStatusIcon(status) {
      switch (status) {
        case "Active":
          return "mdi-check-circle";
        case "Inactive":
          return "mdi-close-circle";
        case "Under Construction":
          return "mdi-hammer-wrench";
        case "Maintenance":
          return "mdi-wrench";
        default:
          return "mdi-help-circle";
      }
    },
  },
};
