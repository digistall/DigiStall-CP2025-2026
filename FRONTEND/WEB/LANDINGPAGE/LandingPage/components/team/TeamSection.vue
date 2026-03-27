<template>
  <section id="team" class="team-section">
    <div class="team-container">
      <div class="team-header animate-on-scroll fade-up">
        <h2 class="section-title">DIGISTALL TEAM</h2>
        <div class="title-divider"></div>
      </div>

      <div class="team-grid">
        <!-- Team Member 1 -->
        <div class="team-card animate-on-scroll fade-up animate-delay-1">
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
        <div class="team-card animate-on-scroll fade-up animate-delay-2">
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
        <div class="team-card animate-on-scroll fade-up animate-delay-3">
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
        <div class="team-card animate-on-scroll fade-up animate-delay-4">
          <div class="member-image-wrapper">
            <img src="../../../assets/Dejumo.png" alt="Voun Irish Florence C. Dejumo" loading="lazy" />
            <div class="member-overlay"></div>
          </div>
          <div class="member-info">
            <h3 class="member-name">Voun Irish Florence C.<br>Dejumo</h3>
            <p class="member-role">Developer</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "TeamSection",
};
</script>

<style scoped>
.team-section {
  padding: 100px 20px;
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
}

/* Background decorations */
.team-section::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(25, 118, 210, 0.03) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.team-container {
  max-width: 1200px;
  margin: 0 auto;
}

.team-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-size: 2.5rem;
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
  gap: 30px;
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
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 33, 129, 0.2);
}

.member-image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder i {
  font-size: 80px;
  color: rgba(255, 255, 255, 0.1);
}

/* Optional: if you add real img tags inside member-image-wrapper later */
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
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 30%, transparent 60%);
  z-index: 1;
}

.member-info {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 24px 20px;
  z-index: 2;
  text-align: center;
}

.member-name {
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.member-role {
  color: #4FC3F7;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Animations */
.animate-on-scroll {
  opacity: 0;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up {
  transform: translateY(40px);
}

.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.animate-delay-1 { transition-delay: 0.1s; }
.animate-delay-2 { transition-delay: 0.2s; }
.animate-delay-3 { transition-delay: 0.3s; }
.animate-delay-4 { transition-delay: 0.4s; }

/* Responsive adjustments */
@media (max-width: 1024px) {
  .team-grid {
    gap: 20px;
  }
  .member-name {
    font-size: 1rem;
  }
}

@media (max-width: 860px) {
  .team-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    max-width: 600px;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .team-section {
    padding: 60px 20px;
  }
  .section-title {
    font-size: 2rem;
  }
  .team-grid {
    grid-template-columns: 1fr;
    max-width: 300px;
  }
  .team-card {
    aspect-ratio: 4/5;
  }
}
</style>
