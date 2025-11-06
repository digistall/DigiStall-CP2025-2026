// ===== ENHANCED AUTHENTICATION SERVICE =====
// JWT authentication with automatic token refresh
// Features:
// - Access token + Refresh token management
// - Automatic token refresh before expiration
// - Role-based access control
// - Single device login enforcement

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTH_ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,
  LOGOUT: `${API_URL}/auth/logout`,
  REFRESH: `${API_URL}/auth/refresh`,
  VERIFY: `${API_URL}/auth/verify-token`,
  ME: `${API_URL}/auth/me`
};

// Token storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  USER_DATA: 'userData',
  TOKEN_EXPIRY: 'tokenExpiry'
};

class AuthService {
  constructor() {
    this.accessToken = null;
    this.refreshTimer = null;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  /**
   * Initialize auth service (check for existing session)
   */
  async initialize() {
    const token = this.getAccessToken();
    if (token) {
      try {
        await this.verifyToken();
        this.scheduleTokenRefresh();
        return true;
      } catch (error) {
        console.error('❌ Token verification failed on init:', error);
        await this.refreshAccessToken();
        return false;
      }
    }
    return false;
  }

  /**
   * Login with email and password
   */
  async login(email, password, userType) {
    try {
      const response = await axios.post(AUTH_ENDPOINTS.LOGIN, {
        email,
        password,
        userType
      }, {
        withCredentials: true // Important for cookies
      });

      if (response.data.success) {
        const { accessToken, user } = response.data;
        
        // Store access token (in memory is best, but sessionStorage as fallback)
        this.setAccessToken(accessToken);
        this.setUserData(user);
        
        // Calculate and store token expiry time (5 minutes from now)
        const expiryTime = Date.now() + (4.5 * 60 * 1000); // Refresh 30s before expiry
        sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
        
        // Schedule automatic token refresh
        this.scheduleTokenRefresh();
        
        console.log('✅ Login successful');
        return { success: true, user };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Logout (revoke tokens)
   */
  async logout() {
    try {
      // Call logout endpoint to revoke refresh token
      await axios.post(AUTH_ENDPOINTS.LOGOUT, {}, {
        withCredentials: true,
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('❌ Logout API error:', error);
      // Continue with local cleanup even if API fails
    }

    // Clear local storage and state
    this.clearAuthData();
    this.clearRefreshTimer();
    
    console.log('✅ Logged out successfully');
    return { success: true };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshSubscribers.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      console.log('🔄 Refreshing token...');
      
      const response = await axios.post(AUTH_ENDPOINTS.REFRESH, {}, {
        withCredentials: true // Important for cookies
      });

      if (response.data.success) {
        const { accessToken, user } = response.data;
        
        // Update access token
        this.setAccessToken(accessToken);
        this.setUserData(user);
        
        // Update expiry time
        const expiryTime = Date.now() + (4.5 * 60 * 1000);
        sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
        
        // Schedule next refresh
        this.scheduleTokenRefresh();
        
        console.log('✅ Token refreshed');
        
        // Resolve all waiting subscribers
        this.refreshSubscribers.forEach(subscriber => subscriber.resolve(accessToken));
        this.refreshSubscribers = [];
        
        this.isRefreshing = false;
        return { success: true, accessToken };
      }

      throw new Error(response.data.message || 'Token refresh failed');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Reject all waiting subscribers
      this.refreshSubscribers.forEach(subscriber => subscriber.reject(error));
      this.refreshSubscribers = [];
      
      this.isRefreshing = false;
      
      // If refresh fails, user must login again
      if (error.response?.data?.requiresLogin) {
        this.clearAuthData();
        window.location.href = '/login';
      }
      
      return { success: false, requiresLogin: true };
    }
  }

  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh() {
    this.clearRefreshTimer();

    const expiryTime = parseInt(sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY) || '0');
    const now = Date.now();
    const timeUntilRefresh = expiryTime - now;

    if (timeUntilRefresh > 0) {
      console.log('⏰ Token refresh scheduled');
      
      this.refreshTimer = setTimeout(() => {
        this.refreshAccessToken();
      }, timeUntilRefresh);
    } else {
      // Token already expired or will expire soon, refresh immediately
      this.refreshAccessToken();
    }
  }

  /**
   * Clear refresh timer
   */
  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Verify if current token is valid
   */
  async verifyToken() {
    try {
      const response = await axios.get(AUTH_ENDPOINTS.VERIFY, {
        headers: this.getAuthHeaders()
      });
      
      return response.data.valid === true;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return false;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      const response = await axios.get(AUTH_ENDPOINTS.ME, {
        headers: this.getAuthHeaders(),
        withCredentials: true
      });
      
      if (response.data.success) {
        this.setUserData(response.data.user);
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Get current user failed:', error);
      return null;
    }
  }

  /**
   * Get access token from storage
   */
  getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }
    
    const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      this.accessToken = token;
    }
    
    return this.accessToken;
  }

  /**
   * Set access token
   */
  setAccessToken(token) {
    this.accessToken = token;
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  /**
   * Get user data from storage
   */
  getUserData() {
    const userData = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Set user data
   */
  setUserData(user) {
    sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    
    // Also store in legacy format for backward compatibility
    sessionStorage.setItem('userType', user.userType);
    sessionStorage.setItem('userId', user.id);
    sessionStorage.setItem('userEmail', user.email);
    
    if (user.permissions) {
      sessionStorage.setItem('employeePermissions', JSON.stringify(user.permissions));
    }
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders() {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Check if user has specific role
   */
  hasRole(...roles) {
    const user = this.getUserData();
    if (!user) return false;
    
    return roles.some(role => 
      role.toLowerCase() === user.userType?.toLowerCase()
    );
  }

  /**
   * Check if user has specific permission (for employees)
   */
  hasPermission(...permissions) {
    const user = this.getUserData();
    if (!user) return false;
    
    // Admins and managers have all permissions
    if (user.userType === 'admin' || user.userType === 'branch_manager') {
      return true;
    }
    
    // Check employee permissions
    if (user.userType === 'employee' && user.permissions) {
      return permissions.some(permission => 
        user.permissions[permission] === true || user.permissions[permission] === 1
      );
    }
    
    return false;
  }

  /**
   * Clear all auth data
   */
  clearAuthData() {
    this.accessToken = null;
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    
    // Clear legacy storage
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('employeePermissions');
  }

  /**
   * Get user role
   */
  getUserRole() {
    const user = this.getUserData();
    return user?.userType || null;
  }

  /**
   * Get user ID
   */
  getUserId() {
    const user = this.getUserData();
    return user?.id || null;
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
