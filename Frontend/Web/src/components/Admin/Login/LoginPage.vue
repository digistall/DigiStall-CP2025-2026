<template>
  <v-container fluid class="login-container">
    <!-- Back Button - Upper Left -->
    <v-btn
      class="back-btn"
      @click="goToLandingPage"
      :disabled="loading"
      variant="elevated"
      size="large"
      prepend-icon="mdi-arrow-left"
    >
      Back
    </v-btn>

    <v-row class="fill-height" no-gutters>
      <!-- Left Side - Logo and Title -->
      <v-col cols="12" md="8" class="left-section d-flex align-center justify-center">
        <div class="logo-title-section text-center">
          <!-- DigiStall Logo -->
          <img
            src="../../../assets/DigiStall-Logo.png"
            alt="DigiStall Logo"
            class="digistall-logo mb-6"
          />
          <h1 class="main-title mb-2">Naga City Stall Management</h1>
          <h2 class="sub-title mb-4">Web Portal</h2>
          <p class="powered-by">Powered by: DigiStall</p>
        </div>
      </v-col>

      <!-- Right Side - Login Form -->
      <v-col cols="12" md="4" class="right-section d-flex align-center justify-center">
        <v-card
          class="login-card"
          elevation="0"
          width="100%"
          max-width="450"
          min-height="600"
        >
          <v-card-text class="pa-6">
            <h3 class="form-title text-center mb-4">System Login</h3>

            <v-form ref="loginForm" v-model="valid" @submit.prevent="handleLogin">
              <!-- Username Field -->
              <v-text-field
                v-model="username"
                :rules="usernameRules"
                label="Username"
                type="text"
                required
                variant="outlined"
                prepend-inner-icon="mdi-account"
                class="login-field"
                placeholder="Enter your username"
                persistent-hint
                hint="Use your registered username"
              ></v-text-field>

              <!-- Password Field -->
              <v-text-field
                v-model="password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                :rules="passwordRules"
                variant="outlined"
                class="mb-3"
                required
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="togglePasswordVisibility"
                placeholder="Enter your password"
                density="comfortable"
              >
              </v-text-field>

              <!-- Login Button -->
              <v-btn
                type="submit"
                class="login-btn mb-3"
                block
                size="large"
                :loading="loading"
                :disabled="!valid || loading"
                color="primary"
              >
                <v-icon left class="mr-2">mdi-login</v-icon>
                {{ loading ? "Authenticating..." : "Login" }}
              </v-btn>

              <!-- Error Message Display -->
              <v-alert
                v-if="errorMessage"
                type="error"
                density="compact"
                class="error-alert mb-3"
                closable
                @click:close="clearError"
                border="start"
                variant="tonal"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-alert-circle</v-icon>
                </template>
                {{ errorMessage }}
              </v-alert>

              <!-- Success Message Display -->
              <v-alert
                v-if="showSuccessMessage && successMessage"
                type="success"
                density="compact"
                class="success-alert mb-3"
                border="start"
                variant="tonal"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-check-circle</v-icon>
                </template>
                {{ successMessage }}
              </v-alert>

              <!-- Forgot Password -->
              <div class="text-center mb-3">
                <v-btn
                  variant="text"
                  class="forgot-password-btn"
                  size="small"
                  @click="handleForgotPassword"
                  :disabled="loading"
                >
                  <v-icon left small>mdi-help-circle</v-icon>
                  Forgot Password?
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Professional Full-Screen Loading Screen -->
    <LoadingScreen
      :visible="showLoadingScreen"
      :userName="loggedInUserName"
      :userRole="loggedInUserRole"
      :branchName="loggedInBranchName"
      :duration="3000"
      @loading-complete="onLoadingComplete"
      @ready-to-navigate="onReadyToNavigate"
    />

    <!-- Success Notification Popup -->
    <UniversalPopup
      :show="showSuccessPopup"
      :message="successMessage"
      type="success"
      operation="login"
      operationType="user"
      @close="showSuccessPopup = false"
    />

    <!-- Error Notification Popup -->
    <UniversalPopup
      :show="errorPopup.show"
      :message="errorPopup.message"
      :type="errorPopup.type"
      :operation="errorPopup.operation"
      :operationType="errorPopup.operationType"
      @close="errorPopup.show = false"
    />
  </v-container>
</template>

<script src="./LoginPage_Enhanced.js"></script>
<style scoped src="./LoginPage.css"></style>
