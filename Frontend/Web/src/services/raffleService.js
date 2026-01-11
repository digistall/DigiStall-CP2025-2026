import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class RaffleService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_BASE_URL}/stalls`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to include auth token
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = sessionStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          sessionStorage.removeItem('authToken')
          sessionStorage.removeItem('currentUser')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      },
    )
  }

  /**
   * Get all participants who joined a raffle for a specific stall
   * This fetches users who clicked "Join Raffle" on the mobile app
   * 
   * @param {number|string} stallId - ID of the stall
   * @returns {Promise} API response with raffle participants
   */
  async getRaffleParticipantsByStall(stallId) {
    try {
      console.log(`🎰 Fetching raffle participants for stall ID: ${stallId}`)
      
      const response = await this.apiClient.get(`/raffles/stall/${stallId}/participants`)
      
      console.log('✅ Raffle participants API response:', response.data)
      
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
        stallInfo: response.data.stallInfo || null,
        raffleInfo: response.data.raffleInfo || null,
        message: response.data.message
      }
    } catch (error) {
      console.error(`❌ Error fetching raffle participants for stall ${stallId}:`, error)
      return this.handleError(error)
    }
  }

  /**
   * Get all active raffles
   * @returns {Promise} API response with active raffles
   */
  async getActiveRaffles() {
    try {
      console.log('🎰 Fetching active raffles...')
      
      const response = await this.apiClient.get('/raffles/active')
      
      console.log('✅ Active raffles response:', response.data)
      
      return {
        success: true,
        data: response.data.data || [],
        counts: response.data.counts || {},
        message: response.data.message
      }
    } catch (error) {
      console.error('❌ Error fetching active raffles:', error)
      return this.handleError(error)
    }
  }

  /**
   * Get raffle details by raffle ID
   * @param {number|string} raffleId - ID of the raffle
   * @returns {Promise} API response with raffle details
   */
  async getRaffleDetails(raffleId) {
    try {
      console.log(`🎰 Fetching raffle details for ID: ${raffleId}`)
      
      const response = await this.apiClient.get(`/raffles/${raffleId}`)
      
      console.log('✅ Raffle details response:', response.data)
      
      return {
        success: true,
        data: response.data.data || null,
        message: response.data.message
      }
    } catch (error) {
      console.error(`❌ Error fetching raffle details for ID ${raffleId}:`, error)
      return this.handleError(error)
    }
  }

  /**
   * Select winner for a raffle
   * @param {number|string} raffleId - ID of the raffle
   * @returns {Promise} API response with winner selection result
   */
  async selectWinner(raffleId) {
    try {
      console.log(`🎰 Selecting winner for raffle ID: ${raffleId}`)
      
      const response = await this.apiClient.post(`/raffles/${raffleId}/select-winner`)
      
      console.log('✅ Winner selection response:', response.data)
      
      return {
        success: true,
        data: response.data.data || null,
        message: response.data.message
      }
    } catch (error) {
      console.error(`❌ Error selecting winner for raffle ID ${raffleId}:`, error)
      return this.handleError(error)
    }
  }

  /**
   * Handle API errors and format them consistently
   * @param {Error} error - The error object
   * @returns {Object} Formatted error object
   */
  handleError(error) {
    let message = 'An unexpected error occurred'
    let status = 500

    if (error.response) {
      // Server responded with error
      status = error.response.status
      message = error.response.data?.message || error.response.statusText
      
      if (status === 404) {
        message = 'Raffle or stall not found'
      } else if (status === 400) {
        message = error.response.data?.message || 'Invalid request'
      } else if (status === 401) {
        message = 'Authentication required. Please log in again.'
      } else if (status === 403) {
        message = 'You do not have permission to access this resource'
      }
    } else if (error.request) {
      // Request made but no response
      message = 'Unable to connect to server. Please check your connection.'
      status = 0
    } else {
      // Error setting up request
      message = error.message
    }

    console.error('❌ Raffle Service Error:', { status, message })

    return {
      success: false,
      message: message,
      status: status,
      error: error.message
    }
  }
}

// Export singleton instance
const raffleService = new RaffleService()
export default raffleService
