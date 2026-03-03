/**
 * Dashboard Subscription Service
 * Uses Server-Sent Events (SSE) to receive real-time updates from the backend
 * instead of polling the server every 2 seconds
 */

class DashboardSubscriptionService {
  constructor() {
    this.eventSource = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000 // 3 seconds
    this.callbacks = {
      onUpdate: null,
      onConnect: null,
      onDisconnect: null,
      onError: null
    }
  }

  /**
   * Get the SSE endpoint URL
   */
  getEndpointUrl() {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    // Remove trailing /api if present since we're adding full path
    const cleanBaseUrl = baseUrl.replace(/\/api$/, '')
    return `${cleanBaseUrl}/api/dashboard-subscription`
  }

  /**
   * Subscribe to dashboard updates
   * @param {Object} callbacks - Callback functions for different events
   * @param {Function} callbacks.onUpdate - Called when data updates are received
   * @param {Function} callbacks.onConnect - Called when connection is established
   * @param {Function} callbacks.onDisconnect - Called when connection is lost
   * @param {Function} callbacks.onError - Called when an error occurs
   */
  subscribe(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks }
    this.connect()
  }

  /**
   * Connect to the SSE endpoint
   */
  connect() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    
    if (!token) {
      console.warn('⚠️ No auth token found, cannot subscribe to dashboard updates')
      return
    }

    // Close existing connection if any
    this.disconnect()

    try {
      // Note: EventSource doesn't support custom headers, so we use URL parameters
      // The backend auth middleware should be updated to accept token via query param
      const url = `${this.getEndpointUrl()}?token=${encodeURIComponent(token)}`
      
      console.log('📡 Connecting to dashboard subscription...')
      this.eventSource = new EventSource(url, { withCredentials: false })

      // Handle connection opened
      this.eventSource.addEventListener('connected', (event) => {
        console.log('✅ Dashboard subscription connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        
        const data = JSON.parse(event.data)
        if (this.callbacks.onConnect) {
          this.callbacks.onConnect(data)
        }
      })

      // Handle data updates
      this.eventSource.addEventListener('update', (event) => {
        const data = JSON.parse(event.data)
        console.log('📊 Dashboard update received:', data.timestamp)
        
        if (this.callbacks.onUpdate) {
          this.callbacks.onUpdate(data)
        }
      })

      // Handle errors
      this.eventSource.onerror = (error) => {
        console.error('❌ Dashboard subscription error:', error)
        this.isConnected = false
        
        if (this.callbacks.onError) {
          this.callbacks.onError(error)
        }

        // Attempt to reconnect
        this.attemptReconnect()
      }

      // Handle generic messages
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 Dashboard message:', data)
        } catch {
          console.log('📨 Dashboard raw message:', event.data)
        }
      }

    } catch (error) {
      console.error('❌ Failed to create EventSource:', error)
      if (this.callbacks.onError) {
        this.callbacks.onError(error)
      }
      this.attemptReconnect()
    }
  }

  /**
   * Attempt to reconnect after a disconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('⚠️ Max reconnect attempts reached, giving up')
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect({ reason: 'max_attempts' })
      }
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts // Exponential backoff
    
    console.log(`🔄 Attempting to reconnect in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect()
      }
    }, delay)
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect() {
    if (this.eventSource) {
      console.log('📡 Disconnecting from dashboard subscription')
      this.eventSource.close()
      this.eventSource = null
      this.isConnected = false
      
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect({ reason: 'manual' })
      }
    }
  }

  /**
   * Unsubscribe from dashboard updates
   */
  unsubscribe() {
    this.disconnect()
    this.callbacks = {
      onUpdate: null,
      onConnect: null,
      onDisconnect: null,
      onError: null
    }
    this.reconnectAttempts = 0
  }

  /**
   * Check if currently connected
   */
  isSubscribed() {
    return this.isConnected && this.eventSource?.readyState === EventSource.OPEN
  }
}

// Export singleton instance
export const dashboardSubscription = new DashboardSubscriptionService()
export default dashboardSubscription
