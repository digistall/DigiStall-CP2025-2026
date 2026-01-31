import axios from "axios";
import emailjs from '@emailjs/browser';

// EmailJS Configuration - reusing the same service as applicants
const EMAILJS_SERVICE_ID = 'service_e2awvdk';
const EMAILJS_APPROVE_TEMPLATE_ID = 'template_r6kxcnh';
const EMAILJS_PUBLIC_KEY = 'sTpDE-Oq2-9XH_UZd';
const SENDER_EMAIL = 'requiem121701@gmail.com';
const SENDER_NAME = 'Naga Stall Management System';

let isInitialized = false;

// Initialize EmailJS
const initializeEmailJS = () => {
  if (!isInitialized) {
    try {
      emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY,
        blockHeadless: false,
        blockList: { list: [] },
        limitRate: { id: 'app', throttle: 5000 }
      });
      isInitialized = true;
      console.log('✅ EmailJS initialized successfully for branch managers');
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error);
      emailjs.init(EMAILJS_PUBLIC_KEY);
      isInitialized = true;
    }
  }
};

// Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Ensure API_BASE_URL includes /api
const API_BASE_URL_WITH_API = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export default {
  name: "AssignManagerDialog",
  emits: ["update:modelValue", "manager-assigned"],
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    branch: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      valid: false,
      loading: false,
      showPassword: false,
      errorMessage: "",
      successMessage: "",
      formData: {
        first_name: "",
        last_name: "",
        email: "",
        contact_number: "",
        status: "Active",
      },
      statusOptions: [
        { title: "Active", value: "Active" },
        { title: "Inactive", value: "Inactive" },
      ],
      rules: {
        required: (value) => !!value || "This field is required",
        minLength: (value) =>
          !value || value.length >= 6 || "Password must be at least 6 characters",
        email: (value) => {
          if (!value) return true;
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return pattern.test(value) || "Enter a valid email address";
        },
      },
    };
  },
  computed: {
    dialog: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  watch: {
    dialog(newVal) {
      if (newVal) {
        this.resetForm();
      }
    },
  },
  methods: {
    resetForm() {
      this.formData = {
        first_name: "",
        last_name: "",
        email: "",
        contact_number: "",
        status: "Active",
      };
      this.errorMessage = "";
      this.successMessage = "";
      this.showPassword = false;

      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }
    },

    closeDialog() {
      this.dialog = false;
    },

    async assignManager() {
      console.log("🚀 Starting manager assignment process...");

      // Validate form
      const { valid } = await this.$refs.form.validate();
      if (!valid) {
        console.log("❌ Form validation failed");
        this.errorMessage = "Please fill in all required fields correctly.";
        return;
      }

      // Clear previous messages
      this.errorMessage = "";
      this.successMessage = "";
      this.loading = true;

      try {
        console.log("📤 Sending request with payload:", {
          ...this.formData,
          branch_id: this.branch.branch_id,
          manager_password: "[HIDDEN]",
        });

        const payload = {
          ...this.formData,
          branch_id: this.branch.branch_id,
        };

        const authToken = sessionStorage.getItem("authToken");
        if (!authToken) {
          throw new Error("No authentication token found. Please log in again.");
        }

        const response = await axios.post(
          `${API_BASE_URL_WITH_API}/branches/managers`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10 second timeout
          }
        );

        console.log("✅ Server response:", response.data);

        if (response.data && response.data.success) {
          // Get credentials from response
          const credentials = response.data.data?.credentials || {};
          const managerName = `${this.formData.first_name} ${this.formData.last_name}`;
          
          // Send email with credentials using EmailJS
          try {
            initializeEmailJS();
            
            const templateParams = {
              from_name: SENDER_NAME,
              from_email: SENDER_EMAIL,
              to_email: this.formData.email,
              to_name: managerName,
              subject: '[Naga Stall Management] Welcome - Branch Manager Access',
              message: `Hello ${managerName},

Welcome to Naga Stall Management System!

You have been assigned as the Branch Manager for: ${this.branch.branch_name}

Your login credentials are:
Username (Email): ${credentials.username || this.formData.email}
Password: ${credentials.password || '[Contact Administrator]'}

Login URL: http://localhost:3000/manager/login

Please keep these credentials secure and change your password after first login.

For any assistance, please contact the System Administrator.

Best regards,
Naga Stall Management Team`,
              reply_to: SENDER_EMAIL,
              stall_username: credentials.username || this.formData.email,
              stall_password: credentials.password || '[Contact Administrator]'
            };

            const emailResult = await emailjs.send(
              EMAILJS_SERVICE_ID,
              EMAILJS_APPROVE_TEMPLATE_ID,
              templateParams,
              { publicKey: EMAILJS_PUBLIC_KEY }
            );

            console.log('✅ Welcome email sent successfully to:', this.formData.email);
            this.successMessage = `Manager assigned successfully! Credentials sent to ${this.formData.email}`;
          } catch (emailError) {
            console.error('⚠️ Email sending failed:', emailError);
            this.successMessage = response.data.message + ' (Email notification failed - please share credentials manually)';
          }

          // Update branch with manager info
          const updatedBranch = {
            ...this.branch,
            manager_name: managerName,
            manager_assigned: true,
          };

          // Emit success event
          this.$emit("manager-assigned", updatedBranch);

          // Close dialog after a brief delay to show success message
          setTimeout(() => {
            this.closeDialog();
          }, 2000);
        } else {
          throw new Error(response.data?.message || "Unexpected response format");
        }
      } catch (error) {
        console.error("❌ Error assigning manager:", error);

        let errorMsg = "Failed to assign manager. ";

        if (error.response) {
          // Server responded with error status
          console.error("Server error response:", error.response.data);
          errorMsg +=
            error.response.data?.message || `Server error (${error.response.status})`;
        } else if (error.request) {
          // Request was made but no response received
          console.error("Network error:", error.request);
          errorMsg += "Network error. Please check your connection.";
        } else if (error.code === "ECONNABORTED") {
          // Request timeout
          errorMsg += "Request timeout. Please try again.";
        } else {
          // Other errors
          errorMsg += error.message;
        }

        this.errorMessage = errorMsg;
      } finally {
        this.loading = false;
      }
    },
  },
};
