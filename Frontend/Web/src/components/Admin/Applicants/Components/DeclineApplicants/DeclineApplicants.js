import { sendDeclineEmailWithRetry } from '../emailJS/emailService.js'

export default {
  name: 'DeclineApplicants',
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
      declined: false,
      emailSent: false,
      declineReason: '',
      sendNotification: true,
      reasonError: '',
      processingMessage: '',
    }
  },
  watch: {
    show(newVal) {
      this.showModal = newVal
      if (newVal) {
        this.resetState()
      }
    },
    declineReason(newVal) {
      if (newVal && newVal.trim().length > 0) {
        this.reasonError = ''
      }
    },
  },
  methods: {
    resetState() {
      this.processing = false
      this.declined = false
      this.emailSent = false
      this.declineReason = ''
      this.sendNotification = true
      this.reasonError = ''
      this.processingMessage = ''
    },

    closeModal() {
      this.showModal = false
      this.$emit('close')
    },

    validateForm() {
      this.reasonError = ''

      if (!this.declineReason || this.declineReason.trim().length === 0) {
        this.reasonError = 'Please provide a reason for declining this application.'
        return false
      }

      if (this.declineReason.trim().length < 10) {
        this.reasonError = 'Please provide a more detailed reason (at least 10 characters).'
        return false
      }

      return true
    },

    async declineApplicant() {
      try {
        // Validate form
        if (!this.validateForm()) {
          return
        }

        console.log('🎯 Declining applicant:', this.applicant)
        console.log('📝 Decline reason:', this.declineReason)

        // Step 1: Send decline email first if requested
        let emailSuccess = false
        if (this.sendNotification) {
          console.log('📧 Sending decline email to:', this.applicant.email)

          const emailResult = await sendDeclineEmailWithRetry(
            this.applicant.email,
            this.applicant.fullName,
            this.declineReason.trim(),
          )

          this.emailSent = emailResult.success
          emailSuccess = emailResult.success

          if (!emailResult.success) {
            console.warn('⚠️ Email failed but proceeding:', emailResult.message)
          }
        }

        // Step 2: Update applicant status to 'Rejected' via backend (no data deletion)
        const declineResult = await this.updateApplicantStatus(
          this.applicant.applicant_id || this.applicant.id,
          'Rejected',
          this.declineReason.trim(),
        )

        if (!declineResult.success) {
          throw new Error(declineResult.message || 'Failed to decline applicant')
        }

        console.log('✅ Applicant status updated to Rejected successfully')

        // Step 3: Close modal and emit events for realtime updates
        this.closeModal()

        // Emit events for realtime updates (status changed, not deleted)
        this.$emit('declined', {
          applicant: this.applicant,
          reason: this.declineReason,
          emailSent: this.emailSent,
          statusUpdated: true,
        })

        // Emit to parent components for immediate list updates
        this.$emit('applicant-status-updated', {
          id: this.applicant.applicant_id || this.applicant.id,
          status: 'Rejected',
          declined_at: new Date().toISOString(),
        })
        this.$emit('refresh-data')

        console.log('✅ Applicant declined successfully:', {
          applicant: this.applicant.fullName,
          email: this.applicant.email,
          reason: this.declineReason,
          emailSent: this.emailSent,
        })
      } catch (error) {
        console.error('❌ Error in decline process:', error)
        
        if (this.$toast) {
          this.$toast.error(`❌ Failed to decline applicant: ${error.message}`)
        } else {
          alert(`❌ Failed to decline applicant: ${error.message}`)
        }
      }
    },

    async updateApplicantStatus(applicantId, status, reason = null) {
      try {
        console.log('📤 Updating applicant status:', { applicantId, status, reason })

        const token =
          sessionStorage.getItem('authToken') ||
          localStorage.getItem('token') ||
          localStorage.getItem('authToken')

        if (!token) {
          throw new Error('Authentication token not found. Please log in again.')
        }

        const updateData = {
          status: status,
        }

        // Add decline reason and timestamp if declining/rejecting
        if ((status === 'declined' || status === 'Rejected') && reason) {
          updateData.decline_reason = reason
          updateData.declined_at = new Date().toISOString()
        }

        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const response = await fetch(`${apiBaseUrl}/applicants/${applicantId}/status`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })

        console.log('📡 Status update response:', response.status)

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Your session has expired. Please log in again.')
          } else if (response.status === 403) {
            throw new Error('You do not have permission to update this applicant.')
          } else if (response.status === 404) {
            throw new Error('Applicant not found.')
          } else {
            throw new Error(`Server error: ${response.status}`)
          }
        }

        const result = await response.json()
        console.log('📦 Status update result:', result)

        if (result.success) {
          return { success: true, message: 'Status updated successfully' }
        } else {
          throw new Error(result.message || 'Failed to update status')
        }
      } catch (error) {
        console.error('❌ Error updating applicant status:', error)
        return { success: false, message: error.message }
      }
    },

    async declineApplicantViaBackend(applicantId, reason) {
      try {
        console.log('🗑️ Declining applicant via backend:', { applicantId, reason })

        const token =
          sessionStorage.getItem('authToken') ||
          localStorage.getItem('token') ||
          localStorage.getItem('authToken')

        if (!token) {
          throw new Error('Authentication token not found. Please log in again.')
        }

        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const response = await fetch(
          `${apiBaseUrl}/applicants/${applicantId}/decline`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reason: reason,
            }),
          },
        )

        console.log('📡 Decline response:', response.status)

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Your session has expired. Please log in again.')
          } else if (response.status === 403) {
            throw new Error('You do not have permission to decline this applicant.')
          } else if (response.status === 404) {
            throw new Error('Applicant not found.')
          } else if (response.status === 400) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Invalid decline reason.')
          } else {
            throw new Error(`Server error: ${response.status}`)
          }
        }

        const result = await response.json()
        console.log('📦 Decline result:', result)

        if (result.success) {
          return {
            success: true,
            message: 'Applicant status updated to Rejected',
            data: result.data,
          }
        } else {
          throw new Error(result.message || 'Failed to update applicant status')
        }
      } catch (error) {
        console.error('❌ Error updating applicant status via backend:', error)
        return { success: false, message: error.message }
      }
    },
  },
}
