<!-- components/AppSidebar.vue -->
<template>
  <div>
    <!-- Collapsed Sidebar -->
    <v-navigation-drawer
      fixed
      permanent
      :width="isExpanded ? 250 : 80"
      class="sidebar"
      @mouseenter="isExpanded = true"
      @mouseleave="isExpanded = false"
    >
      <!-- Logo Section -->
      <div class="logo-section" @click="toggleSidebar">
        <div class="logo-container">
          <img src="../../../assets/DigiStall-Logo.png" alt="Logo" class="logo-icon" />
          <div v-if="isExpanded" class="logo-text">
            <h3>Digi Stall</h3>
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

        <!-- Additional Items - Always visible for Business Managers and Business Owners -->
        <div v-if="!isEmployee && !isSystemAdministrator" class="more-items">
          <div v-for="item in filteredMoreItems" :key="item.id">
            <!-- Regular menu item -->
            <v-list-item
              class="sidebar-item sub-item"
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
          </div>
        </div>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script src="./AppSidebar.js"></script>
<style scoped src="./AppSidebar.css"></style>
