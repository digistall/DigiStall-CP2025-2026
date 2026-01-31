/**
 * AUTH - Web Backend Services
 * Authentication-related services for web
 */

import { createConnection } from '../../../CONFIG/database.js';
import { decryptData, encryptData } from '../../../SERVICES/encryptionService.js';
import jwt from 'jsonwebtoken';

/**
 * Validate web user credentials
 * @param {string} email - User's email
 * @param {string} userType - Type of user (admin, manager, employee)
 * @returns {Object|null} User data if found, null otherwise
 */
export const validateWebUserCredentials = async (email, userType) => {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.execute(
      'CALL sp_getWebUserByEmail(?, ?)',
      [email, userType]
    );
    const users = result[0] || [];
    return users.length > 0 ? users[0] : null;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Generate JWT token for web user
 * @param {Object} userData - User data to encode
 * @returns {string} JWT token
 */
export const generateWebToken = (userData) => {
  return jwt.sign(
    {
      id: userData.id,
      email: userData.email,
      userType: userData.user_type,
      branchId: userData.branch_id
    },
    process.env.JWT_SECRET || 'digistall-secret-key',
    { expiresIn: '24h' }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token data or null
 */
export const verifyWebToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'digistall-secret-key');
  } catch (error) {
    return null;
  }
};

/**
 * Decrypt sensitive user data
 * @param {string} encryptedData - Encrypted data string
 * @returns {string} Decrypted data
 */
export const decryptSensitiveData = (encryptedData) => {
  if (!encryptedData) return encryptedData;
  try {
    if (typeof encryptedData === 'string' && encryptedData.includes(':') && encryptedData.split(':').length === 3) {
      return decryptData(encryptedData);
    }
    return encryptedData;
  } catch (error) {
    return encryptedData;
  }
};

export default {
  validateWebUserCredentials,
  generateWebToken,
  verifyWebToken,
  decryptSensitiveData
};
