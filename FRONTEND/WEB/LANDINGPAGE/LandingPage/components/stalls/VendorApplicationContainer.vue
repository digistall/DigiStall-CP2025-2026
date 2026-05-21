<template>
  <Teleport to="body">
    <!-- Enhanced Loading Overlay -->
    <ApplicationLoadingOverlay
      v-if="showForm && isSubmitting"
      :state="loadingState"
      :error-message="loadingErrorMessage"
      success-title="Vendor Application Submitted"
      success-message="Your vendor application has been submitted successfully."
      success-detail="We will review your application and email you once it is approved."
      @retry="retrySubmission"
    />

    <!-- Step 0: Disclaimer Modal -->
    <Transition name="disclaimer-fade">
      <div v-if="showForm && currentStep === 0 && !isSubmitting" class="disclaimer-overlay">
        <div class="disclaimer-modal">
          <h3 class="disclaimer-modal-title">Before You Begin</h3>
          <p class="disclaimer-modal-subtitle">Vendor Application — Required Information</p>

          <p class="disclaimer-modal-intro">
            To complete your vendor application, you will be asked to provide the following
            information. Please have them ready before proceeding:
          </p>

          <ul class="disclaimer-list">
            <li>
              <div class="disclaimer-list-bullet">1</div>
              <div>
                <strong>Personal Information</strong>
                <small>Full name, birthdate, gender, civil status, contact number, email, and address</small>
              </div>
            </li>
            <li>
              <div class="disclaimer-list-bullet">2</div>
              <div>
                <strong>Business Information</strong>
                <small>Business name, type, description, and products/services offered</small>
              </div>
            </li>
            <li>
              <div class="disclaimer-list-bullet">3</div>
              <div>
                <strong>Email Address</strong>
                <small>Your login credentials will be sent here upon approval</small>
              </div>
            </li>
          </ul>

          <div class="disclaimer-notice">
            <p>Please ensure all information is accurate. Incomplete or inaccurate submissions may delay the processing of your application.</p>
          </div>

          <label class="disclaimer-checkbox-row">
            <input type="checkbox" v-model="disclaimerAcknowledged" />
            <span>I have read and understood the requirements above, and I confirm that I am ready to proceed with my application.</span>
          </label>

          <div class="disclaimer-actions">
            <button type="button" class="btn-close" @click="closeForm">Close</button>
            <button
              type="button"
              class="btn-next"
              :disabled="!disclaimerAcknowledged"
              :class="{ 'btn-next-disabled': !disclaimerAcknowledged }"
              @click="currentStep = 1"
            >
              I Understand, Proceed
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Step 1: Personal Information -->
    <div v-if="showForm && currentStep === 1 && !isSubmitting" class="overlay">
      <div class="form-container">
        <!-- Step Indicator -->
        <div class="step-indicator">
          <div class="step-dot" :class="{ active: currentStep === 1, completed: currentStep > 1 }">1</div>
          <div class="step-dot" :class="{ active: currentStep === 2, completed: currentStep > 2 }">2</div>
        </div>

        <h3>Personal Information</h3>
        <p>Provide your personal details. All fields marked with * are required.</p>

        <!-- Error Message Display -->
        <div v-if="errorMessage" class="error-message-box">
          <span class="error-text">{{ errorMessage }}</span>
        </div>

        <form @submit.prevent>
          <div class="field-grid-2col">
            <label>
              <span>First Name<span class="required-mark">*</span></span>
              <input
                type="text"
                v-model="form.first_name"
                :class="{ 'input-error': errors.first_name }"
                placeholder="Enter first name"
              />
            </label>

            <label>
              Middle Name
              <input
                type="text"
                v-model="form.middle_name"
                placeholder="Middle name (optional)"
              />
            </label>

            <label>
              <span>Last Name<span class="required-mark">*</span></span>
              <input
                type="text"
                v-model="form.last_name"
                :class="{ 'input-error': errors.last_name }"
                placeholder="Enter last name"
              />
            </label>

            <label>
              Suffix
              <input
                type="text"
                v-model="form.suffix"
                placeholder="e.g., Jr., III (optional)"
              />
            </label>

            <label>
              <span>Contact Number<span class="required-mark">*</span></span>
              <input
                type="tel"
                v-model="form.contact_number"
                :class="{ 'input-error': errors.contact_number }"
                placeholder="09XXXXXXXXX"
              />
              <small class="input-hint">Valid phone number (7 to 15 digits).</small>
            </label>

            <label>
              <span>Email Address<span class="required-mark">*</span></span>
              <input
                type="email"
                v-model="form.email"
                :class="{ 'input-error': errors.email }"
                placeholder="example@email.com"
              />
              <small class="input-hint">Credentials will be sent here upon approval.</small>
            </label>

            <label>
              <span>Date of Birth<span class="required-mark">*</span></span>
              <input
                type="date"
                v-model="form.birthdate"
                :class="{ 'input-error': errors.birthdate }"
              />
              <span v-if="calculatedAge !== null" class="age-display" :class="{ 'age-error': calculatedAge < 18 }">
                Age: {{ calculatedAge }} years old
              </span>
            </label>

            <label>
              <span>Gender<span class="required-mark">*</span></span>
              <select v-model="form.gender" :class="{ 'input-error': errors.gender }">
                <option disabled value="">Select gender</option>
                <option v-for="option in genderOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>

            <label>
              <span>Civil Status<span class="required-mark">*</span></span>
              <select v-model="form.civil_status" :class="{ 'input-error': errors.civil_status }">
                <option disabled value="">Select civil status</option>
                <option v-for="option in civilStatusOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>

            <label>
              <span>Address<span class="required-mark">*</span></span>
              <input
                type="text"
                v-model="form.address"
                :class="{ 'input-error': errors.address }"
                placeholder="Enter complete address"
              />
            </label>
          </div>

          <div class="buttons">
            <button type="button" class="btn-close" @click="goToPreviousStep">Back</button>
            <button type="button" class="btn-next" @click="goToStep2">Next</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Step 2: Business Information -->
    <div v-if="showForm && currentStep === 2 && !isSubmitting" class="overlay">
      <div class="form-container">
        <!-- Step Indicator -->
        <div class="step-indicator">
          <div class="step-dot completed">1</div>
          <div class="step-dot active">2</div>
        </div>

        <h3>Business Information</h3>
        <p>Provide details about your business. All fields marked with * are required.</p>

        <!-- Error Message Display -->
        <div v-if="errorMessage" class="error-message-box">
          <span class="error-text">{{ errorMessage }}</span>
        </div>

        <form @submit.prevent>
          <div class="field-grid-2col">
            <label>
              <span>Business Name<span class="required-mark">*</span></span>
              <input
                type="text"
                v-model="form.business_name"
                :class="{ 'input-error': errors.business_name }"
                placeholder="Enter business name"
              />
            </label>

            <label>
              <span>Business Type<span class="required-mark">*</span></span>
              <input
                type="text"
                v-model="form.business_type"
                :class="{ 'input-error': errors.business_type }"
                placeholder="e.g., Food, Retail, Services"
              />
            </label>
          </div>

          <label>
            <span>Business Description<span class="required-mark">*</span></span>
            <textarea
              v-model="form.business_description"
              :class="{ 'input-error': errors.business_description }"
              placeholder="Describe your business"
            ></textarea>
          </label>

          <label>
            <span>Products / Services<span class="required-mark">*</span></span>
            <textarea
              v-model="form.products"
              :class="{ 'input-error': errors.products }"
              placeholder="List the products or services you offer"
            ></textarea>
          </label>

          <div class="buttons">
            <button type="button" class="btn-close" @click="goToPreviousStep">Back</button>
            <button type="button" class="btn-next" @click="submitForm">Submit Application</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script>
import ApplicationLoadingOverlay from '../common/ApplicationLoadingOverlay.vue'

export default {
  name: 'VendorApplicationContainer',
  components: {
    ApplicationLoadingOverlay,
  },
  props: {
    showForm: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      currentStep: 0,
      disclaimerAcknowledged: false,
      form: {
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        contact_number: '',
        email: '',
        birthdate: '',
        gender: '',
        address: '',
        civil_status: '',
        business_name: '',
        business_type: '',
        business_description: '',
        products: '',
      },
      errors: {
        first_name: false,
        last_name: false,
        contact_number: false,
        email: false,
        birthdate: false,
        gender: false,
        address: false,
        civil_status: false,
        business_name: false,
        business_type: false,
        business_description: false,
        products: false,
      },
      errorMessage: '',
      isSubmitting: false,
      loadingState: 'preparing',
      loadingErrorMessage: '',
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      genderOptions: ['Male', 'Female', 'Other'],
      civilStatusOptions: ['Single', 'Married', 'Widowed', 'Separated'],
    }
  },
  computed: {
    calculatedAge() {
      if (!this.form.birthdate) return null
      const today = new Date()
      const birthDate = new Date(this.form.birthdate)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    },
  },
  watch: {
    showForm(value) {
      if (value) {
        this.resetForm()
      }
    },
  },
  methods: {
    resetForm() {
      this.currentStep = 0
      this.disclaimerAcknowledged = false
      this.form = {
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        contact_number: '',
        email: '',
        birthdate: '',
        gender: '',
        address: '',
        civil_status: '',
        business_name: '',
        business_type: '',
        business_description: '',
        products: '',
      }
      this.clearErrors()
      this.isSubmitting = false
      this.loadingState = 'preparing'
      this.loadingErrorMessage = ''
    },
    clearErrors() {
      this.errorMessage = ''
      this.errors = {
        first_name: false,
        last_name: false,
        contact_number: false,
        email: false,
        birthdate: false,
        gender: false,
        address: false,
        civil_status: false,
        business_name: false,
        business_type: false,
        business_description: false,
        products: false,
      }
    },
    showError(message, fields = []) {
      this.errorMessage = message
      fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(this.errors, field)) {
          this.errors[field] = true
        }
      })
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        this.errorMessage = ''
      }, 5000)
    },
    goToPreviousStep() {
      if (this.currentStep > 0) {
        this.clearErrors()
        this.currentStep--
      }
    },
    goToStep2() {
      this.clearErrors()

      // Validate step 1 fields
      const step1Fields = [
        'first_name',
        'last_name',
        'contact_number',
        'email',
        'birthdate',
        'gender',
        'address',
        'civil_status',
      ]

      const missingFields = step1Fields.filter(
        (field) => !String(this.form[field] || '').trim(),
      )

      if (missingFields.length) {
        this.showError('Please fill in all required fields.', missingFields)
        return
      }

      if (!/\S+@\S+\.\S+/.test(this.form.email)) {
        this.showError('Please enter a valid email address.', ['email'])
        return
      }

      const contactDigits = String(this.form.contact_number || '').replace(/[^0-9]/g, '')
      if (contactDigits.length < 7 || contactDigits.length > 15) {
        this.showError('Please enter a valid contact number.', ['contact_number'])
        return
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(this.form.birthdate)) {
        this.showError('Birthdate must use YYYY-MM-DD format.', ['birthdate'])
        return
      }

      if (this.calculatedAge < 18) {
        this.showError('Applicant must be at least 18 years old.', ['birthdate'])
        return
      }

      this.currentStep = 2
    },
    closeForm() {
      this.resetForm()
      this.$emit('close')
    },
    retrySubmission() {
      this.isSubmitting = false
      this.loadingState = 'preparing'
      this.loadingErrorMessage = ''
    },
    async submitForm() {
      this.clearErrors()

      // Validate step 2 fields
      const step2Fields = [
        'business_name',
        'business_type',
        'business_description',
        'products',
      ]

      const missingFields = step2Fields.filter(
        (field) => !String(this.form[field] || '').trim(),
      )

      if (missingFields.length) {
        this.showError('Please fill in all required fields.', missingFields)
        return
      }

      this.isSubmitting = true
      this.loadingState = 'preparing'
      this.loadingErrorMessage = ''

      try {
        await new Promise((resolve) => setTimeout(resolve, 600))
        this.loadingState = 'submitting'

        const payload = {
          first_name: this.form.first_name.trim(),
          middle_name: this.form.middle_name.trim(),
          last_name: this.form.last_name.trim(),
          suffix: this.form.suffix.trim(),
          contact_number: this.form.contact_number.trim(),
          email: this.form.email.trim(),
          birthdate: this.form.birthdate.trim(),
          gender: this.form.gender,
          address: this.form.address.trim(),
          civil_status: this.form.civil_status,
          business_name: this.form.business_name.trim(),
          business_type: this.form.business_type.trim(),
          business_description: this.form.business_description.trim(),
          products: this.form.products.trim(),
        }

        const response = await fetch(
          `${this.apiBaseUrl}/public/vendor-applications/submit`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        )

        const data = await response.json().catch(() => ({}))

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Vendor application submission failed.')
        }

        this.loadingState = 'success'

        setTimeout(() => {
          this.closeForm()
        }, 4500)
      } catch (error) {
        this.loadingState = 'error'
        this.loadingErrorMessage = error.message || 'Failed to submit vendor application.'
      }
    },
  },
}
</script>

<style scoped>
@import '@/assets/LandingPage/css/applicationformstyle.css';

.required-mark {
  color: #dc3545;
  margin-left: 2px;
}

/* Side-by-side field rows */
.field-row {
  display: flex;
  gap: 14px;
  width: 100%;
  align-items: flex-start;
}

.field-col {
  flex: 1 1 0;
  min-width: 0;
}

/* 2-column grid layout — ensures perfect vertical alignment */
.field-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 14px;
  align-items: start;
}

@media (max-width: 580px) {
  .field-row {
    flex-direction: column;
    gap: 14px;
  }

  .field-grid-2col {
    grid-template-columns: 1fr;
  }
}

/* Disclaimer Modal — matches StallApplicationContainer */
.disclaimer-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  padding: 20px;
}

.disclaimer-modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px 24px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: disclaimerSlideUp 0.35s ease-out;
}

@keyframes disclaimerSlideUp {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.disclaimer-modal-title {
  margin: 0;
  font-size: clamp(18px, 4vw, 22px);
  font-weight: 700;
  color: #002B5B;
  text-align: center;
}

.disclaimer-modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #666;
  text-align: center;
  font-weight: 500;
}

.disclaimer-modal-intro {
  margin: 0;
  font-size: 14px;
  color: #444;
  line-height: 1.5;
}

.disclaimer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.disclaimer-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f0f4ff;
  border: 1px solid #d0dbf0;
  border-radius: 10px;
  padding: 11px 14px;
}

.disclaimer-list-bullet {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: #002B5B;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.disclaimer-list li > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.disclaimer-list li strong {
  font-size: 14px;
  color: #002B5B;
}

.disclaimer-list li small {
  font-size: 12px;
  color: #666;
  font-weight: 400;
}

.disclaimer-notice {
  display: flex;
  align-items: flex-start;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-left: 4px solid #f59e0b;
  border-radius: 10px;
  padding: 11px 14px;
}

.disclaimer-notice > p {
  margin: 0;
  font-size: 13px;
  color: #7a5c00;
  line-height: 1.5;
}

.disclaimer-checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  padding: 12px 14px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  transition: border-color 0.2s, background 0.2s;
  font-weight: normal;
  flex-direction: row;
}

.disclaimer-checkbox-row:has(input:checked) {
  background: #eefaf2;
  border-color: #28a745;
}

.disclaimer-checkbox-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-top: 2px;
  accent-color: #002B5B;
  cursor: pointer;
}

.disclaimer-checkbox-row > span {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
}

.disclaimer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.btn-next-disabled {
  background-color: #a0aec0 !important;
  box-shadow: none !important;
  cursor: not-allowed !important;
  opacity: 0.7;
}

.btn-next-disabled:hover {
  background-color: #a0aec0 !important;
  transform: none !important;
  box-shadow: none !important;
}

/* Transition */
.disclaimer-fade-enter-active,
.disclaimer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.disclaimer-fade-enter-from,
.disclaimer-fade-leave-to {
  opacity: 0;
}
</style>


