<template>
  <v-card class="chart-card" elevation="0">
    <v-card-title class="chart-header">
      <div class="chart-title-wrapper">
        <div class="chart-icon">
          <v-icon color="white" size="20">mdi-chart-line</v-icon>
        </div>
        <div>
          <h3 class="chart-title">Revenue Overview</h3>
          <p class="chart-subtitle">Monthly revenue trends</p>
        </div>
      </div>
      <v-btn-toggle v-model="timeRange" mandatory density="compact" class="time-toggle">
        <v-btn value="6m" size="small">6M</v-btn>
        <v-btn value="1y" size="small">1Y</v-btn>
      </v-btn-toggle>
    </v-card-title>
    <v-card-text class="chart-body">
      <canvas ref="revenueChart" height="280"></canvas>
    </v-card-text>
  </v-card>
</template>

<script>
import { Chart, registerables } from 'chart.js'
import { markRaw } from 'vue'
Chart.register(...registerables)

export default {
  name: 'RevenueChart',
  props: {
    revenueData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      timeRange: '6m',
      chartInstance: null
    }
  },
  watch: {
    timeRange() {
      this.$nextTick(() => {
        this.updateChart()
      })
    },
    revenueData: {
      handler() {
        this.$nextTick(() => {
          this.updateChart()
        })
      },
      deep: false
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },
  beforeUnmount() {
    if (this.chartInstance) {
      this.chartInstance.destroy()
      this.chartInstance = null
    }
  },
  methods: {
    initChart() {
      if (!this.$refs.revenueChart) return
      
      const ctx = this.$refs.revenueChart.getContext('2d')
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 280)
      gradient.addColorStop(0, 'rgba(0, 33, 129, 0.3)')
      gradient.addColorStop(1, 'rgba(0, 33, 129, 0)')

      // Use markRaw to prevent Vue from making the chart reactive
      this.chartInstance = markRaw(new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.getLabels(),
          datasets: [{
            label: 'Revenue',
            data: this.getData(),
            borderColor: '#002181',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#002181',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1a1a2e',
              titleColor: '#fff',
              bodyColor: '#fff',
              padding: 12,
              displayColors: false,
              callbacks: {
                label: (context) => `₱${context.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#6b7280',
                font: {
                  size: 11
                }
              }
            },
            y: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: '#6b7280',
                font: {
                  size: 11
                },
                callback: (value) => '₱' + value.toLocaleString()
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      }))
    },
    getLabels() {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const currentMonth = new Date().getMonth()
      const count = this.timeRange === '6m' ? 6 : 12
      const labels = []
      
      for (let i = count - 1; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12
        labels.push(months[monthIndex])
      }
      
      return labels
    },
    getData() {
      // Generate sample data or use actual data if provided
      if (this.revenueData.monthly && this.revenueData.monthly.length > 0) {
        return this.revenueData.monthly
      }
      
      const count = this.timeRange === '6m' ? 6 : 12
      const baseValue = this.revenueData.totalRevenue || 50000
      const data = []
      
      for (let i = 0; i < count; i++) {
        const variation = Math.random() * 0.4 + 0.6
        data.push(Math.round((baseValue / count) * variation))
      }
      
      return data
    },
    updateChart() {
      if (this.chartInstance) {
        this.chartInstance.data.labels = this.getLabels()
        this.chartInstance.data.datasets[0].data = this.getData()
        this.chartInstance.update()
      }
    }
  }
}
</script>

<style scoped>
.chart-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.chart-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #002181 0%, #1565c0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.chart-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.time-toggle {
  border-radius: 8px;
  overflow: hidden;
}

.time-toggle .v-btn {
  font-size: 11px;
  font-weight: 600;
  text-transform: none;
}

.chart-body {
  padding: 20px 24px 24px;
  height: 280px;
}
</style>
