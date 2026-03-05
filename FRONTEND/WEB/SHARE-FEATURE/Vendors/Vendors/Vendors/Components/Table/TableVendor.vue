<template>
  <div class="stallholders-table">
    <v-card elevation="1" class="table-card">
      <!-- Custom Table Header -->
      <div class="table-header">
        <div class="header-row simplified-layout">
          <div class="header-cell id-col">Vendor ID</div>
          <div class="header-cell name-col">Vendor's Name</div>
          <div class="header-cell business-col">Business Name</div>
          <div class="header-cell collector-col">Assigned Collector</div>
          <div class="header-cell status-col">Status</div>
          <div class="header-cell actions-col">Action</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body">
        <div
          v-for="vendor in paginatedVendors"
          :key="vendor.id"
          class="table-row simplified-layout clickable-row"
          @click="$emit('view', vendor.raw || vendor)"
        >
          <div class="table-cell id-col">#{{ vendor.id }}</div>
          <div class="table-cell name-col">{{ vendor.name }}</div>
          <div class="table-cell business-col">{{ vendor.business }}</div>
          <div class="table-cell collector-col">{{ vendor.collector }}</div>
          <div class="table-cell status-col">{{ vendor.status }}</div>
          <div class="table-cell actions-col" @click.stop>
            <v-btn
              variant="text"
              size="small"
              class="text-primary"
              @click="$emit('edit', vendor.raw || vendor)"
              >EDIT</v-btn
            >
            <v-btn
              variant="text"
              size="small"
              class="text-primary"
              @click="$emit('view', vendor.raw || vendor)"
              >VIEW</v-btn
            >
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
  </div>
</template>

<script src="./TableVendor.js"></script>
<style scoped src="./TableVendor.css"></style>
