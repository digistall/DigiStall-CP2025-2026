import ActiveAuctions from '../ActiveAuctions/ActiveAuctions.vue'
import StallParticipants from '../../StallsComponents/StallParticipants/StallParticipants.vue'
import ToastNotification from '../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'AuctionsPage',
  components: {
    ActiveAuctions,
    StallParticipants,
    ToastNotification
  },
  data() {
    return {
      // Toast notification
      toast: {
        show: false,
        message: '',
        type: 'info'
      },
      showDetailsModal: false,
      selectedAuction: null,
      showParticipantsModal: false,
      selectedAuctionForParticipants: null,
    }
  },
  methods: {
    handleMessage(message, type = 'info') {
      // Add emoji icons based on type
      const iconMap = {
        success: '✅ ',
        error: '❌ ',
        warning: '⚠️ ',
        info: 'ℹ️ ',
        delete: '🗑️ ',
        update: '📝 '
      }
      const prefix = iconMap[type] || ''
      this.showToast(prefix + message, type)
    },

    showToast(message, type = 'info') {
      this.toast = {
        show: true,
        message: message,
        type: type
      }
    },

    handleViewDetails(auction) {
      this.selectedAuction = auction
      this.showDetailsModal = true
      console.log('View auction details:', auction)
    },

    closeDetailsModal() {
      this.showDetailsModal = false
      this.selectedAuction = null
    },

    handleViewParticipants(auction) {
      this.selectedAuctionForParticipants = auction
      this.showParticipantsModal = true
      console.log('View auction participants:', auction)
    },

    closeParticipantsModal() {
      this.showParticipantsModal = false
      this.selectedAuctionForParticipants = null
    },

    formatPrice(price) {
      if (!price) return '0'
      return parseFloat(price).toLocaleString()
    },

    formatDateTime(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
