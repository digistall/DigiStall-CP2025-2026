<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row class="mb-4">
          <v-col>
            <h1 class="page-title">Business Owners Management</h1>
            <p class="page-subtitle">Manage business owners and their subscriptions</p>
          </v-col>
          <v-col cols="auto">
            <v-btn color="primary" @click="showCreateDialog = true" prepend-icon="mdi-plus">
              Create Business Owner
            </v-btn>
          </v-col>
        </v-row>

        <!-- Business Owners Table Component -->
        <BusinessOwnersTable
          :business-owners="businessOwners"
          :headers="headers"
          :loading="loading"
          @view-history="viewPaymentHistory"
          @record-payment="showRecordPayment"
        />

        <!-- Create Business Owner Dialog Component -->
        <CreateBusinessOwnerDialog
          :show="showCreateDialog"
          :plans="subscriptionPlans"
          :creating="creating"
          @close="closeCreateDialog"
          @create="handleCreateBusinessOwner"
        />

        <!-- Record Payment Dialog Component -->
        <RecordPaymentDialog
          :show="showPaymentDialog"
          :owner="selectedOwner"
          :payment-methods="paymentMethods"
          :recording="recording"
          @close="closePaymentDialog"
          @record="handleRecordPayment"
        />

        <!-- Snackbar -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color">
          {{ snackbar.message }}
        </v-snackbar>
      </v-container>
    </v-main>
  </v-app>
</template>

<script src="./BusinessOwners.js"></script>
<style scoped src="./BusinessOwners.css"></style>
