import stallBackgroundImage from '@/assets/stallbackground.png'
import StallApplicationContainer from './StallApplicationContainer.vue'

export default {
  name: 'StallSection',
  components: {
    StallApplicationContainer,
  },
  data() {
    return {
      stallBackgroundImage,
      showApplyForm: false,
      // Landing page statistics from database
      totalStallholders: 0,
      totalStalls: 0,
      availableStallsCount: 0,
      occupiedStallsCount: 0,
      statsLoading: true,
      
      // General stall info for hero "Apply Now" button
      generalStallInfo: {
        stall_id: null,
        stall_code: 'GENERAL-APPLICATION',
        stall_name: 'General Stall Application',
        price_type: 'Fixed Price',
        monthly_rental: 0,
        floor: 'N/A',
        section: 'N/A',
        dimensions: 'To be determined',
        branch: 'Naga City Public Market',
        branchLocation: 'Naga City',
        description: 'General stall application - specific stall will be assigned upon approval',
        isAvailable: true,
      },
    }
  },
  computed: {
    formattedStallholders() {
      return this.totalStallholders.toLocaleString()
    },
    formattedStalls() {
      return this.totalStalls.toLocaleString()
    },
  },
  mounted() {
    this.fetchLandingPageStats()
  },
  methods: {
    async fetchLandingPageStats() {
      try {
        this.statsLoading = true
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const response = await fetch(`${apiUrl}/stalls/stats`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const data = await response.json()
        
        if (data.success) {
          this.totalStallholders = data.data.totalStallholders || 0
          this.totalStalls = data.data.totalStalls || 0
          this.availableStallsCount = data.data.availableStalls || 0
          this.occupiedStallsCount = data.data.occupiedStalls || (this.totalStalls - this.availableStallsCount)
          console.log('📊 Landing page stats loaded:', {
            stallholders: this.totalStallholders,
            stalls: this.totalStalls,
            available: this.availableStallsCount,
            occupied: this.occupiedStallsCount
          })
        }
      } catch (error) {
        console.error('❌ Failed to fetch landing page stats:', error)
      } finally {
        this.statsLoading = false
      }
    },
    
    openGeneralApplicationForm() {
      console.log('Opening general application form from hero section')
      this.showApplyForm = true
    },
    closeApplyForm() {
      console.log('Closing general application form')
      this.showApplyForm = false
    },
    scrollToFreeTrial() {
      const freeTrialSection = document.getElementById('free-trial')
      if (freeTrialSection) {
        freeTrialSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
  },
}
