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
   * Get all bidders who placed bids on an auction for a specific stall
   * This fetches users who clicked "Place Bid" on the mobile app
   *
   * @param {number|string} stallId - ID of the stall
   * @returns {Promise} API response with auction bidders
   */
  async getAuctionBiddersByStall(stallId) {
    try {
      console.log(`🏺 Fetching auction bidders for stall ID: ${stallId}`)

      const response = await this.apiClient.get(`/auctions/stall/${stallId}/bidders`)

      console.log('✅ Auction bidders API response:', response.data)

      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
        stallInfo: response.data.stallInfo || null,
        auctionInfo: response.data.auctionInfo || null,
        message: response.data.message
      }
    } catch (error) {
      console.error(`❌ Error fetching auction bidders for stall ${stallId}:`, error)
      return this.handleError(error)
    }
  }

  /**
   * Get all active auctions
   * @returns {Promise} API response with active auctions
   */
  async getActiveAuctions() {
    try {
      console.log('🏺 Fetching active auctions...')

      const response = await this.apiClient.get('/auctions/active')

      console.log('✅ Active auctions response:', response.data)

      return {
        success: true,
        data: response.data.data || [],
        counts: response.data.counts || {},
        message: response.data.message
      }
    } catch (error) {
      console.error('❌ Error fetching active auctions:', error)
      return this.handleError(error)
    }
  }

  /**
   * Get auction details by auction ID
   * @param {number|string} auctionId - ID of the auction
   * @returns {Promise} API response with auction details
   */
  async getAuctionDetails(auctionId) {
    try {
      console.log(`🏺 Fetching auction details for ID: ${auctionId}`)

      const response = await this.apiClient.get(`/auctions/${auctionId}`)

      console.log('✅ Auction details response:', response.data)

      return {
        success: true,
        data: response.data.data || null,
        message: response.data.message
      }
    } catch (error) {
      console.error(`❌ Error fetching auction details for ${auctionId}:`, error)
      return this.handleError(error)
    }
  }

  /**
   * Select/Confirm winner for an auction
   * @param {number|string} auctionId - ID of the auction
   * @returns {Promise} API response with winner data
   */
  async selectWinner(auctionId) {
    try {
      console.log(`🏆 Selecting winner for auction ID: ${auctionId}`)

      const response = await this.apiClient.post(`/auctions/${auctionId}/select-winner`)

      console.log('✅ Select winner response:', response.data)

      return {
        success: true,
        data: response.data.data || null,
        message: response.data.message
      }
    } catch (error) {
      console.error(`❌ Error selecting winner for auction ${auctionId}:`, error)
      return this.handleError(error)
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Axios error object
   * @returns {Object} Standardized error response
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      return {
        success: false,
        message: error.response.data?.message || 'Server error occurred',
        status: error.response.status,
        details: error.response.data
      }
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        message: 'Network error - please check your connection',
        status: null,
        details: null
      }
    } else {
      // Error in request setup
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
        status: null,
        details: null
      }
    }
  }
}

export default new AuctionService()
