<!-- components/AppHeader.vue -->
<template>
  <v-app-bar app color="white" elevation="1" height="90">
    <div class="d-flex align-center">
      <v-btn
        icon
        @click.stop="toggleSidebar"
        class="header-hamburger-btn mr-2"
        variant="text"
      >
        <v-icon color="#333" size="28">mdi-menu</v-icon>
      </v-btn>
      <h2 class="title-text">{{ title }}</h2>
    </div>

    <v-spacer></v-spacer>

    <div class="d-flex align-center">
      <v-btn icon class="mr-3" @click="handleNotificationClick">
        <v-icon size="28" color="dark">mdi-bell-outline</v-icon>
      </v-btn>

      <!-- Profile Button / Section -->
      <div class="profile-container d-flex align-center clickable" ref="profileContainer" @click="toggleProfilePopup">
        <v-avatar
          class="profile-avatar cursor-pointer mr-3"
          :color="isAdmin ? 'red darken-1' : isEmployee ? 'green darken-1' : 'primary'"
          size="44"
          ref="profileButton"
        >
          <v-icon color="white" size="22">
            {{ isAdmin ? "mdi-shield-account" : isEmployee ? "mdi-account-tie" : "mdi-account" }}
          </v-icon>
        </v-avatar>
        <div class="header-profile-details text-left d-none d-sm-block mr-1">
          <div class="header-profile-name font-weight-bold text-body-1">{{ displayFullName }}</div>
          <div class="header-profile-role text-caption text-grey-darken-1">{{ isAdmin ? 'Admin' : isEmployee ? 'Employee' : 'Branch Manager' }}</div>
        </div>
        <v-icon color="grey-darken-1" size="20">mdi-chevron-down</v-icon>

        <!-- Simplified Profile Popup -->
        <div
          v-if="showProfilePopup"
          class="profile-popup simple-dropdown"
          :style="popupPosition"
          @click.stop
        >
          <div class="popup-content">
            <div class="popup-item" @click="handleMyProfileClick">
              <v-icon class="item-icon">mdi-account-circle-outline</v-icon>
              <span>My Profile</span>
            </div>

            <div class="popup-item logout-item" @click="handleLogoutClick">
              <v-icon class="item-icon">mdi-logout</v-icon>
              <span>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay to close popup when clicking outside -->
    <div v-if="showProfilePopup" class="popup-overlay" @click="closeProfilePopup"></div>
  </v-app-bar>
</template>

<script src="./AppHeader.js"></script>
<style scoped src="./AppHeader.css"></style>
