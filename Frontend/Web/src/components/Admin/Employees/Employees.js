import EmployeeSearch from "./Components/EmployeeSearch/EmployeeSearch.vue";
import EmployeeTable from "./Components/EmployeeTable/EmployeeTable.vue";
import AddEmployee from "./Components/AddEmployee/AddEmployee.vue";
import ManagePermissions from "./Components/ManagePermissions/ManagePermissions.vue";
import {
  sendEmployeePasswordResetEmail,
  generateEmployeePassword,
  sendEmployeeCredentialsEmail,
} from "./Components/emailService.js";

export default {
  name: "EmployeeManagement",
  components: {
    EmployeeSearch,
    EmployeeTable,
    AddEmployee,
    ManagePermissions,
  },
  data() {
    return {
      saving: false,
      searchQuery: "",
      statusFilter: null,
      permissionFilter: null,

      // API Configuration
      apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",

      // Dialog states
      employeeDialog: false,
      permissionsDialog: false,
      isEditMode: false,

      // Selected employee and permissions
      selectedEmployee: null,
      selectedPermissions: [],

      // Filter options
      statusOptions: [
        { title: "All Status", value: null },
        { title: "Active", value: "active" },
        { title: "Inactive", value: "inactive" },
      ],

      permissionOptions: [
        { title: "All Permissions", value: null },
        { title: "Dashboard", value: "dashboard" },
        { title: "Payments", value: "payments" },
        { title: "Applicants", value: "applicants" },
        { title: "Complaints", value: "complaints" },
        { title: "Compliances", value: "compliances" },
        { title: "Vendors", value: "vendors" },
        { title: "Stallholders", value: "stallholders" },
        { title: "Collectors", value: "collectors" },
        { title: "Stalls", value: "stalls" },
      ],

      // Available permissions with detailed info
      availablePermissions: [
        {
          value: "dashboard",
          text: "Dashboard",
          icon: "mdi-view-dashboard",
          color: "primary",
          description: "View main dashboard and analytics",
        },
        {
          value: "payments",
          text: "Payments",
          icon: "mdi-credit-card",
          color: "success",
          description: "Manage payment transactions",
        },
        {
          value: "applicants",
          text: "Applicants",
          icon: "mdi-account-plus",
          color: "info",
          description: "Handle stall applications",
        },
        {
          value: "complaints",
          text: "Complaints",
          icon: "mdi-chart-line",
          color: "warning",
          description: "Manage customer complaints",
        },
        {
          value: "compliances",
          text: "Compliances",
          icon: "mdi-clipboard-check",
          color: "purple",
          description: "Handle compliance monitoring",
        },
        {
          value: "vendors",
          text: "Vendors",
          icon: "mdi-account-group",
          color: "teal",
          description: "Manage vendor accounts",
        },
        {
          value: "stallholders",
          text: "Stallholders",
          icon: "mdi-account-multiple",
          color: "indigo",
          description: "Manage stallholder accounts",
        },
        {
          value: "collectors",
          text: "Collectors",
          icon: "mdi-account-cash",
          color: "orange",
          description: "Manage payment collectors",
        },
        {
          value: "stalls",
          text: "Stalls",
          icon: "mdi-store",
          color: "red",
          description: "Manage stall information and operations",
        },
      ],

      // Employees data (loaded from API)
      employees: [],
    };
  },

  computed: {
    totalEmployees() {
      return this.employees.length;
    },

    activeEmployees() {
      return this.employees.filter((emp) => emp.status === "active").length;
    },

    inactiveEmployees() {
      return this.employees.filter((emp) => emp.status === "inactive").length;
    },

    filteredEmployees() {
      let filtered = this.employees;

      if (this.statusFilter) {
        filtered = filtered.filter((emp) => emp.status === this.statusFilter);
      }

      if (this.permissionFilter) {
        filtered = filtered.filter(
          (emp) => emp.permissions && emp.permissions.includes(this.permissionFilter)
        );
      }

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (emp) =>
            emp.first_name?.toLowerCase().includes(query) ||
            emp.last_name?.toLowerCase().includes(query) ||
            emp.email?.toLowerCase().includes(query) ||
            emp.employee_username?.toLowerCase().includes(query)
        );
      }

      return filtered;
    },
  },

  methods: {
    // API Methods
    async fetchEmployees() {
      try {
        // Get authentication token
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication required. Please login again.");
        }

        console.log("🔑 Fetching employees with authentication...");
        const response = await fetch(`${this.apiBaseUrl}/employees`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("📡 Employees API response status:", response.status);

        if (!response.ok) {
          if (response.status === 401) {
            // Clear session and redirect to login
            sessionStorage.clear();
            this.$router.push("/login");
            throw new Error("Session expired. Please login again.");
          } else if (response.status === 403) {
            throw new Error(
              "Access denied. You do not have permission to view employees."
            );
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          this.employees = data.data || data.employees || [];
          console.log(`✅ Loaded ${this.employees.length} employees`);

          // Provide user feedback based on role
          const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
          if (this.employees.length === 0) {
            if (currentUser.userType === "branch-manager") {
              console.log(
                "ℹ️  No employees found - Branch manager has not created any employees yet"
              );
            } else {
              console.log("ℹ️  No employees found");
            }
          } else {
            if (currentUser.userType === "branch-manager") {
              console.log(
                `ℹ️  Showing ${this.employees.length} employees created by this branch manager`
              );
            }
          }
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        this.$emit(
          "show-snackbar",
          `Failed to load employees: ${error.message}`,
          "error"
        );
      }
    },

    // Employee Dialog Methods
    openAddEmployeeDialog() {
      this.isEditMode = false;
      this.selectedEmployee = null;
      this.selectedPermissions = [];
      this.employeeDialog = true;
    },

    editEmployee(employee) {
      this.isEditMode = true;
      this.selectedEmployee = { ...employee };
      this.selectedPermissions = [...(employee.permissions || [])];
      this.employeeDialog = true;
    },

    closeEmployeeDialog() {
      this.employeeDialog = false;
      this.isEditMode = false;
      this.selectedEmployee = null;
      this.selectedPermissions = [];
    },

    // Check if email exists (will be validated by backend globally across all branches)
    async checkEmailExists(email) {
      // Note: Backend will perform the actual validation globally
      // This frontend check is just for immediate feedback from cached data
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await fetch(`${this.apiBaseUrl}/employees`, {
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const employees = data.data || [];
          // Only check within same branch for immediate feedback
          // Backend will validate globally
          return employees.some(emp => emp.email.toLowerCase() === email.toLowerCase());
        }
        return false;
      } catch (error) {
        console.error("Error checking email:", error);
        return false;
      }
    },

    async saveEmployee(employeeData) {
      this.saving = true;

      try {
        // Check for duplicate email first (only for new employees)
        if (!this.isEditMode) {
          const emailExists = await this.checkEmailExists(employeeData.email);
          if (emailExists) {
            throw new Error(`An employee with email "${employeeData.email}" already exists. Please use a different email address.`);
          }
        }

        // Get authentication token first
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication required. Please login again.");
        }

        // Decode token to get user information
        let decodedToken;
        try {
          // Simple base64 decode of JWT payload (between first and second dot)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          decodedToken = JSON.parse(jsonPayload);
        } catch (decodeError) {
          console.error("Token decode error:", decodeError);
          throw new Error("Invalid authentication token. Please login again.");
        }

        console.log("🔍 Debug - Decoded token:", decodedToken);

        // Extract user information from token
        const branchManagerId = decodedToken.userId || decodedToken.branchManagerId;
        const branchId = decodedToken.branchId;

        console.log("🔍 Debug - Extracted from token:");
        console.log("  - branchManagerId:", branchManagerId);
        console.log("  - branchId:", branchId);

        // Validation
        if (!branchManagerId) {
          throw new Error("Unable to identify the branch manager from token. Please login again.");
        }

        if (!branchId) {
          throw new Error("Branch ID not found in token. Please login again.");
        }

        console.log("🏪 Creating employee with branch manager ID:", branchManagerId);
        console.log("🏢 Creating employee for branch ID:", branchId);

        const payload = {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phoneNumber: employeeData.phoneNumber,
          permissions: this.selectedPermissions || [],
        };

        console.log("📤 Sending payload:", payload);
        console.log("📤 Permissions being sent:", this.selectedPermissions);

        const url = this.isEditMode
          ? `${this.apiBaseUrl}/employees/${this.selectedEmployee.employee_id}`
          : `${this.apiBaseUrl}/employees`;

        const method = this.isEditMode ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        console.log("📡 Response status:", response.status);
        
        if (!response.ok) {
          // Try to get error details from response
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          
          // Provide more specific error messages
          if (response.status === 400 && errorMessage.includes('email')) {
            throw new Error(`Email validation failed: ${errorMessage}. Please try a different email address.`);
          } else if (response.status === 400) {
            throw new Error(`Invalid data: ${errorMessage}. Please check all required fields.`);
          } else if (response.status === 401) {
            throw new Error("Authentication expired. Please login again.");
          } else if (response.status === 403) {
            throw new Error("You don't have permission to create employees.");
          } else {
            throw new Error(errorMessage);
          }
        }

        const data = await response.json();
        console.log("📡 Response data:", data);

        if (data.success) {
          if (!this.isEditMode) {
            // Backend generated credentials
            const backendCredentials = data.data.credentials;
            console.log("✅ Employee created with backend credentials:", backendCredentials);
            
            // Send email using EmailJS (same method as applicants)
            try {
              const employeeName = `${employeeData.firstName} ${employeeData.lastName}`;
              const emailResult = await sendEmployeeCredentialsEmail(
                employeeData.email,
                employeeName,
                backendCredentials.username,
                backendCredentials.password
              );
              
              if (emailResult.success) {
                console.log("📧 Welcome email sent successfully via EmailJS");
                this.$emit(
                  "show-snackbar",
                  `Employee created successfully! Welcome email with credentials sent to ${employeeData.email}`,
                  "success",
                  10000
                );
              } else {
                console.warn("⚠️ Email sending failed:", emailResult.message);
                this.$emit(
                  "show-snackbar",
                  `Employee created! Username: ${backendCredentials.username}, Password: ${backendCredentials.password}. (Email failed: ${emailResult.message})`,
                  "warning",
                  15000
                );
              }
            } catch (emailError) {
              console.error("❌ Error sending email:", emailError);
              this.$emit(
                "show-snackbar",
                `Employee created! Username: ${backendCredentials.username}, Password: ${backendCredentials.password}. Please send credentials manually to ${employeeData.email}`,
                "warning",
                15000
              );
            }
          } else {
            this.$emit(
              "show-snackbar",
              "Employee updated successfully!",
              "success"
            );
          }

          this.closeEmployeeDialog();
          await this.fetchEmployees();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error saving employee:", error);
        
        // Provide user-friendly error messages
        let errorMessage = error.message;
        if (error.message.includes('email address already exists') || error.message.includes('Email validation failed')) {
          errorMessage = `⚠️ The email "${employeeData.email}" is already registered in the system (possibly in another branch). Please use a different email address.`;
        } else if (error.message.includes('Authentication')) {
          errorMessage = "Your session has expired. Please refresh the page and login again.";
        } else if (error.message.includes('Branch ID not found')) {
          errorMessage = "Session error: Branch information missing. Please refresh and login again.";
        } else if (error.message.includes('Missing required fields')) {
          errorMessage = "Please fill in all required fields (First Name, Last Name, Email).";
        }
        
        this.$emit("show-snackbar", errorMessage, "error", 10000);
      } finally {
        this.saving = false;
      }
    },

    // Permission Management
    managePermissions(employee) {
      this.selectedEmployee = employee;
      this.selectedPermissions = [...(employee.permissions || [])];
      this.permissionsDialog = true;
    },

    closePermissionsDialog() {
      this.permissionsDialog = false;
      this.selectedEmployee = null;
      this.selectedPermissions = [];
    },

    togglePermission(permission) {
      const index = this.selectedPermissions.indexOf(permission);
      if (index > -1) {
        this.selectedPermissions.splice(index, 1);
      } else {
        this.selectedPermissions.push(permission);
      }
    },

    async savePermissions() {
      if (!this.selectedEmployee) return;

      this.saving = true;

      try {
        // Get authentication token
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication required. Please login again.");
        }

        const response = await fetch(
          `${this.apiBaseUrl}/employees/${this.selectedEmployee.employee_id}/permissions`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              permissions: this.selectedPermissions,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          this.$emit("show-snackbar", "Permissions updated successfully!", "success");
          this.closePermissionsDialog();
          await this.fetchEmployees();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error updating permissions:", error);
        this.$emit(
          "show-snackbar",
          `Failed to update permissions: ${error.message}`,
          "error"
        );
      } finally {
        this.saving = false;
      }
    },

    // Employee Actions
    async toggleEmployeeStatus(employee) {
      const newStatus = employee.status === "active" ? "inactive" : "active";

      try {
        const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

        // Get the branch manager ID from various possible sources
        const branchManagerId =
          currentUser.branchManagerId ||
          sessionStorage.getItem("branchManagerId") ||
          currentUser.id;

        if (!branchManagerId) {
          throw new Error("Unable to identify the branch manager. Please login again.");
        }

        // Get authentication token
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication required. Please login again.");
        }

        const response = await fetch(
          `${this.apiBaseUrl}/employees/${employee.employee_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: newStatus,
              updatedBy: parseInt(branchManagerId),
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          const action = newStatus === "active" ? "activated" : "deactivated";
          this.$emit("show-snackbar", `Employee ${action} successfully!`, "success");
          await this.fetchEmployees();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error updating employee status:", error);
        this.$emit("show-snackbar", `Failed to update status: ${error.message}`, "error");
      }
    },

    async resetEmployeePassword(employee) {
      if (
        !confirm(
          `Reset password for ${employee.first_name} ${employee.last_name}? A new password will be generated and sent to their email.`
        )
      ) {
        return;
      }

      try {
        const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

        // Get the branch manager ID from various possible sources
        const branchManagerId =
          currentUser.branchManagerId ||
          sessionStorage.getItem("branchManagerId") ||
          currentUser.id;

        if (!branchManagerId) {
          throw new Error("Unable to identify the branch manager. Please login again.");
        }

        // Get authentication token
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication required. Please login again.");
        }

        // Generate new password
        const newPassword = generateEmployeePassword();

        const response = await fetch(
          `${this.apiBaseUrl}/employees/${employee.employee_id}/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              resetBy: parseInt(branchManagerId),
              newPassword: newPassword,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          // Send password reset email
          console.log("📧 Sending password reset email...");
          const emailResult = await sendEmployeePasswordResetEmail(
            employee.email,
            `${employee.first_name} ${employee.last_name}`,
            newPassword
          );

          if (emailResult.success) {
            this.$emit(
              "show-snackbar",
              `Password reset successfully! New password: ${newPassword}. Reset notification sent to ${employee.email}`,
              "success",
              8000
            );
          } else {
            this.$emit(
              "show-snackbar",
              `Password reset! New password: ${newPassword}. Warning: Email failed to send - ${emailResult.message}`,
              "warning",
              10000
            );
          }
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error resetting password:", error);
        this.$emit(
          "show-snackbar",
          `Failed to reset password: ${error.message}`,
          "error"
        );
      }
    },

    // Utility Methods
    debugSessionStorage() {
      console.log("🔍 === SESSION STORAGE DEBUG ===");
      console.log("All session storage keys:", Object.keys(sessionStorage));
      console.log(
        "authToken:",
        sessionStorage.getItem("authToken") ? "exists" : "missing"
      );
      console.log("user:", sessionStorage.getItem("user"));
      console.log("currentUser:", sessionStorage.getItem("currentUser"));
      console.log("userType:", sessionStorage.getItem("userType"));
      console.log("branchManagerId:", sessionStorage.getItem("branchManagerId"));
      console.log("branchId:", sessionStorage.getItem("branchId"));
      console.log("branchName:", sessionStorage.getItem("branchName"));
      console.log("branchManagerData:", sessionStorage.getItem("branchManagerData"));
      console.log("=== END DEBUG ===");
    },

    resetFilters() {
      this.searchQuery = "";
      this.statusFilter = null;
      this.permissionFilter = null;
    },
  },

  mounted() {
    // Load employees when component is mounted
    this.fetchEmployees();
  },
};
