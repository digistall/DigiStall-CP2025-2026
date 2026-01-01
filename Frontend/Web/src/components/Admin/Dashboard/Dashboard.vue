<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-app>
    <div>
      <!-- Main Content -->
      <v-main>
        <v-container fluid class="main-content">
          <!-- Standardized Loading Overlay - Fixed to viewport -->
          <LoadingOverlay 
            :loading="loading" 
            text="Loading dashboard data..."
            :full-page="true"
          />
          
          <v-row>
            <v-col cols="12">
              <!-- Dashboard Header with Refresh Controls -->
              <div class="dashboard-header d-flex align-center justify-space-between mb-4">
                <div class="d-flex align-center">
                  <h1 class="text-h5 font-weight-bold">Dashboard</h1>
                  <v-chip
                    class="ml-3"
                    color="success"
                    size="small"
                    variant="flat"
                  >
                    <v-icon start size="14">mdi-refresh-auto</v-icon>
                    Live
                  </v-chip>
                </div>
                <div class="d-flex align-center">
                  <span v-if="lastRefreshTime" class="text-caption text-grey">
                    Updated: {{ formatLastRefreshTime }}
                  </span>
                </div>
              </div>
              
              <!-- Key Metrics Cards -->
              <v-row class="mb-6">
                <v-col cols="12" sm="6" md="3">
                  <v-card class="metric-card" elevation="2" :loading="loading">
                    <v-btn
                      class="download-btn"
                      icon
                      size="small"
                      variant="text"
                      @click.stop="exportStalls"
                      title="Download Stalls Data"
                    >
                      <v-icon size="18">mdi-download</v-icon>
                    </v-btn>
                    <v-card-text class="metric-content">
                      <div class="metric-title">Total Stalls</div>
                      <div class="metric-body">
                        <v-icon size="48" color="primary" class="metric-icon"
                          >mdi-store</v-icon
                        >
                        <div class="metric-number">{{ totalStalls }}</div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card class="metric-card" elevation="2" :loading="loading">
                    <v-btn
                      class="download-btn"
                      icon
                      size="small"
                      variant="text"
                      @click.stop="exportStallholders"
                      title="Download Stallholders Data"
                    >
                      <v-icon size="18">mdi-download</v-icon>
                    </v-btn>
                    <v-card-text class="metric-content">
                      <div class="metric-title">Active Stallholders</div>
                      <div class="metric-body">
                        <v-icon size="48" color="success" class="metric-icon"
                          >mdi-account-group</v-icon
                        >
                        <div class="metric-number">{{ totalStallholders }}</div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card class="metric-card" elevation="2" :loading="loading">
                    <v-btn
                      class="download-btn"
                      icon
                      size="small"
                      variant="text"
                      @click.stop="exportPayments"
                      title="Download Payments Data"
                    >
                      <v-icon size="18">mdi-download</v-icon>
                    </v-btn>
                    <v-card-text class="metric-content">
                      <div class="metric-title">Total Payments</div>
                      <div class="metric-body">
                        <v-icon size="48" color="warning" class="metric-icon"
                          >mdi-currency-php</v-icon
                        >
                        <div class="metric-number">
                          ₱{{ totalPayments.toLocaleString() }}
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card class="metric-card" elevation="2" :loading="loading">
                    <v-btn
                      class="download-btn"
                      icon
                      size="small"
                      variant="text"
                      @click.stop="exportEmployees"
                      title="Download Employees Data"
                    >
                      <v-icon size="18">mdi-download</v-icon>
                    </v-btn>
                    <v-card-text class="metric-content">
                      <div class="metric-title">Active Employees</div>
                      <div class="metric-body">
                        <v-icon size="48" color="info" class="metric-icon"
                          >mdi-account-tie</v-icon
                        >
                        <div class="metric-number">{{ totalCollectors }}</div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Charts Row -->
              <v-row class="mb-6">
                <!-- Payment Trends Chart -->
                <v-col cols="12" lg="4">
                  <v-card elevation="2" class="chart-card">
                    <v-card-title class="chart-title">
                      <v-icon left color="primary">mdi-chart-line</v-icon>
                      Payment Trends (Last 7 Days)
                      <v-spacer></v-spacer>
                      <v-btn
                        class="chart-download-btn"
                        icon
                        size="small"
                        variant="text"
                        @click.stop="exportPaymentTrends"
                        title="Download Payment Trends"
                      >
                        <v-icon size="18">mdi-download</v-icon>
                      </v-btn>
                    </v-card-title>
                    <v-card-text>
                      <div class="chart-container">
                        <canvas
                          ref="paymentChart"
                          class="chart-canvas"
                          width="400"
                          height="300"
                          style="border: 1px solid #e0e0e0; border-radius: 8px"
                        ></canvas>
                        <div v-if="!paymentChart" class="chart-placeholder">
                          <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
                          <p class="text-grey-600 mt-2">Loading chart...</p>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Stall Occupancy Chart -->
                <v-col cols="12" lg="4">
                  <v-card elevation="2" class="chart-card">
                    <v-card-title class="chart-title">
                      <v-icon left color="success">mdi-chart-donut</v-icon>
                      Stall Occupancy Status
                      <v-spacer></v-spacer>
                      <v-btn
                        class="chart-download-btn"
                        icon
                        size="small"
                        variant="text"
                        @click.stop="exportOccupancy"
                        title="Download Occupancy Data"
                      >
                        <v-icon size="18">mdi-download</v-icon>
                      </v-btn>
                    </v-card-title>
                    <v-card-text>
                      <div class="chart-container">
                        <canvas
                          ref="occupancyChart"
                          class="chart-canvas"
                          width="400"
                          height="300"
                          style="border: 1px solid #e0e0e0; border-radius: 8px"
                        ></canvas>
                        <div v-if="!occupancyChart" class="chart-placeholder">
                          <v-icon size="48" color="grey-lighten-1"
                            >mdi-chart-donut</v-icon
                          >
                          <p class="text-grey-600 mt-2">Loading chart...</p>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Collector Performance Chart -->
                <v-col cols="12" lg="4">
                  <v-card elevation="2" class="chart-card">
                    <v-card-title class="chart-title">
                      <v-icon left color="info">mdi-chart-bar</v-icon>
                      Collector Performance
                      <v-spacer></v-spacer>
                      <v-btn
                        class="chart-download-btn"
                        icon
                        size="small"
                        variant="text"
                        @click.stop="exportCollectorPerformance"
                        title="Download Collector Performance"
                      >
                        <v-icon size="18">mdi-download</v-icon>
                      </v-btn>
                    </v-card-title>
                    <v-card-text>
                      <div class="chart-container">
                        <canvas
                          ref="collectorChart"
                          class="chart-canvas"
                          width="400"
                          height="300"
                          style="border: 1px solid #e0e0e0; border-radius: 8px"
                        ></canvas>
                        <div v-if="!collectorChart" class="chart-placeholder">
                          <v-icon size="48" color="grey-lighten-1">mdi-chart-bar</v-icon>
                          <p class="text-grey-600 mt-2">Loading chart...</p>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Data Tables - Stacked Vertically -->
              <!-- Recent Payments -->
              <v-row class="mb-4">
                <v-col cols="12">
                  <v-card elevation="2" class="data-table-card" :loading="loading">
                    <v-card-title class="table-header">
                      <v-icon left color="warning">mdi-credit-card</v-icon>
                      Recent Payments
                    </v-card-title>
                    <v-card-text class="pa-0">
                      <div class="table-scroll-container">
                        <v-table class="custom-table" v-if="recentPayments.length > 0">
                          <thead>
                            <tr>
                              <th>Stallholder</th>
                              <th>Type</th>
                              <th>Amount</th>
                              <th>Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="payment in recentPayments.slice(0, 7)" :key="payment.id">
                              <td class="font-weight-medium">{{ payment.stallholder }}</td>
                              <td>
                                <v-chip
                                  :color="getPaymentTypeColor(payment.paymentType)"
                                  size="small"
                                  variant="flat"
                                >
                                  {{ formatPaymentType(payment.paymentType) }}
                                </v-chip>
                              </td>
                              <td class="text-success font-weight-bold">
                                ₱{{ payment.amount.toLocaleString() }}
                              </td>
                              <td class="text-grey-600">{{ payment.date }}</td>
                              <td>
                                <v-chip
                                  :color="getStatusColor(payment.status)"
                                  size="small"
                                  variant="flat"
                                >
                                  {{ payment.status }}
                                </v-chip>
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                        <div v-else class="empty-state pa-6 text-center">
                          <v-icon size="48" color="grey-lighten-1">mdi-credit-card-off</v-icon>
                          <p class="text-grey-600 mt-2">No recent payments found</p>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Active Employees -->
              <v-row class="mb-4">
                <v-col cols="12">
                  <v-card elevation="2" class="data-table-card" :loading="loading">
                    <v-card-title class="table-header d-flex align-center" style="flex-wrap: nowrap;">
                      <v-icon left color="info" class="mr-2">mdi-account-tie</v-icon>
                      <span>Active Employees</span>
                      <v-chip size="small" color="success" variant="flat" class="ml-3">
                        {{ onlineEmployeesCount }} Online
                      </v-chip>
                    </v-card-title>
                    <v-card-text class="pa-0">
                      <div class="table-scroll-container">
                        <v-table class="custom-table" v-if="activeCollectors.length > 0">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Role</th>
                              <th>Area</th>
                              <th>Last Activity</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="employee in activeCollectors.slice(0, 7)" :key="employee.id">
                              <td class="font-weight-medium">{{ employee.name }}</td>
                              <td>
                                <v-chip
                                  :color="getRoleColor(employee.type)"
                                  size="small"
                                  variant="flat"
                                >
                                  {{ employee.role || 'Employee' }}
                                </v-chip>
                              </td>
                              <td class="text-grey-600">{{ employee.area }}</td>
                              <td class="text-grey-600">{{ employee.lastActivity || 'N/A' }}</td>
                              <td>
                                <v-chip
                                  :color="getOnlineStatusColor(employee.isOnline)"
                                  size="small"
                                  variant="flat"
                                >
                                  <v-icon size="12" class="mr-1">{{ employee.isOnline ? 'mdi-circle' : 'mdi-circle-outline' }}</v-icon>
                                  {{ employee.isOnline ? 'Online' : 'Offline' }}
                                </v-chip>
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                        <div v-else class="empty-state pa-6 text-center">
                          <v-icon size="48" color="grey-lighten-1">mdi-account-off</v-icon>
                          <p class="text-grey-600 mt-2">No active employees found</p>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Stall Overview -->
              <v-row class="mb-4">
                <v-col cols="12">
                  <v-card elevation="2" class="data-table-card" :loading="loading">
                    <v-card-title class="table-header">
                      <v-icon left color="primary">mdi-store</v-icon>
                      Stall Overview
                    </v-card-title>
                    <v-card-text class="pa-0">
                      <div class="table-scroll-container">
                        <v-table class="custom-table" v-if="stallOverview.length > 0">
                          <thead>
                            <tr>
                              <th>Stall ID</th>
                              <th>Stallholder</th>
                              <th>Location</th>
                              <th>Monthly Fee</th>
                              <th>Last Payment</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="stall in stallOverview.slice(0, 7)" :key="stall.id">
                              <td class="font-weight-bold text-primary">
                                {{ stall.stallId }}
                              </td>
                              <td class="font-weight-medium">{{ stall.stallholder }}</td>
                              <td class="text-grey-600">{{ stall.location }}</td>
                              <td class="text-success font-weight-bold">
                                ₱{{ stall.monthlyFee.toLocaleString() }}
                              </td>
                              <td class="text-grey-600">{{ stall.lastPayment }}</td>
                              <td>
                                <v-chip
                                  :color="getStallStatusColor(stall.status)"
                                  size="small"
                                  variant="flat"
                                >
                                  {{ stall.status }}
                                </v-chip>
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                        <div v-else class="empty-state pa-6 text-center">
                          <v-icon size="48" color="grey-lighten-1">mdi-store-off</v-icon>
                          <p class="text-grey-600 mt-2">No stalls found</p>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </div>
  </v-app>
</template>

<script src="./Dashboard.js"></script>
<style scoped src="./Dashboard.css"></style>