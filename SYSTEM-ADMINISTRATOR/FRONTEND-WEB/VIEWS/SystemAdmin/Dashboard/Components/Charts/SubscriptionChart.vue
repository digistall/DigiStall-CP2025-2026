<template>
  <v-card class="chart-card" elevation="0">
    <v-card-title class="chart-header">
      <div class="chart-title-wrapper">
        <div class="chart-icon subscription-icon">
          <v-icon color="white" size="20">mdi-chart-donut</v-icon>
        </div>
        <div>
          <h3 class="chart-title">Subscription Distribution</h3>
          <p class="chart-subtitle">Plan breakdown</p>
        </div>
      </div>
    </v-card-title>
    <v-card-text class="chart-body">
      <div class="chart-container">
        <canvas ref="subscriptionChart"></canvas>
      </div>
      <div class="chart-legend">
        <div v-for="(item, index) in legendItems" :key="index" class="legend-item">
          <div class="legend-color" :style="{ background: item.color }"></div>
          <div class="legend-info">
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { Chart, registerables } from 'chart.js'
import { markRaw } from 'vue'
Chart.register(...registerables)

export default {
  name: 'SubscriptionChart',
  props: {
    subscriptionData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      chartInstance: null,
      colors: ['#002181', '#059669', '#7c3aed', '#ea580c']
    }
  },
  computed: {
    legendItems() {
      const data = this.getChartData()
      return [
        { label: 'Basic Plan', value: data.basic || 0, color: this.colors[0] },
        { label: 'Standard Plan', value: data.standard || 0, color: this.colors[1] },
        { label: 'Premium Plan', value: data.premium || 0, color: this.colors[2] },
        { label: 'Trial', value: data.trial || 0, color: this.colors[3] }
      ].filter(item => item.value > 0)
    }
  },
  watch: {
    subscriptionData: {
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
    getChartData() {
      if (this.subscriptionData.planBreakdown) {
        return this.subscriptionData.planBreakdown
      }
      // Sample data if not provided
      return {
        basic: 5,
        standard: 8,
        premium: 3,
        trial: 2
      }
    },
    initChart() {
      if (!this.$refs.subscriptionChart) return
      
      const ctx = this.$refs.subscriptionChart.getContext('2d')
      const data = this.getChartData()
      
      // Use markRaw to prevent Vue from making the chart reactive
      this.chartInstance = markRaw(new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Basic', 'Standard', 'Premium', 'Trial'],
          datasets: [{
            data: [data.basic || 0, data.standard || 0, data.premium || 0, data.trial || 0],
            backgroundColor: this.colors,
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1a1a2e',
              titleColor: '#fff',
              bodyColor: '#fff',
              padding: 12,
              displayColors: true,
              callbacks: {
                label: (context) => ` ${context.label}: ${context.parsed} subscribers`
              }
            }
          }
        }
      }))
    },
    updateChart() {
      if (this.chartInstance) {
        const data = this.getChartData()
        this.chartInstance.data.datasets[0].data = [data.basic || 0, data.standard || 0, data.premium || 0, data.trial || 0]
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
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.subscription-icon {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
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

.chart-body {
  padding: 20px 24px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.chart-container {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.chart-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-info {
  display: flex;
  justify-content: space-between;
  flex: 1;
}

.legend-label {
  font-size: 13px;
  color: #4b5563;
}

.legend-value {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

@media (max-width: 600px) {
  .chart-body {
    flex-direction: column;
  }
}
</style>
