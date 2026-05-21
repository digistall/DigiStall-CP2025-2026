<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="applicants-container">
    <div>
      <!-- Main Content -->
      <div class="applicants-main-content">
        <div class="feature-content-inner">
          <!-- Standardized Loading Overlay -->
          <LoadingOverlay
            :loading="loading"
            :text="loadingText"
            :full-page="false"
          />

          <v-row>
            <v-col cols="12">
              <!-- Tab Navigation Container -->
              <v-card elevation="2" class="rounded-lg mb-4 d-inline-flex">
                <v-tabs
                  v-model="currentApplicantType"
                  color="primary"
                  bg-color="white"
                  slider-color="primary"
                  align-tabs="start"
                  @update:modelValue="onTabChange"
                >
                  <v-tab value="Stall Applicants" class="text-subtitle-1 font-weight-bold"
                    >STALL APPLICANTS</v-tab
                  >
                  <v-tab value="Vendor Applicants" class="text-subtitle-1 font-weight-bold"
                    >VENDOR APPLICANTS</v-tab
                  >
                </v-tabs>
              </v-card>

              <!-- Search and Filter Section -->
              <VendorSearchFilter @search="handleSearch" @filter="handleFilter" />

              <!-- Toast Notification -->
              <ToastNotification
                :show="toast.show"
                :message="toast.message"
                :type="toast.type"
                @close="toast.show = false"
              />

              <!-- Error State -->
              <div v-if="error" class="text-center py-8">
                <v-icon color="error" size="64">mdi-alert-circle</v-icon>
                <p class="mt-4 text-h6 error--text">{{ error }}</p>
                <v-btn @click="refreshApplicants" color="primary" class="mt-4">
                  <v-icon left>mdi-refresh</v-icon>
                  Retry
                </v-btn>
              </div>

              <!-- Applicants Table -->
              <VendorApplicantsTable
                v-if="!loading && !error"
                :applicants="filteredApplicants"
                :applicant-type="currentApplicantType"
                @accept="handleAccept"
                @decline="handleDecline"
                @recheck="handleRecheck"
                @refresh="refreshApplicants"
              />
            </v-col>
          </v-row>
        </div>
      </div>

      <!-- Approve Applicant Modal -->
      <ApproveApplicants
        :applicant="selectedApplicant"
        :applicant-type="currentApplicantType"
        :show="showApproveModal"
        @close="closeApproveModal"
        @approved="onApplicantApproved"
      />

      <!-- Decline Applicant Modal -->
      <DeclineApplicants
        :applicant="selectedApplicant"
        :applicant-type="currentApplicantType"
        :show="showDeclineModal"
        @close="closeDeclineModal"
        @declined="onApplicantDeclined"
        @applicant-status-updated="onApplicantStatusUpdated"
      />
    </div>

    <!-- CRUD Loading Overlay -->
    <CrudLoadingOverlay
      :visible="crudLoading.visible"
      :operation="crudLoading.operation"
      :entity="crudLoading.entity"
      :message="crudLoading.message"
      :sub-message="crudLoading.subMessage"
      :full-page="false"
    />

    <!-- Error Snackbar -->
    <v-snackbar v-model="showErrorSnackbar" :timeout="4000" location="bottom left" color="#f44336">
      <v-icon class="mr-2">mdi-alert-circle</v-icon>
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script src="./Applicants.js"></script>
<style scoped src="./Applicants.css"></style>
