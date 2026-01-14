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
        address: "",
        assignedLocation: null,
      },
      // Available locations for collectors
      availableLocations: [
        { name: 'Panganiban', value: 'Panganiban' },
        { name: 'Naga City Market', value: 'Naga City Market' },
        { name: 'Triangulo', value: 'Triangulo' },
        { name: 'Concepcion Pequeña', value: 'Concepcion Pequeña' },
      ],
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
    isMobileStaff() {
      if (!this.employee) return false;
      return this.employee.employee_type === 'mobile' || this.accountType === 'mobile';
    },
    canSave() {
      if (!this.formValid) return false;
      if (this.isEditMode) return true;
      if (this.accountType === 'mobile') {
        if (this.mobileRole === null) return false;
        // Collector requires assigned location
        if (this.mobileRole === 'collector' && !this.employeeForm.assignedLocation) return false;
        return true;
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
            phoneNumber: newEmployee.phone_number || newEmployee.contact_no || "",
            address: newEmployee.address || "",
            assignedLocation: newEmployee.assigned_location || newEmployee.location || null,
          };
          // Set account type and mobile role based on employee data
          if (newEmployee.employee_type === 'mobile') {
            this.accountType = 'mobile';
            this.mobileRole = newEmployee.mobile_role || null;
          } else {
            this.accountType = 'web';
            this.mobileRole = null;
          }
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
        address: "",
        assignedLocation: null,
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
