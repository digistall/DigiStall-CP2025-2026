// AuthService wrapper for authentication-related operations
// This provides a cleaner interface for auth operations in the mobile app

import ApiService from './ApiService';

/**
 * Change the current user's password
 * @param {string} currentPassword - The user's current password
 * @param {string} newPassword - The new password to set
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  return ApiService.changePassword(currentPassword, newPassword);
};

/**
 * Login user
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise}
 */
export const login = async (username, password) => {
  return ApiService.mobileLogin(username, password);
};

/**
 * Staff login (Inspector/Collector)
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise}
 */
export const staffLogin = async (username, password) => {
  return ApiService.mobileStaffLogin(username, password);
};

/**
 * Logout user
 * @param {string} token 
 * @param {string} userId 
 * @returns {Promise}
 */
export const logout = async (token, userId) => {
  return ApiService.mobileLogout(token, userId);
};

/**
 * Staff logout
 * @param {string} token 
 * @param {string} staffId 
 * @param {string} staffType 
 * @returns {Promise}
 */
export const staffLogout = async (token, staffId, staffType) => {
  return ApiService.staffLogout(token, staffId, staffType);
};

/**
 * Verify auth token
 * @param {string} token 
 * @returns {Promise}
 */
export const verifyToken = async (token) => {
  return ApiService.verifyToken(token);
};

export default {
  changePassword,
  login,
  staffLogin,
  logout,
  staffLogout,
  verifyToken
};
