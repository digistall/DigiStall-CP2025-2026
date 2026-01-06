<template>
  <v-dialog v-model="dialogValue" max-width="600px" persistent>
    <v-card>
      <v-card-title>Create New Business Owner</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="formData.username"
            label="Username"
            required
            :rules="[v => !!v || 'Username is required']"
          ></v-text-field>
          <v-text-field
            v-model="formData.password"
            label="Password"
            type="password"
            required
            :rules="[v => !!v || 'Password is required', v => v.length >= 8 || 'Password must be at least 8 characters']"
          ></v-text-field>
          <v-text-field
            v-model="formData.firstName"
            label="First Name"
            required
            :rules="[v => !!v || 'First name is required']"
          ></v-text-field>
          <v-text-field
            v-model="formData.lastName"
            label="Last Name"
            required
            :rules="[v => !!v || 'Last name is required']"
          ></v-text-field>
          <v-text-field
            v-model="formData.email"
            label="Email"
            type="email"
            required
            :rules="[
              v => !!v || 'Email is required',
              v => /.+@.+\..+/.test(v) || 'Email must be valid'
            ]"
          ></v-text-field>
          <v-text-field
            v-model="formData.contactNumber"
            label="Contact Number"
            required
            :rules="[v => !!v || 'Contact number is required']"
          ></v-text-field>
          <v-select
            v-model="formData.planId"
            :items="plans"
            item-title="plan_display"
            item-value="subscription_plan_id"
            label="Subscription Plan"
            required
            :rules="[v => !!v || 'Subscription plan is required']"
          ></v-select>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="$emit('close')">Cancel</v-btn>
        <v-btn color="primary" @click="$emit('create', formData)" :loading="creating">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'CreateBusinessOwnerDialog',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    plans: {
      type: Array,
      default: () => []
    },
    creating: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'create'],
  data() {
    return {
      formData: {
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        planId: null
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
      if (!newVal) {
        this.resetForm();
      }
    }
  },
  methods: {
    resetForm() {
      this.formData = {
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        planId: null
      };
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }
    }
  }
}
</script>

<style scoped src="./CreateBusinessOwnerDialog.css"></style>
