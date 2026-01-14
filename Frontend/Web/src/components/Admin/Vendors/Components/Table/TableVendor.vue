<template>
  <div class="stallholders-table">
    <v-card elevation="1" class="table-card">
      <!-- Custom Table Header -->
      <div class="table-header">
        <div class="header-row simplified-layout">
          <div class="header-cell id-col">Vendor ID</div>
          <div class="header-cell name-col">Vendor's Name</div>
          <div class="header-cell business-col">Business Name</div>
          <div class="header-cell email-col">Email Address</div>
          <div class="header-cell phone-col">Phone Number</div>
          <div class="header-cell status-col">Status</div>
          <div class="header-cell compliance-col">Compliance</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body scrollable-table-wrapper">
        <div
          v-for="vendor in paginatedVendors"
          :key="vendor.id"
          class="table-row simplified-layout clickable-row"
          @click="$emit('view', vendor.raw || vendor)"
        >
          <div class="table-cell id-col">#{{ vendor.id }}</div>
          <div class="table-cell name-col">{{ vendor.name }}</div>
          <div class="table-cell business-col">{{ vendor.business }}</div>
          <div class="table-cell email-col">{{ vendor.email || 'N/A' }}</div>
          <div class="table-cell phone-col">{{ vendor.phone || 'N/A' }}</div>
          <div class="table-cell status-col" @click.stop>
            <v-chip
              :color="
                vendor.status === 'Active'
                  ? 'green'
                  : vendor.status === 'Inactive'
                    ? 'grey'
                    : 'orange'
              "
              size="small"
              variant="flat"
              :prepend-icon="
                vendor.status === 'Active'
                  ? 'mdi-check-circle'
                  : vendor.status === 'Inactive'
                    ? 'mdi-close-circle'
                    : 'mdi-pause-circle'
              "
            >
              {{ vendor.status }}
            </v-chip>
          </div>
          <div class="table-cell compliance-col" @click.stop>
            <v-chip
              :color="vendor.compliance === 'Compliant' ? 'green' : 'red'"
              size="small"
              variant="flat"
              :prepend-icon="
                vendor.compliance === 'Compliant' ? 'mdi-check-circle' : 'mdi-alert-circle'
              "
            >
              {{ vendor.compliance || 'Compliant' }}
            </v-chip>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="vendors.length === 0" class="empty-state">
        <v-icon size="48" color="grey-lighten-1" class="mb-3"> mdi-store </v-icon>
        <p class="text-grey-lighten-1">No vendors found</p>
      </div>

      <div class="pagination-section" v-if="totalPages > 1">
        <v-pagination
          v-model="currentPage"
          :total-visible="5"
          :length="totalPages"
          color="primary"
          class="my-4"
        ></v-pagination>
      </div>
    </v-card>

    <!-- Add Vendor Floating Action Button -->
    <div class="floating-actions">
      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-fab
            v-bind="props"
            color="primary"
            icon="mdi-plus"
            size="large"
            @click="openAddVendor"
            :aria-label="'Add Vendor'"
            role="button"
          ></v-fab>
        </template>
        <span>Add Vendor</span>
      </v-tooltip>
    </div>

    <!-- Add Vendor Choice Modal -->
    <AddVendorChoiceModal
      :showModal="showChoiceModal"
      @close-modal="closeChoiceModal"
      @vendor-added="handleVendorAdded"
      @import-completed="handleImportCompleted"
      @show-message="handleShowMessage"
      @refresh-vendors="handleRefreshVendors"
    />
  </div>
</template>

<script src="./TableVendor.js"></script>
<style scoped src="./TableVendor.css"></style>
