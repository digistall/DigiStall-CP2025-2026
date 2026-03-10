<template>
  <div class="profile-page-fluid">
    <LoadingScreen :visible="loading" message="Loading profile..." />

    <!-- Header Bar -->
    <div v-if="userData" class="profile-header">
      <div class="header-left">
        <v-avatar size="52" class="header-avatar">
          <v-img :src="avatarUrl" cover v-if="avatarUrl"></v-img>
          <v-icon size="28" color="white" v-else>{{ userRoleIcon }}</v-icon>
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2">
            <h1 class="header-name">{{ displayFullName }}</h1>
            <v-chip color="success" size="x-small" label class="font-weight-bold">AUTHORIZED</v-chip>
          </div>
          <div class="header-meta">
            {{ displayRole }}<template v-if="userType !== 'system_administrator'"> <span class="mx-1">•</span> {{ displayLocation }}</template>
          </div>
        </div>
      </div>
      <v-btn variant="outlined" color="primary" @click="openEditDialog" prepend-icon="mdi-account-edit" size="small" class="manage-btn">Manage Profile</v-btn>
    </div>

    <!-- Quick Actions -->
    <div v-if="userData" class="quick-actions-bar">
      <template v-if="userType === 'system_administrator'">
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-view-dashboard" size="x-small" @click="$router.push('/system-admin/dashboard')">Dashboard</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-account-multiple" size="x-small" @click="$router.push('/system-admin/business-owners')">Business Owners</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-cash-multiple" size="x-small" @click="$router.push('/system-admin/payments')">Payments</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-chart-box" size="x-small" @click="$router.push('/system-admin/reports')">Reports</v-btn>
      </template>
      <template v-else-if="userType === 'stall_business_owner'">
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-view-dashboard" size="x-small" @click="$router.push('/app/dashboard')">Dashboard</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-domain" size="x-small" @click="$router.push('/app/branch')">Branches</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-store" size="x-small" @click="$router.push('/app/stalls')">Stalls</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-account-tie" size="x-small" @click="$router.push('/app/employees')">Employees</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-credit-card-outline" size="x-small" @click="$router.push('/app/subscription')">Subscription</v-btn>
      </template>
      <template v-else-if="userType === 'business_manager'">
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-view-dashboard" size="x-small" @click="$router.push('/app/dashboard')">Dashboard</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-store" size="x-small" @click="$router.push('/app/stalls')">Stalls</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-account-group" size="x-small" @click="$router.push('/app/applicants')">Applicants</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-credit-card" size="x-small" @click="$router.push('/app/payment')">Payments</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-account-multiple" size="x-small" @click="$router.push('/app/stallholders')">Stallholders</v-btn>
      </template>
      <template v-else-if="userType === 'business_employee'">
        <v-btn v-if="hasPermission('dashboard')" variant="tonal" color="primary" prepend-icon="mdi-view-dashboard" size="x-small" @click="$router.push('/app/dashboard')">Dashboard</v-btn>
        <v-btn v-if="hasPermission('payments')" variant="tonal" color="primary" prepend-icon="mdi-credit-card" size="x-small" @click="$router.push('/app/payment')">Payments</v-btn>
        <v-btn v-if="hasPermission('applicants')" variant="tonal" color="primary" prepend-icon="mdi-account-group" size="x-small" @click="$router.push('/app/applicants')">Applicants</v-btn>
        <v-btn v-if="hasPermission('complaints')" variant="tonal" color="primary" prepend-icon="mdi-chart-line" size="x-small" @click="$router.push('/app/complaints')">Complaints</v-btn>
        <v-btn v-if="hasPermission('stalls')" variant="tonal" color="primary" prepend-icon="mdi-store" size="x-small" @click="$router.push('/app/stalls')">Stalls</v-btn>
        <v-btn v-if="hasPermission('stallholders')" variant="tonal" color="primary" prepend-icon="mdi-account-multiple" size="x-small" @click="$router.push('/app/stallholders')">Stallholders</v-btn>
      </template>
    </div>

    <!-- Content Area -->
    <div v-if="userData" class="profile-content">
      <!-- Row 1: Two card columns -->
      <div class="cards-row">
        <!-- Personnel Details -->
        <div class="card-col">
          <v-card class="info-card" flat>
            <v-card-title class="card-header"><v-icon color="primary" class="mr-2" size="18">mdi-account-details</v-icon> Personnel Details</v-card-title>
            <v-card-text class="card-body">
              <div class="info-grid">
                <div class="info-item"><div class="info-label">First Name</div><div class="info-value">{{ userData.first_name || userData.firstName || '—' }}</div></div>
                <div class="info-item"><div class="info-label">Last Name</div><div class="info-value">{{ userData.last_name || userData.lastName || '—' }}</div></div>
                <div class="info-item"><div class="info-label">Gender</div><div class="info-value">{{ displayGender }}</div></div>
                <div class="info-item"><div class="info-label">Date of Birth</div><div class="info-value">{{ displayDOB }}</div></div>
                <div class="info-item"><div class="info-label">Primary Residence</div><div class="info-value">{{ displayAddress }}</div></div>
                <div class="info-item"><div class="info-label">Email Address</div><div class="info-value">{{ displayEmail }}</div></div>
              </div>
              <!-- Access -->
              <div class="access-row">
                <span class="access-title"><v-icon size="12" color="primary" class="mr-1">mdi-shield-key</v-icon>
                  <template v-if="userType === 'system_administrator'">System Access</template>
                  <template v-else-if="userType === 'business_employee'">Granted Permissions</template>
                  <template v-else>Access Level</template>
                </span>
                <div v-if="userType === 'business_employee' && permissionsList.length > 0" class="d-flex flex-wrap ga-1 mt-1">
                  <v-chip v-for="perm in permissionsList" :key="perm" size="x-small" color="success" variant="tonal" label>{{ formatPermission(perm) }}</v-chip>
                </div>
                <div v-else-if="userType === 'system_administrator'" class="d-flex flex-wrap ga-1 mt-1">
                  <v-chip size="x-small" color="error" variant="tonal" label>Full Admin</v-chip>
                </div>
                <span v-else class="access-value">Full administrative access</span>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Business Affiliation / System Admin -->
        <div class="card-col">
          <v-card class="info-card" flat>
            <v-card-title class="card-header">
              <v-icon color="primary" class="mr-2" size="18">{{ userType === 'system_administrator' ? 'mdi-server-security' : 'mdi-office-building' }}</v-icon>
              {{ userType === 'system_administrator' ? 'System Administration' : 'Business Affiliation' }}
            </v-card-title>
            <v-card-text class="card-body">
              <div class="info-grid">
                <div class="info-item"><div class="info-label">Contact Number</div><div class="info-value">{{ displayPhone }}</div></div>
                <div class="info-item"><div class="info-label">Official Role</div><div class="info-value">{{ displayRole }}</div></div>
                <template v-if="userType !== 'system_administrator'">
                  <div class="info-item"><div class="info-label">{{ userType === 'stall_business_owner' ? 'Business Portfolio' : (userType === 'business_employee' ? 'Assigned Branch' : 'Assigned Unit/Branch') }}</div><div class="info-value">{{ displayLocation }}</div></div>
                </template>
                <template v-else>
                  <div class="info-item"><div class="info-label">Security Level</div><div class="info-value">Level 5 (Full Admin)</div></div>
                </template>
                <div class="info-item"><div class="info-label">{{ userType === 'stall_business_owner' ? 'Registration Date' : (userType === 'system_administrator' ? 'Account Created' : 'Employment Date') }}</div><div class="info-value">{{ displayJoinDate }}</div></div>
                <div class="info-item"><div class="info-label">Account Status</div><div class="info-value"><v-chip size="x-small" color="success" label class="font-weight-bold">ACTIVE</v-chip></div></div>
                <!-- Employee extras -->
                <template v-if="userType === 'business_employee'">
                  <div class="info-item"><div class="info-label">Designation</div><div class="info-value">{{ userData.designation || 'Operational Staff' }}</div></div>
                </template>
                <!-- System Admin extras -->
                <template v-if="userType === 'system_administrator'">
                  <div class="info-item"><div class="info-label">Platform</div><div class="info-value">DigiStall v2.0</div></div>
                </template>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>

      <!-- Row 2: Business Overview (Owner/Manager) -->
      <div v-if="userType === 'business_manager' || userType === 'stall_business_owner'" class="stats-section">
        <v-card class="info-card" flat>
          <v-card-title class="card-header">
            <v-icon color="primary" class="mr-2" size="18">mdi-chart-line</v-icon>
            {{ userType === 'stall_business_owner' ? 'Business Portfolio Overview' : 'Business Overview (Current Branch)' }}
          </v-card-title>
          <v-card-text class="card-body">
            <div class="stats-row">
              <div class="stat-mini stat-blue"><div class="stat-mini-icon"><v-icon size="22" color="white">mdi-store</v-icon></div><div><div class="stat-mini-val">{{ stats.managedStalls }}</div><div class="stat-mini-label">Managed Stalls</div></div></div>
              <div class="stat-mini stat-green"><div class="stat-mini-icon"><v-icon size="22" color="white">mdi-cash-multiple</v-icon></div><div><div class="stat-mini-val">{{ formatCurrency(stats.totalRevenue) }}</div><div class="stat-mini-label">Total Revenue</div></div></div>
              <div class="stat-mini stat-purple"><div class="stat-mini-icon"><v-icon size="22" color="white">mdi-account-group</v-icon></div><div><div class="stat-mini-val">{{ stats.activePersonnel }}</div><div class="stat-mini-label">Active Personnel</div></div></div>
              <div class="stat-mini stat-orange"><div class="stat-mini-icon"><v-icon size="22" color="white">mdi-account-multiple-check</v-icon></div><div><div class="stat-mini-val">{{ stats.activeStallholders }}</div><div class="stat-mini-label">Active Stallholders</div></div></div>
              <div class="stat-mini stat-red"><div class="stat-mini-icon"><v-icon size="22" color="white">mdi-clipboard-text-clock</v-icon></div><div><div class="stat-mini-val">{{ stats.pendingApplications }}</div><div class="stat-mini-label">Pending Apps</div></div></div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="editDialog" max-width="640px" persistent>
      <v-card rounded="xl" class="edit-dialog-card">
        <v-card-title class="edit-dialog-header">
          <v-icon color="white" class="mr-3">mdi-account-edit</v-icon>
          <span class="text-h6 font-weight-bold">Update Profile</span>
          <v-spacer></v-spacer>
          <v-btn icon color="white" variant="text" @click="editDialog = false" size="small"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="editForm" v-model="formValid">
            <div class="text-caption text-uppercase font-weight-bold text-grey-darken-2 mb-3"><v-icon size="14" class="mr-1">mdi-account</v-icon> Personal Information</div>
            <v-row dense>
              <v-col cols="12" sm="6"><v-text-field v-model="editData.firstName" label="First Name" variant="outlined" density="comfortable" prepend-inner-icon="mdi-account" :rules="[v => !!v || 'Required']"></v-text-field></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editData.lastName" label="Last Name" variant="outlined" density="comfortable" prepend-inner-icon="mdi-account-outline" :rules="[v => !!v || 'Required']"></v-text-field></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editData.phone" label="Contact Number" variant="outlined" density="comfortable" prepend-inner-icon="mdi-phone"></v-text-field></v-col>
              <v-col cols="12" sm="6"><v-select v-model="editData.gender" :items="['Male', 'Female', 'Other']" label="Gender" variant="outlined" density="comfortable" prepend-inner-icon="mdi-gender-male-female"></v-select></v-col>
            </v-row>
            <div class="text-caption text-uppercase font-weight-bold text-grey-darken-2 mb-3 mt-2"><v-icon size="14" class="mr-1">mdi-map-marker</v-icon> Additional Details</div>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-menu v-model="dobMenu" :close-on-content-click="false" location="bottom">
                  <template v-slot:activator="{ props }">
                    <v-text-field v-bind="props" :model-value="editData.dob ? formatDateDisplay(editData.dob) : ''" label="Date of Birth" variant="outlined" density="comfortable" prepend-inner-icon="mdi-calendar" readonly clearable @click:clear="editData.dob = ''"></v-text-field>
                  </template>
                  <v-date-picker v-model="dobPickerDate" @update:model-value="handleDobChange" color="primary" :max="new Date().toISOString().split('T')[0]" header="Select Date of Birth" show-adjacent-months></v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="editData.address" label="Primary Residence" variant="outlined" density="comfortable" prepend-inner-icon="mdi-map-marker" placeholder="City, Province"></v-text-field></v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey-darken-1" @click="editDialog = false" class="px-6">Discard</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" :disabled="!formValid" @click="saveProfile" class="px-8 font-weight-bold" rounded="lg">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="bottom left" elevation="24">
      <div class="d-flex align-center"><v-icon class="mr-3">{{ snackbar.color === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle' }}</v-icon>{{ snackbar.text }}</div>
      <template v-slot:actions><v-btn variant="text" @click="snackbar.show = false">Close</v-btn></template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import axios from 'axios';
import LoadingScreen from '@common/LoadingScreen/LoadingScreen.vue';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const userData = ref(null);
const loading = ref(true);
const saving = ref(false);
const avatarUrl = ref(null);
const editDialog = ref(false);
const formValid = ref(false);
const editForm = ref(null);
const dobMenu = ref(false);
const dobPickerDate = ref(null);

const editData = reactive({ firstName: '', lastName: '', phone: '', address: '', dob: '', gender: '' });
const snackbar = reactive({ show: false, text: '', color: 'success' });
const stats = reactive({ managedStalls: 0, totalRevenue: 0, activePersonnel: 0, activeStallholders: 0, pendingApplications: 0 });

const userType = computed(() => userData.value?.userType || '');

const displayFullName = computed(() => {
  if (!userData.value) return '...';
  const u = userData.value;
  return `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim() || 'Authorized User';
});

const displayRole = computed(() => {
  const roles = { 'system_administrator': 'System Administrator', 'stall_business_owner': 'Business Owner', 'business_manager': 'Branch Manager', 'business_employee': userData.value?.designation || 'Operational Staff' };
  return roles[userType.value] || 'Authorized Personnel';
});

const userRoleIcon = computed(() => {
  const icons = { 'system_administrator': 'mdi-shield-account', 'stall_business_owner': 'mdi-briefcase-variant', 'business_manager': 'mdi-account-tie', 'business_employee': 'mdi-account-hard-hat' };
  return icons[userType.value] || 'mdi-account-circle';
});

const formatCurrency = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);
const getAuthToken = () => localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

const displayEmail = computed(() => userData.value?.email || 'N/A');
const displayPhone = computed(() => userData.value?.contact_number || userData.value?.phone_number || 'N/A');
const displayLocation = computed(() => userData.value?.branch_name || userData.value?.branchName || (userType.value === 'stall_business_owner' ? 'Multi-Branch' : 'Main Office'));
const displayGender = computed(() => userData.value?.gender || 'Not specified');
const displayDOB = computed(() => {
  if (!userData.value?.date_of_birth) return 'Not specified';
  return new Date(userData.value.date_of_birth).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
});
const displayAddress = computed(() => userData.value?.address || 'N/A');
const displayJoinDate = computed(() => {
  const date = userData.value?.date_created || userData.value?.created_at || userData.value?.hired_date || userData.value?.hiredDate;
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
});

const permissionsList = computed(() => {
  const p = userData.value?.permissions;
  if (!p) return [];
  if (Array.isArray(p)) return p;
  if (typeof p === 'object') return Object.keys(p).filter(k => p[k] === true);
  try { return JSON.parse(p); } catch { return []; }
});

const hasPermission = (perm) => {
  const p = userData.value?.permissions;
  if (!p) return false;
  if (Array.isArray(p)) return p.includes(perm);
  if (typeof p === 'object') return p[perm] === true;
  return false;
};

const formatPermission = (perm) => perm.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const formatDateDisplay = (dateStr) => { if (!dateStr) return ''; try { return new Date(dateStr).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return dateStr; } };
const handleDobChange = (val) => { if (val) { editData.dob = new Date(val).toISOString().split('T')[0]; } dobMenu.value = false; };

const fetchBusinessStats = async () => {
  const token = getAuthToken();
  if (!token) return;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  try {
    const [stallsRes, paymentsRes, employeesRes, applicantsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/stalls`, { headers }).catch(() => ({ ok: false })),
      fetch(`${API_BASE_URL}/payments/onsite`, { headers }).catch(() => ({ ok: false })),
      fetch(`${API_BASE_URL}/employees`, { headers }).catch(() => ({ ok: false })),
      fetch(`${API_BASE_URL}/applicants/my-stall-applicants`, { headers }).catch(() => ({ ok: false }))
    ]);
    if (stallsRes.ok) { const r = await stallsRes.json(); if (r.success && r.data) { stats.managedStalls = r.data.length; const u = new Set(); r.data.forEach(s => { if (s.stallholder_id) u.add(s.stallholder_id); }); stats.activeStallholders = u.size; } }
    if (paymentsRes.ok) { const r = await paymentsRes.json(); if (r.success && r.data) { stats.totalRevenue = r.data.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || parseFloat(p.amount) || 0), 0); } }
    if (employeesRes.ok) { const r = await employeesRes.json(); if (r.success && r.data) stats.activePersonnel = r.data.length; }
    if (applicantsRes.ok) { const r = await applicantsRes.json(); if (r.success && r.data && r.data.applicants) { stats.pendingApplications = r.data.applicants.filter(a => { const s = a.application_status || (a.applications?.[0]?.application_status || ''); return s.toLowerCase() === 'pending'; }).length; } }
  } catch (error) { console.error('⚠️ Error fetching business stats:', error); }
};

const fetchUserData = async () => {
  const storedUser = sessionStorage.getItem('currentUser');
  if (storedUser) { try { userData.value = JSON.parse(storedUser); loading.value = false; } catch (e) { console.error(e); } }
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.data.success) { userData.value = response.data.data; sessionStorage.setItem('currentUser', JSON.stringify(userData.value)); }
  } catch (error) { console.error('API Fetch error:', error); }
  finally { loading.value = false; }
  if (userType.value === 'business_manager' || userType.value === 'stall_business_owner') { await fetchBusinessStats(); }
};

const openEditDialog = () => {
  const u = userData.value;
  editData.firstName = u.first_name || ''; editData.lastName = u.last_name || '';
  editData.phone = u.contact_number || u.phone_number || ''; editData.address = u.address || '';
  editData.dob = u.date_of_birth ? new Date(u.date_of_birth).toISOString().split('T')[0] : '';
  editData.gender = u.gender || '';
  dobPickerDate.value = editData.dob ? new Date(editData.dob) : null;
  editDialog.value = true;
};

const saveProfile = async () => {
  saving.value = true;
  try {
    const token = getAuthToken();
    await axios.put(`${API_BASE_URL}/auth/profile/update`, editData, { headers: { Authorization: `Bearer ${token}` } });
    snackbar.text = 'Profile updated successfully'; snackbar.color = 'success'; snackbar.show = true;
    editDialog.value = false; await fetchUserData();
  } catch (error) { snackbar.text = 'Update failed. Please try again.'; snackbar.color = 'error'; snackbar.show = true; }
  finally { saving.value = false; }
};

onMounted(fetchUserData);
</script>

<style src="./Profile.css" scoped></style>
