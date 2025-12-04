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
      statsLoading: true,
      
      // Stallholders Modal
      showStallholdersModal: false,
      stallholdersList: [],
      stallholdersLoading: false,
      stallholdersSearch: '',
      stallholdersBranchFilter: '',
      stallholdersBusinessTypeFilter: '',
      stallholdersPage: 1,
      stallholdersSearchTimeout: null,
      
      // Stalls Modal
      showStallsModal: false,
      stallsList: [],
      stallsLoading: false,
      stallsSearch: '',
      stallsBranchFilter: '',
      stallsStatusFilter: '',
      stallsPriceTypeFilter: '',
      stallsPage: 1,
      stallsSearchTimeout: null,
      
      // Filter Options
      filterOptions: {
        branches: [],
        businessTypes: [],
        statuses: [],
        priceTypes: []
      },
      
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
    }
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
          console.log('📊 Landing page stats loaded:', {
            stallholders: this.totalStallholders,
            stalls: this.totalStalls
          })
        }
      } catch (error) {
        console.error('❌ Failed to fetch landing page stats:', error)
      } finally {
        this.statsLoading = false
      }
    },
    
    async fetchFilterOptions() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const response = await fetch(`${apiUrl}/stalls/public/filter-options`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const data = await response.json()
        
        if (data.success) {
          this.filterOptions = data.data
        }
      } catch (error) {
        console.error('❌ Failed to fetch filter options:', error)
      }
    },
    
    // Stallholders Modal Methods
    async openStallholdersModal() {
      this.showStallholdersModal = true
      this.stallholdersPage = 1
      this.stallholdersList = []
      document.body.style.overflow = 'hidden'
      await this.fetchFilterOptions()
      await this.fetchStallholders()
    },
    
    closeStallholdersModal() {
      this.showStallholdersModal = false
      this.stallholdersSearch = ''
      this.stallholdersBranchFilter = ''
      this.stallholdersBusinessTypeFilter = ''
      document.body.style.overflow = ''
    },
    
    async fetchStallholders() {
      try {
        this.stallholdersLoading = true
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const params = new URLSearchParams({
          search: this.stallholdersSearch,
          branch: this.stallholdersBranchFilter,
          businessType: this.stallholdersBusinessTypeFilter,
          page: this.stallholdersPage,
          limit: 20
        })
        
        const response = await fetch(`${apiUrl}/stalls/public/stallholders?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const data = await response.json()
        
        if (data.success) {
          if (this.stallholdersPage === 1) {
            this.stallholdersList = data.data
          } else {
            this.stallholdersList = [...this.stallholdersList, ...data.data]
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch stallholders:', error)
      } finally {
        this.stallholdersLoading = false
      }
    },
    
    debounceStallholdersSearch() {
      clearTimeout(this.stallholdersSearchTimeout)
      this.stallholdersSearchTimeout = setTimeout(() => {
        this.stallholdersPage = 1
        this.fetchStallholders()
      }, 300)
    },
    
    loadMoreStallholders() {
      this.stallholdersPage++
      this.fetchStallholders()
    },
    
    // Stalls Modal Methods
    async openStallsModal() {
      this.showStallsModal = true
      this.stallsPage = 1
      this.stallsList = []
      document.body.style.overflow = 'hidden'
      await this.fetchFilterOptions()
      await this.fetchStalls()
    },
    
    closeStallsModal() {
      this.showStallsModal = false
      this.stallsSearch = ''
      this.stallsBranchFilter = ''
      this.stallsStatusFilter = ''
      this.stallsPriceTypeFilter = ''
      document.body.style.overflow = ''
    },
    
    async fetchStalls() {
      try {
        this.stallsLoading = true
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const params = new URLSearchParams({
          search: this.stallsSearch,
          branch: this.stallsBranchFilter,
          status: this.stallsStatusFilter,
          priceType: this.stallsPriceTypeFilter,
          page: this.stallsPage,
          limit: 20
        })
        
        const response = await fetch(`${apiUrl}/stalls/public/list?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Process stall images - use default images based on section
          const processedStalls = data.data.map(stall => ({
            ...stall,
            stall_image: this.getDefaultImage(stall.section_name)
          }))
          
          if (this.stallsPage === 1) {
            this.stallsList = processedStalls
          } else {
            this.stallsList = [...this.stallsList, ...processedStalls]
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch stalls:', error)
      } finally {
        this.stallsLoading = false
      }
    },
    
    debounceStallsSearch() {
      clearTimeout(this.stallsSearchTimeout)
      this.stallsSearchTimeout = setTimeout(() => {
        this.stallsPage = 1
        this.fetchStalls()
      }, 300)
    },
    
    loadMoreStalls() {
      this.stallsPage++
      this.fetchStalls()
    },
    
    handleImageError(event, stall) {
      // Hide broken image and show placeholder instead
      event.target.style.display = 'none'
      stall.stall_image = null
    },
    
    getDefaultImage(section) {
      // Use same images as Admin Stalls component (Unsplash URLs)
      const defaultImages = {
        'Grocery Section': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'Meat Section': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
        'Fresh Produce': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        'Clothing Section': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        'Electronics Section': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
        'Food Court': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      }
      // Return matching section image or fallback to stall background image
      return defaultImages[section] || stallBackgroundImage
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
    animateStat(event) {
      const card = event.currentTarget
      card.style.transform = 'translateY(-10px) scale(1.02)'
    },
    resetStat(event) {
      const card = event.currentTarget
      card.style.transform = ''
    }
  },
}
