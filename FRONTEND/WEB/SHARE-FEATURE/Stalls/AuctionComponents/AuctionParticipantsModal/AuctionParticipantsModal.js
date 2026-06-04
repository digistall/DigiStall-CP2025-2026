import auctionService from '@services/auctionService.js'
import ParticipantDetailModal from '../../ParticipantDetailModal/ParticipantDetailModal.vue'

export default {
  name: 'AuctionParticipantsModal',
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
      auctionInfo: null,
      selectingWinner: null, // Will hold the participantId being processed
      // Max stalls warning dialog
      showMaxStallsDialog: false,
      maxStallsParticipantName: '',
      maxStallsExistingStalls: [],
      // Update price modal
      showUpdatePriceModal: false,
      selectedWinner: null,
      winningBidAmount: '',
      winningBidRemarks: '',
      winningBidError: '',
      finalizingWinner: false,
      // Participant detail modal
      showParticipantDetail: false,
      selectedApplicantId: null
    }
  },
  computed: {
    hasWinner() {
      return this.participants.some(p => p.isWinner)
    },
    previousStallPrice() {
      return this.stallInfo?.rentalPrice ?? this.auctionInfo?.startingBid ?? 0
    },
    sortedParticipants() {
      // Sort by highest bid (descending), then by join date
      return [...this.participants].sort((a, b) => {
        if ((b.highestBid || 0) !== (a.highestBid || 0)) {
          return (b.highestBid || 0) - (a.highestBid || 0)
        }
        return new Date(a.joinedAt) - new Date(b.joinedAt)
      })
    }
  },
  watch: {
    show: {
      handler(newVal) {
        if (newVal && this.stall) {
          this.fetchParticipants()
        }
        if (!newVal) {
          this.closeUpdatePriceModal()
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * Fetch auction participants for the current stall
     */
    async fetchParticipants() {
      if (!this.stall?.id) {
        console.error('No stall ID provided')
        return
      }

      this.loading = true
      this.error = null

      try {
        console.log(`🔨 Fetching auction participants for stall: ${this.stall.id}`)
        
        const response = await auctionService.getAuctionParticipantsByStall(this.stall.id)

        if (response.success) {
          this.participants = response.data || []
          this.stallInfo = response.stallInfo
          this.auctionInfo = response.auctionInfo
          
          console.log(`✅ Loaded ${this.participants.length} participants`)
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
      this.closeUpdatePriceModal()
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
     * Handle select winner for a specific participant
     */
    handleSelectWinner(participant) {
      if (!this.auctionInfo?.auctionId) {
        this.$emit('show-message', { text: 'No auction found for this stall', type: 'error' })
        return
      }

      this.selectedWinner = participant
      this.winningBidAmount = participant.highestBid > 0 ? String(participant.highestBid) : ''
      this.winningBidRemarks = ''
      this.winningBidError = ''
      this.showUpdatePriceModal = true
    },

    clearWinningBidError() {
      if (this.winningBidError) {
        this.winningBidError = ''
      }
    },

    closeUpdatePriceModal() {
      this.showUpdatePriceModal = false
      this.selectedWinner = null
      this.winningBidAmount = ''
      this.winningBidRemarks = ''
      this.winningBidError = ''
    },

    validateWinningBid() {
      if (this.winningBidAmount === '' || this.winningBidAmount === null || this.winningBidAmount === undefined) {
        this.winningBidError = 'Winning bid amount is required.'
        return null
      }

      const parsedAmount = parseFloat(this.winningBidAmount)
      if (Number.isNaN(parsedAmount)) {
        this.winningBidError = 'Enter a valid numeric amount.'
        return null
      }
      if (parsedAmount < 0) {
        this.winningBidError = 'Amount must not be negative.'
        return null
      }

      this.winningBidError = ''
      return parsedAmount
    },

    async confirmWinnerSelection() {
      if (!this.selectedWinner) {
        this.$emit('show-message', { text: 'No winner selected', type: 'error' })
        return
      }

      if (!this.auctionInfo?.auctionId) {
        this.$emit('show-message', { text: 'No auction found for this stall', type: 'error' })
        return
      }

      const finalBidAmount = this.validateWinningBid()
      if (finalBidAmount === null) return

      this.finalizingWinner = true
      this.selectingWinner = this.selectedWinner.participantId

      const winnerName = this.selectedWinner.personalInfo?.fullName || 'Selected participant'

      try {
        const response = await auctionService.selectWinner(
          this.auctionInfo.auctionId,
          this.selectedWinner.participantId,
          this.selectedWinner.applicantId,
          finalBidAmount,
          this.winningBidRemarks
        )

        if (response.success) {
          this.$emit('show-message', { 
            text: `Winner selected: ${winnerName}`, 
            type: 'success', 
            operation: 'update', 
            operationType: 'auction' 
          })
          this.$emit('winner-selected', response.data)
          this.closeUpdatePriceModal()
          // Refresh participants to show the winner
          await this.fetchParticipants()
        } else {
          // Check if this is a max stalls error
          if (response.error?.maxStalls) {
            this.maxStallsParticipantName = winnerName
            this.maxStallsExistingStalls = response.error.existingStalls || []
            this.showMaxStallsDialog = true
            this.closeUpdatePriceModal()
          } else {
            this.$emit('show-message', { text: response.message || 'Failed to select winner', type: 'error' })
          }
        }
      } catch (error) {
        console.error('❌ Error selecting winner:', error)
        this.$emit('show-message', { text: error.message || 'Failed to select winner', type: 'error' })
      } finally {
        this.finalizingWinner = false
        this.selectingWinner = null
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
     * Get color for auction status
     */
    getAuctionStatusColor(status) {
      const statusColors = {
        'Open': 'success',
        'Scheduled': 'warning',
        'Active': 'success',
        'Closed': 'grey',
        'Cancelled': 'error',
        'Completed': 'info',
        'Awarded': 'success'
      }
      return statusColors[status] || 'grey'
    }
  }
}
