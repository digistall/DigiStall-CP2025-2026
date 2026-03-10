<template>
  <v-layout class="layout-container" fill-height>
    <AppSidebar
      ref="appSidebar"
      :items="menuItems"
      @menu-item-click="handleMenuItemClick"
      @sidebar-toggle="handleSidebarToggle"
    />

    <AppHeader
      :title="pageTitle"
      @notification-click="handleNotificationClick"
      @profile-click="handleProfileClick"
      @settings-click="handleSettingsClick"
      @logout-click="handleLogoutClick"
      @sidebar-toggle="handleSidebarToggleInHeader"
    />

    <v-main class="main-content-wrapper">
      <v-container fluid class="main-content">
        <router-view />
      </v-container>
    </v-main>

    <!-- Logout Confirmation Dialog -->
    <LogoutConfirmationDialog
      :isVisible="showLogoutConfirm"
      :userName="currentUserName"
      :isLoading="isLoggingOut"
      @confirm="handleLogoutConfirm"
      @cancel="showLogoutConfirm = false"
    />

    <!-- Logout Loading Screen -->
    <LogoutLoadingScreen
      :isVisible="isLoggingOut && !showLogoutConfirm"
      :userName="currentUserName"
      message="Please wait while we securely log you out"
    />
  </v-layout>
</template>

<script src="./MainLayout.js"></script>
<style scoped src="./MainLayout.css"></style>
