import auctionService from '../../../../../services/auctionService.js'

export default {
  name: 'AuctionParticipantsModal',
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
      bidders: [],
      stallInfo: null,
      auctionInfo: null,
      selectingWinner: false
    }
  },
  computed: {
    hasWinner() {
      return this.bidders.some(b => b.isWinner) || this.auctionInfo?.hasWinner
    },
    highestBidder() {
      if (!this.bidders.length) return null
      return this.bidders.reduce((max, b) => 
        (b.bidAmount > max.bidAmount) ? b : max, this.bidders[0])
    }
  },
  watch: {
    show: {
      handler(newVal) {
        if (newVal && this.stall) {
          this.fetchBidders()
        }
      },
      immediate: true
    },
    stall: {
      handler(newVal) {
        if (newVal && this.show) {
          this.fetchBidders()
        }
      }
    }
  },
  methods: {
    /**
     * Fetch auction bidders for the current stall
     */
    async fetchBidders() {
      if (!this.stall?.id) {
        console.error('No stall ID provided')
        return
      }

      this.loading = true
      this.error = null

      try {
        console.log(`🏺 Fetching auction bidders for stall: ${this.stall.id}`)

        const response = await auctionService.getAuctionBiddersByStall(this.stall.id)

        if (response.success) {
          this.bidders = response.data || []
          this.stallInfo = response.stallInfo
          this.auctionInfo = response.auctionInfo

          console.log(`✅ Loaded ${this.bidders.length} bidders`)
        } else {
          throw new Error(response.message || 'Failed to fetch bidders')
        }
      } catch (error) {
        console.error('❌ Error fetching bidders:', error)
        this.error = error.message || 'Failed to load bidders'
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
     * Handle select winner button click
     */
    async handleSelectWinner() {
      if (!this.auctionInfo?.auctionId) {
        this.$emit('show-message', { text: 'No auction found for this stall', type: 'error' })
        return
      }

      this.selectingWinner = true

      try {
        const response = await auctionService.selectWinner(this.auctionInfo.auctionId)

        if (response.success) {
          this.$emit('show-message', { text: 'Winner confirmed successfully!', type: 'success', operation: 'update', operationType: 'auction' })
          this.$emit('winner-selected', response.data)
          // Refresh bidders to show the winner
          await this.fetchBidders()
        } else {
          throw new Error(response.message || 'Failed to confirm winner')
        }
      } catch (error) {
        console.error('❌ Error confirming winner:', error)
        this.$emit('show-message', { text: error.message || 'Failed to confirm winner', type: 'error' })
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
     * Get color for auction status
     */
    getAuctionStatusColor(status) {
      const statusColors = {
        'Active': 'success',
        'Waiting for Bidders': 'warning',
        'Not Started': 'info',
        'Ended': 'grey',
        'Cancelled': 'error'
      }
      return statusColors[status] || 'grey'
    },

    /**
     * Check if bidder is highest
     */
    isHighestBidder(bidder) {
      if (!this.highestBidder) return false
      return bidder.bidderId === this.highestBidder.bidderId
    }
  }
}
