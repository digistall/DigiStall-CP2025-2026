<template>
  <v-dialog v-model="dialogValue" max-width="600px" persistent>
    <v-card>
      <v-card-title>Record Subscription Payment</v-card-title>
      <v-card-text>
        <div class="owner-info mb-4">
          <h3>{{ owner?.full_name }}</h3>
          <p>Plan: {{ owner?.plan_name }} (₱{{ formatCurrency(owner?.monthly_fee || 0) }}/month)</p>
          <p>Current Status: <v-chip :color="getStatusColor(owner?.subscription_status)" text-color="white" small>{{ owner?.subscription_status }}</v-chip></p>
        </div>
        <v-form ref="paymentForm">
          <v-text-field
            v-model.number="formData.amount"
            label="Amount"
            type="number"
            prefix="₱"
            required
            :rules="[v => !!v || 'Amount is required', v => v > 0 || 'Amount must be greater than 0']"
          ></v-text-field>
          <v-text-field
            v-model="formData.paymentDate"
            label="Payment Date"
            type="date"
            required
            :rules="[v => !!v || 'Payment date is required']"
          ></v-text-field>
          <v-select
            v-model="formData.paymentMethod"
            :items="paymentMethods"
            label="Payment Method"
            required
            :rules="[v => !!v || 'Payment method is required']"
          ></v-select>
          <v-text-field
            v-model="formData.referenceNumber"
            label="Reference Number (Optional)"
          ></v-text-field>
          <v-text-field
            v-model="formData.periodStart"
            label="Period Start"
            type="date"
            required
            :rules="[v => !!v || 'Period start is required']"
          ></v-text-field>
          <v-text-field
            v-model="formData.periodEnd"
            label="Period End"
            type="date"
            required
            :rules="[v => !!v || 'Period end is required']"
          ></v-text-field>
          <v-textarea
            v-model="formData.notes"
            label="Notes (Optional)"
            rows="2"
          ></v-textarea>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="$emit('close')">Cancel</v-btn>
        <v-btn color="success" @click="$emit('record', formData)" :loading="recording">Record Payment</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'RecordPaymentDialog',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    owner: {
      type: Object,
      default: null
    },
    paymentMethods: {
      type: Array,
      default: () => ['Cash', 'Bank Transfer', 'GCash', 'PayMaya', 'Check']
    },
    recording: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'record'],
  data() {
    return {
      formData: {
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        referenceNumber: '',
        periodStart: '',
        periodEnd: '',
        notes: ''
      }
    }
  },
  computed: {
    dialogValue: {
      get() {
        return this.show
      },
      set(value) {
        if (!value) {
          this.$emit('close')
        }
      }
    }
  },
  watch: {
    show(newVal) {
      if (newVal && this.owner) {
        // Calculate period end based on plan duration
        const today = new Date();
        const duration = this.owner.duration_months || 1;
        const periodEndDate = new Date();
        periodEndDate.setMonth(periodEndDate.getMonth() + duration);
        
        this.formData = {
          amount: this.owner.monthly_fee || this.owner.plan_price || 0,
          paymentDate: today.toISOString().split('T')[0],
          paymentMethod: '',
          referenceNumber: '',
          periodStart: today.toISOString().split('T')[0],
          periodEnd: periodEndDate.toISOString().split('T')[0],
          notes: ''
        };
      } else if (!newVal) {
        this.resetForm();
      }
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH').format(value);
    },
    getStatusColor(status) {
      const statusColors = {
        'Active': 'success',
        'Pending': 'warning',
        'Expired': 'error',
        'Suspended': 'grey'
      };
      return statusColors[status] || 'grey';
    },
    resetForm() {
      this.formData = {
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        referenceNumber: '',
        periodStart: '',
        periodEnd: '',
        notes: ''
      };
      if (this.$refs.paymentForm) {
        this.$refs.paymentForm.resetValidation();
      }
    }
  }
}
</script>

<style scoped src="./RecordPaymentDialog.css"></style>
