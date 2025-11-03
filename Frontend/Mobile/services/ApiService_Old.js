// API Service for mobile app backend integration
import { API_CONFIG, NetworkUtils } from '../config/networkConfig';

class ApiService {
  // Test basic connectivity before login
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

  // Mobile login function using the improved backend
  static async mobileLogin(username, password) {
    try {
      // First ensure we have a working server
      const server = await NetworkUtils.getActiveServer();
      
      console.log('🔄 Attempting login to:', `${server}${API_CONFIG.MOBILE_ENDPOINTS.LOGIN}`);
      console.log('📱 Request data:', { username, password: '***' });

      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({
          username,
          password
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log('✅ Login successful:', data.message);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Login API Error:', error);
      console.error('🔍 Error type:', error.constructor.name);
      console.error('🔍 Error message:', error.message);
      
      // Check if it's a network connectivity issue
      if (error.message === 'Network request failed' || error.message.includes('Unable to connect')) {
        console.error('🚨 Network connectivity issue detected');
        console.error('🔧 Will attempt server discovery on next try');
        
        // Reset server to force rediscovery
        API_CONFIG.BASE_URL = null;
      }
      
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // Submit application using the improved backend
  static async submitApplication(applicantId, stallId) {
    try {
      // Ensure we have a working server
      const server = await NetworkUtils.getActiveServer();
      
      const response = await fetch(`${server}${API_CONFIG.MOBILE_ENDPOINTS.SUBMIT_APPLICATION}`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({
          applicant_id: applicantId,
          stall_id: stallId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Application failed');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Submit Application API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  // Get stalls by type (Fixed Price, Raffle, Auction)
  static async getStallsByType(type, applicantId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      const url = `${server}/api/mobile/stalls/type/${encodeURIComponent(type)}${applicantId ? `?applicant_id=${applicantId}` : ''}`;
      
      console.log('🔄 Fetching stalls by type:', type);
      console.log('📡 URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch ${type} stalls`);
      }

      console.log(`✅ ${type} stalls fetched:`, data.data.total_count);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error(`Get ${type} Stalls API Error:`, error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: { stalls: [], total_count: 0 }
      };
    }
  }

  // Get stalls by area
  static async getStallsByArea(area, applicantId, type = null) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      let url = `${server}/api/mobile/stalls/area/${encodeURIComponent(area)}?`;
      if (applicantId) url += `applicant_id=${applicantId}&`;
      if (type) url += `type=${encodeURIComponent(type)}&`;
      
      console.log('🔄 Fetching stalls by area:', area);
      console.log('📡 URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch stalls in ${area}`);
      }

      console.log(`✅ Stalls in ${area} fetched:`, data.data.total_count);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error(`Get Stalls by Area API Error:`, error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: { stalls: [], total_count: 0 }
      };
    }
  }

  // Get all stalls
  static async getAllStalls(applicantId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      const url = `${server}/api/mobile/stalls${applicantId ? `?applicant_id=${applicantId}` : ''}`;
      
      console.log('🔄 Fetching all stalls');
      console.log('📡 URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stalls');
      }

      console.log('✅ All stalls fetched:', data.data.total_count);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Get All Stalls API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: { all_stalls: [], total_count: 0 }
      };
    }
  }

  // Get stall by ID
  static async getStallById(stallId, applicantId) {
    try {
      const server = await NetworkUtils.getActiveServer();
      
      const url = `${server}/api/mobile/stalls/${stallId}${applicantId ? `?applicant_id=${applicantId}` : ''}`;
      
      console.log('🔄 Fetching stall details:', stallId);
      console.log('📡 URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stall details');
      }

      console.log('✅ Stall details fetched:', data.data.stallNumber);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Get Stall by ID API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred'
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
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const url = `${server}/api/mobile/stalls/search?${params.toString()}`;
      
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

      console.log('✅ Search results:', data.data.total_count);
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Search Stalls API Error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        data: { stalls: [], total_count: 0 }
      };
    }
  }
}

export default ApiService;