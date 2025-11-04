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
          <div class="stall-card" v-for="stall in paginatedStalls" :key="stall.id">
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
                  <button v-if="shouldShowApplyButton(stall)" class="apply-btn" @click="openApplyForm(stall)">
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

    openApplyForm(stall) {
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
      const priceType = (stall.price_type || 'Fixed Price').toString().toLowerCase().trim()

      // Temporary debug logging
      console.log(
        `🔍 Stall ${stall.stallNumber}: priceType="${priceType}", raw price_type="${stall.price_type}"`,
      )

      // Check if it's a fixed price stall (handle various formats)
      const isFixedPrice =
        priceType === 'fixed price' ||
        priceType === 'fixed' ||
        priceType === '' ||
        priceType === 'null' ||
        priceType === 'undefined'

      console.log(
        `🔍 Stall ${stall.stallNumber}: isFixedPrice=${isFixedPrice}, showing button=${isFixedPrice}`,
      )

      return isFixedPrice
    },
  },
}
</script>

<style scoped src="../../../../../assets/css/availablestallstyle.css"></style>
