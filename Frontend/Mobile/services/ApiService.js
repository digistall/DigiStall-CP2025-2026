// API Service for mobile app backend integration
// Updated for unified backend structure
import { API_CONFIG, NetworkUtils } from '../config/networkConfig';
import UserStorageService from './UserStorageService';

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
        user: data.data?.user || data.user,
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

  // Mobile staff login function (for Inspector/Collector)
  static async mobileStaffLogin(username, password) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      console.log('🔄 Attempting staff login to:', `${server}${API_CONFIG.MOBILE_ENDPOINTS.STAFF_LOGIN}`);
      console.log('📱 Request data:', { username, password: '***' });

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.STAFF_LOGIN}`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({ username, password }),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Staff login failed');
      }

      console.log('✅ Staff login successful:', data.message);
      return {
        success: true,
        user: data.user,
        token: data.token,
        staffType: data.user?.staffType,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Staff Login API Error:', error);
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

  // Build headers including Authorization when token is available
  static async authHeaders() {
    try {
      const token = await UserStorageService.getAuthToken();
      if (token) {
        return {
          ...API_CONFIG.HEADERS,
          Authorization: `Bearer ${token}`
        };
      }
      return API_CONFIG.HEADERS;
    } catch (error) {
      console.error('❌ Error building auth headers:', error);
      return API_CONFIG.HEADERS;
    }
  }

  // Mobile logout
  static async mobileLogout(token, userId = null) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.LOGOUT}`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          applicantId: userId
        })
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

  // Staff (Inspector/Collector) logout
  static async staffLogout(token, staffId, staffType) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.STAFF_LOGOUT}`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          staffId: staffId,
          staffType: staffType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Staff logout failed');
      }

      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Staff Logout API Error:', error);
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

  // Get all images for a stall
  static async getStallImages(stallId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_STALL_IMAGES}/${stallId}`;
      
      console.log('🖼️ Fetching images for stall ID:', stallId, 'from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stall images');
      }

      console.log(`✅ Stall images fetched: ${data.data?.images?.length || 0} images`);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Get Stall Images API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: { images: [] }
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

  // ===== STALLHOLDER DOCUMENT METHODS =====

  /**
   * Get stallholder's owned stalls with document requirements grouped by branch/owner
   * @param {string} applicantId - The applicant's ID
   * @returns {Promise} - Response with stalls grouped by branch
   */
  static async getStallholderStallsWithDocuments(applicantId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_STALLHOLDER_STALLS_DOCUMENTS}/${applicantId}`;
      
      console.log('🔄 Fetching stallholder stalls with documents from:', url);

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stallholder documents');
      }

      console.log('✅ Stallholder stalls with documents fetched:', data.data?.total_stalls || 0, 'stalls');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Get Stallholder Stalls Documents API Error:', error);
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timed out. Please check your connection.'
        : (error.message || 'Network error occurred');
      return {
        success: false,
        message: errorMessage,
        data: { stalls: [], grouped_by_branch: [] }
      };
    }
  }

  /**
   * Get document requirements for a specific branch
   * @param {string} branchId - The branch ID
   * @param {string} stallholderId - Optional stallholder ID to include upload status
   * @returns {Promise} - Response with document requirements
   */
  static async getBranchDocumentRequirements(branchId, stallholderId = null) {
    try {
      const server = await NetworkUtils.getActiveServer();
      let url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_BRANCH_DOCUMENT_REQUIREMENTS}/${branchId}`;
      
      if (stallholderId) {
        url += `?stallholder_id=${stallholderId}`;
      }
      
      console.log('🔄 Fetching branch document requirements from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch branch document requirements');
      }

      console.log('✅ Branch document requirements fetched:', data.data?.length || 0);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Get Branch Document Requirements API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  /**
   * Upload a document for stallholder
   * @param {object} documentData - { stallholder_id, document_type_id, file }
   * @param {string} token - Auth token
   * @returns {Promise} - Upload response
   */
  static async uploadStallholderDocument(documentData, token) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      const formData = new FormData();
      formData.append('stallholder_id', documentData.stallholder_id);
      formData.append('document_type_id', documentData.document_type_id);
      formData.append('file', {
        uri: documentData.file.uri,
        type: documentData.file.type || 'image/jpeg',
        name: documentData.file.name || `document_${Date.now()}.jpg`,
      });

      console.log('📤 Uploading stallholder document...');

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.UPLOAD_STALLHOLDER_DOCUMENT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      console.log('✅ Document uploaded successfully');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Upload Stallholder Document API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // ===== UTILITY METHODS =====

  // Generic GET method
  static async get(endpoint, includeAuth = false) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const headers = { ...API_CONFIG.HEADERS };
      
      if (includeAuth) {
        const token = await UserStorageService.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const url = `${server}/api/mobile${endpoint}`;
      console.log('🔄 GET Request:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error(`❌ GET ${endpoint} Error:`, error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // Generic POST method
  static async post(endpoint, body, includeAuth = false) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const headers = { ...API_CONFIG.HEADERS };
      
      if (includeAuth) {
        const token = await UserStorageService.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const url = `${server}/api/mobile${endpoint}`;
      console.log('🔄 POST Request:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error(`❌ POST ${endpoint} Error:`, error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

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

  // ===== INSPECTOR METHODS =====
  
  /**
   * Get all stallholders in inspector's branch
   */
  static async getInspectorStallholders() {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_INSPECTOR_STALLHOLDERS}`;
      console.log('🔄 Fetching stallholders from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stallholders');
      }
      
      console.log('✅ Stallholders fetched:', data.count || 0);
      return {
        success: true,
        data: data.data,
        count: data.count,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Get Inspector Stallholders Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }
  
  /**
   * Get stallholder details by ID
   * @param {number} stallholderId - The stallholder ID
   */
  static async getStallholderDetails(stallholderId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_STALLHOLDER_DETAILS}/${stallholderId}`;
      console.log('🔄 Fetching stallholder details from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stallholder details');
      }
      
      console.log('✅ Stallholder details fetched');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Get Stallholder Details Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: null
      };
    }
  }
  
  /**
   * Get all violation types
   */
  static async getViolationTypes() {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_VIOLATION_TYPES}`;
      console.log('🔄 Fetching violation types from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch violation types');
      }
      
      console.log('✅ Violation types fetched:', data.count || 0);
      return {
        success: true,
        data: data.data,
        count: data.count,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Get Violation Types Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }
  
  /**
   * Submit a violation report
   * @param {object} reportData - The report data
   */
  static async submitViolationReport(reportData) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.SUBMIT_VIOLATION_REPORT}`;
      console.log('🔄 Submitting violation report to:', url);
      console.log('📝 Report data:', reportData);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit violation report');
      }
      
      console.log('✅ Violation report submitted successfully');
      return {
        success: true,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Submit Violation Report Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }
}

export default ApiService;