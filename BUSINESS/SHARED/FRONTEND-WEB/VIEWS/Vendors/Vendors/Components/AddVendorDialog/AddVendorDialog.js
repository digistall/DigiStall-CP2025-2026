import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/api$/, "");

export default {
  name: "AddVendorDialog",
  data() {
    return {
      activeTab: 0,
      formValid: false,

      // Form fields
      form: {
        lastName: "",
        firstName: "",
        middleName: "",
        suffix: "",
        phone: "",
        email: "",
        birthdate: "",
        gender: "",
        address: "",
        vendorId: "",

        // Spouse Info
        spouseFullName: "",
        spouseAge: null,
        spouseBirthdate: "",
        spouseEducation: "",
        spouseContact: "",
        spouseOccupation: "",

        // Child Info
        childFullName: "",
        childAge: null,
        childBirthdate: "",

        // Business Info
        businessName: "",
        businessType: "",
        businessDescription: "",
        vendStart: "",
        vendEnd: "",

        // Location Info
        assignedLocationId: null,
        locationName: "",
        // used for the autocomplete search
        locationSearch: "",

        assignedCollector: "",
      },

      // Document files
      documents: {
        clearance: null,
        cedula: null,
        association: null,
        votersId: null,
        picture: null,
        healthCard: null,
      },

      // Options
      genderOptions: ["Male", "Female", "Other"],
      collectors: ["John Smith", "Jane Garcia", "Marco Reyes", "Ava Santos"],

      // Assigned location dropdown data
      assignedLocations: [],
      _searchTimeout: null,

      // Validation rules
      emailRules: [
        (v) => !!v || "Email is required",
        (v) => /.+@.+\..+/.test(v) || "Email must be valid",
      ],
    };
  },

  computed: {
    visibleModel() {
      return this.isVisible !== undefined ? this.isVisible : this.modelValue;
    },
  },

  watch: {
    visibleModel(newVal) {
      if (!newVal) {
        this.resetForm();
      } else {
        // when dialog opens, load initial locations list
        this.fetchLocations("");
      }
    },
    "form.locationSearch": function (newVal) {
      // debounce
      clearTimeout(this._searchTimeout);
      this._searchTimeout = setTimeout(() => {
        this.fetchLocations(newVal);
      }, 300);
    },
  },

  methods: {
    closeDialog() {
      this.$emit("update:modelValue", false);
      if (this.isVisible !== undefined) {
        this.$emit("close");
      }
    },

    resetForm() {
      this.$refs.vendorForm?.reset();
      this.activeTab = 0;
      this.formValid = false;
      // clear location fields
      this.form.assignedLocationId = null;
      this.form.locationSearch = "";
      this.assignedLocations = [];
      // Reset documents
      this.documents = {
        clearance: null,
        cedula: null,
        association: null,
        votersId: null,
        picture: null,
        healthCard: null,
      };
    },

    async fetchLocations(query) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/vendors/locations`,
          { params: { search: query } },
        );
        this.assignedLocations = response.data.data || [];
      } catch (err) {
        console.error("Failed to fetch locations", err);
        this.assignedLocations = [];
      }
    },

    save() {
      if (!this.$refs.vendorForm.validate()) {
        return;
      }

      // Derive name from selected id for backwards compatibility
      let selectedName = null;
      if (this.form.assignedLocationId) {
        const loc = this.assignedLocations.find(
          (l) => l.id === this.form.assignedLocationId,
        );
        selectedName = loc ? loc.name : null;
      }

      const payload = {
        // Vendor personal info
        firstName: this.form.firstName,
        lastName: this.form.lastName,
        middleName: this.form.middleName,
        suffix: this.form.suffix,
        contactNumber: this.form.phone,
        email: this.form.email,
        birthdate: this.form.birthdate,
        gender: this.form.gender,
        address: this.form.address,
        vendorIdentifier: this.form.vendorId,
        status: "Active",

        // Spouse info
        spouseFullName: this.form.spouseFullName,
        spouseAge: this.form.spouseAge,
        spouseBirthdate: this.form.spouseBirthdate,
        spouseEducation: this.form.spouseEducation,
        spouseContact: this.form.spouseContact,
        spouseOccupation: this.form.spouseOccupation,

        // Child info
        childFullName: this.form.childFullName,
        childAge: this.form.childAge,
        childBirthdate: this.form.childBirthdate,

        // Business info
        businessName: this.form.businessName,
        businessType: this.form.businessType,
        businessDescription: this.form.businessDescription,
        vendingTimeStart: this.form.vendStart,
        vendingTimeEnd: this.form.vendEnd,

        // Location info
        assignedLocationId: this.form.assignedLocationId,
        locationName: selectedName,
      };

      // Emit to parent to handle the actual API call
      // Parent will handle all feedback (loading, success/error messages, closing)
      this.$emit("save", payload);
    },
  },

  props: {
    modelValue: { type: Boolean, default: false },
    isVisible: { type: Boolean, required: false },
    loading: { type: Boolean, default: false },
  },

  emits: ["update:modelValue", "save", "close"],
};
