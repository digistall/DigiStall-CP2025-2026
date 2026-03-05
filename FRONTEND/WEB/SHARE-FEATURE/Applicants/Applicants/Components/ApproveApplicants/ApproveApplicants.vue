<template>
  <div>
  <v-dialog v-model="showModal" max-width="500" persistent>
    <v-card>
      <v-card-title class="text-h5 pa-4 bg-primary text-white">
        <v-icon class="mr-2" color="white">mdi-check-circle</v-icon>
        Approve Applicant
      </v-card-title>

      <v-card-text class="pa-6">
        <div class="text-center mb-4">
          <v-icon size="64" color="primary">mdi-account-check</v-icon>
        </div>
        
        <div class="text-center mb-4">
          <h3 class="text-h6 mb-2">{{ applicant?.fullName }}</h3>
          <p class="text-body-2 text-grey">{{ applicant?.email }}</p>
        </div>

        <v-divider class="my-4"></v-divider>

        <div v-if="!processing && !approved" class="text-center">
          <p class="text-body-1 mb-4">
            Are you sure you want to approve this applicant?
          </p>
          <p v-if="applicant?.has_credentials" class="text-body-2 text-success font-weight-medium">
            <v-icon size="small" color="success" class="mr-1">mdi-account-check</v-icon>
            This applicant already has a mobile account. Approving will assign the stall directly.
          </p>
          <p v-else class="text-body-2 text-grey">
            Login credentials will be generated and sent to the applicant's email address.
          </p>
        </div>

        <!-- Processing State -->
        <div v-if="processing" class="text-center py-4">
          <v-progress-circular
            indeterminate
            color="primary"
            size="48"
            class="mb-3"
          ></v-progress-circular>
          <p class="text-body-1">{{ processingMessage }}</p>
        </div>

        <!-- Success State -->
        <div v-if="approved && !processing" class="text-center">
          <v-icon size="48" color="primary" class="mb-3">mdi-check-circle</v-icon>
          <p class="text-h6 text-primary mb-2">Applicant Approved!</p>
          <div v-if="credentialsAlreadyExisted" class="bg-grey-lighten-4 pa-3 rounded mb-3">
            <p class="text-body-2 text-success">
              <v-icon size="small" color="success" class="mr-1">mdi-account-check</v-icon>
              Stall assigned using existing mobile account.
            </p>
          </div>
          <div v-else class="text-left bg-grey-lighten-4 pa-3 rounded mb-3">
            <p class="text-body-2 mb-1"><strong>Generated Credentials:</strong></p>
            <p class="text-body-2 mb-1">Username: <strong>{{ credentials?.username }}</strong></p>
            <p class="text-body-2">Password: <strong>{{ credentials?.password }}</strong></p>
          </div>
          <p class="text-body-2 text-grey">
            {{ credentialsAlreadyExisted ? 'The applicant can use their existing account to access the stall.' : (emailSent ? 'Credentials have been sent to the applicant\'s email.' : 'Applicant approved but email failed to send.') }}
          </p>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          v-if="!processing && !approved"
          variant="outlined"
          @click="closeModal"
        >
          Cancel
        </v-btn>
        <v-btn
          v-if="!processing && !approved"
          color="primary"
          variant="flat"
          @click="approveApplicant"
          :disabled="processing"
        >
          <v-icon left>mdi-check</v-icon>
          Approve
        </v-btn>
        <v-btn
          v-if="approved"
          color="primary"
          variant="flat"
          @click="closeModal"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Error Snackbar -->
  <v-snackbar
    v-model="showErrorSnackbar"
    :timeout="4000"
    location="bottom left"
    color="#f44336"
  >
    <v-icon class="mr-2">mdi-alert-circle</v-icon>
    {{ snackbarMessage }}
  </v-snackbar>
  </div>
</template>

<script src="./ApproveApplicants.js"></script>
<style scoped src="./ApproveApplicants.css"></style>