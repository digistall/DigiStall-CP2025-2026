<template>
  <div class="business-owners-page">
    <div class="page-header">
      <h1 class="page-title">Business Owners Management</h1>
      <v-btn color="primary" @click="showCreateDialog = true" prepend-icon="mdi-plus">
        Create New Business Owner
      </v-btn>
    </div>

    <!-- Business Owners Table -->
    <v-card elevation="2">
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="businessOwners"
          :loading="loading"
          class="elevation-1"
        >
          <template #[`item.subscription_status`]="{ item }">
            <v-chip
              :color="getStatusColor(item.subscription_status)"
              text-color="white"
              small
            >
              {{ item.subscription_status }}
            </v-chip>
          </template>
          <template #[`item.days_until_expiry`]="{ item }">
            <span :class="{ 'text-red': item.days_until_expiry < 7 && item.days_until_expiry >= 0 }">
              {{ item.days_until_expiry !== null ? `${item.days_until_expiry} days` : 'N/A' }}
            </span>
          </template>
          <template #[`item.actions`]="{ item }">
            <v-btn size="small" color="primary" @click="viewPaymentHistory(item)" class="mr-2">
              <v-icon size="small">mdi-history</v-icon>
            </v-btn>
            <v-btn size="small" color="success" @click="showRecordPayment(item)">
              <v-icon size="small">mdi-cash-plus</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create Business Owner Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>Create New Business Owner</v-card-title>
        <v-card-text>
          <v-form ref="createForm">
            <v-text-field
              v-model="newOwner.username"
              label="Username"
              required
              :rules="[v => !!v || 'Username is required']"
            ></v-text-field>
            <v-text-field
              v-model="newOwner.password"
              label="Password"
              type="password"
              required
              :rules="[v => !!v || 'Password is required', v => v.length >= 8 || 'Password must be at least 8 characters']"
            ></v-text-field>
            <v-text-field
              v-model="newOwner.firstName"
              label="First Name"
              required
              :rules="[v => !!v || 'First name is required']"
            ></v-text-field>
            <v-text-field
              v-model="newOwner.lastName"
              label="Last Name"
              required
              :rules="[v => !!v || 'Last name is required']"
            ></v-text-field>
            <v-text-field
              v-model="newOwner.email"
              label="Email"
              type="email"
              required
              :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
            ></v-text-field>
            <v-text-field
              v-model="newOwner.contactNumber"
              label="Contact Number"
              required
              :rules="[v => !!v || 'Contact number is required']"
            ></v-text-field>
            <v-select
              v-model="newOwner.planId"
              :items="subscriptionPlans"
              item-title="plan_display"
              item-value="plan_id"
              label="Subscription Plan"
              required
              :rules="[v => !!v || 'Subscription plan is required']"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeCreateDialog">Cancel</v-btn>
          <v-btn color="primary" @click="createBusinessOwner" :loading="creating">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Record Payment Dialog -->
    <v-dialog v-model="showPaymentDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>Record Subscription Payment</v-card-title>
        <v-card-text>
          <div class="owner-info mb-4">
            <h3>{{ selectedOwner?.full_name }}</h3>
            <p>Plan: {{ selectedOwner?.plan_name }} (₱{{ formatCurrency(selectedOwner?.monthly_fee || 0) }}/month)</p>
            <p>Current Status: <v-chip :color="getStatusColor(selectedOwner?.subscription_status)" text-color="white" small>{{ selectedOwner?.subscription_status }}</v-chip></p>
          </div>
          <v-form ref="paymentForm">
            <v-text-field
              v-model.number="payment.amount"
              label="Amount"
              type="number"
              prefix="₱"
              required
              :rules="[v => !!v || 'Amount is required', v => v > 0 || 'Amount must be greater than 0']"
            ></v-text-field>
            <v-text-field
              v-model="payment.paymentDate"
              label="Payment Date"
              type="date"
              required
              :rules="[v => !!v || 'Payment date is required']"
            ></v-text-field>
            <v-select
              v-model="payment.paymentMethod"
              :items="paymentMethods"
              label="Payment Method"
              required
              :rules="[v => !!v || 'Payment method is required']"
            ></v-select>
            <v-text-field
              v-model="payment.referenceNumber"
              label="Reference Number (Optional)"
            ></v-text-field>
            <v-text-field
              v-model="payment.periodStart"
              label="Period Start"
              type="date"
              required
              :rules="[v => !!v || 'Period start is required']"
            ></v-text-field>
            <v-text-field
              v-model="payment.periodEnd"
              label="Period End"
              type="date"
              required
              :rules="[v => !!v || 'Period end is required']"
            ></v-text-field>
            <v-textarea
              v-model="payment.notes"
              label="Notes (Optional)"
              rows="2"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closePaymentDialog">Cancel</v-btn>
          <v-btn color="success" @click="recordPayment" :loading="recording">Record Payment</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script src="./BusinessOwners.js"></script>
<style scoped src="./BusinessOwners.css"></style>
