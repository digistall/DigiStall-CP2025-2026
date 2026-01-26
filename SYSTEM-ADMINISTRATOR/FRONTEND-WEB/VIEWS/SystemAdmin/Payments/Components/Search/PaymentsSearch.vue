<template>
  <div class="search-filter-section mb-6">
    <v-row align="center">
      <!-- Search Bar -->
      <v-col cols="12" md="6" lg="4">
        <v-text-field
          v-model="searchQuery"
          label="Search Payments"
          placeholder="Search by business owner, receipt number..."
          variant="outlined"
          clearable
          hide-details
          prepend-inner-icon="mdi-magnify"
          @input="handleSearch"
          class="search-field"
        ></v-text-field>
      </v-col>

      <!-- Spacer -->
      <v-col cols="12" md="4" lg="6" class="d-none d-md-block">
        <!-- Empty space to push filter to the right -->
      </v-col>

      <!-- Filter Button -->
      <v-col cols="12" md="2" lg="2" class="text-right">
        <div class="filter-container" ref="filterContainer">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-filter-variant"
            @click="toggleFilter"
            class="filter-btn"
            :class="{ 'filter-active': showFilterPanel }"
          >
            Filter
            <v-icon
              :icon="showFilterPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="small"
              class="ml-1"
            ></v-icon>
          </v-btn>

          <!-- Filter Dropdown Panel -->
          <transition name="slide-down">
            <div v-show="showFilterPanel" class="filter-dropdown">
              <v-card elevation="8" class="filter-card-dropdown">
                <div class="filter-header-dropdown">
                  <div class="d-flex align-center">
                    <v-icon icon="mdi-filter-variant" size="small" class="mr-2"></v-icon>
                    <span class="filter-title">FILTER OPTIONS</span>
                  </div>
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="small"
                    class="close-btn"
                    @click="showFilterPanel = false"
                  ></v-btn>
                </div>

                <div class="filter-content">
                  <!-- Business Owner Filter -->
                  <div class="filter-group">
                    <label class="filter-label">BUSINESS OWNER</label>
                    <v-select
                      v-model="filter.businessOwnerId"
                      :items="businessOwners"
                      item-title="full_name"
                      item-value="business_owner_id"
                      placeholder="Select business owner"
                      clearable
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    ></v-select>
                  </div>

                  <!-- Status Filter -->
                  <div class="filter-group">
                    <label class="filter-label">STATUS</label>
                    <div class="status-buttons">
                      <v-btn
                        :variant="filter.status === null ? 'flat' : 'outlined'"
                        :color="filter.status === null ? 'primary' : 'default'"
                        class="status-btn"
                        @click="selectStatus('All')"
                      >
                        All
                      </v-btn>
                      <v-btn
                        :variant="filter.status === 'Completed' ? 'flat' : 'outlined'"
                        :color="filter.status === 'Completed' ? 'primary' : 'default'"
                        class="status-btn"
                        @click="selectStatus('Completed')"
                      >
                        Completed
                      </v-btn>
                      <v-btn
                        :variant="filter.status === 'Pending' ? 'flat' : 'outlined'"
                        :color="filter.status === 'Pending' ? 'primary' : 'default'"
                        class="status-btn"
                        @click="selectStatus('Pending')"
                      >
                        Pending
                      </v-btn>
                      <v-btn
                        :variant="filter.status === 'Failed' ? 'flat' : 'outlined'"
                        :color="filter.status === 'Failed' ? 'primary' : 'default'"
                        class="status-btn"
                        @click="selectStatus('Failed')"
                      >
                        Failed
                      </v-btn>
                      <v-btn
                        :variant="filter.status === 'Refunded' ? 'flat' : 'outlined'"
                        :color="filter.status === 'Refunded' ? 'primary' : 'default'"
                        class="status-btn status-btn-full"
                        @click="selectStatus('Refunded')"
                      >
                        Refunded
                      </v-btn>
                    </div>
                  </div>

                  <!-- Payment Method Filter -->
                  <div class="filter-group">
                    <label class="filter-label">PAYMENT METHOD</label>
                    <v-select
                      v-model="filter.paymentMethod"
                      :items="paymentMethods"
                      placeholder="Select payment method"
                      clearable
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    ></v-select>
                  </div>

                  <!-- Action Buttons -->
                  <div class="filter-actions">
                    <v-btn
                      variant="outlined"
                      color="grey"
                      class="action-btn clear-btn"
                      block
                      @click="clearFilters"
                    >
                      Clear All
                    </v-btn>
                    <v-btn
                      variant="flat"
                      color="primary"
                      class="action-btn apply-btn"
                      block
                      @click="applyFilters"
                    >
                      Apply Filters
                    </v-btn>
                  </div>
                </div>
              </v-card>
            </div>
          </transition>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script src="./PaymentsSearch.js"></script>
<style scoped src="./PaymentsSearch.css"></style>
