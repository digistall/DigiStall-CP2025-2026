import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class AuctionService {
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
   * Get all participants who joined an auction for a specific stall
   * This fetches stallholders who clicked "Join Auction" on the mobile app
   * 
   * @param {number|string} stallId - ID of the stall
   * @returns {Promise} API response with auction participants
   */
  async getAuctionParticipantsByStall(stallId) {
    try {
      console.log(`🔨 Fetching auction participants for stall ID: ${stallId}`)
      
      const response = await this.apiClient.get(`/auctions/stall/${stallId}/participants`)
      
      console.log('✅ Auction participants API response:', response.data)
      
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
        stallInfo: response.data.stallInfo || null,
        auctionInfo: response.data.auctionInfo || null,
        message: response.data.message
      }
    } catch (error) {
      console.error(`❌ Error fetching auction participants for stall ${stallId}:`, error)
      return this.handleError(error)
    }
  }

  /**
   * Select a winner for an auction
   * 
   * @param {number|string} auctionId - ID of the auction
   * @param {number|string} participantId - ID of the winning participant
   * @param {number|string} applicantId - Applicant ID of the winner
   * @returns {Promise} API response with winner details
   */
  async selectWinner(auctionId, participantId, applicantId) {
    try {
      console.log(`🏆 Selecting winner for auction ID: ${auctionId}`)
      
      const response = await this.apiClient.post(`/auctions/${auctionId}/select-winner`, {
        participantId,
        applicantId
      })
      
      console.log('✅ Auction winner selection response:', response.data)
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      }
    } catch (error) {
      console.error(`❌ Error selecting winner for auction ${auctionId}:`, error)
      return this.handleError(error)
    }
  }

  /**
   * Get all active auctions
   * @returns {Promise} API response with active auctions
   */
  async getActiveAuctions() {
    try {
      console.log('🔨 Fetching active auctions...')
      
      const response = await this.apiClient.get('/auctions/active')
      
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
        message: response.data.message
      }
    } catch (error) {
      console.error('❌ Error fetching active auctions:', error)
      return this.handleError(error)
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      return {
        success: false,
        data: null,
        message: error.response.data?.message || `Server error: ${error.response.status}`,
        error: error.response.data
      }
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        data: null,
        message: 'Network error. Please check your connection.',
        error: 'No response from server'
      }
    } else {
      // Error setting up request
      return {
        success: false,
        data: null,
        message: error.message || 'An unexpected error occurred',
        error: error.message
      }
    }
  }
}

const auctionService = new AuctionService()
export default auctionService
