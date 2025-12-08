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
            <button class="action-btn view-btn" @click.stop="onView(collector)" title="View">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="18"
                height="18"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="action-btn edit-btn" @click.stop="onEdit(collector)" title="Edit">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="18"
                height="18"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="m18.5 2.5-5.5 5.5-2-2 5.5-5.5a2.1 2.1 0 0 1 3 3z"></path>
              </svg>
            </button>
            <button class="action-btn delete-btn" @click.stop="onDelete(collector)" title="Delete">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="18"
                height="18"
              >
                <polyline points="3,6 5,6 21,6"></polyline>
                <path
                  d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"
                ></path>
              </svg>
            </button>
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
