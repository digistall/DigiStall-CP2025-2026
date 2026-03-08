<!-- components/AppSidebar.vue -->
<template>
  <div>
    <!-- Collapsed Sidebar -->
    <v-navigation-drawer app permanent elevation="2" :width="isExpanded ? 260 : 90" class="sidebar">
      <!-- Logo Section with Hamburger -->
      <div class="logo-section py-4 px-2">
        <div
          class="d-flex align-center"
          :class="{ 'justify-center': !isExpanded, 'px-2': isExpanded, 'w-100': !isExpanded }"
        >
          <v-btn
            icon
            @click.stop="toggleSidebar"
            class="hamburger-btn circle-hover mr-1"
            variant="text"
          >
            <v-icon color="#333" size="28">mdi-menu</v-icon>
          </v-btn>

          <div
            v-if="isExpanded"
            class="logo-content d-flex align-center ml-2 clickable"
            @click="toggleSidebar"
          >
            <img src="@assets/DigiStall-Logo.png" alt="Logo" class="logo-icon" />
            <div class="logo-text ml-3">
              <h3>Digi Stall</h3>
            </div>
          </div>
        </div>
      </div>

      <v-divider class="my-2"></v-divider>

      <!-- Activity Section -->
      <div v-if="isExpanded" class="section-title">Activity</div>

      <!-- Menu Items -->
      <v-list class="pa-0">
        <v-list-item
          v-for="item in menuItems"
          :key="item.id"
          class="sidebar-item"
          :class="{ active: isActiveRoute(item.route), collapsed: !isExpanded }"
          @click="setActiveItem(item.id, item.route)"
        >
          <v-tooltip :text="item.name" location="right" :disabled="isExpanded">
            <template v-slot:activator="{ props }">
              <div class="item-container" v-bind="props">
                <v-icon
                  class="sidebar-icon mr-3"
                  :color="isActiveRoute(item.route) ? 'white' : 'dark'"
                >
                  {{ item.icon }}
                </v-icon>
                <span v-if="isExpanded" class="sidebar-text">
                  {{ item.name }}
                </span>
              </div>
            </template>
          </v-tooltip>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script src="./AppSidebar.js"></script>
<style scoped src="./AppSidebar.css"></style>
