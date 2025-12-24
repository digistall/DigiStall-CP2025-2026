<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable vue/valid-v-slot -->
<!--eslint-disable-next-line vue/multi-word-component-names-->
<template>
  <v-app>
    <div>
      <!-- Main Content -->
      <v-main class="collectors-main-content">
        <!-- Standardized Loading Overlay - contained within main content -->
        <LoadingOverlay 
          :loading="loading" 
          text="Loading collectors..."
          :full-page="false"
        />

        <v-container fluid class="main-content">
          <v-row>
            <v-col cols="12">
              <!-- Search Component -->
              <SearchCollector :locations="locations" @search="handleSearch" />

              <!-- Table Component -->
              <TableCollector
                :collectors="filteredCollectors"
                :searchQuery="search"
                :activeFilter="activeFilter"
                @view="view"
                @edit="edit"
              />

              <!-- Add Collector Dialog -->
              <AddCollectorDialog
                :isVisible="addDialog"
                @close="addDialog = false"
                :locations="locations"
                @save="handleSave"
              />

              <!-- Collector Details Dialog -->
              <CollectorDetailsDialog
                :isVisible="detailsDialog"
                @close="detailsDialog = false"
                :data="detailsData"
                photo="https://i.pravatar.cc/200?img=14"
              />

              <!-- Edit Collector Dialog -->
              <EditCollectorDialog
                :isVisible="editDialog"
                @close="editDialog = false"
                :data="editData"
                :locations="locations"
                @update="handleEditUpdate"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-main>

      <!-- Floating Action Button for Add Collector -->
      <v-btn
        icon="mdi-plus"
        fab
        color="primary"
        size="large"
        class="floating-add-btn"
        @click="openAddDialog"
        aria-label="Add collector"
      ></v-btn>
    </div>
  </v-app>
</template>

<script src="./Collectors.js"></script>
<style scoped src="./Collectors.css"></style>
