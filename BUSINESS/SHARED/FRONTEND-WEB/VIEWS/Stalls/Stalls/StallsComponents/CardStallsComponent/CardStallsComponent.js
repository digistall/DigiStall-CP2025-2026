export default {
  name: 'CardStallsComponent',
  props: {
    stalls: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      expandedDescriptions: {},
      stallImages: {}, // Store images for each stall { stallId: [images] }
      loadingImages: {}, // Track loading state for each stall { stallId: boolean }
    }
  },
  mounted() {
    // Check stalls data
    console.log('CardStallsComponent mounted')
    console.log('Number of stalls:', this.stalls.length)
    if (this.stalls.length > 0) {
      console.log('Sample stall data:', this.stalls[0])
      console.log('Sample stall location:', this.stalls[0].location)
      // Fetch images for all stalls
      this.fetchAllStallImages()
    }
  },
  watch: {
    stalls: {
      handler() {
        this.fetchAllStallImages()
      },
      deep: true
    }
  },
  methods: {
    async fetchAllStallImages() {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '')
      const token = sessionStorage.getItem('authToken')

      for (const stall of this.stalls) {
        if (!this.stallImages[stall.id]) {
          // Set loading state
          this.loadingImages = {
            ...this.loadingImages,
            [stall.id]: true
          }
          
          try {
            const fetchUrl = `${apiUrl}/api/stalls/${stall.id}/images/blob`
            const response = await fetch(fetchUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })

            if (response.ok) {
              const result = await response.json()
              if (result.success && result.data.images && result.data.images.length > 0) {
                // Vue 3 compatible reactive update
                this.stallImages = {
                  ...this.stallImages,
                  [stall.id]: result.data.images.map(img => ({
                    url: `${apiUrl}/api/stalls/images/blob/id/${img.image_id}`,
                    is_primary: img.is_primary
                  }))
                }
              } else {
                // No images found
                this.stallImages = {
                  ...this.stallImages,
                  [stall.id]: []
                }
              }
            } else {
              // Request failed
              this.stallImages = {
                ...this.stallImages,
                [stall.id]: []
              }
            }
          } catch (error) {
            console.error(`Error fetching images for stall ${stall.id}:`, error)
            this.stallImages = {
              ...this.stallImages,
              [stall.id]: []
            }
          } finally {
            // Clear loading state
            this.loadingImages = {
              ...this.loadingImages,
              [stall.id]: false
            }
          }
        }
      }
    },
    handleCardClick(stall) {
      console.log('Card clicked for stall:', stall)
      this.$emit('stall-edit', stall)
    },

    handleModify(stall) {
      console.log('Edit stall:', stall)
      this.$emit('stall-edit', stall)
    },

    // Handle raffle management
    handleRaffleManagement(stall) {
      console.log('Manage raffle stall:', stall)
      this.$emit('stall-raffle-management', stall)
    },

    // Handle auction management
    handleAuctionManagement(stall) {
      console.log('Manage auction stall:', stall)
      this.$emit('stall-auction-management', stall)
    },

    // Get color for price type badge
    getPriceTypeColor(priceType) {
      switch (priceType) {
        case 'Raffle':
          return 'primary'
        case 'Auction':
          return 'primary'
        case 'Fixed Price':
        default:
          return 'primary'
      }
    },

    // Get color for availability status badge
    getAvailabilityColor(status) {
      switch (status) {
        case 'Available':
          return 'success'
        case 'Occupied':
          return 'error'
        case 'Unavailable':
          return 'grey'
        default:
          return 'success'
      }
    },

    // Get icon for availability status badge
    getAvailabilityIcon(status) {
      switch (status) {
        case 'Available':
          return 'mdi-check-circle'
        case 'Occupied':
          return 'mdi-account-check'
        case 'Unavailable':
          return 'mdi-close-circle'
        default:
          return 'mdi-check-circle'
      }
    },

    // NEW: Check if description is long enough to need truncation
    isDescriptionLong(description) {
      if (!description) return false
      return description.length > 80 // Show "show more" if description is longer than 80 characters
    },

    // NEW: Check if description is expanded
    isDescriptionExpanded(stallId) {
      return this.expandedDescriptions[stallId] || false
    },

    // NEW: Toggle description visibility
    toggleDescription(stall) {
      const stallId = stall.stallNumber || stall.id
      // Use Vue.set or direct assignment for reactivity
      if (this.$set) {
        this.$set(this.expandedDescriptions, stallId, !this.expandedDescriptions[stallId])
      } else {
        // Fallback for Vue 3 or when $set is not available
        this.expandedDescriptions = {
          ...this.expandedDescriptions,
          [stallId]: !this.expandedDescriptions[stallId],
        }
      }
    },
  },
}
