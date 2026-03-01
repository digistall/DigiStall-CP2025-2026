<template>
  <v-container fluid class="forgot-password-container">
    <!-- Back Button - Upper Left -->
    <v-btn
      class="back-btn"
      @click="goToLogin"
      :disabled="loading"
      variant="elevated"
      size="large"
      prepend-icon="mdi-arrow-left"
    >
      Back to Login
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

      <!-- Right Side - Forgot Password Form -->
      <v-col cols="12" md="4" class="right-section d-flex align-center justify-center">
        <v-card
          class="forgot-password-card"
          elevation="0"
          width="100%"
          max-width="450"
          min-height="600"
        >
          <v-card-text class="pa-6">
            <!-- Step 1: Enter Email -->
            <div v-if="currentStep === 1">
              <h3 class="form-title text-center mb-2">Forgot Password</h3>
              <p class="form-subtitle text-center mb-4">
                Enter your registered email address to receive a verification code
              </p>

              <v-form ref="emailForm" v-model="emailFormValid" @submit.prevent="handleSendCode">
                <!-- Email Field -->
                <v-text-field
                  v-model="email"
                  :rules="emailRules"
                  label="Email Address"
                  type="email"
                  required
                  variant="outlined"
                  prepend-inner-icon="mdi-email"
                  class="mb-3"
                  placeholder="Enter your registered email"
                  persistent-hint
                  hint="We'll send a 6-digit verification code to this email"
                ></v-text-field>

                <!-- Send Code Button -->
                <v-btn
                  type="submit"
                  class="action-btn mb-3"
                  block
                  size="large"
                  :loading="loading"
                  :disabled="!emailFormValid || loading"
                  color="primary"
                >
                  <v-icon left class="mr-2">mdi-email-send</v-icon>
                  {{ loading ? "Sending Code..." : "Send Verification Code" }}
                </v-btn>
              </v-form>
            </div>

            <!-- Step 2: Enter Verification Code -->
            <div v-if="currentStep === 2">
              <h3 class="form-title text-center mb-2">Enter Verification Code</h3>
              <p class="form-subtitle text-center mb-4">
                A 6-digit code has been sent to<br>
                <strong>{{ maskEmail(email) }}</strong>
              </p>

              <v-form ref="codeForm" v-model="codeFormValid" @submit.prevent="handleVerifyCode">
                <!-- OTP Code Input -->
                <div class="otp-container mb-4">
                  <v-otp-input
                    v-model="verificationCode"
                    :length="6"
                    type="number"
                    variant="outlined"
                    @finish="handleVerifyCode"
                  ></v-otp-input>
                </div>

                <!-- Verify Code Button -->
                <v-btn
                  type="submit"
                  class="action-btn mb-3"
                  block
                  size="large"
                  :loading="loading"
                  :disabled="verificationCode.length !== 6 || loading"
                  color="primary"
                >
                  <v-icon left class="mr-2">mdi-check-circle</v-icon>
                  {{ loading ? "Verifying..." : "Verify Code" }}
                </v-btn>

                <!-- Resend Code -->
                <div class="text-center mb-3">
                  <span class="resend-text">Didn't receive the code? </span>
                  <v-btn
                    variant="text"
                    class="resend-btn"
                    size="small"
                    @click="handleResendCode"
                    :disabled="loading || resendCooldown > 0"
                  >
                    {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code' }}
                  </v-btn>
                </div>

                <!-- Back to Email Step -->
                <v-btn
                  variant="text"
                  class="change-email-btn"
                  block
                  @click="goBackToEmail"
                  :disabled="loading"
                >
                  <v-icon left small>mdi-arrow-left</v-icon>
                  Change Email Address
                </v-btn>
              </v-form>
            </div>

            <!-- Step 3: Reset Password -->
            <div v-if="currentStep === 3">
              <h3 class="form-title text-center mb-2">Create New Password</h3>
              <p class="form-subtitle text-center mb-4">
                Your identity has been verified. Please create a new password.
              </p>

              <v-form ref="passwordForm" v-model="passwordFormValid" @submit.prevent="handleResetPassword">
                <!-- New Password Field -->
                <v-text-field
                  v-model="newPassword"
                  :rules="newPasswordRules"
                  label="New Password"
                  :type="showNewPassword ? 'text' : 'password'"
                  required
                  variant="outlined"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showNewPassword = !showNewPassword"
                  class="mb-3"
                  placeholder="Enter your new password"
                  persistent-hint
                  hint="At least 8 characters with uppercase, lowercase, and number"
                ></v-text-field>

                <!-- Confirm Password Field -->
                <v-text-field
                  v-model="confirmPassword"
                  :rules="confirmPasswordRules"
                  label="Confirm Password"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  variant="outlined"
                  prepend-inner-icon="mdi-lock-check"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  class="mb-3"
                  placeholder="Confirm your new password"
                ></v-text-field>

                <!-- Password Strength Indicator -->
                <div class="password-strength mb-4">
                  <v-progress-linear
                    :model-value="passwordStrength"
                    :color="passwordStrengthColor"
                    height="4"
                    rounded
                  ></v-progress-linear>
                  <span class="strength-text" :style="{ color: passwordStrengthColor }">
                    {{ passwordStrengthText }}
                  </span>
                </div>

                <!-- Reset Password Button -->
                <v-btn
                  type="submit"
                  class="action-btn mb-3"
                  block
                  size="large"
                  :loading="loading"
                  :disabled="!passwordFormValid || loading"
                  color="primary"
                >
                  <v-icon left class="mr-2">mdi-lock-reset</v-icon>
                  {{ loading ? "Resetting Password..." : "Reset Password" }}
                </v-btn>
              </v-form>
            </div>

            <!-- Step 4: Success -->
            <div v-if="currentStep === 4">
              <div class="success-container text-center">
                <v-icon size="80" color="success" class="mb-4">mdi-check-circle</v-icon>
                <h3 class="form-title mb-2">Password Reset Successful!</h3>
                <p class="form-subtitle mb-4">
                  Your password has been reset successfully. You can now login with your new password.
                </p>
                <v-btn
                  class="action-btn"
                  block
                  size="large"
                  color="primary"
                  @click="goToLogin"
                >
                  <v-icon left class="mr-2">mdi-login</v-icon>
                  Go to Login
                </v-btn>
              </div>
            </div>

            <!-- Error Message Display -->
            <v-alert
              v-if="errorMessage"
              type="error"
              density="compact"
              class="error-alert mb-3 mt-3"
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
              v-if="successMessage"
              type="success"
              density="compact"
              class="success-alert mb-3 mt-3"
              closable
              @click:close="clearSuccess"
              border="start"
              variant="tonal"
            >
              <template v-slot:prepend>
                <v-icon>mdi-check-circle</v-icon>
              </template>
              {{ successMessage }}
            </v-alert>

            <!-- Step Indicator -->
            <div class="step-indicator mt-4" v-if="currentStep < 4">
              <div class="steps">
                <template v-for="step in 3" :key="step">
                  <div class="step-item">
                    <div
                      class="step-dot"
                      :class="{ 'active': step === currentStep, 'completed': step < currentStep }"
                    >
                      <v-icon v-if="step < currentStep" size="14" color="white">mdi-check</v-icon>
                      <span v-else>{{ step }}</span>
                    </div>
                    <span
                      class="step-label"
                      :class="{ 'active': step === currentStep }"
                    >{{ ['Email', 'Verify', 'Reset'][step - 1] }}</span>
                  </div>
                  <div
                    v-if="step < 3"
                    class="step-connector"
                    :class="{ 'completed': step < currentStep }"
                  ></div>
                </template>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarType === 'error' ? 'error' : 'success'"
      :timeout="4000"
      location="bottom right"
      rounded="pill"
      elevation="6"
    >
      <div class="d-flex align-center ga-2">
        <v-icon>{{ snackbarType === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle' }}</v-icon>
        <span>{{ snackbarMessage }}</span>
      </div>
      <template v-slot:actions>
        <v-btn icon variant="text" @click="showSnackbar = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script src="./ForgotPassword.js"></script>
<style scoped src="./ForgotPassword.css"></style>
