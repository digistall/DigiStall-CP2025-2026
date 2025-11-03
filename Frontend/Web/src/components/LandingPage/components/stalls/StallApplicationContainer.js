import PersonalInformation from "./apply/PersonalInformation/PersonalInformation.vue";
import SpouseInformation from "./apply/SpouseInformation/SpouseInformation.vue";
import BusinessInformation from "./apply/BusinessInformation/BusinessInformation.vue";
import OtherInformation from "./apply/OtherInformation/OtherInformation.vue";
import ApplicationLoadingOverlay from "../common/ApplicationLoadingOverlay.vue";

export default {
  name: "ApplicationForm",
  components: {
    PersonalInformation,
    SpouseInformation,
    BusinessInformation,
    OtherInformation,
    ApplicationLoadingOverlay,
  },
  props: {
    stall: Object,
    showForm: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["close"],
  data() {
    return {
      currentStep: 1,
      personalInfo: null,
      spouseInfo: null,
      businessInfo: null,
      otherInfo: null,
      isSubmitting: false,
      loadingState: "preparing", // 'preparing', 'submitting', 'success', 'error'
      loadingErrorMessage: "",
      apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
    };
  },
  methods: {
    async testApiConnection() {
      try {
        console.log("Testing API connection...");
        console.log("API Base URL:", this.apiBaseUrl);

        console.log("Testing health endpoint...");
        const healthResponse = await fetch(
          `${this.apiBaseUrl}/health`
        );
        console.log("Health Status:", healthResponse.status);
        const healthData = await healthResponse.text();
        console.log("Health Response:", healthData);

        console.log("Testing GET /api/applicants...");
        const getResponse = await fetch(`${this.apiBaseUrl}/applicants`);
        console.log("GET Applicants Status:", getResponse.status);
        const getData = await getResponse.text();
        console.log("GET Applicants Response:", getData);

        console.log(
          `API Test Results - Health: ${healthResponse.status}, GET Applicants: ${getResponse.status}`
        );
      } catch (error) {
        console.error("API Test Error:", error);
      }
    },

    closeForm() {
      this.resetForm();
      this.$emit("close");
    },

    handlePersonalInfoNext(formData) {
      this.personalInfo = formData;

      if (formData.civilStatus === "Single") {
        this.spouseInfo = null;
        this.currentStep = 3;
      } else {
        this.currentStep = 2;
      }
    },

    handleSpouseInfoNext(spouseData) {
      this.spouseInfo = spouseData;
      this.currentStep = 3;
    },

    handleBusinessInfoNext(businessData) {
      this.businessInfo = businessData;
      this.currentStep = 4;
    },

    async handleOtherInfoNext(otherInfoData) {
      this.otherInfo = otherInfoData;
      this.isSubmitting = true;
      this.loadingState = "preparing";

      try {
        console.log("Starting application submission...");

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const applicationData = await this.prepareApplicationData();
        console.log("Prepared application data:", applicationData);

        this.loadingState = "submitting";
        await new Promise((resolve) => setTimeout(resolve, 800));

        const result = await this.submitApplication(applicationData);
        console.log("Submission result:", result);

        this.loadingState = "success";
        console.log("Application submitted successfully!", result);

        setTimeout(() => {
          this.closeForm();
        }, 3000);
      } catch (error) {
        console.error("Full error object:", error);

        let errorMessage = "Failed to submit application. Please try again.";

        if (error.message.includes("Failed to fetch")) {
          errorMessage =
            "Network error: Cannot connect to server. Please check if the server is running on http://localhost:3001";
        } else if (error.message.includes("HTTP 404")) {
          errorMessage =
            "API endpoint not found (404). Please check server configuration.";
        } else if (error.message.includes("HTTP 500")) {
          errorMessage = "Server error (500). Please check server logs.";
        } else if (error.message.includes("Email address already exists")) {
          errorMessage =
            "This email address is already registered. Please use a different email address or contact support if this is your email.";
        } else if (error.message.includes("HTTP 400")) {
          // Try to extract the actual error message from the response
          try {
            const errorData = JSON.parse(
              error.message.replace("HTTP 400: ", "")
            );
            errorMessage =
              errorData.message ||
              "Invalid application data. Please check all fields.";
          } catch {
            errorMessage = "Invalid application data. Please check all fields.";
          }
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        console.error(`Submission failed: ${errorMessage}`, {
          apiBaseUrl: this.apiBaseUrl,
          error,
        });

        this.loadingState = "error";
        this.loadingErrorMessage = errorMessage;
      }
    },

    async prepareApplicationData() {
      const personal = this.personalInfo;
      const spouse = this.spouseInfo;
      const business = this.businessInfo;
      const other = this.otherInfo;

      const applicationData = {
        // Personal Information - match backend field names
        applicant_full_name: personal.fullName,
        applicant_contact_number: personal.contactNumber,
        applicant_address: personal.mailingAddress,
        applicant_birthdate: personal.birthdate,
        applicant_civil_status: personal.civilStatus,
        applicant_educational_attainment: personal.education,

        // Spouse Information
        spouse_full_name: spouse?.spouseName || null,
        spouse_birthdate: spouse?.spouseBirthdate || null,
        spouse_educational_attainment: spouse?.spouseEducation || null,
        spouse_contact_number: spouse?.spouseContact || null,
        spouse_occupation: spouse?.occupation || null,

        // Business Information
        nature_of_business: business?.natureOfBusiness || "",
        capitalization: business?.businessCapitalization || null,
        source_of_capital: business?.sourceOfCapital || "",
        previous_business_experience: business?.previousBusiness || "",
        relative_stall_owner: business?.applicantRelative || "No",

        // Other Information
        signature_of_applicant: other?.applicantSignature?.name || null,
        house_sketch_location: other?.applicantLocation?.name || null,
        valid_id: other?.applicantValidID?.name || null,
        email_address: other?.emailAddress || "",
      };

      return applicationData;
    },

    async submitApplication(applicationData) {
      console.log("API Base URL:", this.apiBaseUrl);
      console.log("Application Data:", applicationData);

      const stallId = this.stall.stall_id || this.stall.id || this.stall.ID;

      if (!stallId) {
        throw new Error("Stall ID not found in stall object");
      }

      // ✅ NEW APPROACH: Use the atomic endpoint that handles both applicant and application creation
      const completeApplicationData = {
        ...applicationData,
        // Add application-specific fields
        stall_id: stallId,
        application_date: new Date().toISOString().split("T")[0],
      };

      console.log("Complete Application Data:", completeApplicationData);

      // ✅ Single atomic call instead of two separate calls
      const response = await fetch(
        `${this.apiBaseUrl}/landing-applicants/stall-application`, // ✅ Use the new atomic endpoint
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(completeApplicationData),
        }
      );

      console.log("Response Status:", response.status);
      console.log("Response OK:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);

        // Try to parse the error response to get more details
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(
          `HTTP ${response.status}: ${JSON.stringify(errorData)}`
        );
      }

      const result = await response.json();
      console.log("Complete Application Result:", result);

      if (!result.success) {
        throw new Error(result.message || "Failed to submit stall application");
      }

      return {
        applicant: {
          success: true,
          data: {
            applicant_id: result.data.applicant_id,
            applicant_full_name: result.data.applicant_full_name,
            applicant_contact_number: result.data.applicant_contact_number,
          },
        },
        application: {
          success: true,
          data: {
            application_id: result.data.application_id,
            stall_id: result.data.stall_id,
            application_status: result.data.application_status,
          },
        },
      };
    },

    goToPreviousStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },

    retrySubmission() {
      this.loadingState = "preparing";
      this.loadingErrorMessage = "";
      this.handleOtherInfoNext(this.otherInfo);
    },

    resetForm() {
      this.currentStep = 1;
      this.personalInfo = null;
      this.spouseInfo = null;
      this.businessInfo = null;
      this.otherInfo = null;
      this.isSubmitting = false;
      this.loadingState = "preparing";
      this.loadingErrorMessage = "";
    },
  },
};
