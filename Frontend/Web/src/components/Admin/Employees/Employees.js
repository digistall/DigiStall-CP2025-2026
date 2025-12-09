import EmployeeSearch from "./Components/EmployeeSearch/EmployeeSearch.vue";
import EmployeeTable from "./Components/EmployeeTable/EmployeeTable.vue";
import AddEmployee from "./Components/AddEmployee/AddEmployee.vue";
import ManagePermissions from "./Components/ManagePermissions/ManagePermissions.vue";
import ToastNotification from '../../Common/ToastNotification/ToastNotification.vue';
import {
  sendEmployeePasswordResetEmail,
  generateEmployeePassword,
  sendEmployeeCredentialsEmail,
} from "./Components/emailService.js";
import dataCacheService from '../../../services/dataCacheService.js';

export default {
  name: "EmployeeManagement",
  components: {
    EmployeeSearch,
    EmployeeTable,
    AddEmployee,
    ManagePermissions,
    ToastNotification,
  },
  data() {
    return {
      saving: false,
      searchQuery: "",
      statusFilter: null,
      permissionFilter: null,
      employeeTypeFilter: null, // 'web', 'mobile', or null for all
      // Toast notification
      toast: {
        show: false,
        message: '',
        type: 'success',
      },

      // API Configuration
      apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:3001/api",

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

      employeeTypeOptions: [
        { title: "All Types", value: null },
        { title: "Web Employees", value: "web" },
        { title: "Mobile Staff", value: "mobile" },
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
      return this.employees.filter((emp) => emp.status?.toLowerCase() === "active").length;
    },

    inactiveEmployees() {
      return this.employees.filter((emp) => emp.status?.toLowerCase() === "inactive").length;
    },

    filteredEmployees() {
      let filtered = this.employees;

      // Filter by employee type (web/mobile)
      if (this.employeeTypeFilter) {
        filtered = filtered.filter((emp) => emp.employee_type === this.employeeTypeFilter);
      }

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
            emp.employee_username?.toLowerCase().includes(query) ||
            emp.display_role?.toLowerCase().includes(query)
        );
      }

      return filtered;
    },

    // Computed for mobile staff counts
    mobileStaffCount() {
      return this.employees.filter((emp) => emp.employee_type === 'mobile').length;
    },

    webEmployeesCount() {
      return this.employees.filter((emp) => emp.employee_type === 'web').length;
    },

    // Check if user is a business owner (view-only access)
    isBusinessOwner() {
      const userType = sessionStorage.getItem('userType');
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      return userType === 'stall_business_owner' || currentUser.userType === 'stall_business_owner';
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

        // Get current user info for branch verification
        const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
        const userBranchId = currentUser.branchId || currentUser.branch_id || currentUser.branch?.id;

        console.log("🔑 Fetching employees with authentication...");
        console.log("🏢 Current user branch ID:", userBranchId);
        
        // Fetch web employees, mobile staff (inspectors & collectors) in parallel
        const [employeesData, inspectorsData, collectorsData] = await Promise.all([
          // Web employees
          dataCacheService.cachedFetch(
            `${this.apiBaseUrl}/employees`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
            5 * 60 * 1000
          ),
          // Mobile inspectors
          dataCacheService.cachedFetch(
            `${this.apiBaseUrl}/mobile-staff/inspectors`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
            5 * 60 * 1000
          ).catch(err => {
            console.warn("⚠️ Could not fetch inspectors:", err.message);
            return { success: true, data: [] };
          }),
          // Mobile collectors
          dataCacheService.cachedFetch(
            `${this.apiBaseUrl}/mobile-staff/collectors`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
            5 * 60 * 1000
          ).catch(err => {
            console.warn("⚠️ Could not fetch collectors:", err.message);
            return { success: true, data: [] };
          })
        ]);

        console.log("📡 Employees API response:", employeesData);
        console.log("📡 Inspectors API response:", inspectorsData);
        console.log("📡 Collectors API response:", collectorsData);

        let allEmployees = [];

        // Process web employees
        if (employeesData.success) {
          let employees = employeesData.data || employeesData.employees || [];
          
          // Add employee_type for web employees
          employees = employees.map(emp => ({
            ...emp,
            employee_type: 'web',
            display_role: emp.role || 'Web Employee'
          }));
          
          allEmployees = [...allEmployees, ...employees];
        }

        // Process inspectors (mobile staff)
        if (inspectorsData.success) {
          let inspectors = inspectorsData.data || [];
          
          // Map inspector data to employee format
          inspectors = inspectors.map(ins => ({
            employee_id: `inspector_${ins.inspector_id}`,
            inspector_id: ins.inspector_id,
            first_name: ins.first_name,
            last_name: ins.last_name,
            email: ins.email,
            contact_no: ins.contact_no,
            employee_username: ins.username,
            status: ins.status,
            date_created: ins.date_created,
            date_hired: ins.date_hired,
            branch_id: ins.branch_id,
            branch_name: ins.branch_name,
            employee_type: 'mobile',
            mobile_role: 'inspector',
            display_role: 'Inspector (Mobile)',
            permissions: ['mobile_inspector']
          }));
          
          allEmployees = [...allEmployees, ...inspectors];
        }

        // Process collectors (mobile staff)
        if (collectorsData.success) {
          let collectors = collectorsData.data || [];
          
          // Map collector data to employee format
          collectors = collectors.map(col => ({
            employee_id: `collector_${col.collector_id}`,
            collector_id: col.collector_id,
            first_name: col.first_name,
            last_name: col.last_name,
            email: col.email,
            contact_no: col.contact_no,
            employee_username: col.username,
            status: col.status,
            date_created: col.date_created,
            date_hired: col.date_hired,
            branch_id: col.branch_id,
            branch_name: col.branch_name,
            employee_type: 'mobile',
            mobile_role: 'collector',
            display_role: 'Collector (Mobile)',
            permissions: ['mobile_collector']
          }));
          
          allEmployees = [...allEmployees, ...collectors];
        }

        // Client-side verification: Filter employees to ensure they belong to current user's branch
        if (userBranchId) {
          const originalCount = allEmployees.length;
          allEmployees = allEmployees.filter(emp => {
            const empBranchId = emp.branch_id || emp.branchId;
            // Include if no branch set (web employees without branch) or if matches
            return !empBranchId || parseInt(empBranchId) === parseInt(userBranchId);
          });
          
          if (originalCount !== allEmployees.length) {
            console.warn(`⚠️ Filtered out ${originalCount - allEmployees.length} employees from different branches`);
          }
        }
        
        this.employees = allEmployees;
        console.log(`✅ Loaded ${this.employees.length} total employees (web + mobile) for branch ${userBranchId}`);

        // Provide user feedback based on role
        if (this.employees.length === 0) {
          if (currentUser.userType === "business_manager") {
            console.log(
              "ℹ️  No employees found - Business manager has not created any employees yet"
            );
          } else {
            console.log("ℹ️  No employees found");
          }
        } else {
          if (currentUser.userType === "business_manager") {
            console.log(
              `ℹ️  Showing ${this.employees.length} employees for branch ${userBranchId}`
            );
          }
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        
        // Clear cache and retry once on auth errors
        if (error.message.includes("Authentication") || error.message.includes("401")) {
          console.log("🔄 Authentication error - clearing cache and retrying...");
          dataCacheService.invalidatePattern("employees");
          
          // Don't retry to avoid infinite loops
          this.showToast(
            "❌ Authentication expired. Please login again.",
            "error"
          );
        } else {
          this.showToast(
            `❌ Failed to load employees: ${error.message}`,
            "error"
          );
        }
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
        // Get authentication token first
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication required. Please login again.");
        }

        // Decode token to get user information
        let decodedToken;
        try {
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

        const branchManagerId = decodedToken.userId || decodedToken.branchManagerId;
        const branchId = decodedToken.branchId;

        if (!branchManagerId || !branchId) {
          throw new Error("Session information missing. Please login again.");
        }

        // Determine account type from form data
        const accountType = employeeData.accountType || 'web';
        const mobileRole = employeeData.mobileRole;

        console.log(`🔍 Creating ${accountType} account${mobileRole ? ` (${mobileRole})` : ''}`);

        // Handle mobile account creation (Inspector or Collector)
        if (accountType === 'mobile' && !this.isEditMode) {
          await this.createMobileAccount(employeeData, token, branchId, branchManagerId);
          return;
        }

        // Handle web employee creation/update
        // Check for duplicate email first (only for new employees)
        if (!this.isEditMode) {
          const emailExists = await this.checkEmailExists(employeeData.email);
          if (emailExists) {
            throw new Error(`An employee with email "${employeeData.email}" already exists.`);
          }
        }

        console.log("🏪 Creating web employee for branch ID:", branchId);

        const payload = {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phoneNumber: employeeData.phoneNumber,
          permissions: this.selectedPermissions || [],
        };

        console.log("📤 Sending payload:", payload);

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
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.success) {
          if (!this.isEditMode) {
            const backendCredentials = data.data.credentials;
            console.log("✅ Web employee created with credentials");
            
            try {
              const employeeName = `${employeeData.firstName} ${employeeData.lastName}`;
              const emailResult = await sendEmployeeCredentialsEmail(
                employeeData.email,
                employeeName,
                backendCredentials.username,
                backendCredentials.password
              );
              
              if (emailResult.success) {
                this.showToast(
                  `✅ Web Employee created! Welcome email sent to ${employeeData.email}`,
                  "success"
                );
              } else {
                this.showToast(
                  `⚠️ Employee created! Username: ${backendCredentials.username}, Password: ${backendCredentials.password}. (Email failed)`,
                  "warning"
                );
              }
            } catch (emailError) {
              this.showToast(
                `⚠️ Employee created! Username: ${backendCredentials.username}, Password: ${backendCredentials.password}. Please send manually.`,
                "warning"
              );
            }
          } else {
            this.showToast("✅ Employee updated successfully!", "success");
          }

          this.closeEmployeeDialog();
          dataCacheService.invalidatePattern('employees');
          await this.fetchEmployees();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error saving employee:", error);
        this.showToast(`❌ ${error.message}`, "error");
      } finally {
        this.saving = false;
      }
    },

    // Create mobile account (Inspector or Collector)
    async createMobileAccount(employeeData, token, branchId, branchManagerId) {
      const mobileRole = employeeData.mobileRole;
      const endpoint = mobileRole === 'inspector' 
        ? `${this.apiBaseUrl}/mobile-staff/inspectors`
        : `${this.apiBaseUrl}/mobile-staff/collectors`;

      console.log(`📱 Creating ${mobileRole} account...`);

      const payload = {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        phoneNumber: employeeData.phoneNumber,
        branchId: branchId,
        branchManagerId: branchManagerId,
      };

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `Failed to create ${mobileRole}`);
        }

        const data = await response.json();

        if (data.success) {
          const credentials = data.data.credentials;
          const roleName = mobileRole === 'inspector' ? 'Inspector' : 'Collector';
          
          console.log(`✅ ${roleName} created with credentials:`, credentials.username);

          // Send credentials email
          try {
            const employeeName = `${employeeData.firstName} ${employeeData.lastName}`;
            const emailResult = await sendEmployeeCredentialsEmail(
              employeeData.email,
              employeeName,
              credentials.username,
              credentials.password,
              `Mobile ${roleName}`
            );
            
            if (emailResult.success) {
              this.showToast(
                `✅ ${roleName} created! Mobile app credentials sent to ${employeeData.email}`,
                "success"
              );
            } else {
              this.showToast(
                `⚠️ ${roleName} created! Username: ${credentials.username}, Password: ${credentials.password}. (Email failed)`,
                "warning"
              );
            }
          } catch (emailError) {
            this.showToast(
              `⚠️ ${roleName} created! Username: ${credentials.username}, Password: ${credentials.password}. Send manually.`,
              "warning"
            );
          }

          this.closeEmployeeDialog();
          dataCacheService.invalidatePattern('employees');
          dataCacheService.invalidatePattern('mobile-staff');
          dataCacheService.invalidatePattern('inspectors');
          dataCacheService.invalidatePattern('collectors');
          await this.fetchEmployees();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error(`Error creating ${mobileRole}:`, error);
        throw error;
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
          this.showToast("✅ Permissions updated successfully!", "success");
          this.closePermissionsDialog();
          
          // Clear cache and refresh data
          dataCacheService.invalidatePattern('employees');
          await this.fetchEmployees();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error updating permissions:", error);
        this.showToast(
          `❌ Failed to update permissions: ${error.message}`,
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
          this.showToast(`✅ Employee ${action} successfully!`, "success");
          
          // Clear cache and refresh data
          dataCacheService.invalidatePattern('employees');
          await this.fetchEmployees();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error updating employee status:", error);
        this.showToast(`❌ Failed to update status: ${error.message}`, "error");
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
            this.showToast(
              `✅ Password reset successfully! New password: ${newPassword}. Reset notification sent to ${employee.email}`,
              "success"
            );
          } else {
            this.showToast(
              `⚠️ Password reset! New password: ${newPassword}. Warning: Email failed to send - ${emailResult.message}`,
              "warning"
            );
          }
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error resetting password:", error);
        this.showToast(
          `❌ Failed to reset password: ${error.message}`,
          "error"
        );
      }
    },

    // Toast notification helper
    showToast(message, type = 'success') {
      this.toast.show = true;
      this.toast.message = message;
      this.toast.type = type;
    },

    // Utility Methods
    debugSessionStorage() {
      // Security Note: Session storage debugging removed for production safety
      // Use browser dev tools to inspect session storage if needed
      console.log("=== SESSION DEBUG ===");
      console.log("Session keys available:", Object.keys(sessionStorage).length);
      console.log("Auth token:", sessionStorage.getItem("authToken") ? "present" : "missing");
      console.log("User type:", sessionStorage.getItem("userType"));
      console.log("Branch ID present:", !!sessionStorage.getItem("branchId"));
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
    // Opt-in: use table scrolling inside page instead of page scrollbar
    try {
      document.body.classList.add('no-page-scroll')
      document.documentElement.classList.add('no-page-scroll')
      try {
        const prevHtmlOverflow = document.documentElement.style.overflow
        const prevBodyOverflow = document.body.style.overflow
        document.documentElement.dataset._prevOverflow = prevHtmlOverflow || ''
        document.body.dataset._prevOverflow = prevBodyOverflow || ''
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
      } catch (e) {}
    } catch (e) {}
  },
  beforeUnmount() {
    try {
      document.body.classList.remove('no-page-scroll')
      document.documentElement.classList.remove('no-page-scroll')
      try {
        const prevHtml = document.documentElement.dataset._prevOverflow || ''
        const prevBody = document.body.dataset._prevOverflow || ''
        document.documentElement.style.overflow = prevHtml
        document.body.style.overflow = prevBody
        delete document.documentElement.dataset._prevOverflow
        delete document.body.dataset._prevOverflow
      } catch (e) {}
    } catch (e) {}
  },
};
