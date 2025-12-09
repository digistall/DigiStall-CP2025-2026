import {
  sendEmployeeCredentialsEmailWithRetry,
  generateEmployeeUsername,
  generateEmployeePassword,
} from "../emailService.js";

export default {
  name: "AddEmployee",
  props: {
    modelValue: Boolean,
    employee: Object,
    isEditMode: Boolean,
    saving: Boolean,
    availablePermissions: Array,
    selectedPermissions: Array,
  },
  emits: ["update:modelValue", "save", "close", "toggle-permission", "show-error", "show-success"],
  data() {
    return {
      formValid: false,
      accountType: 'web', // 'web' or 'mobile'
      mobileRole: null, // 'inspector' or 'collector'
      employeeForm: {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
      },
      rules: {
        required: (value) => !!value || "This field is required",
        email: (value) => {
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return pattern.test(value) || "Invalid email address";
        },
        phone: (value) => {
          const pattern = /^09\d{9}$/;
          return pattern.test(value) || "Phone must be 11 digits starting with 09";
        },
      },
    };
  },
  computed: {
    canSave() {
      if (!this.formValid) return false;
      if (this.isEditMode) return true;
      if (this.accountType === 'mobile') {
        return this.mobileRole !== null;
      }
      return true;
    },
    getSaveButtonText() {
      if (this.isEditMode) return "Update Employee";
      if (this.accountType === 'mobile') {
        if (this.mobileRole === 'inspector') return "Create Inspector";
        if (this.mobileRole === 'collector') return "Create Collector";
        return "Create Mobile Staff";
      }
      return "Create Employee";
    }
  },
  watch: {
    employee: {
      handler(newEmployee) {
        if (newEmployee && this.isEditMode) {
          this.employeeForm = {
            firstName: newEmployee.first_name || "",
            lastName: newEmployee.last_name || "",
            email: newEmployee.email || "",
            phoneNumber: newEmployee.phone_number || "",
          };
          // In edit mode, always show as web employee
          this.accountType = 'web';
          this.mobileRole = null;
        } else if (!this.isEditMode) {
          this.resetForm();
        }
      },
      immediate: true,
    },
    modelValue(newVal) {
      if (!newVal) {
        // Reset when dialog closes
        this.resetForm();
      }
    }
  },
  methods: {
    resetForm() {
      this.employeeForm = {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
      };
      this.accountType = 'web';
      this.mobileRole = null;
    },

    selectAccountType(type) {
      this.accountType = type;
      if (type === 'web') {
        this.mobileRole = null;
      }
    },

    selectMobileRole(role) {
      this.mobileRole = role;
    },

    isPermissionSelected(permission) {
      return this.selectedPermissions && this.selectedPermissions.includes(permission);
    },

    handleSave() {
      if (this.canSave) {
        const formData = {
          ...this.employeeForm,
          accountType: this.accountType,
          mobileRole: this.mobileRole,
        };
        this.$emit("save", formData);
      }
    },

    async testEmail() {
      if (!this.employeeForm.email || !this.employeeForm.firstName) {
        this.$emit('show-error', "Please fill in at least the first name and email fields before testing.");
        return;
      }

      try {
        console.log("📧 Testing email functionality...");

        // Generate test credentials
        const testUsername = generateEmployeeUsername();
        const testPassword = generateEmployeePassword();

        const employeeName = `${this.employeeForm.firstName} ${
          this.employeeForm.lastName || "Test"
        }`;

        // Send test email
        const result = await sendEmployeeCredentialsEmailWithRetry(
          this.employeeForm.email,
          employeeName,
          testUsername,
          testPassword
        );

        if (result.success) {
          this.$emit('show-success', 
            `✅ Test email sent successfully!\n\nTest credentials:\nUsername: ${testUsername}\nPassword: ${testPassword}\n\nEmail sent to: ${this.employeeForm.email}`
          );
        } else {
          this.$emit('show-error', `❌ Test email failed: ${result.message}`);
        }
      } catch (error) {
        console.error("Test email error:", error);
        this.$emit('show-error', `❌ Test email error: ${error.message}`);
      }
    },
  },
};
