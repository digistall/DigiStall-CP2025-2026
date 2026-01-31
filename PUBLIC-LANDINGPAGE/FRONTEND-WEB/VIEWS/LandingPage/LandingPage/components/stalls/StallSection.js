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
      
      // Stall images management
      stallImages: {}, // { stallId: [images] }
      loadingStallImages: {}, // { stallId: boolean }
      
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
    // Filter out occupied stalls - only show available ones
    availableStallsList() {
      return this.stallsList.filter(stall => 
        stall.occupancy_status !== 'Occupied' && 
        stall.occupancy_status?.toLowerCase() !== 'occupied'
      )
    },
    // Compute available count from stalls list
    computedAvailableCount() {
      if (this.stallsList.length > 0) {
        return this.stallsList.filter(stall => 
          stall.occupancy_status !== 'Occupied' && 
          stall.occupancy_status?.toLowerCase() !== 'occupied'
        ).length
      }
      return this.availableStallsCount
    },
    // Compute occupied count from stalls list
    computedOccupiedCount() {
      if (this.stallsList.length > 0) {
        return this.stallsList.filter(stall => 
          stall.occupancy_status === 'Occupied' || 
          stall.occupancy_status?.toLowerCase() === 'occupied'
        ).length
      }
      return this.occupiedStallsCount
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
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        // Ensure apiUrl ends with /api
        const apiUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
        
        const params = new URLSearchParams({
          search: this.stallsSearch,
          branch: this.stallsBranchFilter,
          status: this.stallsStatusFilter,
          priceType: this.stallsPriceTypeFilter,
          page: this.stallsPage,
          limit: 20
        })
        
        console.log('📊 Fetching stalls from:', `${apiUrl}/stalls/public/list?${params}`)
        
        const response = await fetch(`${apiUrl}/stalls/public/list?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const data = await response.json()
        console.log('📊 Stalls API response:', data)
        
        if (data.success) {
          // Process stall data
          const processedStalls = data.data.map(stall => ({
            ...stall,
            currentImageIndex: 0 // Track current image index for carousel
          }))
          
          console.log('📊 Processed stalls:', processedStalls.length)
          
          if (this.stallsPage === 1) {
            this.stallsList = processedStalls
          } else {
            this.stallsList = [...this.stallsList, ...processedStalls]
          }          
          // Fetch images for all stalls
          processedStalls.forEach(stall => {
            this.fetchStallImages(stall.stall_id)
          })
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
    
    async fetchStallImages(stallId) {
      if (!stallId || this.stallImages[stallId]) return // Skip if already loaded
      
      // Use spread to ensure reactivity
      this.loadingStallImages = { ...this.loadingStallImages, [stallId]: true }
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const baseUrl = apiBaseUrl.replace(/\/api$/, '')
      
      try {
        const response = await fetch(`${baseUrl}/api/stalls/public/${stallId}/images/blob`)
        
        if (response.ok) {
          const result = await response.json()
          console.log(`🔍 API response for stall ${stallId}:`, result)
          if (result.success && result.data?.images && result.data.images.length > 0) {
            const images = result.data.images.map(img => ({
              id: img.image_id,  // Backend returns image_id, not id
              url: `${baseUrl}/api/stalls/images/blob/id/${img.image_id}`,
              is_primary: img.is_primary
            }))
            
            // Use spread to ensure Vue 3 reactivity
            this.stallImages = { ...this.stallImages, [stallId]: images }
            console.log(`📷 Loaded ${images.length} images for stall ${stallId}:`, images)
          } else {
            // No images found, set empty array
            this.stallImages = { ...this.stallImages, [stallId]: [] }
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching images for stall ${stallId}:`, error)
        this.stallImages = { ...this.stallImages, [stallId]: [] }
      } finally {
        this.loadingStallImages = { ...this.loadingStallImages, [stallId]: false }
      }
    },
    
    handleImageError(event, stall) {
      // Hide broken image and show placeholder instead
      event.target.style.display = 'none'
      stall.stall_image = null
    },
    
    changeStallImage(stall, direction) {
      const images = this.stallImages[stall.stall_id]
      if (!images || images.length <= 1) return
      
      const currentIndex = stall.currentImageIndex || 0
      if (direction === 'next') {
        stall.currentImageIndex = (currentIndex + 1) % images.length
      } else {
        stall.currentImageIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
      }
      this.$forceUpdate()
    },
    
    buildImageUrl(imagePath) {
      // Build full URL for images
      if (!imagePath) return null
      
      // If it's already a full URL (http:// or https://), return as-is
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath
      }
      
      // Check if it's a BLOB API URL path (e.g., /api/stalls/images/blob/21/1)
      if (imagePath.includes('/api/stalls/images/blob/')) {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        // Remove trailing /api from base URL if present, then append the full path
        const baseUrl = apiBaseUrl.replace(/\/api$/, '')
        return `${baseUrl}${imagePath}`
      }
      
      // Legacy: Build URL for file-based images
      const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost'
      return `${imageBaseUrl}${imagePath}`
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
