import { eventBus, EVENTS } from '@eventBus'

export default {
  name: 'DeleteStall',
  emits: ['close', 'deleted', 'error'],
  props: {
    stallData: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    showModal: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      // API base URL
      apiBaseUrl: (() => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      })(),
    }
  },
  methods: {
    async handleConfirmDelete() {
      // Check for stall ID using correct field names from backend
      const stallId = this.stallData.stall_id || this.stallData.ID || this.stallData.id

      if (!stallId) {
        console.error('❌ No stall ID provided for deletion')
        console.log('Available stall data:', this.stallData)
        this.$emit('error', 'No stall ID provided for deletion')
        return
      }

      this.loading = true

      try {
        const stallNumber = this.stallData.stall_no || this.stallData.stallNumber || 'Unknown'

        console.log('🗑️ Starting deletion process...')
        console.log(`📋 Stall Details: ID=${stallId}, Number=${stallNumber}`)
        console.log(
          `📍 Location: ${this.stallData.stall_location || this.stallData.location || 'N/A'}`,
        )

        // Get auth token from sessionStorage
        const token = sessionStorage.getItem('authToken')

        if (!token) {
          this.$emit('error', {
            message: '🔒 Authentication Required: Please login again to continue.',
            error: new Error('Authentication token not found')
          })
          setTimeout(() => {
            this.$router.push('/login')
          }, 2000)
          return
        }

        // Make API call to delete stall
        const apiUrl = `${this.apiBaseUrl}/stalls/${stallId}`

        console.log(`🌐 Making DELETE request to: ${apiUrl}`)

        const response = await fetch(apiUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json().catch(() => {
          // If JSON parsing fails, return a generic error object
          return {
            success: false,
            message: response.statusText || 'Server error',
          }
        })

        console.log('📡 Delete API Response:', result)
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`)

        if (!response.ok) {
          if (response.status === 401) {
            this.$emit('error', {
              message: '🔒 Session Expired: Please login again to continue.',
              error: new Error('Session expired')
            })
            setTimeout(() => {
              this.$router.push('/login')
            }, 2000)
            return
          } else if (response.status === 403) {
            throw new Error('Access denied - you do not have permission to delete this stall')
          } else if (response.status === 404) {
            throw new Error('Stall not found or you do not have permission to delete it')
          }
          throw new Error(result.message || `Server error: ${response.status}`)
        }

        if (result.success) {
          console.log('✅ Stall deletion successful!')
          console.log(`🎉 Successfully deleted stall: ${stallNumber}`)

          // Emit success event to parent component
          this.$emit('deleted', {
            stallId: stallId,
            stallData: this.stallData,
            message: result.message || `Stall ${stallNumber} deleted successfully`,
          })

          // NEW: Emit global event for real-time sidebar update
          eventBus.emit(EVENTS.STALL_DELETED, {
            stallId: stallId,
            stallData: this.stallData,
            priceType: this.stallData?.priceType || this.stallData?.price_type,
            message: result.message || `Stall ${stallNumber} deleted successfully`,
          })

          // Close the modal after successful delete
          this.loading = false
          this.handleCancel()
        } else {
          throw new Error(result.message || 'Failed to delete stall')
        }
      } catch (error) {
        console.error('❌ Error deleting stall:', error)
        console.error('🔍 Error details:', {
          message: error.message,
          stallId: stallId,
          stallNumber: this.stallData.stall_no || this.stallData.stallNumber,
        })

        this.loading = false

        // Format error message with appropriate icon
        let errorMessage = '❌ Error: Failed to delete stall'
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '❌ Network Error: Unable to connect to server. Please check your connection and try again.'
        } else if (error.message.includes('Application records exist') || error.message.includes('Stallholder records exist')) {
          errorMessage = `⚠️ Cannot Delete: ${error.message}. Please archive the stall instead.`
        } else if (error.message.includes('Access denied')) {
          errorMessage = `🚫 Access Denied: ${error.message}`
        } else if (error.message.includes('Stall not found')) {
          errorMessage = `⚠️ Not Found: ${error.message}`
        } else if (error.message.includes('Auction records exist') || error.message.includes('Raffle records exist')) {
          errorMessage = `⚠️ Cannot Delete: ${error.message}. Archive stall instead of deleting.`
        } else if (error.message.includes('Violation reports exist')) {
          errorMessage = `⚠️ Cannot Delete: ${error.message}. Archive stall instead of deleting.`
        } else if (error.message) {
          errorMessage = `❌ Error: ${error.message}`
        }

        // Emit error event to parent component
        this.$emit('error', {
          message: errorMessage,
          error: error,
        })
      }
    },

    handleCancel() {
      this.$emit('close')
    },

    formatPrice(price) {
      if (!price) return 'N/A'

      // Extract numeric price if it's a formatted string
      const numericPrice = String(price)
        .replace(/[₱,\s]/g, '')
        .replace(/php/gi, '')
        .replace(/\/.*$/i, '') // Remove everything after "/" (like "/ Fixed Price")
        .trim()

      if (isNaN(numericPrice)) return price

      return `₱${parseFloat(numericPrice).toLocaleString()}`
    },
  },

  beforeDestroy() {
    // Clean up timeout when component is destroyed
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout)
      this.popupTimeout = null
    }
  },
}
