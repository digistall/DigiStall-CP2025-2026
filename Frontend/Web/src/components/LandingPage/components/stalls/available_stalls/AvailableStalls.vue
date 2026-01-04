<template>
  <div class="available-stalls">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>Loading available stalls...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-btn">Try Again</button>
    </div>

    <!-- Stalls Grid with fade animation -->
    <div v-else>
      <transition name="fade-pagination" mode="out-in">
        <div class="stall-grid" :key="currentPage">
          <div class="stall-card" v-for="stall in paginatedStalls" :key="stall.id" @click="openStallDetails(stall)">
            <div class="stall-image">
              <!-- Loading placeholder until images are fetched -->
              <div v-if="!stall.stallImages || stall.stallImages.length === 0" class="stall-image-loading">
                <div class="loading-spinner-small"></div>
              </div>
              <img v-else :src="getStallDisplayImage(stall)" :alt="`Stall ${stall.stallNumber}`" @error="handleImageError" />
              <div class="stall-status-badge" :class="getStallBadgeClass(stall)">
                {{ getStallBadgeText(stall) }}
              </div>
              
              <!-- Image pagination dots (show only if multiple images) -->
              <div class="image-pagination-dots" v-if="stall.imageCount > 1">
                <div 
                  v-for="n in Math.min(stall.imageCount, 10)" 
                  :key="n"
                  class="pagination-dot"
                  :class="{ active: stall.currentImageIndex === (n - 1) }"
                  @click.stop="changeStallImage(stall, n - 1)"
                ></div>
              </div>
            </div>
            <div class="stall-info">
              <div class="stall-header">
                <span class="stall-badge">{{ stall.stallNumber }}</span>
                <span class="stall-price">{{ stall.price }}</span>
              </div>
              <div class="stall-details">
                <p>
                  <strong>{{ stall.floor }}</strong> / {{ stall.section }}
                </p>
                <div class="size-btn-row">
                  <p>{{ stall.dimensions }}</p>
                  <button v-if="shouldShowApplyButton(stall)" class="apply-btn" @click.stop="openApplyForm(stall)">
                    APPLY NOW!
                  </button>
                  <button v-else-if="!stall.isAvailable" class="apply-btn occupied" disabled>
                    OCCUPIED
                  </button>
                  <!-- No button for Auction and Raffle stalls -->
                </div>
                <p class="location-info">
                  <strong>{{ stall.branch }}</strong> - {{ stall.branchLocation }}
                </p>
                <p class="stall-description">{{ stall.description }}</p>
                <div v-if="stall.managerName" class="manager-info">
                  Managed by: {{ stall.managerName }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Pagination Controls -->
    <div v-if="!loading && !error && totalPages > 1" class="pagination-controls">
      <button class="pagination-btn prev-btn" @click="previousPage" :disabled="currentPage === 1"
        :class="{ disabled: currentPage === 1 }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        Previous
      </button>

      <div class="pagination-info">
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <span class="stall-count">({{ filteredStalls.length }} stalls)</span>
      </div>

      <button class="pagination-btn next-btn" @click="nextPage" :disabled="currentPage === totalPages"
        :class="{ disabled: currentPage === totalPages }">
        Next
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <!-- No Results Message -->
    <div v-if="!loading && !error && filteredStalls.length === 0" class="no-results">
      <div class="no-results-content">
        <h3>No stalls found</h3>
        <p>No stalls match your current filters. Try adjusting your search criteria.</p>
      </div>
    </div>

    <!-- StallApplicationContainer.vue -->
    <StallApplicationContainer v-if="showApplyForm" :stall="selectedStall" :showForm="showApplyForm"
      @close="closeApplyForm" />

    <!-- Stall Details Modal -->
    <transition name="modal-fade">
      <div v-if="showStallDetails" class="modal-overlay" @click.self="closeStallDetails">
        <div class="modal-container professional">
          <!-- Close button floating -->
          <button class="close-btn-floating" @click="closeStallDetails">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <div class="modal-content" v-if="selectedStallDetails">
            <!-- Image Gallery Section - Full width hero -->
            <div class="modal-image-hero">
              <div class="hero-image-container" @click="openFullscreenViewer">
                <!-- Loading State -->
                <div v-if="loadingImages" class="hero-loading">
                  <div class="loading-spinner"></div>
                  <span>Loading images...</span>
                </div>
                <!-- Image Display -->
                <img v-else :src="currentDisplayImage" :alt="`Stall ${selectedStallDetails.stallNumber}`"
                  @error="handleImageError" class="hero-image" />
                
                <!-- Gradient overlay -->
                <div class="hero-gradient"></div>
                
                <!-- Stall number badge on image -->
                <div class="hero-badge">
                  <span class="badge-number">{{ selectedStallDetails.stallNumber }}</span>
                  <span class="badge-status" :class="getStallBadgeClass(selectedStallDetails)">
                    {{ getStallBadgeText(selectedStallDetails) }}
                  </span>
                </div>
                
                <!-- Image navigation arrows -->
                <template v-if="!loadingImages && stallImages.length > 1">
                  <button class="hero-nav prev" @click.stop="prevImage">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button class="hero-nav next" @click.stop="nextImage">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </template>
                
                <!-- Image dots indicator -->
                <div class="hero-dots" v-if="!loadingImages && stallImages.length > 1">
                  <span 
                    v-for="(img, index) in stallImages" 
                    :key="index"
                    class="dot"
                    :class="{ active: currentImageIndex === index }"
                    @click.stop="currentImageIndex = index"
                  ></span>
                </div>
              </div>
            </div>

            <!-- Info Section - Clean card layout -->
            <div class="modal-info-card">
              <!-- Price highlight -->
              <div class="price-section">
                <span class="price-label">Monthly Rent</span>
                <span class="price-amount">{{ selectedStallDetails.price }}</span>
                <span class="price-type">{{ selectedStallDetails.price_type || 'Fixed Price' }}</span>
              </div>

              <!-- Details grid -->
              <div class="details-grid">
                <div class="detail-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                  </svg>
                  <div class="detail-content">
                    <span class="detail-label">Floor & Section</span>
                    <span class="detail-value">{{ selectedStallDetails.floor }} / {{ selectedStallDetails.section }}</span>
                  </div>
                </div>

                <div class="detail-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18"></rect>
                  </svg>
                  <div class="detail-content">
                    <span class="detail-label">Dimensions</span>
                    <span class="detail-value">{{ selectedStallDetails.dimensions }}</span>
                  </div>
                </div>

                <div class="detail-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div class="detail-content">
                    <span class="detail-label">Location</span>
                    <span class="detail-value">{{ selectedStallDetails.branch }}</span>
                  </div>
                </div>

                <div class="detail-item" v-if="selectedStallDetails.managerName && selectedStallDetails.managerName !== 'Unknown' && selectedStallDetails.managerName !== 'N/A'">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <div class="detail-content">
                    <span class="detail-label">Manager</span>
                    <span class="detail-value">{{ selectedStallDetails.managerName }}</span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div class="description-section" v-if="selectedStallDetails.description">
                <span class="description-label">About this stall</span>
                <p class="description-text">{{ selectedStallDetails.description }}</p>
              </div>

              <!-- Apply button -->
              <button 
                v-if="shouldShowApplyButton(selectedStallDetails)" 
                class="apply-btn-large" 
                @click="applyFromModal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                APPLY NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Fullscreen Image Viewer -->
    <transition name="fade">
      <div v-if="showFullscreenViewer" class="fullscreen-viewer" @click.self="closeFullscreenViewer">
        <button class="fullscreen-close" @click="closeFullscreenViewer">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6L18 18"></path>
          </svg>
        </button>
        
        <div class="fullscreen-content">
          <!-- Main Image -->
          <div class="fullscreen-image-container">
            <img :src="currentDisplayImage" :alt="`Stall ${selectedStallDetails?.stallNumber}`" @error="handleImageError" />
          </div>
          
          <!-- Navigation Arrows -->
          <template v-if="stallImages.length > 1">
            <button class="fullscreen-nav prev" @click="prevImage" :disabled="currentImageIndex === 0">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button class="fullscreen-nav next" @click="nextImage" :disabled="currentImageIndex === stallImages.length - 1">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </template>
          
          <!-- Image Counter -->
          <div class="fullscreen-counter" v-if="stallImages.length > 0">
            {{ currentImageIndex + 1 }} / {{ stallImages.length }}
          </div>
          
          <!-- Thumbnail Strip -->
          <div class="fullscreen-thumbnails" v-if="stallImages.length > 1">
            <div 
              v-for="(img, index) in stallImages" 
              :key="img.id || index"
              class="fullscreen-thumb"
              :class="{ active: currentImageIndex === index }"
              @click="currentImageIndex = index"
            >
              <img :src="buildImageUrl(img.image_url)" :alt="`Image ${index + 1}`" @error="handleThumbnailError($event)" />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import StallApplicationContainer from '../StallApplicationContainer.vue'
import stallBackgroundImg from '@/assets/stallbackground.png'

export default {
  name: 'AvailableStalls',
  components: {
    StallApplicationContainer,
  },
  emits: ['modal-opened', 'modal-closed'],
  props: {
    filteredStalls: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      showApplyForm: false,
      selectedStall: null,
      showStallDetails: false,
      selectedStallDetails: null,
      currentPage: 1,
      stallsPerPage: 8,
      // Image gallery
      stallImages: [],
      currentImageIndex: 0,
      loadingImages: false,
      // Fullscreen viewer
      showFullscreenViewer: false,
      // Stall images cache for main grid
      stallImageCache: new Map(),
      // Auto slideshow
      autoSlideInterval: null,
      autoSlideDelay: 3000, // 3 seconds
      // Grid auto slideshow
      gridAutoSlideInterval: null,
      gridAutoSlideDelay: 2500, // 2.5 seconds for grid cards
      // Wheel listener for closing modal on scroll
      wheelListener: null,
      wheelScrollAccumulator: 0,
      wheelScrollThreshold: 150, // Pixels of wheel scroll to close
    }
  },
  beforeUnmount() {
    // Clean up auto slide interval
    this.stopAutoSlide()
    this.stopGridAutoSlide()
    // Remove wheel listener
    this.removeWheelListener()
    // Restore body scroll
    document.body.style.overflow = ''
  },
  mounted() {
    // Start grid auto slide after a short delay to allow images to load
    setTimeout(() => {
      this.startGridAutoSlide()
    }, 1000)
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredStalls.length / this.stallsPerPage)
    },
    paginatedStalls() {
      const startIndex = (this.currentPage - 1) * this.stallsPerPage
      const endIndex = startIndex + this.stallsPerPage
      const stalls = this.filteredStalls.slice(startIndex, endIndex)

      // Ensure all stalls have an image and fetch image info
      return stalls.map((stall) => {
        const stallWithDefaults = {
          ...stall,
          imageUrl: stall.imageUrl || stall.image || stallBackgroundImg,
          currentImageIndex: 0,
          imageCount: 1,
          stallImages: []
        }
        
        // Fetch images for this stall if not cached
        this.fetchStallImagesForGrid(stallWithDefaults)
        
        return stallWithDefaults
      })
    },
    currentDisplayImage() {
      // If we have fetched images, use the current one
      if (this.stallImages.length > 0 && this.stallImages[this.currentImageIndex]) {
        return this.buildImageUrl(this.stallImages[this.currentImageIndex].image_url)
      }
      // Fallback to the stall's primary image
      return this.selectedStallDetails?.imageUrl || stallBackgroundImg
    },
  },
  watch: {
    filteredStalls() {
      this.currentPage = 1
    },
  },
  methods: {
    handleImageError(event) {
      event.target.src = stallBackgroundImg
    },

    handleThumbnailError(event) {
      event.target.src = stallBackgroundImg
    },

    buildImageUrl(imagePath) {
      if (!imagePath) return stallBackgroundImg
      // Already a full URL
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
      // Build full URL from relative path (legacy file-based)
      const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost'
      return `${imageBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
    },

    async fetchStallImagesForGrid(stall) {
      if (!stall.id) return
      
      // Check if we already have this stall's images cached
      if (this.stallImageCache.has(stall.id)) {
        const cachedImages = this.stallImageCache.get(stall.id)
        stall.stallImages = cachedImages
        stall.imageCount = cachedImages.length
        return
      }
      
      // Use BLOB API for cloud deployment
      await this.fetchImagesFromBlobApiForGrid(stall)
    },

    async fetchImagesFromBlobApiForGrid(stall) {
      if (!stall.id) {
        stall.stallImages = []
        stall.imageCount = 1
        return
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      // Remove trailing /api if present to avoid double /api in URLs
      const baseUrl = apiBaseUrl.replace(/\/api$/, '')
      const stallId = stall.id
      
      try {
        // Fetch images from PUBLIC BLOB API endpoint (no auth required)
        const response = await fetch(`${baseUrl}/api/stalls/public/${stallId}/images/blob`)
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.images && result.data.images.length > 0) {
            const images = result.data.images.map(img => ({
              id: img.id,
              stall_id: stallId,
              image_url: `${baseUrl}/api/stalls/images/blob/id/${img.id}`,
              display_order: img.display_order,
              is_primary: img.is_primary ? 1 : 0
            }))
            
            // Cache the results
            this.stallImageCache.set(stallId, images)
            stall.stallImages = images
            stall.imageCount = images.length
            console.log(`📷 Grid: Loaded ${images.length} BLOB images for stall ${stallId}`)
            return
          }
        }
      } catch (error) {
        console.log(`📷 Grid: BLOB API error for stall ${stallId}:`, error.message)
      }
      
      // Fallback: no images found
      stall.stallImages = []
      stall.imageCount = 1
    },

    async fetchImagesFromFileSystemForGrid(stall) {
      // Legacy method - redirect to BLOB API
      return this.fetchImagesFromBlobApiForGrid(stall)
    },

    getStallDisplayImage(stall) {
      // If stall has multiple images, show the current one
      if (stall.stallImages && stall.stallImages.length > 0 && stall.stallImages[stall.currentImageIndex]) {
        return this.buildImageUrl(stall.stallImages[stall.currentImageIndex].image_url)
      }
      // Fallback to original image
      return stall.imageUrl || stall.image || stallBackgroundImg
    },

    changeStallImage(stall, imageIndex) {
      if (stall.stallImages && stall.stallImages.length > imageIndex) {
        stall.currentImageIndex = imageIndex
        // Force reactivity update
        this.$forceUpdate()
      }
    },

    async openStallDetails(stall) {
      this.selectedStallDetails = stall
      this.showStallDetails = true
      this.currentImageIndex = 0
      this.stallImages = []
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      
      // Emit event to parent to pause scroll listener
      this.$emit('modal-opened')
      
      // Setup wheel listener to close modal on scroll
      this.setupWheelListener()
      
      // Fetch all images for this stall
      await this.fetchStallImages(stall.id)
      
      // Start auto slideshow if multiple images
      this.startAutoSlide()
    },

    async fetchStallImages(stallId) {
      if (!stallId) return
      
      this.loadingImages = true
      
      // Use BLOB API for cloud deployment
      await this.fetchImagesFromBlobApi(stallId)
      
      this.loadingImages = false
    },

    async fetchImagesFromBlobApi(stallId) {
      // Fetch images from BLOB storage API
      const stall = this.selectedStallDetails
      if (!stall) return
      
      console.log(`🔍 Fetching images for stall ${stallId} from BLOB API`)
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      // Remove trailing /api if present to avoid double /api in URLs
      const baseUrl = apiBaseUrl.replace(/\/api$/, '')
      
      try {
        // Use PUBLIC BLOB API endpoint (no auth required)
        const response = await fetch(`${baseUrl}/api/stalls/public/${stallId}/images/blob`)
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.images && result.data.images.length > 0) {
            this.stallImages = result.data.images.map(img => ({
              id: img.id,
              stall_id: stallId,
              image_url: `${baseUrl}/api/stalls/images/blob/id/${img.id}`,
              display_order: img.display_order,
              is_primary: img.is_primary ? 1 : 0
            }))
            console.log(`📷 Modal: Loaded ${this.stallImages.length} BLOB images for stall ${stallId}`)
            return
          }
        }
      } catch (error) {
        console.log(`📷 Modal: BLOB API error for stall ${stallId}:`, error.message)
      }
      
      // Fallback: use stall's main image or placeholder
      console.log(`❌ No BLOB images found, using fallback`)
      if (stall.imageUrl && stall.imageUrl !== 'stall-image.jpg') {
        this.stallImages = [{
          id: 'fallback_1',
          stall_id: stallId,
          image_url: stall.imageUrl,
          display_order: 1,
          is_primary: 1
        }]
      } else {
        this.stallImages = [{
          id: 'placeholder',
          stall_id: stallId,
          image_url: stallBackgroundImg,
          display_order: 1,
          is_primary: 1
        }]
      }
    },

    // Legacy method - redirects to BLOB API
    async fetchImagesFromFileSystem(stallId) {
      return this.fetchImagesFromBlobApi(stallId)
    },

    prevImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--
      }
    },

    nextImage() {
      if (this.currentImageIndex < this.stallImages.length - 1) {
        this.currentImageIndex++
      }
    },

    startAutoSlide() {
      // Stop any existing interval
      this.stopAutoSlide()
      
      // Only start if there are multiple images
      if (this.stallImages.length > 1) {
        this.autoSlideInterval = setInterval(() => {
          // Loop back to first image after last
          if (this.currentImageIndex >= this.stallImages.length - 1) {
            this.currentImageIndex = 0
          } else {
            this.currentImageIndex++
          }
        }, this.autoSlideDelay)
      }
    },

    stopAutoSlide() {
      if (this.autoSlideInterval) {
        clearInterval(this.autoSlideInterval)
        this.autoSlideInterval = null
      }
    },

    // Restart auto slide when images are loaded
    restartAutoSlide() {
      if (this.stallImages.length > 1) {
        this.startAutoSlide()
      }
    },

    // Grid auto slide methods
    startGridAutoSlide() {
      this.stopGridAutoSlide()
      
      this.gridAutoSlideInterval = setInterval(() => {
        // Get all stalls from cache and advance their images
        this.stallImageCache.forEach((images, stallId) => {
          if (images.length > 1) {
            // Find the stall in paginatedStalls
            const stall = this.paginatedStalls.find(s => s.id === stallId)
            if (stall) {
              // Advance to next image, loop back to 0
              const nextIndex = (stall.currentImageIndex + 1) % images.length
              stall.currentImageIndex = nextIndex
            }
          }
        })
        // Force reactivity update
        this.$forceUpdate()
      }, this.gridAutoSlideDelay)
    },

    stopGridAutoSlide() {
      if (this.gridAutoSlideInterval) {
        clearInterval(this.gridAutoSlideInterval)
        this.gridAutoSlideInterval = null
      }
    },

    // Wheel listener to close modal on scroll
    setupWheelListener() {
      this.wheelScrollAccumulator = 0
      this.wheelListener = (e) => {
        // Accumulate scroll delta
        this.wheelScrollAccumulator += Math.abs(e.deltaY)
        
        // If accumulated scroll exceeds threshold, close modal
        if (this.wheelScrollAccumulator > this.wheelScrollThreshold) {
          this.closeStallDetails()
        }
      }
      window.addEventListener('wheel', this.wheelListener, { passive: true })
    },

    removeWheelListener() {
      if (this.wheelListener) {
        window.removeEventListener('wheel', this.wheelListener)
        this.wheelListener = null
      }
      this.wheelScrollAccumulator = 0
    },

    closeStallDetails() {
      this.showStallDetails = false
      this.selectedStallDetails = null
      this.stallImages = []
      this.currentImageIndex = 0
      this.showFullscreenViewer = false
      
      // Stop auto slideshow
      this.stopAutoSlide()
      
      // Remove wheel listener
      this.removeWheelListener()
      
      // Restore body scroll
      document.body.style.overflow = ''
      
      // Emit event to parent to resume scroll listener
      this.$emit('modal-closed')
    },

    openFullscreenViewer() {
      this.showFullscreenViewer = true
      // Prevent body scroll when fullscreen is open
      document.body.style.overflow = 'hidden'
    },

    closeFullscreenViewer() {
      this.showFullscreenViewer = false
      // Restore body scroll
      document.body.style.overflow = ''
    },

    openImageGallery() {
      // Legacy method - now using fullscreen viewer
      this.openFullscreenViewer()
    },

    applyFromModal() {
      // Close the details modal and open the application form
      this.selectedStall = this.selectedStallDetails
      this.showStallDetails = false
      this.showApplyForm = true
      this.$emit('application-form-opened')
    },

    openApplyForm(stall) {
      console.log('📝 Opening application form for stall:', {
        stallNumber: stall.stallNumber,
        branch: stall.branch,
        price: stall.price,
        price_type: stall.price_type
      })
      this.selectedStall = stall
      this.showApplyForm = true
      this.$emit('application-form-opened')
    },

    closeApplyForm() {
      this.showApplyForm = false
      this.selectedStall = null
      this.$emit('application-form-closed')
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },

    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },

    getStallBadgeClass(stall) {
      // If stall is not available (occupied), return unavailable class
      if (!stall.isAvailable) {
        return 'unavailable'
      }

      // For available stalls, return class based on price type
      // Support both snake_case and camelCase property names
      const priceType = stall.price_type || stall.priceType
      switch (priceType) {
        case 'Fixed Price':
          return 'available'
        case 'Auction':
          return 'auction'
        case 'Raffle':
          return 'raffle'
        default:
          return 'available' // fallback to available for unknown types
      }
    },

    getStallBadgeText(stall) {
      // If stall is not available (occupied), return "Occupied"
      if (!stall.isAvailable) {
        return 'Occupied'
      }

      // For available stalls, return text based on price type
      // Support both snake_case and camelCase property names
      const priceType = stall.price_type || stall.priceType
      switch (priceType) {
        case 'Fixed Price':
          return 'Available'
        case 'Auction':
          return 'Auction'
        case 'Raffle':
          return 'Raffle'
        default:
          return 'Available' // fallback to available for unknown types
      }
    },

    shouldShowApplyButton(stall) {
      // Check if stall is available
      const isAvailable =
        stall.isAvailable === true || stall.isAvailable === 1 || stall.isAvailable === '1'
      if (!isAvailable) {
        return false
      }

      // Get price type and normalize it - default to 'Fixed Price' if empty/null
      // Support both snake_case and camelCase property names
      const rawPriceType = stall.price_type || stall.priceType
      const priceType = rawPriceType ? rawPriceType.toString().toLowerCase().trim() : 'fixed price'

      // Only show apply button for Fixed Price stalls
      // Explicitly exclude Auction and Raffle
      const isFixedPrice =
        priceType === 'fixed price' ||
        priceType === 'fixed' ||
        priceType === ''

      // Make sure it's NOT auction or raffle
      const isAuctionOrRaffle = priceType === 'auction' || priceType === 'raffle'

      return isFixedPrice && !isAuctionOrRaffle
    },
  },
}
</script>

<style scoped src="../../../../../assets/css/availablestallstyle.css"></style>
