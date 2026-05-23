<template>
  <div class="mobile-branch-selector">
    <!-- Floating Action Button -->
    <MobileFAB
      :branchCount="availableBranches.length"
      :hidden="isFabHidden"
      :pulse="!isSheetOpen && !isDrawerOpen"
      @click="openSheet"
    />

    <!-- Branch Selection Sheet -->
    <MobileBranchSheet
      :isOpen="isSheetOpen"
      :branches="availableBranches"
      :selectedBranch="selectedBranch"
      :loading="loading"
      :error="error"
      @close="closeSheet"
      @select-branch="selectBranch"
      @retry="$emit('retry-branches')"
    />

    <!-- Stall Browser Drawer -->
    <MobileStallDrawer
      :isOpen="isDrawerOpen"
      :selectedBranch="selectedBranch"
      :stalls="stalls"
      :loading="stallsLoading"
      :error="stallsError"
      @close="closeDrawer"
      @retry="retryStalls"
    />
  </div>
</template>

<script>
import MobileFAB from './MobileFAB.vue';
import MobileBranchSheet from './MobileBranchSheet.vue';
import MobileStallDrawer from './MobileStallDrawer.vue';

export default {
  name: "MobileBranchSelector",
  components: {
    MobileFAB,
    MobileBranchSheet,
    MobileStallDrawer
  },
  props: {
    availableBranches: {
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
    },
    stalls: {
      type: Array,
      default: () => []
    },
    stallsLoading: {
      type: Boolean,
      default: false
    },
    stallsError: {
      type: String,
      default: null
    }
  },
  emits: ['retry-branches', 'branch-selected', 'retry-stalls'],
  data() {
    return {
      isSheetOpen: false,
      isDrawerOpen: false,
      selectedBranch: null,
      lastScrollY: 0,
      isFabHidden: false,
      scrollListener: null,
      heroButtonListener: null
    }
  },
  mounted() {
    this.setupScrollListener();
    this.setupHeroButtonListener();
  },
  beforeUnmount() {
    this.removeScrollListener();
    this.removeHeroButtonListener();
  },
  methods: {
    setupScrollListener() {
      this.lastScrollY = window.scrollY;
      this.scrollListener = () => {
        const currentScrollY = window.scrollY;

        // Hide FAB when scrolling down, show when scrolling up
        if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
          this.isFabHidden = true;
        } else {
          this.isFabHidden = false;
        }

        this.lastScrollY = currentScrollY;
      };
      window.addEventListener('scroll', this.scrollListener, { passive: true });
    },
    removeScrollListener() {
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
      }
    },
    setupHeroButtonListener() {
      // Listen for "Browse Stalls" button click from hero section
      this.heroButtonListener = () => {
        console.log('📱 Received open-mobile-stall-browser event');
        this.openSheet();
      };
      window.addEventListener('open-mobile-stall-browser', this.heroButtonListener);
    },
    removeHeroButtonListener() {
      if (this.heroButtonListener) {
        window.removeEventListener('open-mobile-stall-browser', this.heroButtonListener);
      }
    },
    openSheet() {
      this.isSheetOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeSheet() {
      this.isSheetOpen = false;
      document.body.style.overflow = '';
    },
    selectBranch(branch) {
      this.selectedBranch = branch;
      this.closeSheet();

      // Emit event to parent to fetch stalls
      this.$emit('branch-selected', branch);

      // Open the stall drawer
      this.$nextTick(() => {
        this.isDrawerOpen = true;
      });
    },
    closeDrawer() {
      this.isDrawerOpen = false;
      this.selectedBranch = null;
      document.body.style.overflow = '';
    },
    retryStalls() {
      if (this.selectedBranch) {
        this.$emit('retry-stalls', this.selectedBranch);
      }
    }
  },
  watch: {
    stallsError(newVal) {
      // Handle stalls error if drawer is open
      if (newVal && this.isDrawerOpen) {
        console.log('Stalls error:', newVal);
      }
    }
  }
}
</script>
