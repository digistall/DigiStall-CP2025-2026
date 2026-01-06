<template>
  <div class="stallholder-dropdown-container">
    <v-autocomplete
      v-model="selectedStallholder"
      :items="stallholders"
      :loading="loading"
      :search="searchQuery"
      label="Search Stallholder"
      variant="outlined"
      density="comfortable"
      item-title="text"
      item-value="value"
      placeholder="Type to search stallholder name, stall number, or business type..."
      prepend-inner-icon="mdi-account-search"
      clearable
      no-filter
      @update:search="onSearchUpdate"
      @update:model-value="onSelectionUpdate"
      :rules="rules"
      :error-messages="errorMessage"
      hide-details="auto"
    >
      <template #item="{ props, item }">
        <v-list-item
          v-bind="props"
          :title="item.raw?.stallholderData?.name || 'Unknown Stallholder'"
          class="stallholder-item"
        >
          <template #prepend>
            <v-avatar size="40" color="primary">
              {{ (item.raw?.stallholderData?.name || 'U').charAt(0).toUpperCase() }}
            </v-avatar>
          </template>
          
          <div class="stallholder-details">
            <div class="stallholder-main-info">
              <span class="stallholder-name">{{ item.raw?.stallholderData?.name || 'Unknown Stallholder' }}</span>
              <v-chip 
                v-if="item.raw?.stallholderData?.stallNo"
                size="x-small" 
                color="primary" 
                variant="flat"
                class="stall-chip"
              >
                {{ item.raw?.stallholderData?.stallNo }}
              </v-chip>
            </div>
            <div class="stallholder-meta">
              <span class="business-type">{{ item.raw?.stallholderData?.businessName || 'N/A' }}</span>
              <span class="separator">•</span>
              <span class="monthly-rent">₱{{ formatCurrency(item.raw?.stallholderData?.monthlyRental || 0) }}/month</span>
              <span class="separator">•</span>
              <v-chip 
                size="x-small"
                :color="getPaymentStatusColor(item.raw?.stallholderData?.paymentStatus)"
                variant="flat"
              >
                {{ item.raw?.stallholderData?.paymentStatus || 'current' }}
              </v-chip>
            </div>
          </div>
        </v-list-item>
      </template>

      <template #selection="{ item }">
        <div class="selected-stallholder">
          <v-avatar size="24" color="primary" class="mr-2">
            {{ (item.raw?.stallholderData?.name || 'U').charAt(0).toUpperCase() }}
          </v-avatar>
          <span>{{ item.raw?.stallholderData?.name || 'Unknown Stallholder' }}</span>
          <v-chip 
            v-if="item.raw?.stallholderData?.stallNo"
            size="x-small" 
            color="primary" 
            variant="flat"
            class="ml-2"
          >
            {{ item.raw?.stallholderData?.stallNo }}
          </v-chip>
        </div>
      </template>

      <template #no-data>
        <v-list-item>
          <v-list-item-title class="text-center text-grey">
            <v-icon class="mr-2">mdi-account-search</v-icon>
            <span v-if="loading">Loading stallholders...</span>
            <span v-else-if="stallholders.length === 0">No stallholders available ({{ stallholders.length }})</span>
            <span v-else>Type to search {{ stallholders.length }} stallholders</span>
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-autocomplete>

    <!-- Selected Stallholder Details Card -->
    <v-card 
      v-if="selectedStallholderData" 
      class="mt-3 stallholder-info-card"
      elevation="1"
    >
      <v-card-text class="pa-3">
        <div class="selected-stallholder-details">
          <div class="info-row">
            <span class="info-label">Business Name:</span>
            <span class="info-value">{{ selectedStallholderData.businessName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Contact:</span>
            <span class="info-value">{{ selectedStallholderData.contact }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Stall Location:</span>
            <span class="info-value">{{ selectedStallholderData.stallLocation || 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Monthly Rent:</span>
            <span class="info-value amount">₱{{ formatCurrency(selectedStallholderData.monthlyRental || 0) }}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'StallholderDropdown',
  props: {
    modelValue: {
      type: [String, Number],
      default: null
    },
    rules: {
      type: Array,
      default: () => []
    },
    errorMessage: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'stallholder-selected', 'error'],
  data() {
    return {
      selectedStallholder: this.modelValue,
      stallholders: [],
      loading: false,
      searchQuery: '',
      debounceTimer: null
    }
  },
  computed: {
    selectedStallholderData() {
      if (!this.selectedStallholder) return null
      const stallholder = this.stallholders.find(s => s.value === this.selectedStallholder)
      return stallholder ? stallholder.stallholderData : null
    }
  },
  watch: {
    modelValue(newVal) {
      this.selectedStallholder = newVal
    },
    selectedStallholder(newVal) {
      this.$emit('update:modelValue', newVal)
      if (newVal && this.selectedStallholderData) {
        this.$emit('stallholder-selected', this.selectedStallholderData)
      }
    }
  },
  mounted() {
    console.log('🎯 StallholderDropdown mounted, checking authentication...')
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      console.log('❌ No auth token found - loading fallback data')
      this.loadFallbackStallholders()
      this.loading = false
      return
    }
    console.log('✅ Auth token found, fetching stallholders...')
    this.fetchStallholders()
  },
  methods: {
    async fetchStallholders(searchTerm = '') {
      console.log('🔍 fetchStallholders called with searchTerm:', searchTerm)
      this.loading = true
      try {
        const token = sessionStorage.getItem('authToken')
        console.log('🔑 Token exists:', !!token)
        if (!token) {
          throw new Error('No authentication token found. Please log in.')
        }

        // Use the new stored procedure endpoint (no search parameter needed)
        const response = await fetch('/api/payments/stallholders', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('📡 API Response Status:', response.status)
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.')
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view stallholders.')
          }
          throw new Error(`Failed to fetch stallholders: ${response.status}`)
        }

        const result = await response.json()
        console.log('📊 API Response Result:', result)

        if (result.success && Array.isArray(result.data)) {
          // Transform the new API response format to dropdown format
          this.stallholders = result.data.map(stallholder => ({
            title: `${stallholder.name || 'Unknown'} - ${stallholder.stallNo || 'No Stall'}`,
            value: stallholder.id,
            stallholderData: {
              id: stallholder.id,
              name: stallholder.name,
              businessName: stallholder.businessName || stallholder.business_name,
              contact: stallholder.contact || stallholder.contact_number,
              stallNo: stallholder.stallNo || stallholder.stall_no,
              stallLocation: stallholder.stallLocation || stallholder.stall_location,
              monthlyRental: stallholder.monthlyRental || stallholder.rental_price || stallholder.monthly_rental,
              branchName: stallholder.branchName || stallholder.branch_name,
              contractStatus: stallholder.contractStatus || stallholder.contract_status,
              paymentStatus: stallholder.totalPayments > 0 ? 'paid' : 'pending',
              totalPayments: stallholder.totalPayments || 0,
              lastPaymentDate: stallholder.lastPaymentDate
            }
          }))

          // Filter by search term if provided (client-side filtering)
          if (searchTerm && searchTerm.trim()) {
            const query = searchTerm.toLowerCase().trim()
            this.stallholders = this.stallholders.filter(item => {
              const data = item.stallholderData
              return (
                (data.name && data.name.toLowerCase().includes(query)) ||
                (data.stallNo && data.stallNo.toLowerCase().includes(query)) ||
                (data.businessName && data.businessName.toLowerCase().includes(query))
              )
            })
          }

          console.log('✅ Stallholders loaded successfully:', this.stallholders.length)
        } else {
          console.warn('⚠️ Invalid API response format:', result)
          throw new Error('Invalid response format from server')
        }
      } catch (error) {
        console.error('❌ Error fetching stallholders:', error)
        
        // Show user-friendly error
        if (error.message.includes('Authentication') || error.message.includes('log in')) {
          // Could emit an event for parent to handle login redirect
          this.$emit('auth-error', error.message)
        }
        
        // Load fallback data for development
        this.loadFallbackStallholders()
      } finally {
        this.loading = false
      }
    },

    onSearchUpdate(searchTerm) {
      this.searchQuery = searchTerm
      
      // Debounce search requests
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      
      this.debounceTimer = setTimeout(() => {
        this.fetchStallholders(searchTerm)
      }, 300)
    },

    onSelectionUpdate(value) {
      this.selectedStallholder = value
    },

    formatCurrency(amount) {
      if (!amount) return '0.00'
      return parseFloat(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    getPaymentStatusColor(status) {
      const statusColors = {
        'current': 'success',
        'overdue': 'error',
        'grace_period': 'warning'
      }
      return statusColors[status] || 'grey'
    },

    loadFallbackStallholders() {
      console.log('🧪 Loading fallback stallholder data')
      this.stallholders = [
        {
          value: 16,
          text: 'Carlos Mendoza',
          stallholderData: {
            id: 16,
            name: 'Carlos Mendoza',
            businessName: 'Mendoza Food Corner',
            stallNo: 'NPM-008',
            stallLocation: 'Food Court Central',
            contact: '09201234567',
            email: 'carlos.mendoza@email.com',
            monthlyRent: 5000,
            paymentStatus: 'current'
          }
        },
        {
          value: 13,
          text: 'Maria Santos',
          stallholderData: {
            id: 13,
            name: 'Maria Santos',
            businessName: 'Santos General Merchandise',
            stallNo: 'NPM-005',
            stallLocation: 'Corner Market Area',
            contact: '09171234567',
            email: 'maria.santos@email.com',
            monthlyRent: 4500,
            paymentStatus: 'current'
          }
        },
        {
          value: 14,
          text: 'Roberto Cruz',
          stallholderData: {
            id: 14,
            name: 'Roberto Cruz',
            businessName: 'Cruz Electronics Repair',
            stallNo: 'NPM-008',
            stallLocation: 'South Plaza',
            contact: '09181234567',
            email: 'roberto.cruz@email.com',
            monthlyRent: 4000,
            paymentStatus: 'current'
          }
        },
        {
          value: 15,
          text: 'Elena Reyes',
          stallholderData: {
            id: 15,
            name: 'Elena Reyes',
            businessName: 'Elena\'s Fashion Corner',
            stallNo: 'NPM-009',
            stallLocation: 'Center Court',
            contact: '09191234567',
            email: 'elena.reyes@email.com',
            monthlyRent: 4800,
            paymentStatus: 'payment_overdue'
          }
        }
      ]
      console.log('✅ Loaded', this.stallholders.length, 'fallback stallholders')
    }
  }
}
</script>

<style scoped>
.stallholder-dropdown-container {
  width: 100%;
}

.stallholder-item {
  padding: 12px 16px !important;
}

.stallholder-details {
  flex: 1;
  margin-left: 12px;
}

.stallholder-main-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.stallholder-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.stall-chip {
  font-size: 10px !important;
  height: 20px !important;
}

.stallholder-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.business-type {
  font-weight: 500;
}

.monthly-rent {
  color: #059669;
  font-weight: 500;
}

.separator {
  color: #d1d5db;
}

.selected-stallholder {
  display: flex;
  align-items: center;
}

.stallholder-info-card {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.selected-stallholder-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  min-width: 100px;
}

.info-value {
  font-size: 12px;
  color: #1f2937;
  font-weight: 500;
  text-align: right;
}

.info-value.amount {
  color: #059669;
  font-weight: 600;
}
</style>