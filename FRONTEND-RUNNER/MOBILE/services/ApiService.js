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
      
      // DEBUG: Log the FULL response to see if token is there
      console.log('🔍 FULL API RESPONSE:', JSON.stringify(data, null, 2));
      console.log('🔐 Token in response:', data.token ? 'YES (' + data.token.substring(0, 20) + '...)' : 'NO TOKEN!');

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
      // Don't log as error - this is expected for non-staff users (stallholders)
      console.log('ℹ️ Staff login check:', error.message || 'Not a staff user');
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

  // Staff (Inspector/Collector) heartbeat - keep marked as online
  static async staffHeartbeat(token, staffId, staffType) {
    try {
      const server = await NetworkUtils.getActiveServer();

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.STAFF_HEARTBEAT}`, {
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
        throw new Error(data.message || 'Staff heartbeat failed');
      }

      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      // Silent fail for heartbeat - don't spam console
      return {
        success: false,
        message: error.message || 'Heartbeat error'
      };
    }
  }

  // Staff (Inspector/Collector) auto-logout due to inactivity
  // Uses the same endpoint as manual logout since staff-auto-logout may not be deployed
  static async staffAutoLogout(token, staffId, staffType) {
    try {
      const server = await NetworkUtils.getActiveServer();

      // Use the working staff-logout endpoint (same functionality)
      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.STAFF_LOGOUT}`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          staffId: staffId,
          staffType: staffType,
          reason: 'inactivity' // Include reason for logging purposes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Auto-logout failed');
      }

      console.log('✅ Staff auto-logout API called - last_logout updated');
      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Staff Auto-Logout API Error:', error);
      return {
        success: false,
        message: error.message || 'Auto-logout error'
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

  // Join Raffle - Pre-register for a raffle stall
  static async joinRaffle(applicantId, stallId) {
    console.log('🎰 ====== JOIN RAFFLE START ======');
    console.log('🎰 Input params - applicantId:', applicantId, 'type:', typeof applicantId);
    console.log('🎰 Input params - stallId:', stallId, 'type:', typeof stallId);
    
    // Validate inputs before making the request
    if (!applicantId) {
      console.error('❌ VALIDATION ERROR: applicantId is missing or undefined');
      return {
        success: false,
        message: 'Applicant ID is required to join raffle'
      };
    }
    
    if (!stallId) {
      console.error('❌ VALIDATION ERROR: stallId is missing or undefined');
      return {
        success: false,
        message: 'Stall ID is required to join raffle'
      };
    }
    
    try {
      console.log('🔌 Getting active server...');
      const server = await NetworkUtils.getActiveServer();
      console.log('🔌 Active server:', server);
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.JOIN_RAFFLE}`;
      console.log('🎰 Full URL:', url);
      
      const requestBody = { applicantId, stallId };
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('� Request headers:', JSON.stringify(API_CONFIG.HEADERS, null, 2));

      console.log('🚀 Sending POST request...');
      const response = await fetch(url, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response statusText:', response.statusText);
      console.log('📡 Response ok:', response.ok);
      
      let data;
      try {
        const responseText = await response.text();
        console.log('📡 Raw response text:', responseText);
        data = JSON.parse(responseText);
        console.log('📡 Parsed response data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError.message);
        throw new Error('Server returned invalid response');
      }

      if (!response.ok) {
        console.error('❌ Response not OK - Status:', response.status);
        console.error('❌ Server error message:', data.message);
        console.error('❌ Server error details:', data.error);
        throw new Error(data.message || 'Failed to join raffle');
      }

      console.log('✅ Successfully joined raffle:', data.message);
      console.log('✅ Response data:', JSON.stringify(data.data, null, 2));
      console.log('🎰 ====== JOIN RAFFLE SUCCESS ======');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ ====== JOIN RAFFLE ERROR ======');
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Join Raffle API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // Join Auction - Register for an auction stall (no application record created)
  static async joinAuction(applicantId, stallId) {
    console.log('🔨 ====== JOIN AUCTION START ======');
    console.log('🔨 Input params - applicantId:', applicantId, 'type:', typeof applicantId);
    console.log('🔨 Input params - stallId:', stallId, 'type:', typeof stallId);
    
    // Validate inputs before making the request
    if (!applicantId) {
      console.error('❌ VALIDATION ERROR: applicantId is missing or undefined');
      return {
        success: false,
        message: 'Applicant ID is required to join auction'
      };
    }
    
    if (!stallId) {
      console.error('❌ VALIDATION ERROR: stallId is missing or undefined');
      return {
        success: false,
        message: 'Stall ID is required to join auction'
      };
    }
    
    try {
      console.log('🔌 Getting active server...');
      const server = await NetworkUtils.getActiveServer();
      console.log('🔌 Active server:', server);
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.JOIN_AUCTION}`;
      console.log('🔨 Full URL:', url);
      
      const requestBody = { applicantId, stallId };
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      console.log('🚀 Sending POST request...');
      const response = await fetch(url, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      let data;
      try {
        const responseText = await response.text();
        console.log('📡 Raw response text:', responseText);
        data = JSON.parse(responseText);
        console.log('📡 Parsed response data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError.message);
        throw new Error('Server returned invalid response');
      }

      if (!response.ok) {
        console.error('❌ Response not OK - Status:', response.status);
        console.error('❌ Server error message:', data.message);
        throw new Error(data.message || 'Failed to join auction');
      }

      console.log('✅ Successfully joined auction:', data.message);
      console.log('✅ Response data:', JSON.stringify(data.data, null, 2));
      console.log('🔨 ====== JOIN AUCTION SUCCESS ======');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ ====== JOIN AUCTION ERROR ======');
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Join Auction API Error:', error);
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

  // ===== LEGACY RAFFLE METHOD (DEPRECATED) =====
  // Note: Use joinRaffle(applicantId, stallId) instead - defined earlier in this file
  // This method is kept for backward compatibility but should not be used
  static async joinRaffleLegacy(raffleId, applicantId, token) {
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

  // ===== STALLHOLDER DOCUMENT BLOB METHODS =====

  /**
   * Upload stallholder document as BLOB (base64) to database
   * @param {object} documentData - Document data with base64
   * @param {number} documentData.stallholder_id
   * @param {number} documentData.document_type_id
   * @param {string} documentData.document_data - Base64 data with data:mime/type;base64, prefix
   * @param {string} documentData.mime_type
   * @param {string} documentData.file_name
   * @param {string} documentData.expiry_date - Optional
   * @param {string} documentData.notes - Optional
   * @param {string} authToken - Optional token (if not provided, will try to retrieve from storage)
   */
  static async uploadStallholderDocumentBlob(documentData, authToken = null) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      // Use provided token or try to get from storage (token is optional for this endpoint)
      let token = authToken;
      if (!token) {
        token = await UserStorageService.getAuthToken();
      }

      // Token is optional - backend endpoint is public
      // Just log a warning but continue with the upload
      if (!token) {
        console.log('⚠️ No authentication token available - proceeding without auth (endpoint is public)');
      } else {
        console.log('🔐 Using token:', token.substring(0, 20) + '...');
      }

      console.log('📤 Uploading stallholder document BLOB...');
      console.log('� Payload:', {
        stallholder_id: documentData.stallholder_id,
        document_type_id: documentData.document_type_id,
        file_name: documentData.file_name,
        mime_type: documentData.mime_type,
        file_size: documentData.file_size,
        has_document_data: !!documentData.document_data
      });

      // Build headers - include auth token only if available
      const headers = {
        ...API_CONFIG.HEADERS,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${server}/api/mobile/stallholder/documents/blob/upload`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(documentData),
      });

      const data = await response.json();
      console.log('📡 Upload response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      console.log('✅ Document BLOB uploaded successfully');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Upload Stallholder Document BLOB API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Get stallholder document BLOB by document ID
   * @param {number} documentId
   * @returns {Promise} - Base64 image data
   */
  static async getStallholderDocumentBlobById(documentId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log(`📥 Fetching document BLOB ${documentId}...`);

      // Try the new base64 JSON endpoint first (if deployed), otherwise fallback to binary endpoint
      let response;
      let useBase64Endpoint = true;
      
      try {
        response = await fetch(`${server}/api/mobile/stallholder/documents/blob/base64/${documentId}`, {
          method: 'GET',
          headers: {
            ...API_CONFIG.HEADERS,
            'Authorization': `Bearer ${token}`,
          },
        });
        
        // If we get a 404, the endpoint doesn't exist yet, try the old endpoint
        if (response.status === 404) {
          useBase64Endpoint = false;
        }
      } catch (e) {
        useBase64Endpoint = false;
      }
      
      if (useBase64Endpoint && response.ok) {
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch document');
        }

        console.log('✅ Document BLOB retrieved successfully via base64 endpoint');
        return {
          success: true,
          data: result.data,
          mimeType: result.mimeType,
          fileName: result.fileName
        };
      }
      
      // Fallback: Try to fetch binary and use ArrayBuffer approach for React Native
      console.log('📥 Using fallback binary endpoint...');
      response = await fetch(`${server}/api/mobile/stallholder/documents/blob/id/${documentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch document');
      }

      // Get content type
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Use arrayBuffer and convert to base64 (React Native compatible)
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64 using chunk method (React Native compatible)
      const CHUNK_SIZE = 0x8000; // 32KB chunks
      let binary = '';
      for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
        const chunk = uint8Array.subarray(i, i + CHUNK_SIZE);
        binary += String.fromCharCode.apply(null, chunk);
      }
      
      // Use global btoa or polyfill
      let base64Data;
      if (typeof btoa !== 'undefined') {
        base64Data = btoa(binary);
      } else {
        // Manual base64 encoding for React Native
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        while (i < binary.length) {
          const a = binary.charCodeAt(i++);
          const b = binary.charCodeAt(i++);
          const c = binary.charCodeAt(i++);
          result += chars[a >> 2];
          result += chars[((a & 3) << 4) | (b >> 4)];
          result += chars[((b & 15) << 2) | (c >> 6)];
          result += chars[c & 63];
        }
        const padding = binary.length % 3;
        if (padding === 1) {
          result = result.slice(0, -2) + '==';
        } else if (padding === 2) {
          result = result.slice(0, -1) + '=';
        }
        base64Data = result;
      }
      
      const dataUri = `data:${contentType};base64,${base64Data}`;

      console.log('✅ Document BLOB retrieved successfully via binary endpoint');
      return {
        success: true,
        data: dataUri,
        mimeType: contentType,
      };
    } catch (error) {
      console.error('❌ Get Stallholder Document BLOB API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Get all documents for a stallholder
   * @param {number} stallholderId
   * @param {boolean} includeData - Include base64 data
   */
  static async getStallholderDocuments(stallholderId, includeData = false) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const url = `${server}/api/mobile/stallholder/${stallholderId}/documents/blob${
        includeData ? '?include_data=true' : ''
      }`;
      
      console.log('📥 Fetching all documents for stallholder:', stallholderId);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch documents');
      }

      console.log('✅ Documents retrieved successfully');
      return {
        success: true,
        data: data.data,
        total: data.total,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Get Stallholder Documents API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  /**
   * Delete a stallholder document
   * @param {number} documentId
   */
  static async deleteStallholderDocument(documentId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log(`🗑️ Deleting document ${documentId}...`);

      const response = await fetch(`${server}/api/mobile/stallholder/documents/blob/${documentId}`, {
        method: 'DELETE',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete document');
      }

      console.log('✅ Document deleted successfully');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Delete Stallholder Document API Error:', error);
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
   * Get stallholder profile with stall information
   * @param {number} stallholderId - The stallholder ID
   */
  static async getStallholderProfile(stallholderId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}/api/mobile/stallholder/profile/${stallholderId}`;
      console.log('🔄 Fetching stallholder profile from:', url);
      
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
        throw new Error(data.message || 'Failed to fetch stallholder profile');
      }
      
      console.log('✅ Stallholder profile fetched:', data.data?.stall_number || 'No stall');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Get Stallholder Profile Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: null
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

  /**
   * Submit a violation report with photo evidence
   * @param {object} reportData - The report data
   * @param {array} photos - Array of photo objects with uri, type, name
   */
  static async submitViolationReportWithPhotos(reportData, photos = []) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.SUBMIT_VIOLATION_REPORT_WITH_PHOTOS}`;
      console.log('🔄 Submitting violation report with photos to:', url);
      console.log('📝 Report data:', reportData);
      console.log('📷 Photos count:', photos.length);
      
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add report data fields
      formData.append('stallholder_id', reportData.stallholder_id.toString());
      formData.append('violation_id', reportData.violation_id.toString());
      formData.append('branch_id', reportData.branch_id.toString());
      if (reportData.stall_id) {
        formData.append('stall_id', reportData.stall_id.toString());
      }
      formData.append('receipt_number', reportData.receipt_number.toString());
      formData.append('evidence', reportData.evidence);
      if (reportData.remarks) {
        formData.append('remarks', reportData.remarks);
      }
      
      // Add photos
      photos.forEach((photo, index) => {
        formData.append('evidence_photos', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.name || `evidence_${index + 1}.jpg`
        });
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit violation report');
      }
      
      console.log('✅ Violation report with photos submitted successfully');
      return {
        success: true,
        message: data.message,
        photos_uploaded: data.photos_uploaded,
        photo_paths: data.photo_paths
      };
      
    } catch (error) {
      console.error('❌ Submit Violation Report With Photos Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // ===== COMPLAINT METHODS =====

  /**
   * Submit a complaint from stallholder
   * @param {object} complaintData - The complaint data
   */
  static async submitComplaint(complaintData) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.SUBMIT_COMPLAINT}`;
      console.log('🔄 Submitting complaint to:', url);
      console.log('📝 Complaint data:', complaintData);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(complaintData)
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit complaint');
      }
      
      console.log('✅ Complaint submitted successfully');
      return {
        success: true,
        data: data.data,
        message: data.message || 'Complaint submitted successfully'
      };
      
    } catch (error) {
      console.error('❌ Submit Complaint Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Get stallholder's complaints
   */
  static async getMyComplaints() {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_MY_COMPLAINTS}`;
      console.log('🔄 Fetching complaints from:', url);
      
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
        throw new Error(data.message || 'Failed to fetch complaints');
      }
      
      console.log('✅ Complaints fetched successfully:', data.count);
      return {
        success: true,
        data: data.data || [],
        count: data.count || 0,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Get Complaints Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  // ===== STALLHOLDER PAYMENT METHODS =====

  /**
   * Get payment records for stallholder (paginated)
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Records per page (default: 10)
   */
  static async getPaymentRecords(page = 1, limit = 10) {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      console.log('🔐 Payment API - Token check:', token ? `Found (${token.substring(0, 20)}...)` : 'NOT FOUND');
      
      if (!token) {
        console.log('⚠️ No auth token in storage. User may need to log in again.');
        throw new Error('Authentication token not found. Please log in again.');
      }
       
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_PAYMENT_RECORDS}?page=${page}&limit=${limit}`;
      console.log('🔄 Fetching payment records from:', url);
      
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
        throw new Error(data.message || 'Failed to fetch payment records');
      }
      
      console.log('✅ Payment records fetched successfully:', data.data?.length || 0, 'records');
      return {
        success: true,
        data: data.data || [],
        pagination: data.pagination || {},
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Get Payment Records Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  /**
   * Get all payment records for stallholder (no pagination)
   */
  static async getAllPaymentRecords() {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_ALL_PAYMENT_RECORDS}`;
      console.log('🔄 Fetching all payment records from:', url);
      
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
        throw new Error(data.message || 'Failed to fetch all payment records');
      }
      
      console.log('✅ All payment records fetched successfully:', data.totalRecords || 0, 'records');
      return {
        success: true,
        data: data.data || [],
        totalRecords: data.totalRecords || 0,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Get All Payment Records Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: []
      };
    }
  }

  /**
   * Get payment summary/statistics for stallholder
   */
  static async getPaymentSummary() {
    try {
      const server = await NetworkUtils.getActiveServer();
      const token = await UserStorageService.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const url = `${server}${API_CONFIG.MOBILE_ENDPOINTS.GET_PAYMENT_SUMMARY}`;
      console.log('🔄 Fetching payment summary from:', url);
      
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
        throw new Error(data.message || 'Failed to fetch payment summary');
      }
      
      console.log('✅ Payment summary fetched successfully');
      return {
        success: true,
        data: data.data || {},
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Get Payment Summary Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: {}
      };
    }
  }
}

export default ApiService;