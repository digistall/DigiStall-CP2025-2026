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

        <!-- More Section - Show for Business Managers and Business Owners (not System Admin or Employees) -->
        <v-list-item
          v-if="isExpanded && !isEmployee && !isSystemAdministrator"
          class="sidebar-item more-item"
          :class="{ active: showMoreItems }"
          @click="toggleMoreItems"
        >
          <div class="item-container">
            <v-icon
              class="sidebar-icon mr-3"
              :class="{ 'rotate-180': showMoreItems }"
              :color="showMoreItems ? 'white' : 'dark'"
            >
              mdi-chevron-down
            </v-icon>
            <span class="sidebar-text">{{
              showMoreItems ? "Less" : "More"
            }}</span>
          </div>
        </v-list-item>

        <!-- Employee-specific items - Show stalls for employees with stalls permission -->
        <v-list-item
          v-if="isEmployee && hasStallsPermission"
          class="sidebar-item"
          :class="{ 
            active: isActiveRoute('/app/stalls'),
            'has-submenu': true,
            'submenu-expanded': showStallsSubMenu,
            collapsed: !isExpanded,
          }"
          @click="setActiveItem(9, '/app/stalls', true)"
        >
          <v-tooltip text="Stalls" location="right" :disabled="isExpanded">
            <template v-slot:activator="{ props }">
              <div class="item-container" v-bind="props">
                <v-icon 
                  class="sidebar-icon"
                  :color="isActiveRoute('/app/stalls') ? 'white' : 'dark'"
                >
                  mdi-store
                </v-icon>
                <span v-if="isExpanded" class="sidebar-text">
                  Stalls
                </span>
              </div>
            </template>
          </v-tooltip>
        </v-list-item>

        <!-- Additional Items (when More is expanded) - Show for Business Managers and Business Owners -->
        <div v-if="isExpanded && showMoreItems && !isEmployee && !isSystemAdministrator" class="more-items">
          <div v-for="item in filteredMoreItems" :key="item.id">
            <!-- Regular menu item -->
            <v-list-item
              class="sidebar-item sub-item"
              :class="{ active: isActiveRoute(item.route) }"
              @click="setActiveItem(item.id, item.route)"
            >
              <div class="item-container">
                <v-icon 
                  class="sidebar-icon mr-3" 
                  :color="isActiveRoute(item.route) ? 'white' : 'dark'"
                >
                  {{ item.icon }}
                </v-icon>
                <span class="sidebar-text">
                  {{ item.name }}
                </span>
              </div>
            </v-list-item>
          </div>
        </div>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script src="./AppSidebar.js"></script>
<style scoped src="./AppSidebar.css"></style>
