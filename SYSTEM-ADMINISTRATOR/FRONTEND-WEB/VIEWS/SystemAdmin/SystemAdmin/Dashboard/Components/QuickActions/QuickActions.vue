<template>
  <v-card class="quick-actions-card" elevation="0">
    <v-card-title class="card-header">
      <div class="header-wrapper">
        <div class="header-icon">
          <v-icon color="white" size="20">mdi-lightning-bolt</v-icon>
        </div>
        <div>
          <h3 class="header-title">Quick Actions</h3>
          <p class="header-subtitle">Common management tasks</p>
        </div>
      </div>
    </v-card-title>
    
    <v-card-text class="card-body">
      <div class="actions-grid">
        <button class="action-item" @click="$emit('action', 'add-owner')">
          <div class="action-icon primary">
            <v-icon color="white" size="20">mdi-account-plus</v-icon>
          </div>
          <span class="action-label">Add Business Owner</span>
        </button>
        
        <button class="action-item" @click="$emit('action', 'manage-subscriptions')">
          <div class="action-icon success">
            <v-icon color="white" size="20">mdi-credit-card-check</v-icon>
          </div>
          <span class="action-label">Manage Subscriptions</span>
        </button>
        
        <button class="action-item" @click="$emit('action', 'send-notifications')">
          <div class="action-icon warning">
            <v-icon color="white" size="20">mdi-bell-ring</v-icon>
          </div>
          <span class="action-label">Send Notifications</span>
        </button>
        
        <button class="action-item" @click="$emit('action', 'export-reports')">
          <div class="action-icon info">
            <v-icon color="white" size="20">mdi-file-export</v-icon>
          </div>
          <span class="action-label">Export Reports</span>
        </button>
        
        <button class="action-item" @click="$emit('action', 'view-analytics')">
          <div class="action-icon purple">
            <v-icon color="white" size="20">mdi-chart-bar</v-icon>
          </div>
          <span class="action-label">View Analytics</span>
        </button>
        
        <button class="action-item" @click="$emit('action', 'system-settings')">
          <div class="action-icon grey">
            <v-icon color="white" size="20">mdi-cog</v-icon>
          </div>
          <span class="action-label">System Settings</span>
        </button>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'QuickActions',
  emits: ['action']
}
</script>

<style scoped>
.quick-actions-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.header-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.header-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.card-body {
  padding: 20px 24px 24px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  background: #f9fafb;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-item:hover {
  background: #ffffff;
  border-color: rgba(0, 33, 129, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.action-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon.primary {
  background: linear-gradient(135deg, #002181 0%, #1565c0 100%);
}

.action-icon.success {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.action-icon.warning {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
}

.action-icon.info {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
}

.action-icon.purple {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
}

.action-icon.grey {
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
}

.action-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  text-align: center;
}

@media (max-width: 600px) {
  .actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .action-item {
    padding: 12px 8px;
  }
  
  .action-label {
    font-size: 11px;
  }
}
</style>
