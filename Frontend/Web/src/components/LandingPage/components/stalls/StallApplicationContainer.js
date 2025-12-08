import PersonalInformation from './apply/PersonalInformation/PersonalInformation.vue'
import SpouseInformation from './apply/SpouseInformation/SpouseInformation.vue'
import BusinessInformation from './apply/BusinessInformation/BusinessInformation.vue'
import OtherInformation from './apply/OtherInformation/OtherInformation.vue'
import ApplicationLoadingOverlay from '../common/ApplicationLoadingOverlay.vue'

export default {
  name: 'ApplicationForm',
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
  emits: ['close'],
  data() {
    return {
      currentStep: 1,
      personalInfo: null,
      spouseInfo: null,
      businessInfo: null,
      otherInfo: null,
      isSubmitting: false,
      loadingState: 'preparing',
      loadingErrorMessage: '',
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    }
  },
  methods: {
    async testApiConnection() {
      try {
        console.log('Testing API connection...')
        console.log('API Base URL:', this.apiBaseUrl)

        console.log('Testing health endpoint...')
        const healthResponse = await fetch(`${this.apiBaseUrl}/health`)
        console.log('Health Status:', healthResponse.status)
        const healthData = await healthResponse.text()
        console.log('Health Response:', healthData)

        console.log('Testing GET /api/applicants...')
        const getResponse = await fetch(`${this.apiBaseUrl}/applicants`)
        console.log('GET Applicants Status:', getResponse.status)
        const getData = await getResponse.text()
        console.log('GET Applicants Response:', getData)

        console.log(
          `API Test Results - Health: ${healthResponse.status}, GET Applicants: ${getResponse.status}`,
        )
      } catch (error) {
        console.error('API Test Error:', error)
      }
    },

    closeForm() {
      this.resetForm()
      this.$emit('close')
    },

    handlePersonalInfoNext(formData) {
      console.log('✅ Step 1 Complete - Personal Information:', formData)
      this.personalInfo = formData

      if (formData.civilStatus === 'Single') {
        console.log('👤 Civil Status: Single - Skipping spouse information')
        this.spouseInfo = null
        this.currentStep = 3
      } else {
        console.log('👥 Civil Status: Not Single - Proceeding to spouse information')
        this.currentStep = 2
      }
    },

    handleSpouseInfoNext(spouseData) {
      console.log('✅ Step 2 Complete - Spouse Information:', spouseData)
      this.spouseInfo = spouseData
      this.currentStep = 3
    },

    handleBusinessInfoNext(businessData) {
      console.log('✅ Step 3 Complete - Business Information:', businessData)
      this.businessInfo = businessData
      this.currentStep = 4
    },

    async handleOtherInfoNext(otherInfoData) {
      console.log('✅ Step 4 Complete - Other Information:', otherInfoData)
      this.otherInfo = otherInfoData
      this.isSubmitting = true
      this.loadingState = 'preparing'

      try {
        console.log('📤 Starting application submission...')
        console.log('🏢 Stall Details:', {
          stall_id: this.stall.stall_id || this.stall.id || this.stall.ID,
          stall_code: this.stall.stall_code,
          price_type: this.stall.price_type,
        })

        await new Promise((resolve) => setTimeout(resolve, 1500))

        const applicationData = await this.prepareApplicationData()
        console.log('📋 Prepared application data:', applicationData)

        this.loadingState = 'submitting'
        console.log('⏳ Submitting to backend...')
        await new Promise((resolve) => setTimeout(resolve, 800))

        const result = await this.submitApplication(applicationData)
        console.log('✅ Submission result:', result)

        this.loadingState = 'success'
        console.log('🎉 Application submitted successfully!', result)

        setTimeout(() => {
          this.closeForm()
        }, 3000)
      } catch (error) {
        console.error('Full error object:', error)

        let errorMessage = 'Failed to submit application. Please try again.'

        if (error.message.includes('Failed to fetch')) {
          errorMessage =
            'Network error: Cannot connect to server. Please check if the server is running on http://localhost:3001'
        } else if (error.message.includes('HTTP 404')) {
          errorMessage = 'API endpoint not found (404). Please check server configuration.'
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'Server error (500). Please check server logs.'
        } else if (error.message.includes('Email address already exists')) {
          errorMessage =
            'This email address is already registered. Please use a different email address or contact support if this is your email.'
        } else if (error.message.includes('HTTP 400')) {
          try {
            const errorData = JSON.parse(error.message.replace('HTTP 400: ', ''))
            errorMessage = errorData.message || 'Invalid application data. Please check all fields.'
          } catch {
            errorMessage = 'Invalid application data. Please check all fields.'
          }
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }

        console.error(`Submission failed: ${errorMessage}`, {
          apiBaseUrl: this.apiBaseUrl,
          error,
        })

        this.loadingState = 'error'
        this.loadingErrorMessage = errorMessage
      }
    },

    async prepareApplicationData() {
      const personal = this.personalInfo || {}
      const spouse = this.spouseInfo || {}
      const business = this.businessInfo || {}
      const other = this.otherInfo || {}

      // FIXED: Better helper function that ALWAYS returns a valid value (never undefined)
      const toNull = (value) => {
        // Check for undefined, null, empty string, or just whitespace
        if (value === undefined || value === null || value === '' || 
            (typeof value === 'string' && value.trim() === '')) {
          return null
        }
        return value
      }

      // FIXED: Safe getter for nested properties
      const safeGet = (obj, path, defaultValue = null) => {
        try {
          const keys = path.split('.')
          let current = obj
          
          for (const key of keys) {
            if (current === null || current === undefined) {
              return defaultValue
            }
            current = current[key]
          }
          
          return toNull(current) || defaultValue
        } catch {
          return defaultValue
        }
      }

      const applicationData = {
        // Personal Information - REQUIRED fields should not be null
        applicant_full_name: toNull(personal.fullName) || '',
        applicant_contact_number: toNull(personal.contactNumber) || '',
        applicant_address: toNull(personal.mailingAddress),
        applicant_birthdate: toNull(personal.birthdate),
        applicant_civil_status: toNull(personal.civilStatus) || 'Single',
        applicant_educational_attainment: toNull(personal.education),

        // Spouse Information - all optional
        spouse_full_name: toNull(spouse.spouseName),
        spouse_birthdate: toNull(spouse.spouseBirthdate),
        spouse_educational_attainment: toNull(spouse.spouseEducation),
        spouse_contact_number: toNull(spouse.spouseContact),
        spouse_occupation: toNull(spouse.occupation),

        // Business Information
        nature_of_business: toNull(business.natureOfBusiness),
        capitalization: toNull(business.businessCapitalization),
        source_of_capital: toNull(business.sourceOfCapital),
        previous_business_experience: toNull(business.previousBusiness),
        relative_stall_owner: toNull(business.applicantRelative) || 'No',

        // Other Information
        signature_of_applicant: safeGet(other, 'applicantSignature.name'),
        house_sketch_location: safeGet(other, 'applicantLocation.name'),
        valid_id: safeGet(other, 'applicantValidID.name'),
        email_address: toNull(other.emailAddress) || '',
      }

      // CRITICAL: Final safety check - convert ANY remaining undefined to null
      Object.keys(applicationData).forEach(key => {
        if (applicationData[key] === undefined) {
          console.warn(`⚠️ Found undefined value for ${key}, converting to null`)
          applicationData[key] = null
        }
      })

      // Validate that we have no undefined values
      const hasUndefined = Object.values(applicationData).some(v => v === undefined)
      if (hasUndefined) {
        console.error('❌ CRITICAL: Application data still contains undefined values!')
        console.error('Application Data:', applicationData)
        throw new Error('Invalid data preparation: undefined values detected')
      }

      console.log('✅ Prepared Application Data (validated - no undefined):', applicationData)
      return applicationData
    },

    async submitApplication(applicationData) {
      console.log('API Base URL:', this.apiBaseUrl)
      console.log('Application Data:', applicationData)

      const stallId = this.stall.stall_id || this.stall.id || this.stall.ID

      if (!stallId) {
        console.log('No stall ID provided - submitting general application')
      }

      // Prepare complete application data
      const completeApplicationData = {
        ...applicationData,
        stall_id: stallId || null,
        application_date: new Date().toISOString().split('T')[0],
      }

      // CRITICAL: One more safety check before sending
      Object.keys(completeApplicationData).forEach(key => {
        if (completeApplicationData[key] === undefined) {
          console.warn(`⚠️ Converting undefined ${key} to null before sending`)
          completeApplicationData[key] = null
        }
      })

      console.log('Complete Application Data (final):', completeApplicationData)

      // Validate required fields
      if (!completeApplicationData.applicant_full_name || 
          !completeApplicationData.applicant_contact_number || 
          !completeApplicationData.email_address) {
        throw new Error('Missing required fields: applicant name, contact number, and email address are required')
      }

      const response = await fetch(
        `${this.apiBaseUrl}/landing-applicants/stall-application`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completeApplicationData),
        },
      )

      console.log('Response Status:', response.status)
      console.log('Response OK:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }

        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`)
      }

      const result = await response.json()
      console.log('Complete Application Result:', result)

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit stall application')
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
      }
    },

    goToPreviousStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },

    retrySubmission() {
      this.loadingState = 'preparing'
      this.loadingErrorMessage = ''
      this.handleOtherInfoNext(this.otherInfo)
    },

    resetForm() {
      this.currentStep = 1
      this.personalInfo = null
      this.spouseInfo = null
      this.businessInfo = null
      this.otherInfo = null
      this.isSubmitting = false
      this.loadingState = 'preparing'
      this.loadingErrorMessage = ''
    },
  },
}