<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable vue/valid-v-slot -->
<!--eslint-disable-next-line vue/multi-word-component-names-->
<template>
  <div class="vendors-container">
    <div>
      <!-- Main Content -->
      <div class="vendors-main-content">
        <!-- Standardized Loading Overlay - contained within main content -->
        <LoadingOverlay :loading="loading" text="Loading vendors..." :full-page="false" />

        <div class="feature-content-inner">
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
              />

              <!-- Add Vendor Dialog -->
              <AddVendorDialog
                :isVisible="addDialog"
                :loading="loading"
                :saveSuccess="vendorSaveSuccess"
                @close="addDialog = false"
                @save="handleSave"
              />

              <!-- Vendor Details Dialog -->
              <VendorDetailsDialog
                :isVisible="detailsDialog"
                @close="detailsDialog = false"
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
        </div>

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
      </div>
    </div>
  </div>
</template>

<script src="./Vendors.js"></script>
<style scoped src="./Vendors.css"></style>
