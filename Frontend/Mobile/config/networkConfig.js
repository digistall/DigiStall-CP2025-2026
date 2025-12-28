// Network configuration for mobile app
// Use this file to configure the API endpoints for your React Native Expo app

// IMPORTANT: This configuration supports multiple network environments
// It will automatically try different endpoints until one works

export const API_CONFIG = {
  // Multiple possible server endpoints (in order of preference)
  SERVERS: [
    // DigitalOcean Production Server - Mobile Backend (HIGHEST PRIORITY)
    'http://68.183.154.125:5001',  // Mobile Backend on DigitalOcean
    'http://68.183.154.125:5000',  // Web Backend on DigitalOcean (fallback)
    
    // Local Development - Mobile Backend (Port 5001)
    'http://192.168.100.241:5001', // Current Ethernet IP
    'http://172.18.195.29:5001',   // Current Wi-Fi IP
    'http://192.168.137.1:5001',   // Local Area Connection
    'http://192.168.1.101:5001',   // Previous Expo detected IP
    'http://192.168.110.16:5001',  // Previous Wi-Fi IP
    
    // Previous IP (backup)
    'http://192.168.8.38:5000',
    
    // Common local network ranges
    'http://192.168.1.100:5000',
    'http://192.168.0.100:5000',
    'http://192.168.1.1:5000',
    'http://192.168.0.1:5000',
    'http://10.0.0.100:5000',
    'http://10.0.0.1:5000',
    'http://172.16.0.100:5000',
    'http://192.168.43.1:5000',
    'http://172.20.10.1:5000',
    
    // Localhost alternatives
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ],
  
  // Static file server for images (Apache on port 80)
  // Must match one of the server IPs above
  STATIC_FILE_SERVER: null,
  
  // Current active server (will be set automatically)
  BASE_URL: null,
  
  // Mobile app specific endpoints
  MOBILE_ENDPOINTS: {
    // Authentication endpoints - Match Backend-Mobile routes
    LOGIN: '/api/mobile/auth/login',
    STAFF_LOGIN: '/api/mobile/auth/staff-login',
    REGISTER: '/api/mobile/auth/register',
    VERIFY_TOKEN: '/api/mobile/auth/verify-token',
    LOGOUT: '/api/mobile/auth/logout',
    
    // Stall endpoints
    GET_ALL_STALLS: '/api/mobile/stalls',
    GET_STALLS_BY_TYPE: '/api/mobile/stalls/type',
    GET_STALLS_BY_AREA: '/api/mobile/stalls/area',
    GET_STALL_BY_ID: '/api/mobile/stalls',
    GET_STALL_IMAGES: '/api/mobile/stalls/images',
    GET_AVAILABLE_AREAS: '/api/mobile/areas',
    SEARCH_STALLS: '/api/mobile/stalls/search',
    
    // Application endpoints
    SUBMIT_APPLICATION: '/api/mobile/applications/submit',
    GET_MY_APPLICATIONS: '/api/mobile/applications/my',
    GET_APPLICATION_STATUS: '/api/mobile/applications',
    UPDATE_APPLICATION: '/api/mobile/applications',

    // Stallholder document endpoints
    GET_STALLHOLDER_STALLS_DOCUMENTS: '/api/mobile/stallholder/documents',
    GET_BRANCH_DOCUMENT_REQUIREMENTS: '/api/mobile/stallholder/documents/branch',
    UPLOAD_STALLHOLDER_DOCUMENT: '/api/mobile/stallholder/documents/upload',
    
    // Inspector endpoints
    GET_INSPECTOR_STALLHOLDERS: '/api/mobile/inspector/stallholders',
    GET_STALLHOLDER_DETAILS: '/api/mobile/inspector/stallholders',
    GET_VIOLATION_TYPES: '/api/mobile/inspector/violations',
    SUBMIT_VIOLATION_REPORT: '/api/mobile/inspector/report',
    
    // Health check
    HEALTH: '/api/health'  // Main health endpoint
  },
  
  // Timeout for network requests (5 seconds per attempt)
  TIMEOUT: 5000,
  
  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Server discovery and connection testing
export const NetworkUtils = {
  // Test if a server is reachable
  async testConnection(serverUrl) {
    try {
      console.log(`🔌 Testing connection to: ${serverUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${serverUrl}${API_CONFIG.MOBILE_ENDPOINTS.HEALTH}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Connection successful to: ${serverUrl}`);
        return true;
      } else {
        console.log(`❌ Server responded with error: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Connection failed to ${serverUrl}:`, error.message);
      return false;
    }
  },

  // Find the first working server
  async findWorkingServer() {
    console.log('🔍 Discovering available servers...');
    
    for (const server of API_CONFIG.SERVERS) {
      if (await this.testConnection(server)) {
        API_CONFIG.BASE_URL = server;
        // Extract host IP from server URL for static files (Apache on port 80)
        const url = new URL(server);
        API_CONFIG.STATIC_FILE_SERVER = `http://${url.hostname}`;
        console.log(`🎯 Active server set to: ${server}`);
        console.log(`📁 Static file server set to: ${API_CONFIG.STATIC_FILE_SERVER}`);
        return server;
      }
    }
    
    console.error('❌ No working servers found');
    throw new Error('Unable to connect to any server. Please check:\n\n• Backend server is running on port 3001\n• Device and server are on same network\n• Firewall allows connections\n• Server IP is in the config');
  },

  // Get current active server or find one
  async getActiveServer() {
    if (API_CONFIG.BASE_URL) {
      // Test if current server is still working
      if (await this.testConnection(API_CONFIG.BASE_URL)) {
        return API_CONFIG.BASE_URL;
      } else {
        console.log('🔄 Current server not responding, finding new one...');
        API_CONFIG.BASE_URL = null;
        API_CONFIG.STATIC_FILE_SERVER = null;
      }
    }
    
    return await this.findWorkingServer();
  },
  
  // Get static file server URL (for images served by Apache)
  getStaticFileServer() {
    // If we have BASE_URL, always extract the hostname from it
    if (API_CONFIG.BASE_URL) {
      try {
        const url = new URL(API_CONFIG.BASE_URL);
        API_CONFIG.STATIC_FILE_SERVER = `http://${url.hostname}`;
      } catch (e) {
        // Fallback: extract IP from URL string
        const match = API_CONFIG.BASE_URL.match(/http:\/\/([^:]+)/);
        if (match) {
          API_CONFIG.STATIC_FILE_SERVER = `http://${match[1]}`;
        }
      }
    }
    return API_CONFIG.STATIC_FILE_SERVER || 'http://localhost';
  }
};

// Helper function to make API calls
export const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      headers: API_CONFIG.HEADERS,
      timeout: API_CONFIG.TIMEOUT
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Example usage in your mobile app:
// import { API_CONFIG, apiCall } from './config/networkConfig';
// 
// // Login example:
// const loginResult = await apiCall(API_CONFIG.MOBILE_ENDPOINTS.LOGIN, 'POST', {
//   username: 'your_username',
//   password: 'your_password'
// });

console.log('📱 Mobile Network Config Loaded');
console.log('🌐 Backend URL:', API_CONFIG.BASE_URL);
console.log('🔗 Login endpoint:', `${API_CONFIG.BASE_URL}${API_CONFIG.MOBILE_ENDPOINTS.LOGIN}`);
console.log('🌐 Backend URL:', API_CONFIG.BASE_URL);
console.log('🔗 Login endpoint:', `${API_CONFIG.BASE_URL}${API_CONFIG.MOBILE_ENDPOINTS.LOGIN}`);