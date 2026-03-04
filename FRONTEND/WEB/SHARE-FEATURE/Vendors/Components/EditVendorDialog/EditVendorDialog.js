import { computed, reactive, watch, ref } from "vue";
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/api$/, "");

/**
 * Convert any date value (Date object, ISO string, etc.) to YYYY-MM-DD
 * for HTML <input type="date"> compatibility.
 * Uses local timezone to preserve the calendar date.
 */
function formatDate(val) {
  if (!val) return "";
  const s = String(val).trim();
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/**
 * Normalize a time value (e.g. "09:00:00") to HH:MM for HTML <input type="time">.
 */
function formatTime(val) {
  if (!val) return "";
  const s = String(val).trim();
  // Match HH:MM or HH:MM:SS and return HH:MM
  const m = s.match(/^(\d{2}:\d{2})/);
  return m ? m[1] : s;
}

export default {
  setup(props, { emit }) {
    // Support both v-model (modelValue) and :isVisible + @close API
    const visible = computed({
      get: () =>
        props.isVisible === undefined ? props.modelValue : props.isVisible,
      set: (v) => {
        emit("update:modelValue", v);
        if (props.isVisible !== undefined && !v) emit("close");
      },
    });

    // Replace step with activeTab for tabs navigation
    const activeTab = ref(0);
    const formValid = ref(false);
    const genderOptions = ["Male", "Female", "Other"];
    const emailRules = [
      (v) => !!v || "Email is required",
      (v) => /.+@.+\..+/.test(v) || "Email must be valid",
    ];

    // initialize form from props.data (keep File objects)
    const form = reactive(makeInitialForm(props.data));

    // list for dropdown
    const assignedLocations = ref([]);
    const locationSearch = ref("");

    watch(
      () => props.data,
      (val) => {
        Object.assign(form, makeInitialForm(val));
        activeTab.value = 0;
        // reload locations in case record has id
        fetchLocations("");
      },
      { deep: true },
    );

    watch(visible, (val) => {
      if (val) {
        fetchLocations("");
      }
    });

    watch(locationSearch, (newVal) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => fetchLocations(newVal), 300);
    });

    let searchTimeout;

    function makeInitialForm(src) {
      // shallow copy is enough for primitives + File refs
      const f = {
        assignedLocationId: null,
        locationSearch: "",
        // Vendor personal info
        lastName: "",
        firstName: "",
        middleName: "",
        suffix: "",
        birthdate: "",
        gender: "Male",
        phone: "",
        email: "",
        vendorId: "",
        address: "",

        // Spouse info
        spouseFullName: "",
        spouseAge: null,
        spouseBirthdate: "",
        spouseEducation: "",
        spouseContact: "",
        spouseOccupation: "",

        // Child info
        childFullName: "",
        childAge: null,
        childBirthdate: "",

        // Business info
        businessName: "",
        businessType: "",
        businessDescription: "",
        vendStart: "",
        vendEnd: "",

        // Location info
        locationName: "",

        // files
        files: {
          clearance: null,
          votersId: null,
          cedula: null,
          picture: null,
          association: null,
          healthcard: null,
        },
      };
      // merge incoming data if present
      if (src && typeof src === "object") {
        // Map database fields to form fields
        f.firstName = src.first_name || src.firstName || "";
        f.lastName = src.last_name || src.lastName || "";
        f.middleName = src.middle_name || src.middleName || "";
        f.suffix = src.suffix || "";
        f.birthdate = formatDate(src.birthdate);
        f.gender = src.gender || "Male";
        f.phone = src.contact_number || src.phone || "";
        f.email = src.email || "";
        f.vendorId =
          src.vendor_identifier || src.vendorId || src.vendor_id || "";
        f.address = src.address || "";

        // Spouse fields from database
        f.spouseFullName = src.spouse_full_name || src.spouseFullName || "";
        f.spouseAge = src.spouse_age || src.spouseAge || null;
        f.spouseBirthdate = formatDate(src.spouse_birthdate || src.spouseBirthdate);
        f.spouseEducation = src.spouse_education || src.spouseEducation || "";
        f.spouseContact = src.spouse_contact || src.spouseContact || "";
        f.spouseOccupation =
          src.spouse_occupation || src.spouseOccupation || "";

        // Child fields from database
        f.childFullName = src.child_full_name || src.childFullName || "";
        f.childAge = src.child_age || src.childAge || null;
        f.childBirthdate = formatDate(src.child_birthdate || src.childBirthdate);

        // Business fields from database
        f.businessName = src.business_name || src.businessName || "";
        f.businessType = src.business_type || src.businessType || "";
        f.businessDescription =
          src.business_description ||
          src.productsSold ||
          src.businessDescription ||
          "";
        f.vendStart = formatTime(src.vending_time_start || src.vendStart);
        f.vendEnd = formatTime(src.vending_time_end || src.vendEnd);

        // Location field from database
        f.locationName = src.location_name || src.locationName || "";
        f.assignedLocationId =
          src.assigned_location_id || src.assignedLocationId || null;

        f.files = { ...f.files, ...(src.files || {}) };
      }
      return f;
    }

    async function fetchLocations(query) {
      try {
        const resp = await axios.get(`${API_BASE_URL}/api/vendors/locations`, {
          params: { search: query },
        });
        assignedLocations.value = resp.data.data || [];
      } catch (error) {
        console.error("Failed to load locations", error);
        assignedLocations.value = [];
      }
    }

    function submit() {
      // derive name from id for backwards compatibility
      let selectedName = null;
      if (form.assignedLocationId) {
        const loc = assignedLocations.value.find(
          (l) => l.id === form.assignedLocationId,
        );
        selectedName = loc ? loc.name : null;
      }

      // return complete payload with all relations
      const payload = {
        // Vendor personal info
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName,
        suffix: form.suffix,
        contactNumber: form.phone,
        email: form.email,
        birthdate: form.birthdate,
        gender: form.gender,
        address: form.address,
        vendorIdentifier: form.vendorId,
        status: form.status || "Active",

        // Spouse info
        spouseFullName: form.spouseFullName,
        spouseAge: form.spouseAge,
        spouseBirthdate: form.spouseBirthdate,
        spouseEducation: form.spouseEducation,
        spouseContact: form.spouseContact,
        spouseOccupation: form.spouseOccupation,

        // Child info
        childFullName: form.childFullName,
        childAge: form.childAge,
        childBirthdate: form.childBirthdate,

        // Business info
        businessName: form.businessName,
        businessType: form.businessType,
        businessDescription: form.businessDescription,
        vendingTimeStart: form.vendStart,
        vendingTimeEnd: form.vendEnd,

        // Location info
        assignedLocationId: form.assignedLocationId,
        locationName: selectedName,
      };
      emit("update", payload);
      visible.value = false;
    }

    function cancel() {
      visible.value = false;
      activeTab.value = 0;
    }

    return {
      model: visible,
      activeTab,
      formValid,
      genderOptions,
      emailRules,
      form,
      submit,
      cancel,
      assignedLocations,
      locationSearch,
      fetchLocations,
      loading: computed(() => props.loading),
    };
  },
  props: {
    modelValue: { type: Boolean, default: false },
    isVisible: { type: Boolean, required: false },
    /** pass the full vendor payload (what you stored in item.raw) */
    data: { type: Object, default: () => ({}) },
    loading: { type: Boolean, default: false },
  },
  emits: ["update:modelValue", "update", "close"],
};
