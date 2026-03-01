<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable vue/valid-v-slot -->
<!--eslint-disable-next-line vue/multi-word-component-names-->
<template>
  <v-app>
    <div>
      <!-- Main Content -->
      <v-main class="vendors-main-content">
        <!-- Standardized Loading Overlay - contained within main content -->
        <LoadingOverlay :loading="loading" text="Loading vendors..." :full-page="false" />

        <v-container fluid class="main-content">
          <v-row>
            <v-col cols="12">
              <!-- Search Component -->
              <SearchVendor @search="handleSearch" />

              <!-- Table Component -->
              <TableVendor
                :vendors="filteredVendors"
                :searchQuery="search"
                :activeFilter="statusFilter"
                @view="view"
                @edit="edit"
                @open-add-dialog="openAddDialog"
              />

              <!-- Add Vendor Dialog -->
              <AddVendorDialog
                :isVisible="addDialog"
                @close="addDialog = false"
                @save="handleSave"
              />

              <!-- Vendor Details Dialog -->
              <VendorDetailsDialog
                :isVisible="detailsDialog"
                @close="detailsDialog = false"
                @edit="handleEditFromDetails"
                :data="detailsData"
                photo="https://i.pravatar.cc/200?img=12"
              />

              <!-- Edit Vendor Dialog -->
              <EditVendorDialog
                :isVisible="editDialog"
                @close="editDialog = false"
                :data="editData"
                @update="handleEditUpdate"
              />
            </v-col>
          </v-row>
        </v-container>

        <!-- Snackbar for notifications -->
        <v-snackbar
          v-model="snackbar.show"
          :color="snackbar.color"
          :timeout="snackbar.timeout"
          location="top"
        >
          {{ snackbar.message }}
          <template v-slot:actions>
            <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
          </template>
        </v-snackbar>
      </v-main>
    </div>
  </v-app>
</template>

<script src="./Vendors.js"></script>
<style scoped src="./Vendors.css"></style>
