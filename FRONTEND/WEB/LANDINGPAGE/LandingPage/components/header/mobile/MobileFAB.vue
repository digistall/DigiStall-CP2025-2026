<template>
  <button
    class="mobile-fab"
    :class="{ 'hidden': hidden, 'pulse': pulse && !hidden }"
    @click="$emit('click')"
    aria-label="Browse available stalls"
  >
    <i class="mdi mdi-store-search mobile-fab-icon"></i>
    <span v-if="branchCount > 0" class="mobile-fab-badge">{{ branchCount }}</span>
  </button>
</template>

<script>
export default {
  name: "MobileFAB",
  props: {
    branchCount: {
      type: Number,
      default: 0
    },
    hidden: {
      type: Boolean,
      default: false
    },
    pulse: {
      type: Boolean,
      default: true
    }
  },
  emits: ['click']
}
</script>

<style>
/* FAB styles - unscoped for fixed positioning */
.mobile-fab {
  position: fixed;
  bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  right: 20px;
  z-index: 9999;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #002181 0%, #1976d2 100%);
  border: none;
  box-shadow: 0 4px 20px rgba(0, 33, 129, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-fab:hover,
.mobile-fab:active {
  transform: scale(1.05);
  box-shadow: 0 6px 24px rgba(0, 33, 129, 0.5);
}

.mobile-fab.hidden {
  transform: translateY(100px);
  opacity: 0;
  pointer-events: none;
}

.mobile-fab-icon {
  font-size: 24px;
  color: white;
}

.mobile-fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #4FC3F7;
  color: #002181;
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-fab.pulse {
  animation: fabPulse 2s ease-in-out infinite;
}

@keyframes fabPulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(0, 33, 129, 0.4);
  }
  50% {
    box-shadow: 0 4px 30px rgba(0, 33, 129, 0.6),
                0 0 0 8px rgba(0, 33, 129, 0.1);
  }
}
</style>
