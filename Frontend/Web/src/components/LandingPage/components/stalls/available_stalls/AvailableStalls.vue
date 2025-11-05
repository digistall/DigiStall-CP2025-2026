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
              <img :src="stall.imageUrl" :alt="`Stall ${stall.stallNumber}`" @error="handleImageError" />
              <div class="stall-status-badge" :class="getStallBadgeClass(stall)">
                {{ getStallBadgeText(stall) }}
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
        <div class="modal-container">
          <div class="modal-header">
            <h2>Stall Details</h2>
            <button class="close-btn" @click="closeStallDetails">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="modal-content" v-if="selectedStallDetails">
            <div class="modal-image-section">
              <img :src="selectedStallDetails.imageUrl" :alt="`Stall ${selectedStallDetails.stallNumber}`"
                @error="handleImageError" />
            </div>

            <div class="modal-info-section">
              <div class="info-row">
                <span class="info-label">Stall Number:</span>
                <span class="info-value stall-number-highlight">{{ selectedStallDetails.stallNumber }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Price:</span>
                <span class="info-value price-highlight">{{ selectedStallDetails.price }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Price Type:</span>
                <span class="info-value">{{ selectedStallDetails.price_type || 'Fixed Price' }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Floor:</span>
                <span class="info-value">{{ selectedStallDetails.floor }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Section:</span>
                <span class="info-value">{{ selectedStallDetails.section }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Dimensions:</span>
                <span class="info-value">{{ selectedStallDetails.dimensions }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Branch:</span>
                <span class="info-value">{{ selectedStallDetails.branch }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-value">{{ selectedStallDetails.branchLocation }}</span>
              </div>

              <div class="info-row" v-if="selectedStallDetails.managerName">
                <span class="info-label">Manager:</span>
                <span class="info-value">{{ selectedStallDetails.managerName }}</span>
              </div>

              <div class="info-row full-width" v-if="selectedStallDetails.description">
                <span class="info-label">Description:</span>
                <p class="info-description">{{ selectedStallDetails.description }}</p>
              </div>

              <div class="modal-actions">
                <button v-if="shouldShowApplyButton(selectedStallDetails)" class="modal-apply-btn"
                  @click="applyFromModal">
                  APPLY NOW!
                </button>
                <button v-else-if="!selectedStallDetails.isAvailable" class="modal-apply-btn occupied" disabled>
                  OCCUPIED
                </button>
                <button class="modal-close-btn" @click="closeStallDetails">Close</button>
              </div>
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
      stallsPerPage: 6,
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredStalls.length / this.stallsPerPage)
    },
    paginatedStalls() {
      const startIndex = (this.currentPage - 1) * this.stallsPerPage
      const endIndex = startIndex + this.stallsPerPage
      const stalls = this.filteredStalls.slice(startIndex, endIndex)

      // Ensure all stalls have an image
      return stalls.map((stall) => ({
        ...stall,
        imageUrl: stall.imageUrl || stall.image || stallBackgroundImg,
      }))
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

    openStallDetails(stall) {
      this.selectedStallDetails = stall
      this.showStallDetails = true
    },

    closeStallDetails() {
      this.showStallDetails = false
      this.selectedStallDetails = null
    },

    applyFromModal() {
      // Close the details modal and open the application form
      this.selectedStall = this.selectedStallDetails
      this.showStallDetails = false
      this.showApplyForm = true
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
    },

    closeApplyForm() {
      this.showApplyForm = false
      this.selectedStall = null
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
      switch (stall.price_type) {
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
      switch (stall.price_type) {
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
      const priceType = stall.price_type ? stall.price_type.toString().toLowerCase().trim() : 'fixed price'

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
