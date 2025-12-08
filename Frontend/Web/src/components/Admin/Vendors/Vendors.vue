<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable vue/valid-v-slot -->
<!--eslint-disable-next-line vue/multi-word-component-names-->
<template>
  <v-app>
    <div>
      <!-- Main Content -->
      <v-main>
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
      </v-main>

      <!-- Floating Action Button for Add Vendor -->
      <v-btn
        icon="mdi-plus"
        fab
        color="primary"
        size="large"
        class="floating-add-btn"
        @click="openAddDialog"
        aria-label="Add vendor"
      ></v-btn>
    </div>
  </v-app>
</template>

<script src="./Vendors.js"></script>
<style scoped src="./Vendors.css"></style>
