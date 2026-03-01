/**
 * AUTH - Mobile Backend Services
 * Authentication-related services for mobile
 */

import { createConnection } from '../../../config/database.js';
import { decryptApplicantData, decryptStallholderData, decryptSpouseData, decryptAES256GCM, decryptObjectFields } from '../../../services/mysqlDecryptionService.js';
import jwt from 'jsonwebtoken';

/**
 * Validate user credentials
 * @param {string} username - User's username
 * @returns {Object|null} User data if found, null otherwise
 */
export const validateUserCredentials = async (username) => {
  let connection;
  try {
    connection = await createConnection();
    const [spResult] = await connection.execute('CALL sp_getMobileUserByUsername(?)', [username]);
    const users = spResult[0] || [];
    return users.length > 0 ? users[0] : null;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Generate JWT token for mobile user
 * @param {Object} userData - User data to encode
 * @returns {string} JWT token
 */
export const generateMobileToken = (userData) => {
  return jwt.sign(
    {
      id: userData.id || userData.applicant_id,
      username: userData.user_name,
      userType: userData.user_type || 'applicant'
    },
    process.env.JWT_SECRET || 'digistall-secret-key',
    { expiresIn: '7d' }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token data or null
 */
export const verifyMobileToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'digistall-secret-key');
  } catch (error) {
    return null;
  }
};

/**
 * Decrypt user data fields
 * @param {Object} userData - User data with encrypted fields
 * @returns {Object} User data with decrypted fields
 */
export const decryptUserData = (userData) => {
  return decryptObjectFields(userData, [
    'applicant_full_name',
    'applicant_contact_number',
    'applicant_address',
    'applicant_email'
  ]);
};

export default {
  validateUserCredentials,
  generateMobileToken,
  verifyMobileToken,
  decryptUserData
};
