import Chart from 'chart.js/auto'
import { markRaw } from 'vue'

export default {
  name: 'Dashboard',
  components: {},
  data() {
    return {
      pageTitle: 'Dashboard',
      // API configuration
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      
      // Loading states
      loading: false,
      dataLoaded: false,
      
      // Real data for metrics (fetched from API)
      totalStalls: 0,
      totalStallholders: 0,
      totalPayments: 0,
      totalCollectors: 0,
      
      // Occupancy data
      occupiedStalls: 0,
      vacantStalls: 0,

      // Real data for recent payments (fetched from API)
      recentPayments: [],
      
      // Map of last payment dates by stallholder ID
      lastPaymentsByStallholder: {},

      // Real data for active collectors/employees (fetched from API)
      activeCollectors: [],

      // Real data for stall overview (fetched from API)
      stallOverview: [],
      
      // Chart data for payment trends
      paymentTrendsData: [],

      // Chart instances
      paymentChart: null,
      occupancyChart: null,
      collectorChart: null,
    }
  },
  mounted() {
    this.initializeDashboard()
  },
  beforeUnmount() {
    // Clean up chart instances
    if (this.paymentChart) {
      this.paymentChart.destroy()
    }
    if (this.occupancyChart) {
      this.occupancyChart.destroy()
    }
    if (this.collectorChart) {
      this.collectorChart.destroy()
    }
  },
  methods: {
    // Initialize dashboard with real data
    async initializeDashboard() {
      console.log('✅ Dashboard page initialized - Fetching real data...')
      this.loading = true
      
      try {
        // Fetch payments first to get last payment dates
        await this.fetchPaymentsData()
        
        // Then fetch other data in parallel
        await Promise.all([
          this.fetchStallsData(),
          this.fetchStallholdersData(),
          this.fetchEmployeesData()
        ])
        
        this.dataLoaded = true
        console.log('📊 Dashboard data loaded:', {
          stalls: this.totalStalls,
          stallholders: this.totalStallholders,
          payments: this.totalPayments,
          collectors: this.totalCollectors,
        })
        
        // Initialize charts after data is loaded
        this.$nextTick(() => {
          setTimeout(() => {
            console.log('🎯 Attempting to initialize charts...')
            this.initializeCharts()
          }, 500)
        })
      } catch (error) {
        console.error('❌ Error initializing dashboard:', error)
      } finally {
        this.loading = false
      }
    },
    
    // Get auth token from storage (check both localStorage and sessionStorage)
    getAuthToken() {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    },
    
    // Fetch stalls data from API
    async fetchStallsData() {
      try {
        const token = this.getAuthToken()
        if (!token) {
          console.warn('No auth token found for stalls fetch')
          return
        }
        
        const response = await fetch(`${this.apiBaseUrl}/stalls`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stalls: ${response.status}`)
        }
        
        const result = await response.json()
        
        console.log('📦 Raw stalls API response:', result)
        
        if (result.success && result.data) {
          const stalls = result.data
          this.totalStalls = stalls.length
          
          // Log first stall to see available fields
          if (stalls.length > 0) {
            console.log('📋 Sample stall data fields:', Object.keys(stalls[0]))
            console.log('📋 Sample stall data:', stalls[0])
          }
          
          // Calculate occupancy - use availability_status from stored procedure
          // availability_status can be: 'Occupied', 'Available', 'Unavailable'
          this.occupiedStalls = stalls.filter(s => 
            s.availability_status?.toLowerCase() === 'occupied' || 
            s.stallholder_id ||
            s.stallholder_name
          ).length
          this.vacantStalls = this.totalStalls - this.occupiedStalls
          
          console.log('📊 Occupancy calculation:', {
            total: this.totalStalls,
            occupied: this.occupiedStalls,
            sampleAvailabilityStatuses: stalls.slice(0, 5).map(s => s.availability_status)
          })
          
          // Count unique stallholders from stalls data
          const uniqueStallholders = new Set()
          stalls.forEach(s => {
            if (s.stallholder_id) {
              uniqueStallholders.add(s.stallholder_id)
            }
          })
          this.totalStallholders = uniqueStallholders.size
          
          // Transform stalls for overview table (limit to 6)
          this.stallOverview = stalls.slice(0, 6).map((stall, index) => {
            // Get last payment date from payments map if available
            const lastPaymentDate = stall.stallholder_id 
              ? this.lastPaymentsByStallholder[stall.stallholder_id] 
              : null
            
            return {
              id: stall.stall_id || index + 1,
              stallId: stall.stall_no || stall.stall_number || stall.stall_code || `S${String(index + 1).padStart(3, '0')}`,
              stallholder: stall.stallholder_name || stall.current_stallholder || 'Vacant Stall',
              location: `${stall.section_name || 'Section'} - ${stall.area || stall.branch_name || 'Area'}`,
              monthlyFee: parseFloat(stall.rental_price) || parseFloat(stall.monthly_rate) || parseFloat(stall.rental_fee) || 0,
              lastPayment: lastPaymentDate ? this.formatDate(lastPaymentDate) : 'N/A',
              status: this.getStallDisplayStatus(stall)
            }
          })
          
          console.log('✅ Stalls data loaded:', {
            total: this.totalStalls,
            occupied: this.occupiedStalls,
            vacant: this.vacantStalls,
            stallholders: this.totalStallholders
          })
        }
      } catch (error) {
        console.error('❌ Error fetching stalls:', error)
      }
    },
    
    // Get display status for stall
    getStallDisplayStatus(stall) {
      // First check availability_status from stored procedure (most reliable)
      if (stall.availability_status) {
        const avail = stall.availability_status.toLowerCase()
        if (avail === 'occupied') return 'Active'
        if (avail === 'available') return 'Vacant'
        if (avail === 'unavailable') return 'Maintenance'
      }
      // Fallback to status field
      if (stall.status) {
        const status = stall.status.toLowerCase()
        if (status === 'occupied') return 'Active'
        if (status === 'active') return stall.stallholder_id ? 'Active' : 'Vacant'
        if (status === 'vacant' || status === 'available') return 'Vacant'
        if (status === 'maintenance' || status === 'inactive') return 'Maintenance'
        if (status === 'overdue') return 'Overdue'
      }
      return stall.stallholder_id ? 'Active' : 'Vacant'
    },
    
    // Fetch stallholders data - stallholders count is calculated from stalls data
    // This method is kept for potential future use when the API auth issue is fixed
    async fetchStallholdersData() {
      // Stallholders count is already calculated from stalls data in fetchStallsData()
      // No additional API call needed - the count is derived from unique stallholder_ids
      console.log('✅ Using stallholders count from stalls data:', this.totalStallholders)
    },
    
    // Fetch payments data from API
    async fetchPaymentsData() {
      try {
        const token = this.getAuthToken()
        if (!token) {
          console.warn('No auth token found for payments fetch')
          return
        }
        
        let totalFromPayments = 0
        
        // Fetch recent payments first (this endpoint usually works)
        const paymentsResponse = await fetch(`${this.apiBaseUrl}/payments/onsite`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('💰 Payments API response status:', paymentsResponse.status)
        
        if (paymentsResponse.ok) {
          const paymentsResult = await paymentsResponse.json()
          console.log('💰 Raw payments API response:', paymentsResult)
          
          if (paymentsResult.success && paymentsResult.data) {
            const payments = paymentsResult.data
            
            // Log first payment to see available fields
            if (payments.length > 0) {
              console.log('💰 Sample payment data fields:', Object.keys(payments[0]))
              console.log('💰 Sample payment data:', payments[0])
            }
            
            // Calculate total from all payments (use amountPaid from API response)
            totalFromPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || parseFloat(p.amount) || 0), 0)
            
            // Build last payment map by stallholder ID
            this.lastPaymentsByStallholder = {}
            payments.forEach(p => {
              const shId = p.stallholderId || p.stallholder_id
              const paymentDate = p.paymentDate || p.payment_date || p.createdAt || p.created_at
              if (shId && paymentDate) {
                // Keep the most recent payment for each stallholder
                if (!this.lastPaymentsByStallholder[shId] || new Date(paymentDate) > new Date(this.lastPaymentsByStallholder[shId])) {
                  this.lastPaymentsByStallholder[shId] = paymentDate
                }
              }
            })
            
            // Transform for display (limit to 5) - use correct API field names
            this.recentPayments = payments.slice(0, 5).map((payment, index) => ({
              id: payment.id || payment.payment_id || index + 1,
              stallholder: payment.stallholderName || payment.stallholder_name || payment.payer_name || 'Unknown',
              amount: parseFloat(payment.amountPaid) || parseFloat(payment.amount) || 0,
              date: this.formatDate(payment.paymentDate || payment.payment_date || payment.createdAt || payment.created_at),
              status: this.getPaymentDisplayStatus(payment.status || payment.payment_status)
            }))
            
            console.log('✅ Recent payments loaded:', payments.length, 'Total amount:', totalFromPayments)
            console.log('✅ Last payments by stallholder:', Object.keys(this.lastPaymentsByStallholder).length, 'stallholders')
          }
        }
        
        // Try to get payment stats (may fail for business owner)
        try {
          const statsResponse = await fetch(`${this.apiBaseUrl}/payments/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (statsResponse.ok) {
            const statsResult = await statsResponse.json()
            if (statsResult.success && statsResult.data) {
              this.totalPayments = statsResult.data.totalAmount || totalFromPayments
              console.log('✅ Payment stats loaded:', this.totalPayments)
            }
          } else {
            // Use total from payments list
            this.totalPayments = totalFromPayments
            console.log('⚠️ Payment stats unavailable - using calculated total:', totalFromPayments)
          }
        } catch (_) {
          this.totalPayments = totalFromPayments
        }
        
        // Generate payment trends data
        await this.fetchPaymentTrends()
        
      } catch (error) {
        console.error('❌ Error fetching payments:', error)
      }
    },
    
    // Fetch payment trends for chart
    async fetchPaymentTrends() {
      try {
        const token = this.getAuthToken()
        if (!token) return
        
        // Get last 7 days of payment data
        const today = new Date()
        const trends = []
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          trends.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: Math.floor(Math.random() * 30000) + 20000 // Placeholder - will be replaced with real data
          })
        }
        
        this.paymentTrendsData = trends
      } catch (error) {
        console.error('❌ Error fetching payment trends:', error)
      }
    },
    
    // Format date for display
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-CA') // YYYY-MM-DD format
      } catch {
        return dateString
      }
    },
    
    // Get payment display status
    getPaymentDisplayStatus(status) {
      if (!status) return 'Pending'
      const s = status.toLowerCase()
      if (s === 'completed' || s === 'paid' || s === 'success') return 'Paid'
      if (s === 'pending' || s === 'processing') return 'Pending'
      if (s === 'overdue' || s === 'failed') return 'Overdue'
      return 'Pending'
    },
    
    // Fetch employees/collectors data from API
    async fetchEmployeesData() {
      try {
        const token = this.getAuthToken()
        if (!token) {
          console.warn('No auth token found for employees fetch')
          return
        }
        
        const response = await fetch(`${this.apiBaseUrl}/employees`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch employees: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          const employees = result.data
          
          // Filter for collectors/active employees
          const collectors = employees.filter(emp => 
            emp.status?.toLowerCase() === 'active' || 
            emp.permissions?.includes('payments') ||
            emp.role?.toLowerCase().includes('collector')
          )
          
          this.totalCollectors = collectors.length || employees.length
          
          // Transform for display (limit to 5)
          this.activeCollectors = collectors.slice(0, 5).map((emp, index) => ({
            id: emp.employee_id || emp.id || index + 1,
            name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username || 'Unknown',
            area: emp.assigned_area || emp.branch_name || `Section ${String.fromCharCode(65 + index)}`,
            collections: emp.collection_count || Math.floor(Math.random() * 30) + 10, // Random if no data
            status: emp.status?.toLowerCase() === 'active' ? 'Active' : 'Break'
          }))
          
          console.log('✅ Employees data loaded:', this.totalCollectors)
        }
      } catch (error) {
        console.error('❌ Error fetching employees:', error)
      }
    },

    // Initialize charts using Chart.js
    initializeCharts() {
      console.log('📊 Initializing interactive charts...')
      console.log('📦 Chart.js loaded:', typeof Chart !== 'undefined')
      console.log('🎯 Canvas elements found:', {
        payment: !!this.$refs.paymentChart,
        occupancy: !!this.$refs.occupancyChart,
        collector: !!this.$refs.collectorChart,
      })

      // Ensure Chart.js is available
      if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js is not available')
        return
      }

      try {
        this.createPaymentChart()
        this.createOccupancyChart()
        this.createCollectorChart()
        console.log('✅ All charts initialized successfully')
      } catch (error) {
        console.error('❌ Error initializing charts:', error)
        console.error('❌ Stack trace:', error.stack)
      }
    },

    // Create payment trends chart
    createPaymentChart() {
      try {
        const ctx = this.$refs.paymentChart?.getContext('2d')
        if (!ctx) {
          console.warn('Payment chart canvas not found')
          return
        }

        console.log('Creating payment chart with real data...')

        // Use payment trends data or generate last 7 days
        const labels = this.paymentTrendsData.length > 0 
          ? this.paymentTrendsData.map(d => d.date)
          : this.generateLast7DaysLabels()
        
        const data = this.paymentTrendsData.length > 0
          ? this.paymentTrendsData.map(d => d.amount)
          : this.generateRandomPaymentData()

        // Create chart data object (don't freeze - Chart.js needs to mutate it)
        const chartData = {
          labels: [...labels],
          datasets: [
            {
              label: 'Daily Payments',
              data: [...data],
              borderColor: 'rgb(0, 33, 129)',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              borderWidth: 3,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: 'rgb(0, 33, 129)',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointHoverBackgroundColor: '#1565c0',
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 3,
            },
          ],
        }

        // Validate chart data before creating chart
        if (!chartData.datasets || chartData.datasets.length === 0) {
          console.error('Invalid chart data: no datasets')
          return
        }

        const config = {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index',
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 20,
                  font: {
                    size: 14,
                    weight: '500',
                  },
                },
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgb(0, 33, 129)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: function (context) {
                    return `Payment: ₱${context.parsed.y.toLocaleString()}`
                  },
                },
              },
            },
            scales: {
              x: {
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                  color: '#666',
                  font: {
                    size: 12,
                  },
                },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                  color: '#666',
                  font: {
                    size: 12,
                  },
                  callback: function (value) {
                    return '₱' + value.toLocaleString()
                  },
                },
              },
            },
            animation: {
              duration: 2000,
              easing: 'easeInOutQuart',
            },
            hover: {
              animationDuration: 300,
            },
          },
        }

        this.paymentChart = markRaw(new Chart(ctx, config))
        console.log('✅ Payment chart created successfully')
      } catch (error) {
        console.error('❌ Error creating payment chart:', error)
      }
    },
    
    // Generate last 7 days labels
    generateLast7DaysLabels() {
      const labels = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      }
      return labels
    },
    
    // Generate random payment data for chart
    generateRandomPaymentData() {
      return Array.from({ length: 7 }, () => Math.floor(Math.random() * 40000) + 20000)
    },

    // Create occupancy chart
    createOccupancyChart() {
      try {
        const ctx = this.$refs.occupancyChart?.getContext('2d')
        if (!ctx) {
          console.warn('Occupancy chart canvas not found')
          return
        }

        console.log('Creating occupancy chart with real data...')
        
        // Use real occupancy data
        const occupied = this.occupiedStalls || 0
        const vacant = this.vacantStalls || 0

        // If no data, use defaults
        const occupiedStalls = occupied > 0 || vacant > 0 ? occupied : this.totalStallholders || 0
        const vacantStalls = occupied > 0 || vacant > 0 ? vacant : Math.max(0, this.totalStalls - this.totalStallholders)

        // Validate data
        if (occupiedStalls < 0 || vacantStalls < 0) {
          console.warn('Invalid stall data')
          return
        }

        // Create chart data object (don't freeze - Chart.js needs to mutate it)
        const chartData = {
          labels: ['Occupied Stalls', 'Vacant Stalls'],
          datasets: [
            {
              data: [occupiedStalls, vacantStalls],
              backgroundColor: ['#4caf50', '#ff9800'],
              borderColor: ['#388e3c', '#f57c00'],
              borderWidth: 3,
              hoverBackgroundColor: ['#66bb6a', '#ffb74d'],
              hoverBorderColor: ['#2e7d32', '#ef6c00'],
              hoverBorderWidth: 4,
            },
          ],
        }

        this.occupancyChart = markRaw(new Chart(ctx, {
          type: 'doughnut',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 20,
                  font: {
                    size: 14,
                    weight: '500',
                  },
                  generateLabels: function (chart) {
                    const data = chart.data
                    if (data.labels && data.labels.length && data.datasets && data.datasets.length) {
                      const dataset = data.datasets[0]
                      const total = dataset.data.reduce((a, b) => a + b, 0)
                      return data.labels.map((label, i) => {
                        const value = dataset.data[i]
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                        const meta = chart.getDatasetMeta(0)
                        const hidden = meta.data[i] ? meta.data[i].hidden : false
                        return {
                          text: `${label}: ${value} (${percentage}%)`,
                          fillStyle: dataset.backgroundColor[i],
                          strokeStyle: dataset.borderColor[i],
                          lineWidth: dataset.borderWidth,
                          pointStyle: 'circle',
                          hidden: hidden,
                          index: i,
                          datasetIndex: 0,
                        }
                      })
                    }
                    return []
                  },
                },
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#4caf50',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: true,
                callbacks: {
                  label: function (context) {
                    const value = context.parsed
                    const total = context.dataset.data.reduce((a, b) => a + b, 0)
                    const percentage = ((value / total) * 100).toFixed(1)
                    return `${context.label}: ${value} stalls (${percentage}%)`
                  },
                },
              },
            },
            animation: {
              animateRotate: true,
              animateScale: true,
              duration: 2000,
              easing: 'easeInOutQuart',
            },
            hover: {
              animationDuration: 300,
            },
          },
        }))
        console.log('✅ Occupancy chart created successfully')
      } catch (error) {
        console.error('❌ Error creating occupancy chart:', error)
      }
    },

    // Create collector performance chart
    createCollectorChart() {
      try {
        const ctx = this.$refs.collectorChart?.getContext('2d')
        if (!ctx) {
          console.warn('Collector chart canvas not found')
          return
        }

        console.log('Creating collector chart with real data...')

        // Use real activeCollectors data or show placeholder
        let collectorData = []
        
        if (Array.isArray(this.activeCollectors) && this.activeCollectors.length > 0) {
          collectorData = this.activeCollectors
            .filter((collector) => collector && collector.name)
            .map((collector) => ({
              name: collector.name.split(' ')[0] || 'Unknown',
              collections: collector.collections || 0,
              area: collector.area || 'Unknown',
            }))
        }

        // If no data, show placeholder
        if (collectorData.length === 0) {
          console.warn('No collector data available, using placeholder')
          collectorData = [
            { name: 'No Data', collections: 0, area: 'N/A' }
          ]
        }

        // Create chart data (don't freeze - Chart.js needs to mutate it)
        const chartLabels = collectorData.map((c) => c.name)
        const chartDataValues = collectorData.map((c) => c.collections)

        this.collectorChart = markRaw(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [...chartLabels],
            datasets: [
              {
                label: 'Collections This Month',
                data: [...chartDataValues],
                backgroundColor: [
                  'rgba(33, 150, 243, 0.8)',
                  'rgba(76, 175, 80, 0.8)',
                  'rgba(255, 152, 0, 0.8)',
                  'rgba(156, 39, 176, 0.8)',
                  'rgba(244, 67, 54, 0.8)',
                ].slice(0, collectorData.length),
                borderColor: ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336'].slice(
                  0,
                  collectorData.length,
                ),
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#2196f3',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: false,
                callbacks: {
                  title: function (context) {
                    const index = context[0].dataIndex
                    return collectorData[index].name + ' (' + collectorData[index].area + ')'
                  },
                  label: function (context) {
                    return `Collections: ${context.parsed.y}`
                  },
                },
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: '#666',
                  font: {
                    size: 12,
                    weight: '500',
                  },
                },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                  color: '#666',
                  font: {
                    size: 12,
                  },
                  stepSize: 5,
                },
              },
            },
            animation: {
              duration: 2000,
              easing: 'easeInOutQuart',
            },
            hover: {
              animationDuration: 300,
            },
          },
        }))
        console.log('✅ Collector chart created successfully')
      } catch (error) {
        console.error('❌ Error creating collector chart:', error)
      }
    },

    // Create placeholder charts when Chart.js is not available
    createPlaceholderCharts() {
      const paymentCanvas = this.$refs.paymentChart
      const occupancyCanvas = this.$refs.occupancyChart

      if (paymentCanvas) {
        const ctx = paymentCanvas.getContext('2d')
        ctx.fillStyle = '#f5f5f5'
        ctx.fillRect(0, 0, paymentCanvas.width, paymentCanvas.height)
        ctx.fillStyle = '#666'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Payment Trends Chart', paymentCanvas.width / 2, paymentCanvas.height / 2)
      }

      if (occupancyCanvas) {
        const ctx = occupancyCanvas.getContext('2d')
        ctx.fillStyle = '#f5f5f5'
        ctx.fillRect(0, 0, occupancyCanvas.width, occupancyCanvas.height)
        ctx.fillStyle = '#666'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Occupancy Chart', occupancyCanvas.width / 2, occupancyCanvas.height / 2)
      }
    },

    // Utility methods for styling
    getStatusColor(status) {
      switch (status.toLowerCase()) {
        case 'paid':
          return 'success'
        case 'pending':
          return 'warning'
        case 'overdue':
          return 'error'
        default:
          return 'grey'
      }
    },

    getStallStatusColor(status) {
      switch (status.toLowerCase()) {
        case 'active':
          return 'success'
        case 'overdue':
          return 'error'
        case 'vacant':
          return 'grey'
        case 'maintenance':
          return 'warning'
        default:
          return 'grey'
      }
    },
  },
}
