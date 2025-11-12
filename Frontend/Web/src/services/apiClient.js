// ===== AXIOS INTERCEPTORS =====
// Automatic token refresh and error handling
// Features:
// - Automatic access token injection
// - Auto-refresh on token expiry
// - Request queuing during refresh
// - Global error handling

import axios from 'axios';
import authService from './authService';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  withCredentials: true // Important for cookies
});

// Request queue for handling multiple requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// ===== REQUEST INTERCEPTOR =====
// Automatically add Authorization header with access token
apiClient.interceptors.request.use(
  (config) => {
    // Get access token - try multiple possible keys for compatibility
    const token = authService.getAccessToken() || 
                  sessionStorage.getItem('authToken') || 
                  sessionStorage.getItem('accessToken');
    
    // Add token to headers if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Request logging disabled for security

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR =====
// Automatically refresh token on 401 errors
apiClient.interceptors.response.use(
  (response) => {
    // Response logging disabled for security
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request is already retried, reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: originalRequest.url,
        message: error.response?.data?.message || error.message
      });
      return Promise.reject(error);
    }

    // Check if error indicates need for token refresh
    const errorData = error.response?.data;
    const needsRefresh = errorData?.requiresRefresh || 
                        errorData?.message?.includes('expired') ||
                        errorData?.message?.includes('Token expired');

    if (!needsRefresh) {
      // If not a token expiry issue, reject immediately
      console.error('❌ 401 Error (not token expiry):', errorData?.message);
      
      // If requires authentication, redirect to login
      if (errorData?.requiresAuth) {
        authService.clearAuthData();
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    // Token has expired, attempt to refresh
    if (isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      console.log('🔄 Token expired, attempting refresh...');
      
      // Attempt to refresh token
      const result = await authService.refreshAccessToken();

      if (result.success) {
        const newToken = result.accessToken;
        
        console.log('✅ Token refreshed, retrying original request');
        
        // Process queued requests
        processQueue(null, newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } else {
        // Refresh failed
        console.error('❌ Token refresh failed, redirecting to login');
        processQueue(new Error('Token refresh failed'), null);
        
        // Clear auth data and redirect to login
        authService.clearAuthData();
        window.location.href = '/login';
        
        return Promise.reject(error);
      }
    } catch (refreshError) {
      console.error('❌ Token refresh error:', refreshError);
      processQueue(refreshError, null);
      
      // Clear auth data and redirect to login
      authService.clearAuthData();
      window.location.href = '/login';
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ===== HELPER FUNCTIONS =====

/**
 * Make authenticated GET request
 */
export const get = (url, config = {}) => {
  return apiClient.get(url, config);
};

/**
 * Make authenticated POST request
 */
export const post = (url, data, config = {}) => {
  return apiClient.post(url, data, config);
};

/**
 * Make authenticated PUT request
 */
export const put = (url, data, config = {}) => {
  return apiClient.put(url, data, config);
};

/**
 * Make authenticated PATCH request
 */
export const patch = (url, data, config = {}) => {
  return apiClient.patch(url, data, config);
};

/**
 * Make authenticated DELETE request
 */
export const del = (url, config = {}) => {
  return apiClient.delete(url, config);
};

/**
 * Upload file with progress tracking
 */
export const upload = (url, formData, onProgress) => {
  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    }
  });
};

// Export configured axios instance and methods
export default apiClient;
export { apiClient };
