<template>
  <section id="home" class="hero-section">
    <div class="hero-background">
      <img :src="stallBackgroundImage" alt="Naga People's Mall" class="hero-image" />
      <div class="hero-overlay"></div>
      <!-- Floating particles -->
      <div class="particles">
        <div class="particle" v-for="n in 8" :key="n" :style="{ animationDelay: `${n * 0.4}s` }"></div>
      </div>
    </div>
    
    <div class="hero-content">
      <div class="hero-badge animate-on-scroll">
        <i class="mdi mdi-storefront"></i>
        <span>Stall Management Platform</span>
      </div>
      
      <div class="hero-text">
        <h1 class="hero-title animate-on-scroll animate-delay-1">
          Manage Your <span class="highlight">Stall Business</span>
        </h1>
        <h2 class="hero-subtitle animate-on-scroll animate-delay-2">Like a Pro</h2>
        <p class="hero-description animate-on-scroll animate-delay-3">
          The complete digital solution for stall rental business owners. 
          Track payments, manage tenants, monitor compliance — all in one powerful platform.
        </p>
      </div>

      <div class="stats-container animate-on-scroll animate-delay-3">
        <div class="stat-card clickable" @click="openStallholdersModal" @mouseenter="animateStat($event)" @mouseleave="resetStat($event)">
          <div class="stat-icon">
            <i class="mdi mdi-account-group"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number counter" :class="{ 'loading': statsLoading }">{{ formattedStallholders }}</div>
            <div class="stat-label">Active Stallholders</div>
            <div class="stat-click-hint">
              <i class="mdi mdi-cursor-default-click-outline"></i>
              <span>Click to view</span>
            </div>
          </div>
        </div>
        <div class="stat-card clickable" @click="openStallsModal" @mouseenter="animateStat($event)" @mouseleave="resetStat($event)">
          <div class="stat-icon">
            <i class="mdi mdi-store-check"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number counter" :class="{ 'loading': statsLoading }">{{ formattedStalls }}</div>
            <div class="stat-label">Stalls Managed</div>
            <div class="stat-click-hint">
              <i class="mdi mdi-cursor-default-click-outline"></i>
              <span>Click to view</span>
            </div>
          </div>
        </div>
      </div>

      <div class="hero-actions animate-on-scroll animate-delay-4">
        <button class="apply-btn primary-btn" @click="openGeneralApplicationForm">
          <i class="mdi mdi-file-document-edit"></i>
          <span>Apply for a Stall</span>
        </button>
      </div>
      
      <div class="trust-badges animate-on-scroll animate-delay-5">
        <span class="trust-item">
          <i class="mdi mdi-shield-check"></i>
          Bank-level Security
        </span>
        <span class="trust-item">
          <i class="mdi mdi-clock-fast"></i>
          Setup in 5 Minutes
        </span>
        <span class="trust-item">
          <i class="mdi mdi-credit-card-off"></i>
          No Credit Card Required
        </span>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="scroll-indicator animate-on-scroll animate-delay-5">
      <div class="scroll-mouse">
        <div class="scroll-wheel"></div>
      </div>
      <span>Scroll to explore</span>
    </div>

    <!-- StallApplicationContainer for General Application -->
    <StallApplicationContainer v-if="showApplyForm" :stall="generalStallInfo" :showForm="showApplyForm"
      @close="closeApplyForm" />

    <!-- Stallholders List Modal -->
    <div v-if="showStallholdersModal" class="stats-modal-overlay" @click.self="closeStallholdersModal">
      <div class="stats-modal">
        <div class="stats-modal-header">
          <div class="stats-modal-title">
            <i class="mdi mdi-account-group"></i>
            <h2>Active Stallholders</h2>
            <span class="stats-modal-count">{{ totalStallholders }} Total</span>
          </div>
          <button class="stats-modal-close" @click="closeStallholdersModal">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        
        <div class="stats-modal-filters">
          <div class="stats-search-box">
            <i class="mdi mdi-magnify"></i>
            <input 
              type="text" 
              v-model="stallholdersSearch" 
              placeholder="Search by name, business, stall..."
              @input="debounceStallholdersSearch"
            />
          </div>
          <div class="stats-filter-group">
            <select v-model="stallholdersBranchFilter" @change="fetchStallholders">
              <option value="">All Branches</option>
              <option v-for="branch in filterOptions.branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
            <select v-model="stallholdersBusinessTypeFilter" @change="fetchStallholders">
              <option value="">All Business Types</option>
              <option v-for="type in filterOptions.businessTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
        </div>

        <div class="stats-modal-content">
          <div v-if="stallholdersLoading" class="stats-loading">
            <i class="mdi mdi-loading mdi-spin"></i>
            <span>Loading stallholders...</span>
          </div>
          <div v-else-if="stallholdersList.length === 0" class="stats-empty">
            <i class="mdi mdi-account-search"></i>
            <span>No stallholders found</span>
          </div>
          <div v-else class="stats-list">
            <div v-for="stallholder in stallholdersList" :key="stallholder.stallholder_id" class="stats-list-item">
              <div class="stats-item-avatar">
                <i class="mdi mdi-account"></i>
              </div>
              <div class="stats-item-details">
                <div class="stats-item-name">{{ stallholder.stallholder_name }}</div>
                <div class="stats-item-business">{{ stallholder.business_name || 'N/A' }}</div>
                <div class="stats-item-meta">
                  <span class="stats-item-tag type">
                    <i class="mdi mdi-tag"></i>
                    {{ stallholder.business_type || 'N/A' }}
                  </span>
                  <span class="stats-item-tag stall">
                    <i class="mdi mdi-store"></i>
                    {{ stallholder.stall_no || 'N/A' }}
                  </span>
                  <span class="stats-item-tag branch">
                    <i class="mdi mdi-map-marker"></i>
                    {{ stallholder.branch_name || 'N/A' }}
                  </span>
                </div>
              </div>
              <div class="stats-item-status" :class="stallholder.compliance_status?.toLowerCase()">
                {{ stallholder.compliance_status || 'N/A' }}
              </div>
            </div>
          </div>
        </div>

        <div class="stats-modal-footer">
          <button class="stats-load-more" v-if="stallholdersList.length >= 20" @click="loadMoreStallholders">
            <i class="mdi mdi-refresh"></i>
            Load More
          </button>
        </div>
      </div>
    </div>

    <!-- Stalls List Modal -->
    <div v-if="showStallsModal" class="stats-modal-overlay" @click.self="closeStallsModal">
      <div class="stats-modal">
        <div class="stats-modal-header">
          <div class="stats-modal-title">
            <i class="mdi mdi-store-check"></i>
            <h2>All Stalls</h2>
            <span class="stats-modal-count">{{ totalStalls }} Total</span>
          </div>
          <button class="stats-modal-close" @click="closeStallsModal">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        
        <div class="stats-modal-filters">
          <div class="stats-search-box">
            <i class="mdi mdi-magnify"></i>
            <input 
              type="text" 
              v-model="stallsSearch" 
              placeholder="Search by stall no, location, section..."
              @input="debounceStallsSearch"
            />
          </div>
          <div class="stats-filter-group">
            <select v-model="stallsBranchFilter" @change="fetchStalls">
              <option value="">All Branches</option>
              <option v-for="branch in filterOptions.branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
            <select v-model="stallsStatusFilter" @change="fetchStalls">
              <option value="">All Statuses</option>
              <option v-for="status in filterOptions.statuses" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
            <select v-model="stallsPriceTypeFilter" @change="fetchStalls">
              <option value="">All Price Types</option>
              <option v-for="type in filterOptions.priceTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
        </div>

        <div class="stats-modal-content">
          <div v-if="stallsLoading" class="stats-loading">
            <i class="mdi mdi-loading mdi-spin"></i>
            <span>Loading stalls...</span>
          </div>
          <div v-else-if="stallsList.length === 0" class="stats-empty">
            <i class="mdi mdi-store-search"></i>
            <span>No stalls found</span>
          </div>
          <div v-else class="stats-list stalls-grid">
            <div v-for="stall in stallsList" :key="stall.stall_id" class="stats-list-item stall-card">
              <div class="stall-card-image" :class="{ 'no-image': !stall.stall_image }">
                <img v-if="stall.stall_image" :src="stall.stall_image" :alt="stall.stall_no" @error="handleImageError($event, stall)" />
                <div v-else class="stall-card-placeholder">
                  <i class="mdi mdi-storefront-outline"></i>
                  <span>{{ stall.stall_no }}</span>
                </div>
                <span class="stall-price-badge" :class="stall.price_type?.toLowerCase().replace(' ', '-')">
                  {{ stall.price_type }}
                </span>
                <span class="stall-occupancy-badge" :class="stall.occupancy_status?.toLowerCase()">
                  <i :class="stall.occupancy_status === 'Occupied' ? 'mdi mdi-account-check' : 'mdi mdi-check-circle'"></i>
                  {{ stall.occupancy_status }}
                </span>
              </div>
              <div class="stall-card-content">
                <div class="stall-card-header">
                  <span class="stall-card-code">{{ stall.stall_no }}</span>
                  <span class="stall-card-status" :class="stall.status?.toLowerCase()">
                    {{ stall.status }}
                  </span>
                </div>
                <div class="stall-card-location">
                  <i class="mdi mdi-map-marker"></i>
                  {{ stall.stall_location }}
                </div>
                <div class="stall-card-details">
                  <span><i class="mdi mdi-floor-plan"></i> {{ stall.floor_name || 'N/A' }}</span>
                  <span><i class="mdi mdi-view-grid"></i> {{ stall.section_name || 'N/A' }}</span>
                  <span><i class="mdi mdi-resize"></i> {{ stall.size || 'N/A' }}</span>
                </div>
                <div class="stall-card-footer">
                  <span class="stall-card-branch">{{ stall.branch_name }}</span>
                  <span class="stall-card-price">₱{{ stall.rental_price?.toLocaleString() || '0' }}/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-modal-footer">
          <button class="stats-load-more" v-if="stallsList.length >= 20" @click="loadMoreStalls">
            <i class="mdi mdi-refresh"></i>
            Load More
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script src="./StallSection.js"></script>

<style src="../../../../assets/css/StallSection.css" scoped></style>