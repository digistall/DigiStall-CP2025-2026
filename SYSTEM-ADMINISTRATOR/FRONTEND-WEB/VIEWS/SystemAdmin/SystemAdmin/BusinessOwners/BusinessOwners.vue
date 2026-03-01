<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row class="mb-4">
          <v-col>
            <h1 class="page-title">Business Owners Management</h1>
            <p class="page-subtitle">Manage business owners and their subscriptions</p>
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

      </v-container>
    </v-main>

    <!-- Floating Action Button -->
    <v-tooltip location="left">
      <template v-slot:activator="{ props }">
        <v-btn
          fab
          color="primary"
          class="fab-add"
          @click="showCreateDialog = true"
          v-bind="props"
          :aria-label="'Add Business Owner'"
          role="button"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>
      <span>Add Business Owner</span>
    </v-tooltip>

    <!-- Universal Popup -->
    <UniversalPopup
      :show="popup.show"
      :message="popup.message"
      :type="popup.type"
      :operation="popup.operation"
      :operationType="popup.operationType"
      @close="popup.show = false"
    />
  </v-app>
</template>

<script src="./BusinessOwners.js"></script>
<style scoped src="./BusinessOwners.css"></style>
