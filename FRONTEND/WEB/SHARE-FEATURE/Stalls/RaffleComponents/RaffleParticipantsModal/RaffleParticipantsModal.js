import raffleService from '@services/raffleService.js'
import ParticipantDetailModal from '../../ParticipantDetailModal/ParticipantDetailModal.vue'

export default {
  name: 'RaffleParticipantsModal',
  components: {
    ParticipantDetailModal
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    stall: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'winner-selected', 'show-message'],
  data() {
    return {
      loading: false,
      error: null,
      participants: [],
      stallInfo: null,
      raffleInfo: null,
      selectingWinner: false,
      // Max stalls warning dialog
      showMaxStallsDialog: false,
      maxStallsParticipantName: '',
      maxStallsExistingStalls: [],
      // Participant detail modal
      showParticipantDetail: false,
      selectedApplicantId: null
    }
  },
  computed: {
    hasWinner() {
      return this.participants.some(p => p.isWinner) || this.raffleInfo?.hasWinner
    }
  },
  watch: {
    show: {
      handler(newVal) {
        if (newVal && this.stall) {
          this.fetchParticipants()
        }
      },
      immediate: true
    },
    stall: {
      handler(newVal) {
        if (newVal && this.show) {
          this.fetchParticipants()
        }
      }
    }
  },
  methods: {
    /**
     * Fetch raffle participants for the current stall
     */
    async fetchParticipants() {
      if (!this.stall?.id) {
        console.error('No stall ID provided')
        return
      }

      this.loading = true
      this.error = null

      try {
        console.log(`🎰 Fetching raffle participants for stall: ${this.stall.id}`)
        
        const response = await raffleService.getRaffleParticipantsByStall(this.stall.id)

        console.log('🔍 Full raffle response:', response)
        console.log('🔍 Response data:', response.data)
        console.log('🔍 Response stallInfo:', response.stallInfo)
        console.log('🔍 Response raffleInfo:', response.raffleInfo)

        if (response.success) {
          this.participants = response.data || []
          this.stallInfo = response.stallInfo
          this.raffleInfo = response.raffleInfo
          
          console.log(`✅ Loaded ${this.participants.length} participants`)
          if (this.participants.length > 0) {
            console.log('📋 First participant:', this.participants[0])
          }
        } else {
          throw new Error(response.message || 'Failed to fetch participants')
        }
      } catch (error) {
        console.error('❌ Error fetching participants:', error)
        this.error = error.message || 'Failed to load participants'
      } finally {
        this.loading = false
      }
    },

    /**
     * Handle close button click
     */
    handleClose() {
      this.$emit('close')
    },

    /**
     * Open participant detail modal
     */
    openParticipantDetail(participant) {
      if (participant.applicantId) {
        this.selectedApplicantId = participant.applicantId
        this.showParticipantDetail = true
      }
    },

    /**
     * Close participant detail modal
     */
    closeParticipantDetail() {
      this.showParticipantDetail = false
      this.selectedApplicantId = null
    },

    /**
     * Handle select winner button click
     */
    async handleSelectWinner() {
      if (!this.raffleInfo?.raffleId) {
        this.$emit('show-message', { text: 'No raffle found for this stall', type: 'error' })
        return
      }

      this.selectingWinner = true

      try {
        const response = await raffleService.selectWinner(this.raffleInfo.raffleId)

        if (response.success) {
          this.$emit('show-message', { text: 'Winner selected successfully!', type: 'success', operation: 'update', operationType: 'raffle' })
          this.$emit('winner-selected', response.data)
          // Refresh participants to show the winner
          await this.fetchParticipants()
        } else {
          // Check if this is a max stalls error
          if (response.error?.maxStalls) {
            this.maxStallsParticipantName = 'The randomly selected winner'
            this.maxStallsExistingStalls = response.error.existingStalls || []
            this.showMaxStallsDialog = true
          } else {
            this.$emit('show-message', { text: response.message || 'Failed to select winner', type: 'error' })
          }
        }
      } catch (error) {
        console.error('❌ Error selecting winner:', error)
        this.$emit('show-message', { text: error.message || 'Failed to select winner', type: 'error' })
      } finally {
        this.selectingWinner = false
      }
    },

    /**
     * Handle select winner for specific participant
     */
    async handleSelectWinnerForParticipant(participantId) {
      if (!this.raffleInfo?.raffleId) {
        this.$emit('show-message', { text: 'No raffle found for this stall', type: 'error' })
        return
      }

      this.selectingWinner = true

      try {
        const response = await raffleService.selectWinnerByParticipantId(this.raffleInfo.raffleId, participantId)

        if (response.success) {
          this.$emit('show-message', { text: 'Winner selected successfully!', type: 'success', operation: 'update', operationType: 'raffle' })
          this.$emit('winner-selected', response.data)
          // Refresh participants to show the winner
          await this.fetchParticipants()
        } else {
          // Check if this is a max stalls error
          if (response.error?.maxStalls) {
            const participant = this.participants.find(p => p.participantId === participantId)
            this.maxStallsParticipantName = participant?.personalInfo?.fullName || 'This participant'
            this.maxStallsExistingStalls = response.error.existingStalls || []
            this.showMaxStallsDialog = true
          } else {
            this.$emit('show-message', { text: response.message || 'Failed to select winner', type: 'error' })
          }
        }
      } catch (error) {
        console.error('❌ Error selecting winner:', error)
        this.$emit('show-message', { text: error.message || 'Failed to select winner', type: 'error' })
      } finally {
        this.selectingWinner = false
      }
    },

    /**
     * Get initials from full name
     */
    getInitials(fullName) {
      if (!fullName) return '?'
      const names = fullName.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
      }
      return fullName.substring(0, 2).toUpperCase()
    },

    /**
     * Format price with proper formatting
     */
    formatPrice(price) {
      if (!price) return '0.00'
      return parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    /**
     * Format date/time string
     */
    formatDateTime(dateTime) {
      if (!dateTime) return 'N/A'
      const date = new Date(dateTime)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    },

    /**
     * Truncate text with ellipsis
     */
    truncateText(text, maxLength) {
      if (!text) return 'N/A'
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    },

    /**
     * Get color for raffle status
     */
    getRaffleStatusColor(status) {
      const statusColors = {
        'Active': 'success',
        'Waiting for Participants': 'warning',
        'Not Started': 'info',
        'Ended': 'grey',
        'Cancelled': 'error'
      }
      return statusColors[status] || 'grey'
    }
  }
}
