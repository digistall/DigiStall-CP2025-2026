import ActiveRaffles from './ActiveRaffles/ActiveRaffles.vue'
import StallParticipants from '../StallsComponents/StallParticipants/StallParticipants.vue'
import RaffleDetailsPopup from './RaffleDetailsPopup/RaffleDetailsPopup.vue'
import ToastNotification from '../../../Common/ToastNotification/ToastNotification.vue'

export default {
  name: 'RafflesPage',
  components: {
    ActiveRaffles,
    StallParticipants,
    RaffleDetailsPopup,
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
      selectedRaffle: null,
      showParticipantsModal: false,
      selectedRaffleForParticipants: null,
    }
  },
  methods: {
    // Message and Modal methods
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

    handleViewDetails(raffle) {
      this.selectedRaffle = raffle
      this.showDetailsModal = true
      console.log('View raffle details:', raffle)
    },

    closeDetailsModal() {
      this.showDetailsModal = false
      this.selectedRaffle = null
    },

    handleViewParticipants(raffle) {
      this.selectedRaffleForParticipants = raffle
      this.showParticipantsModal = true
      console.log('View raffle participants:', raffle)
    },

    closeParticipantsModal() {
      this.showParticipantsModal = false
      this.selectedRaffleForParticipants = null
    },

    formatPrice(price) {
      return parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    },

    formatDateTime(dateTime) {
      if (!dateTime) return 'N/A'

      const date = new Date(dateTime)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    },
  },
}
