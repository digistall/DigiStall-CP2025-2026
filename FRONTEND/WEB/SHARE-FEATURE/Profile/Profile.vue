<template>
  <div class="profile-page-fluid">
    <v-overlay :model-value="loading" class="align-center justify-center" persistent>
      <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <!-- Business Header -->
    <v-card v-if="userData" class="business-header" flat border>
      <div class="header-content d-flex align-center pa-6">
        <v-avatar size="100" class="elevation-2 bg-white" border>
          <v-img :src="avatarUrl" cover v-if="avatarUrl"></v-img>
          <v-icon size="50" color="primary" v-else>{{ userRoleIcon }}</v-icon>
        </v-avatar>
        
        <div class="ml-6">
          <div class="d-flex align-center">
            <h1 class="text-h4 font-weight-bold">{{ displayFullName }}</h1>
            <v-chip color="success" size="x-small" label class="ml-3 font-weight-bold">AUTHORIZED</v-chip>
          </div>
          <div class="text-body-1 text-grey-darken-1 mt-1">
            <v-icon size="18" class="mr-1">mdi-briefcase-variant</v-icon> {{ displayRole }}
            <span class="mx-2">•</span>
            <v-icon size="18" class="mr-1">mdi-store</v-icon> {{ displayLocation }}
          </div>
        </div>
        
        <v-spacer></v-spacer>
        
        <div class="header-actions">
          <v-btn color="primary" @click="openEditDialog" prepend-icon="mdi-account-edit">Manage Profile</v-btn>
        </div>
      </div>
    </v-card>

    <!-- Main Data Grid -->
    <v-container v-if="userData" fluid class="mt-6 pa-0">
      <v-row>
        <!-- Personnel Details -->
        <v-col cols="12" md="6">
          <v-card flat border height="100%">
            <v-card-title class="px-6 pt-6 text-subtitle-1 font-weight-bold">
              <v-icon color="primary" class="mr-2">mdi-account-details</v-icon> Personnel Details
            </v-card-title>
            <v-card-text class="pa-6">
              <div class="business-data-grid">
                <div class="data-item">
                  <div class="label">First Name</div>
                  <div class="value">{{ userData.first_name || userData.firstName || '—' }}</div>
                </div>
                <div class="data-item">
                  <div class="label">Last Name</div>
                  <div class="value">{{ userData.last_name || userData.lastName || '—' }}</div>
                </div>
                <div class="data-item">
                  <div class="label">Gender</div>
                  <div class="value">{{ displayGender }}</div>
                </div>
                <div class="data-item">
                  <div class="label">Date of Birth</div>
                  <div class="value">{{ displayDOB }}</div>
                </div>
                <div class="data-item" v-if="displayAddress !== 'N/A'">
                  <div class="label">Home Address</div>
                  <div class="value">{{ displayAddress }}</div>
                </div>
              </div>

              <!-- Integrated System Access -->
              <div class="mt-4 pt-4 border-top">
                <div class="text-caption text-uppercase font-weight-bold text-grey-darken-1 mb-2 d-flex align-center">
                  <v-icon size="14" color="primary" class="mr-1">mdi-shield-key</v-icon> System Access
                </div>
                <div v-if="permissions.length > 0" class="d-flex flex-wrap gap-2">
                  <div v-for="perm in permissions" :key="perm" class="access-chip-mini">
                    <v-icon size="12" color="success" class="mr-1">mdi-check-decagram</v-icon>
                    {{ formatPermission(perm) }}
                  </div>
                </div>
                <div v-else class="text-body-2 text-grey-darken-1 font-italic">
                  Full administrative access granted.
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <!-- Business Affiliation -->
        <v-col cols="12" md="6">
          <v-card flat border height="100%">
            <v-card-title class="px-6 pt-6 text-subtitle-1 font-weight-bold">
              <v-icon color="primary" class="mr-2">mdi-office-building</v-icon> Business Affiliation
            </v-card-title>
            <v-card-text class="pa-6">
              <div class="business-data-grid">
                <div class="data-item">
                  <div class="label">Work Email</div>
                  <div class="value">{{ displayEmail }}</div>
                </div>
                <div class="data-item">
                  <div class="label">Contact Number</div>
                  <div class="value">{{ displayPhone }}</div>
                </div>
                <div class="data-item">
                  <div class="label">Official Role</div>
                  <div class="value">{{ displayRole }}</div>
                </div>
                <div class="data-item">
                  <div class="label">Assigned Unit/Branch</div>
                  <div class="value">{{ displayLocation }}</div>
                </div>
                <div class="data-item">
                  <div class="label">Employment Date</div>
                  <div class="value">{{ displayJoinDate }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Business Overview Stats -->
        <v-col cols="12">
          <v-card flat border class="mt-4">
            <v-card-title class="px-6 pt-6 text-subtitle-1 font-weight-bold">
              <v-icon color="primary" class="mr-2">mdi-chart-line</v-icon> Business Overview (Current Branch)
            </v-card-title>
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" sm="4">
                  <div class="stat-box text-center pa-4 rounded-lg bg-blue-lighten-5">
                    <div class="text-caption text-uppercase font-weight-bold text-blue-darken-3">Managed Stalls</div>
                    <div class="text-h4 font-weight-bold text-blue-darken-4 mt-1">{{ stats.managedStalls }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="stat-box text-center pa-4 rounded-lg bg-green-lighten-5">
                    <div class="text-caption text-uppercase font-weight-bold text-green-darken-3">Total Revenue</div>
                    <div class="text-h4 font-weight-bold text-green-darken-4 mt-1">{{ formatCurrency(stats.totalRevenue) }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="stat-box text-center pa-4 rounded-lg bg-purple-lighten-5">
                    <div class="text-caption text-uppercase font-weight-bold text-purple-darken-3">Active Personnel</div>
                    <div class="text-h4 font-weight-bold text-purple-darken-4 mt-1">{{ stats.activePersonnel }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <div class="stat-box text-center pa-4 rounded-lg bg-orange-lighten-5 mt-4">
                    <div class="text-caption text-uppercase font-weight-bold text-orange-darken-3">Active Stallholders</div>
                    <div class="text-h4 font-weight-bold text-orange-darken-4 mt-1">{{ stats.activeStallholders || 0 }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <div class="stat-box text-center pa-4 rounded-lg bg-red-lighten-5 mt-4">
                    <div class="text-caption text-uppercase font-weight-bold text-red-darken-3">Pending Applications</div>
                    <div class="text-h4 font-weight-bold text-red-darken-4 mt-1">{{ stats.pendingApplications || 0 }}</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="editDialog" max-width="600px" persistent>
      <v-card rounded="lg">
        <v-card-title class="pa-4 bg-primary text-white">Update Profile Data</v-card-title>
        <v-card-text class="pt-6">
          <v-form ref="editForm" v-model="formValid">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editData.firstName" label="First Name" variant="outlined" density="compact" :rules="[v => !!v || 'Required']"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editData.lastName" label="Last Name" variant="outlined" density="compact" :rules="[v => !!v || 'Required']"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editData.phone" label="Contact Number" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select v-model="editData.gender" :items="['Male', 'Female', 'Other']" label="Gender" variant="outlined" density="compact"></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editData.dob" label="Date of Birth" type="date" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editData.address" label="Primary Residence" variant="outlined" density="compact"></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editDialog = false">Discard</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" :disabled="!formValid" @click="saveProfile">Apply Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const userData = ref(null);
const loading = ref(true);
const saving = ref(false);
const avatarUrl = ref(null);
const editDialog = ref(false);
const formValid = ref(false);
const editForm = ref(null);

const editData = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  dob: '',
  gender: ''
});

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
});

const displayFullName = computed(() => {
  if (!userData.value) return '...';
  const u = userData.value;
  const first = u.first_name || u.firstName || '';
  const last = u.last_name || u.lastName || '';
  return `${first} ${last}`.trim() || 'Authorized User';
});

const displayRole = computed(() => {
  if (!userData.value) return '';
  const type = userData.value.userType;
  const roles = {
    'system_administrator': 'System Administrator',
    'stall_business_owner': 'Platform Proprietor',
    'business_manager': 'Branch Manager',
    'business_employee': userData.value.designation || 'Operational Staff'
  };
  return roles[type] || 'Authorized Personnel';
});

// Business Aggregate Stats
const stats = computed(() => userData.value?.stats || {
  managedStalls: 0,
  totalRevenue: 0,
  activePersonnel: 0,
  activeStallholders: 0,
  pendingApplications: 0
});

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);
};

const userRoleIcon = computed(() => {
  const type = userData.value?.userType;
  if (type === 'system_administrator') return 'mdi-shield-account';
  if (type === 'stall_business_owner') return 'mdi-briefcase-variant';
  return 'mdi-account-circle';
});

const displayEmail = computed(() => userData.value?.email || 'N/A');
const displayPhone = computed(() => userData.value?.contact_number || userData.value?.phone_number || 'N/A');
const displayLocation = computed(() => userData.value?.branch_name || 'Main Office');
const displayGender = computed(() => userData.value?.gender || 'Not specified');
const displayDOB = computed(() => {
  if (!userData.value?.date_of_birth) return 'Not specified';
  return new Date(userData.value.date_of_birth).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
});
const displayAddress = computed(() => userData.value?.address || 'N/A');
const displayJoinDate = computed(() => {
  const date = userData.value?.created_at || userData.value?.hired_date || userData.value?.hiredDate || userData.value?.joinDate;
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
});

const permissions = computed(() => {
  const p = userData.value?.permissions;
  if (!p) return [];
  return Array.isArray(p) ? p : JSON.parse(p || '[]');
});

const formatPermission = (perm) => perm.replace(/_/g, ' ').toUpperCase();

const fetchUserData = async () => {
  // 1. Try to get logic from session storage first (Instant UI)
  const storedUser = sessionStorage.getItem('currentUser');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      userData.value = parsed;
      loading.value = false;
      console.log('✅ UI populated from session storage');
    } catch (e) {
      console.error('Session data parse error:', e);
    }
  }

  // 2. Fetch fresh data from API (Updates stats and profile)
  try {
    const token = sessionStorage.getItem('authToken');
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      userData.value = response.data.data;
      // Sync back to session storage
      sessionStorage.setItem('currentUser', JSON.stringify(userData.value));
      console.log('✅ Fresh profile data fetched from API');
    }
  } catch (error) {
    console.error('API Fetch error:', error);
  } finally {
    loading.value = false;
  }
};

const openEditDialog = () => {
  const u = userData.value;
  editData.firstName = u.first_name || '';
  editData.lastName = u.last_name || '';
  editData.phone = u.contact_number || u.phone_number || '';
  editData.address = u.address || '';
  editData.dob = u.date_of_birth ? new Date(u.date_of_birth).toISOString().split('T')[0] : '';
  editData.gender = u.gender || '';
  editDialog.value = true;
};

const saveProfile = async () => {
  saving.value = true;
  try {
    const token = sessionStorage.getItem('authToken');
    await axios.put(`${API_BASE_URL}/auth/profile/update`, editData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    snackbar.text = 'Information updated successfully';
    snackbar.show = true;
    editDialog.value = false;
    await fetchUserData();
  } catch (error) {
    snackbar.text = 'Update failed. Check requirements.';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    saving.value = false;
  }
};

onMounted(fetchUserData);
</script>

<style src="./Profile.css" scoped></style>
