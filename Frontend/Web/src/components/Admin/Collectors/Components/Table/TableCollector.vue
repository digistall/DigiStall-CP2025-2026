<template>
  <div class="stallholders-table">
    <v-card elevation="1" class="table-card">
      <!-- Custom Table Header -->
      <div class="table-header">
        <div class="header-row simplified-layout">
          <div class="header-cell id-col">Collector ID</div>
          <div class="header-cell name-col">Collector's Name</div>
          <div class="header-cell contact-col">Contact No.</div>
          <div class="header-cell location-col">Assigned Location</div>
          <div class="header-cell actions-col">Action</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="table-body">
        <div
          v-for="collector in paginatedCollectors"
          :key="collector.id"
          class="table-row simplified-layout clickable-row"
          @click="$emit('view', collector.raw || collector)"
        >
          <div class="table-cell id-col">#{{ collector.id }}</div>
          <div class="table-cell name-col">{{ collector.name }}</div>
          <div class="table-cell contact-col">{{ collector.contact }}</div>
          <div class="table-cell location-col">{{ collector.location }}</div>
          <div class="table-cell actions-col" @click.stop>
            <v-btn
              variant="text"
              size="small"
              class="text-primary"
              @click="$emit('edit', collector.raw || collector)"
              >EDIT</v-btn
            >
            <v-btn
              variant="text"
              size="small"
              class="text-primary"
              @click="$emit('view', collector.raw || collector)"
              >VIEW</v-btn
            >
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="collectors.length === 0" class="empty-state">
        <v-icon size="48" color="grey-lighten-1" class="mb-3"> mdi-account-multiple </v-icon>
        <p class="text-grey-lighten-1">No collectors found</p>
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

<script src="./TableCollector.js"></script>
<style scoped src="./TableCollector.css"></style>
