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
              <div class="stall-status-badge" :class="stall.isAvailable ? 'available' : 'unavailable'">
                {{ stall.isAvailable ? 'Available' : 'Occupied' }}
              </div>
            </div>
            <div class="stall-info">
              <div class="stall-header">
                <span class="stall-badge">{{ stall.stallNumber }}</span>
                <span class="stall-price">{{ stall.price }}</span>
              </div>
              <div class="stall-details">
                <p><strong>{{ stall.floor }}</strong> / {{ stall.section }}</p>
                <div class="size-btn-row">
                  <p>{{ stall.dimensions }}</p>
                  <button 
                    v-if="stall.isAvailable" 
                    class="apply-btn" 
                    @click="openApplyForm(stall)"
                  >
                    APPLY NOW!
                  </button>
                  <button 
                    v-else 
                    class="apply-btn occupied" 
                    disabled
                  >
                    OCCUPIED
                  </button>
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
      <button 
        class="pagination-btn prev-btn" 
        @click="previousPage" 
        :disabled="currentPage === 1"
        :class="{ disabled: currentPage === 1 }"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Previous
      </button>

      <div class="pagination-info">
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <span class="stall-count">({{ filteredStalls.length }} stalls)</span>
      </div>

      <button 
        class="pagination-btn next-btn" 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
        :class="{ disabled: currentPage === totalPages }"
      >
        Next
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
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
    <StallApplicationContainer 
      v-if="showApplyForm" 
      :stall="selectedStall" 
      :showForm="showApplyForm"
      @close="closeApplyForm" 
    />
  </div>
</template>

<script>
import StallApplicationContainer from "../StallApplicationContainer.vue";
import stallBackgroundImg from '@/assets/stallbackground.png'

export default {
  name: "AvailableStalls",
  components: {
    StallApplicationContainer,
  },
  props: {
    filteredStalls: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      showApplyForm: false,
      selectedStall: null,
      currentPage: 1,
      stallsPerPage: 6,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredStalls.length / this.stallsPerPage);
    },
    paginatedStalls() {
      const startIndex = (this.currentPage - 1) * this.stallsPerPage;
      const endIndex = startIndex + this.stallsPerPage;
      const stalls = this.filteredStalls.slice(startIndex, endIndex);
      
      // Ensure all stalls have an image
      return stalls.map(stall => ({
        ...stall,
        imageUrl: stall.imageUrl || stall.image || stallBackgroundImg
      }));
    },
  },
  watch: {
    filteredStalls() {
      this.currentPage = 1;
    }
  },
  methods: {
    handleImageError(event) {
      event.target.src = stallBackgroundImg;
    },

    openApplyForm(stall) {
      this.selectedStall = stall;
      this.showApplyForm = true;
    },

    closeApplyForm() {
      this.showApplyForm = false;
      this.selectedStall = null;
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
  },
};
</script>

<style scoped src="../../../../../assets/css/availablestallstyle.css"></style>
