import {
  generatePassword,
  sendApprovalEmailWithRetry,
} from '../emailJS/emailService.js'

export default {
  name: 'ApproveApplicants',
  props: {
    applicant: {
      type: Object,
      default: null,
    },
    show: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      showModal: false,
      processing: false,
      approved: false,
      emailSent: false,
      credentials: null,
      processingMessage: '',
      credentialsAlreadyExisted: false,
    }
  },
  watch: {
    show(newVal) {
      this.showModal = newVal
      if (newVal) {
        this.resetState()
      }
    },
  },
  methods: {
    resetState() {
      this.processing = false
      this.approved = false
      this.emailSent = false
      this.credentials = null
      this.processingMessage = ''
      this.credentialsAlreadyExisted = false
    },

    closeModal() {
      this.showModal = false
      this.$emit('close')
    },

    async approveApplicant() {
      try {
        this.processing = true
        this.processingMessage = 'Processing approval...'

        console.log('🎯 Approving applicant:', this.applicant)
        console.log('🔍 DEBUG - applicant_id:', this.applicant.applicant_id)
        console.log('🔍 DEBUG - application_id:', this.applicant.application_id)
        console.log('🔍 DEBUG - id:', this.applicant.id)
        console.log('🔍 DEBUG - has_credentials:', this.applicant.has_credentials)

        // Get the correct applicant_id - use applicant_id directly, or extract from formatted id (#0047 -> 47)
        const applicantId = this.applicant.applicant_id || 
          (this.applicant.id && typeof this.applicant.id === 'string' 
            ? parseInt(this.applicant.id.replace('#', ''), 10) 
            : this.applicant.id)

        console.log('🔍 DEBUG - Using applicantId:', applicantId)

        if (!applicantId) {
          throw new Error('Cannot determine applicant ID')
        }

        // Check if applicant already has credentials (existing account)
        const hasExistingCredentials = this.applicant.has_credentials || false

        let username = null
        let password = null

        if (hasExistingCredentials) {
          // Applicant already has an account — skip password generation
          console.log('⏭️ Applicant already has credentials — skipping password generation')
          this.processingMessage = 'Assigning stall to existing account...'
          this.credentialsAlreadyExisted = true
        } else {
          // Generate new credentials
          this.processingMessage = 'Generating credentials...'
          username = this.applicant.email  // Email from other_information
          password = generatePassword()
          this.credentials = { username, password }
        }

        console.log(`📝 Approving applicant ${this.applicant.id}:`, {
          email: this.applicant.email,
          name: this.applicant.fullName,
          hasExistingCredentials,
          username,
        })

        this.processingMessage = 'Updating database...'

        // Update database status to approved using the same endpoint that works for decline/recheck
        const updateResult = await this.updateApplicantStatus(
          applicantId,
          'Approved', // Use proper capitalization for database enum
          username,
          password,
        )

        if (!updateResult.success) {
          throw new Error(updateResult.message || 'Failed to update database')
        }

        // Check if backend confirms credentials already existed
        if (updateResult.data?.credentials_already_existed) {
          this.credentialsAlreadyExisted = true
        }

        console.log('✅ Applicant approved and credentials stored in database')

        // Only send email if new credentials were created
        if (!this.credentialsAlreadyExisted && username && password) {
          this.processingMessage = 'Sending credentials email...'

          // Send approval email with credentials
          const emailResult = await sendApprovalEmailWithRetry(
            this.applicant.email,
            this.applicant.fullName,
            username,
            password,
          )

          this.emailSent = emailResult.success
        } else {
          this.emailSent = true // No email needed for existing accounts
        }

        this.approved = true
        this.processing = false

        if (this.credentialsAlreadyExisted) {
          if (this.$toast) {
            this.$toast.success(
              `✅ ${this.applicant.fullName} approved — stall assigned using existing account`,
            )
          }
        } else if (this.emailSent) {
          // Show success message
          if (this.$toast) {
            this.$toast.success(
              `✅ ${this.applicant.fullName} approved and credentials sent to ${this.applicant.email}`,
            )
          }

          console.log('✅ Applicant approved successfully:', {
            applicant: this.applicant.fullName,
            email: this.applicant.email,
            username,
            password,
          })
        } else {
          // Show partial success message
          if (this.$toast) {
            this.$toast.warning(`⚠️ Applicant approved but email failed to send`)
          }
        }

        // Emit success event to parent component with realtime update
        this.$emit('approved', {
          applicant: this.applicant,
          credentials: this.credentials,
          emailSent: this.emailSent,
          credentialsAlreadyExisted: this.credentialsAlreadyExisted,
        })

        // Emit for realtime updates (no refresh needed)
        this.$emit('applicant-approved', this.applicant.applicant_id)
        this.$emit('refresh-data')
      } catch (error) {
        console.error('❌ Unexpected error in approveApplicant:', error)

        this.processing = false

        if (this.$toast) {
          this.$toast.error(`❌ Failed to approve applicant: ${error.message}`)
        } else {
          alert(`❌ Failed to approve applicant: ${error.message}`)
        }
      }
    },

    async updateApplicantStatus(applicantId, status, username = null, password = null) {
      try {
        console.log('📤 Approving applicant via backend:', { applicantId, status, username })

        const token =
          sessionStorage.getItem('authToken') ||
          localStorage.getItem('token') ||
          localStorage.getItem('authToken')

        if (!token) {
          throw new Error('Authentication token not found. Please log in again.')
        }

        // Use the approve endpoint which creates credentials
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const response = await fetch(`${apiBaseUrl}/applicants/${applicantId}/approve`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        })

        console.log('📡 Approval response:', response.status)

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Your session has expired. Please log in again.')
          } else if (response.status === 403) {
            throw new Error('You do not have permission to approve this applicant.')
          } else if (response.status === 404) {
            throw new Error('Applicant not found.')
          } else if (response.status === 400) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Invalid request data.')
          } else {
            throw new Error(`Server error: ${response.status}`)
          }
        }

        const result = await response.json()
        console.log('📦 Approval result:', result)

        if (result.success) {
          return { success: true, message: 'Applicant approved successfully', data: result.data }
        } else {
          throw new Error(result.message || 'Failed to approve applicant')
        }
      } catch (error) {
        console.error('❌ Error approving applicant:', error)
        return { success: false, message: error.message }
      }
    },
  },
}
