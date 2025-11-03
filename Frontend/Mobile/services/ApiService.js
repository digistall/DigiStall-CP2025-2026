// API Service for mobile app backend integration
// Updated for unified backend structure
import { API_CONFIG, NetworkUtils } from '../config/networkConfig';

class ApiService {
  // ===== CONNECTIVITY TESTING =====
  static async testConnectivity() {
    try {
      console.log('🔌 Testing network connectivity...');
      const server = await NetworkUtils.getActiveServer();
      return {
        success: true,
        server: server,
        message: 'Connection successful'
      };
    } catch (error) {
      console.error('❌ Connectivity test failed:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // ===== AUTHENTICATION METHODS =====
  
  // Mobile login function
  static async mobileLogin(username, password) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      console.log('🔄 Attempting login to:', `${server}${API_CONFIG.MOBILE_ENDPOINTS.LOGIN}`);
      console.log('📱 Request data:', { username, password: '***' });

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({ username, password }),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log('✅ Login successful:', data.message);
      return {
        success: true,
        data: data.data,  // Extract the data from the response
        user: data.data?.user,
        token: data.token,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Login API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // Mobile registration
  static async mobileRegister(userData) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      console.log('🔄 Attempting registration to:', `${server}${API_CONFIG.MOBILE_ENDPOINTS.REGISTER}`);

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      console.log('✅ Registration successful:', data.message);
      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Registration API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // Verify token
  static async verifyToken(token) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.VERIFY_TOKEN}`, {
        method: 'GET',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token verification failed');
      }

      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return {
        success: false,
        message: error.message || 'Token verification failed'
      };
    }
  }

  // Mobile logout
  static async mobileLogout(token) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.LOGOUT}`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Logout failed');
      }

      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Logout API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // ===== STALL METHODS =====

  // Get all stalls
  static async getAllStalls(applicantId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_ALL_STALLS}?applicant_id=${applicantId}`;
      
      console.log('🔄 Fetching all stalls from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stalls');
      }

      console.log('✅ Stalls fetched successfully:', data.data?.length || 0);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Get All Stalls API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  // Get stalls by type (Fixed Price, Raffle, Auction)
  static async getStallsByType(type, applicantId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_STALLS_BY_TYPE}/${type}?applicant_id=${applicantId}`;
      
      console.log('🔄 Fetching stalls by type:', type, 'from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch ${type} stalls`);
      }

      console.log(`✅ ${type} stalls fetched successfully:`, data.data?.length || 0);
      return {
        success: true,
        data: data.data,
        message: data.message,
        type: type
      };
    } catch (error) {
      console.error(`❌ Get ${type} Stalls API Error:`, error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  // Get stalls by area
  static async getStallsByArea(area, applicantId, type = null) {
    try {
      const server = await NetworkUtils.getActiveServer();
      let url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_STALLS_BY_AREA}/${encodeURIComponent(area)}?applicant_id=${applicantId}`;
      
      if (type) {
        url += `&type=${type}`;
      }
      
      console.log('🔄 Fetching stalls by area:', area, 'from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch stalls in ${area}`);
      }

      console.log(`✅ Stalls in ${area} fetched successfully:`, data.data?.length || 0);
      return {
        success: true,
        data: data.data,
        message: data.message,
        area: area
      };
    } catch (error) {
      console.error(`❌ Get Stalls by Area API Error:`, error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  // Get stall by ID
  static async getStallById(stallId, applicantId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_STALL_BY_ID}/${stallId}?applicant_id=${applicantId}`;
      
      console.log('🔄 Fetching stall details for ID:', stallId, 'from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stall details');
      }

      console.log('✅ Stall details fetched successfully for ID:', stallId);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Get Stall by ID API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: null
      };
    }
  }

  // Get available areas
  static async getAvailableAreas(applicantId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_AVAILABLE_AREAS}?applicant_id=${applicantId}`;
      
      console.log('🔄 Fetching available areas from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch available areas');
      }

      console.log('✅ Available areas fetched successfully:', data.data?.length || 0);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Get Available Areas API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  // Search stalls with filters
  static async searchStalls(filters = {}) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      // Build query string
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.SEARCH_STALLS}?${params.toString()}`;
      
      console.log('🔄 Searching stalls with filters:', filters);
      console.log('📡 URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search stalls');
      }

      console.log('✅ Search results:', data.data?.stalls?.length || 0, 'stalls found');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Search Stalls API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: { stalls: [], total_count: 0 }
      };
    }
  }

  // ===== APPLICATION METHODS =====

  // Submit application
  static async submitApplication(applicationData) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      console.log('🔄 Submitting application to:', `${server}${API_CONFIG.MOBILE_ENDPOINTS.SUBMIT_APPLICATION}`);
      console.log('📱 Application data:', applicationData);

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.SUBMIT_APPLICATION}`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(applicationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Application submission failed');
      }

      console.log('✅ Application submitted successfully:', data.message);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Submit Application API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // Get user's applications (requires authentication)
  static async getMyApplications(token) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_MY_APPLICATIONS}`, {
        method: 'GET',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch applications');
      }

      console.log('✅ Applications fetched successfully:', data.data?.length || 0);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Get My Applications API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  // Get application status
  static async getApplicationStatus(applicationId, token) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_APPLICATION_STATUS}/${applicationId}/status`, {
        method: 'GET',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch application status');
      }

      console.log('✅ Application status fetched successfully for ID:', applicationId);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Get Application Status API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: null
      };
    }
  }

  // Update application
  static async updateApplication(applicationId, updateData, token) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.UPDATE_APPLICATION}/${applicationId}`, {
        method: 'PUT',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update application');
      }

      console.log('✅ Application updated successfully:', applicationId);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Update Application API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // ===== AUCTION & RAFFLE METHODS =====

  // Get auction stalls (specialized call for auction type)
  static async getAuctionStalls(applicantId) {
    return this.getStallsByType('Auction', applicantId);
  }

  // Get raffle stalls (specialized call for raffle type)
  static async getRaffleStalls(applicantId) {
    return this.getStallsByType('Raffle', applicantId);
  }

  // Get fixed price stalls (specialized call for fixed price type)
  static async getFixedPriceStalls(applicantId) {
    return this.getStallsByType('Fixed Price', applicantId);
  }

  // Submit auction bid (if auction bidding is implemented)
  static async submitAuctionBid(auctionId, bidAmount, applicantId, token) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}/mobile/api/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bid_amount: bidAmount,
          applicant_id: applicantId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bid submission failed');
      }

      console.log('✅ Auction bid submitted successfully');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Submit Auction Bid API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // Join raffle (if raffle joining is implemented)
  static async joinRaffle(raffleId, applicantId, token) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}/mobile/api/raffles/${raffleId}/join`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicant_id: applicantId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Raffle join failed');
      }

      console.log('✅ Joined raffle successfully');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Join Raffle API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // ===== UTILITY METHODS =====

  // Reset network configuration (force server rediscovery)
  static resetNetwork() {
    API_CONFIG.BASE_URL = null;
    console.log('🔄 Network configuration reset - will rediscover servers on next request');
  }

  // Get current server URL
  static getCurrentServer() {
    return API_CONFIG.BASE_URL;
  }

  // Handle network errors consistently
  static handleNetworkError(error) {
    if (error.message === 'Network request failed' || error.message.includes('Unable to connect')) {
      console.error('🚨 Network connectivity issue detected');
      console.error('🔧 Will attempt server discovery on next try');
      
      // Reset server to force rediscovery
      this.resetNetwork();
    }
    
    return {
      success: false,
      message: error.message || 'Network error occurred'
    };
  }
}

export default ApiService;