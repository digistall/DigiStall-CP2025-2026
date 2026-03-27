<template>
  <Teleport to="body">
    <Transition name="fade-scale">
      <div v-if="isVisible" class="team-modal-overlay" @click.self="close">
        <div class="team-modal-container glass-card" role="dialog" aria-modal="true" aria-labelledby="team-modal-title">
          
          <button class="close-btn" @click="close" aria-label="Close team modal">
            <i class="mdi mdi-close"></i>
          </button>

          <div class="team-header">
            <h2 id="team-modal-title" class="section-title">DIGISTALL TEAM</h2>
            <div class="title-divider"></div>
          </div>

          <div class="team-grid">
            <!-- Team Member 1 -->
            <div class="team-card">
              <div class="member-image-wrapper">
                <img src="../../../assets/Archivido.png" alt="Giuseppe Marie B. Archivido" loading="lazy" />
                <div class="member-overlay"></div>
              </div>
              <div class="member-info">
                <h3 class="member-name">Giuseppe Marie B.<br>Archivido</h3>
                <p class="member-role">Leader</p>
              </div>
            </div>

            <!-- Team Member 2 -->
            <div class="team-card">
              <div class="member-image-wrapper">
                <img src="../../../assets/Laurente.png" alt="Jeno Aldrei A. Laurente" loading="lazy" />
                <div class="member-overlay"></div>
              </div>
              <div class="member-info">
                <h3 class="member-name">Jeno Aldrei A.<br>Laurente</h3>
                <p class="member-role">Lead Developer</p>
              </div>
            </div>

            <!-- Team Member 3 -->
            <div class="team-card">
              <div class="member-image-wrapper">
                <img src="../../../assets/Luansing.png" alt="Shimri Gabriel C. Luansing" loading="lazy" />
                <div class="member-overlay"></div>
              </div>
              <div class="member-info">
                <h3 class="member-name">Shimri Gabriel C.<br>Luansing</h3>
                <p class="member-role">Analyst</p>
              </div>
            </div>

            <!-- Team Member 4 -->
            <div class="team-card">
              <div class="member-image-wrapper">
                <img src="../../../assets/Dejumo.png" alt="Voun Irish Florence C. Dejumo" loading="lazy" />
                <div class="member-overlay"></div>
              </div>
              <div class="member-info">
                <h3 class="member-name">Voun Irish Florence<br>C. Dejumo</h3>
                <p class="member-role">Developer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: "TeamSection",
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    close() {
      this.$emit('close');
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  },
  beforeUnmount() {
    if (this.isVisible) {
      document.body.style.overflow = '';
    }
  }
};
</script>

<style scoped>
/* Modal Overlay */
.team-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 15, 45, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  overflow-y: auto;
}

/* Modal Container */
.team-modal-container {
  background: #ffffff;
  width: 100%;
  max-width: 1100px;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  position: relative;
  padding: 50px 40px;
  margin: auto;
}

/* Close Button */
.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 33, 129, 0.05);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.close-btn i {
  font-size: 24px;
  color: #002181;
}

.close-btn:hover {
  background: rgba(0, 33, 129, 0.1);
  transform: rotate(90deg);
}

.team-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-title {
  font-size: 2rem;
  font-weight: 800;
  color: #060d1e;
  letter-spacing: 2px;
  margin: 0 0 16px 0;
  text-transform: uppercase;
}

.title-divider {
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #002181, #4FC3F7);
  margin: 0 auto;
  border-radius: 2px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.team-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  aspect-ratio: 3/4;
}

.team-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 33, 129, 0.2);
}

.member-image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.member-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.team-card:hover .member-image-wrapper img {
  transform: scale(1.05);
}

.member-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 40%, transparent 70%);
  z-index: 1;
}

.member-info {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 30px 16px 20px;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 140px; /* Provides consistent bottom spacing */
}

.member-name {
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  margin: auto 0 6px 0; /* Auto margin top pushes text down against the role */
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.member-role {
  color: #4FC3F7;
  font-size: 0.75rem;
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Transitions */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.3s ease;
}

.fade-scale-enter-active .team-modal-container,
.fade-scale-leave-active .team-modal-container {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
}

.fade-scale-enter-from .team-modal-container,
.fade-scale-leave-to .team-modal-container {
  transform: scale(0.95) translateY(20px);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .team-grid {
    gap: 16px;
  }
}

@media (max-width: 860px) {
  .team-modal-container {
    padding: 40px 24px;
  }
  .team-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 500px;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .team-modal-overlay {
    padding: 20px 12px;
  }
  .team-modal-container {
    padding: 32px 16px;
  }
  .section-title {
    font-size: 1.6rem;
  }
  .team-grid {
    grid-template-columns: 1fr;
    max-width: 280px;
  }
  .team-card {
    aspect-ratio: 4/5;
  }
}
</style>
