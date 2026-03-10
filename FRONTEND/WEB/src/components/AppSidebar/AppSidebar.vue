<!-- components/AppSidebar.vue -->
<template>
  <div>
    <v-navigation-drawer app permanent elevation="2" :width="isExpanded ? 260 : 90" class="sidebar">
      <div class="sidebar-content-wrapper">
        <!-- Profile Section with Hamburger -->
        <div class="logo-section pa-0" style="padding-bottom: 0 !important; flex-shrink: 0;">
        <!-- Logo Section -->
        <div v-if="isExpanded" class="logo-container d-flex align-center justify-center py-4">
          <img src="@/assets/DigiStall-Logo.png" alt="DigiStall Logo" style="max-width: 50px; height: auto;" />
          <span class="brand-text ml-3">Digi Stall</span>
        </div>
        <div v-else class="logo-container-collapsed d-flex justify-center py-5">
          <img src="@/assets/DigiStall-Icon.png" alt="DigiStall Icon" style="max-width: 55px; height: auto;" />
        </div>
        </div>

        <v-divider></v-divider>

        <div class="sidebar-scroll-area">
          <!-- Grouped Menu Items -->
          <template v-for="(group, gIndex) in groupedMenuItems" :key="gIndex">
            <div v-if="isExpanded" class="section-title mt-2">{{ group.name }}</div>
            <v-divider v-if="!isExpanded && gIndex > 0" class="my-2 mx-4"></v-divider>
            
            <v-list class="pa-0">
              <v-list-item
                v-for="item in group.items"
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
          </template>
        </div>
        
        <!-- Bottom Fixed Section - Settings & Logout -->
        <div class="sidebar-bottom-section">
          <v-divider class="my-2"></v-divider>
          <v-list class="pa-0">
            <v-list-item
              class="sidebar-item"
              :class="{ collapsed: !isExpanded }"
              @click="handleSettingsClick"
            >
              <v-tooltip text="Settings" location="right" :disabled="isExpanded">
                <template v-slot:activator="{ props }">
                  <div class="item-container" v-bind="props">
                    <v-icon class="sidebar-icon mr-3" color="dark">mdi-cog</v-icon>
                    <span v-if="isExpanded" class="sidebar-text">Settings</span>
                  </div>
                </template>
              </v-tooltip>
            </v-list-item>
            
            <v-list-item
              class="sidebar-item logout-item-sidebar"
              :class="{ collapsed: !isExpanded }"
              @click="handleLogoutClick"
            >
              <v-tooltip text="Logout" location="right" :disabled="isExpanded">
                <template v-slot:activator="{ props }">
                  <div class="item-container" v-bind="props">
                    <v-icon class="sidebar-icon mr-3" color="error">mdi-logout</v-icon>
                    <span v-if="isExpanded" class="sidebar-text text-error" style="color: #e53935;">Logout</span>
                  </div>
                </template>
              </v-tooltip>
            </v-list-item>
          </v-list>
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script src="./AppSidebar.js"></script>
<style scoped src="./AppSidebar.css"></style>
