// ===== AUTHENTICATION STORE (PINIA) =====
// Centralized state management for authentication with direct database integration
// Features:
// - User state management
// - Role-based access control helpers
// - JWT token authentication (24h expiry)
// - Persistent authentication state via sessionStorage

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import SecureLogger from '../utils/secureLogger.js';

// API Base URL - Uses environment variable for production, fallback for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useAuthStore = defineStore('auth', () => {
  // ===== STATE =====
  const user = ref(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  const error = ref(null);
  const isInitialized = ref(false);

  // ===== COMPUTED =====
  
  /**
   * Check if user is authenticated
   */
  const authenticated = computed(() => {
    return isAuthenticated.value && user.value !== null;
  });

  /**
   * Get user role
   */
  const userRole = computed(() => {
    return user.value?.userType || null;
  });

  /**
   * Get user permissions
   */
  const userPermissions = computed(() => {
    return user.value?.permissions || {};
  });

  /**
   * Check if user is system administrator
   */
  const isSystemAdministrator = computed(() => {
    return user.value?.userType === 'system_administrator';
  });

  /**
   * Check if user is stall business owner
   */
  const isStallBusinessOwner = computed(() => {
    return user.value?.userType === 'stall_business_owner';
  });

  /**
   * Check if user is business manager
   */
  const isBusinessManager = computed(() => {
    return user.value?.userType === 'business_manager';
  });

  /**
   * Check if user is business employee
   */
  const isBusinessEmployee = computed(() => {
    return user.value?.userType === 'business_employee';
  });

  /**
   * Get user's full name
   */
  const userFullName = computed(() => {
    if (!user.value) return '';
    return `${user.value.firstName} ${user.value.lastName}`.trim();
  });

  /**
   * Get user's branch ID
   */
  const userBranchId = computed(() => {
    return user.value?.branchId || null;
  });

  // ===== ACTIONS =====

  /**
   * Initialize auth store (check for existing session)
   */
  async function initialize() {
    if (isInitialized.value) return;

    try {
      isLoading.value = true;
      
      // Check localStorage for existing auth data (for cross-tab sync)
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('currentUser');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          user.value = parsedUser;
          isAuthenticated.value = true;
          
          // Set default axios auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Restore permissions to sessionStorage for backward compatibility
          if (parsedUser.permissions) {
            sessionStorage.setItem('permissions', JSON.stringify(parsedUser.permissions));
            sessionStorage.setItem('employeePermissions', JSON.stringify(parsedUser.permissions));
          }
          
          // Also restore other session data for backward compatibility
          sessionStorage.setItem('authToken', token);
          sessionStorage.setItem('currentUser', userData);
          sessionStorage.setItem('userType', parsedUser.userType);
          
          console.log('✅ Auth store initialized with existing session');
        } catch (parseError) {
          console.error('❌ Error parsing session data:', parseError);
          // Clear invalid session data
          localStorage.clear();
          sessionStorage.clear();
        }
      }
      
      // Listen for storage changes from other tabs
      window.addEventListener('storage', handleStorageChange);
    
    } catch (err) {
      console.error('❌ Auth initialization error:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  }

  /**
   * Handle storage changes from other tabs (for cross-tab sync)
   */
  function handleStorageChange(event) {
    // Only respond to changes in authToken
    if (event.key === 'authToken') {
      const newToken = event.newValue;
      
      if (newToken) {
        // User logged in from another tab
        const userData = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const userType = localStorage.getItem('userType');
        
        if (userData && userType) {
          console.log('🔄 Login detected from another tab');
          
          // Update axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Update state
          user.value = userData;
          isAuthenticated.value = true;
          
          // Optionally refresh the page to load the correct dashboard
          // or emit an event to update the UI
        }
      } else {
        // User logged out from another tab
        console.log('🔄 Logout detected from another tab');
        
        // Clear axios header
        delete axios.defaults.headers.common['Authorization'];
        
        // Clear state
        user.value = null;
        isAuthenticated.value = false;
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
  }

  /**
   * Login user with direct database authentication
   */
  async function login(username, password, userType) {
    try {
      isLoading.value = true;
      error.value = null;

      // Clear all existing authentication data first to prevent data mixing
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      localStorage.removeItem('permissions');
      localStorage.removeItem('employeePermissions');
      
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('userType');
      sessionStorage.removeItem('permissions');
      sessionStorage.removeItem('employeePermissions');
      sessionStorage.removeItem('branchManagerData');
      sessionStorage.removeItem('employeeData');
      sessionStorage.removeItem('adminData');
      sessionStorage.removeItem('branchManagerId');
      sessionStorage.removeItem('employeeId');
      sessionStorage.removeItem('adminId');
      sessionStorage.removeItem('branchId');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('fullName');
      sessionStorage.clear();
      
      // Clear data cache service if available
      if (window.dataCacheService) {
        window.dataCacheService.clearAll();
      }
      
      // Clear axios auth header
      delete axios.defaults.headers.common['Authorization'];

      SecureLogger.auth('Attempting authentication');

      const loginUrl = `${API_BASE_URL}/auth/login`;
      const loginData = {
        username: username, // Backend expects 'username' field
        password,
        userType
      };

      SecureLogger.network('Login request', { url: loginUrl, method: 'POST' });
      SecureLogger.auth('Login data prepared', { username, userType, passwordLength: password?.length });

      // Call unified login API
      const response = await axios.post(loginUrl, loginData);

      if (response.data.success) {
        const { user: userData, token } = response.data.data;

        // Store auth data in localStorage for cross-tab sync
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('userType', userData.userType);
        
        // Store permissions separately for sidebar compatibility
        if (userData.permissions) {
          localStorage.setItem('permissions', JSON.stringify(userData.permissions));
          localStorage.setItem('employeePermissions', JSON.stringify(userData.permissions));
        }
        
        // Also keep in sessionStorage for backward compatibility with existing code
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        sessionStorage.setItem('userType', userData.userType);
        
        // Store permissions in sessionStorage too for sidebar
        if (userData.permissions) {
          sessionStorage.setItem('permissions', JSON.stringify(userData.permissions));
          sessionStorage.setItem('employeePermissions', JSON.stringify(userData.permissions));
        }

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Update store state
        user.value = userData;
        isAuthenticated.value = true;

        SecureLogger.auth('Login successful', { userType: userData.userType, hasToken: !!token });
        return { success: true, user: userData };
      } else {
        error.value = response.data.message;
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      SecureLogger.error('Login error', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      error.value = errorMessage;
      return { success: false, message: errorMessage };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logout user
   */
  async function logout() {
    try {
      isLoading.value = true;
      
      // Get user info before clearing for API call
      const currentUserData = user.value;
      const currentUserType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
      const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Also try to get currentUser from storage if user.value is null
      let storedUser = null;
      if (!currentUserData) {
        try {
          const storedUserStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
          if (storedUserStr) {
            storedUser = JSON.parse(storedUserStr);
          }
        } catch (e) {
          console.warn('Could not parse stored user:', e);
        }
      }
      
      const userDataToUse = currentUserData || storedUser;
      
      // Try to get user ID from multiple sources
      let userId = userDataToUse?.id || 
                   userDataToUse?.userId || 
                   userDataToUse?.employeeId || 
                   userDataToUse?.business_employee_id ||
                   userDataToUse?.managerId ||
                   userDataToUse?.manager_id ||
                   userDataToUse?.business_manager_id ||
                   userDataToUse?.adminId ||
                   userDataToUse?.admin_id ||
                   userDataToUse?.business_owner_id ||
                   userDataToUse?.system_admin_id;
      
      // Also try from sessionStorage
      if (!userId) {
        userId = sessionStorage.getItem('employeeId') || 
                 sessionStorage.getItem('branchManagerId') ||
                 sessionStorage.getItem('adminId');
      }
      
      console.log('='.repeat(60));
      console.log('🔐 FRONTEND LOGOUT INITIATED');
      console.log('🔐 user.value:', JSON.stringify(currentUserData, null, 2));
      console.log('🔐 storedUser:', JSON.stringify(storedUser, null, 2));
      console.log('🔐 userDataToUse:', JSON.stringify(userDataToUse, null, 2));
      console.log('🔐 Extracted userId:', userId, '(type:', typeof userId, ')');
      console.log('🔐 userType:', currentUserType);
      console.log('🔐 authToken present:', !!authToken);
      console.log('='.repeat(60));
      
      // Call logout API to update last_logout in database
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        console.log('🔐 Calling logout API:', `${apiUrl}/auth/logout`);
        console.log('🔐 Request body:', { userId, userType: currentUserType });
        
        const response = await axios.post(`${apiUrl}/auth/logout`, {
          userId: userId,
          userType: currentUserType
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        console.log('✅ Logout API response:', response.data);
      } catch (apiError) {
        console.warn('⚠️ Logout API error (continuing with local cleanup):', apiError.message);
        if (apiError.response) {
          console.warn('⚠️ API response:', apiError.response.data);
        }
      }
      
      // Clear localStorage (this triggers storage event for cross-tab sync)
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      localStorage.removeItem('permissions');
      localStorage.removeItem('employeePermissions');
      
      // Clear sessionStorage for backward compatibility
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('userType');
      sessionStorage.removeItem('permissions');
      sessionStorage.removeItem('employeePermissions');
      
      // Clear all branch manager and employee specific data
      sessionStorage.removeItem('branchManagerData');
      sessionStorage.removeItem('employeeData');
      sessionStorage.removeItem('adminData');
      sessionStorage.removeItem('branchManagerId');
      sessionStorage.removeItem('employeeId');
      sessionStorage.removeItem('adminId');
      sessionStorage.removeItem('branchId');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('fullName');
      
      // Clear ALL session storage completely
      sessionStorage.clear();
      
      // Clear data cache service if available
      if (window.dataCacheService) {
        window.dataCacheService.clearAll();
      }
      
      // Clear axios auth header
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear state
      user.value = null;
      isAuthenticated.value = false;
      error.value = null;
      
      SecureLogger.auth('User logged out');
      return { success: true };
    } catch (err) {
      SecureLogger.error('Logout error', err);
      
      // Clear state anyway
      user.value = null;
      isAuthenticated.value = false;
      
      return { success: false, message: err.message };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Refresh user data
   */
  async function refreshUser() {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        return { success: false };
      }

      // Verify token is still valid
      const response = await axios.post(`${API_BASE_URL}/auth/unified/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
          user.value = JSON.parse(userData);
          isAuthenticated.value = true;
          return { success: true };
        }
      }
      return { success: false };
    } catch (err) {
      console.error('❌ Refresh user error:', err);
      return { success: false };
    }
  }

  /**
   * Check if user has specific role(s)
   */
  function hasRole(...roles) {
    if (!user.value) return false;
    
    return roles.some(role => 
      role.toLowerCase() === user.value.userType?.toLowerCase()
    );
  }

  /**
   * Check if user has specific permission(s)
   */
  function hasPermission(...permissions) {
    if (!user.value) return false;
    
    // System administrators, stall business owners, and business managers have all permissions
    if (user.value.userType === 'system_administrator' || 
        user.value.userType === 'stall_business_owner' || 
        user.value.userType === 'business_manager') {
      return true;
    }
    
    // Check business employee permissions
    if (user.value.userType === 'business_employee' && user.value.permissions) {
      // Handle both array format ['dashboard', 'applicants'] and object format { dashboard: true }
      if (Array.isArray(user.value.permissions)) {
        // Array format: check if permission exists in array
        return permissions.some(permission => user.value.permissions.includes(permission));
      } else {
        // Object format: check if permission value is true
        return permissions.some(permission => {
          const permValue = user.value.permissions[permission];
          return permValue === true || permValue === 1;
        });
      }
    }
    
    return false;
  }

  /**
   * Check if user can access a specific route
   */
  function canAccessRoute(routeRoles = [], routePermissions = []) {
    if (!user.value) return false;

    // If no restrictions, allow access
    if (routeRoles.length === 0 && routePermissions.length === 0) {
      return true;
    }

    // Check role-based access
    if (routeRoles.length > 0) {
      const hasRequiredRole = hasRole(...routeRoles);
      if (hasRequiredRole) return true;
    }

    // Check permission-based access
    if (routePermissions.length > 0) {
      const hasRequiredPermission = hasPermission(...routePermissions);
      if (hasRequiredPermission) return true;
    }

    return false;
  }

  /**
   * Clear error
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Set error
   */
  function setError(message) {
    error.value = message;
  }

  /**
   * Update user data
   */
  function updateUser(userData) {
    user.value = { ...user.value, ...userData };
    // Update sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(user.value));
  }

  // ===== RETURN =====
  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
    
    // Computed
    authenticated,
    userRole,
    userPermissions,
    isSystemAdministrator,
    isStallBusinessOwner,
    isBusinessManager,
    isBusinessEmployee,
    userFullName,
    userBranchId,
    
    // Actions
    initialize,
    login,
    logout,
    refreshUser,
    hasRole,
    hasPermission,
    canAccessRoute,
    clearError,
    setError,
    updateUser
  };
});
